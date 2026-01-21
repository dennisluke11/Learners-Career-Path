import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface JobOpening {
  source: string; // e.g., "LinkedIn", "Indeed", "Glassdoor"
  title: string;
  company?: string;
  location?: string;
  url?: string;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: string; // "yearly", "monthly"
  source?: string;
}

export interface JobCountBySite {
  site: string; // "LinkedIn", "Indeed", "Glassdoor", etc.
  count: number;
}

export interface SalaryRangeByLevel {
  junior: SalaryRange;
  mid: SalaryRange;
  senior: SalaryRange;
}

export interface CareerMarketData {
  careerName: string;
  jobOpenings: JobOpening[];
  salaryRange: SalaryRange | null; // Deprecated - use salaryRangesByLevel instead
  salaryRangesByLevel?: SalaryRangeByLevel; // Junior to Senior salary ranges
  totalJobCount?: number; // Total jobs from all sites in last 12 months
  jobCountsBySite?: JobCountBySite[]; // Job counts per site
  marketTrend: 'growing' | 'stable' | 'declining' | 'unknown';
  lastUpdated: Date;
  loading?: boolean;
  error?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CareerMarketService {
  private cache: { [careerName: string]: CareerMarketData } = {};
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  private genAI: GoogleGenerativeAI | null = null;
  private useFirebaseFunctions: boolean = false;

  constructor(private http: HttpClient) {
    this.useFirebaseFunctions = environment.useFirebaseFunctions || false;
    
    if (!this.useFirebaseFunctions && environment.geminiApiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
      } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
      }
    }
  }

  getMarketData(careerName: string, countryCode?: string): Observable<CareerMarketData> {
    const cached = this.cache[careerName];
    if (cached && this.isCacheValid(cached)) {
      return of(cached);
    }

    if (this.useFirebaseFunctions) {
      return this.getMarketDataViaFunctions(careerName, countryCode);
    }

    if (!environment.geminiApiKey || !this.genAI) {
      return new Observable<CareerMarketData>(observer => {
        this.getDefaultMarketData(careerName, countryCode).then(data => {
          observer.next(data);
          observer.complete();
        });
      });
    }

    const prompt = this.buildMarketDataPrompt(careerName, countryCode);

    return new Observable<CareerMarketData>(observer => {
      this.listAndUseAvailableModel(prompt, careerName, countryCode, observer);
    });
  }

  private async listAndUseAvailableModel(
    prompt: string,
    careerName: string,
    countryCode: string | undefined,
    observer: any
  ): Promise<void> {
    try {
      const apiKey = environment.geminiApiKey;
      const listUrls = [
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
      ];

      let availableModels: string[] = [];

      for (const url of listUrls) {
        try {
          const response: any = await this.http.get(url).toPromise();
          if (response && response.models) {
            availableModels = response.models
              .map((m: any) => m.name.replace('models/', ''))
              .filter((name: string) => name.includes('gemini'));
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (availableModels.length === 0) {
        console.warn('No Gemini models found. Using AI-generated defaults.');
        this.getDefaultMarketData(careerName, countryCode).then(data => {
          observer.next(data);
          observer.complete();
        });
        return;
      }

      this.tryGeminiModelsWithSDK([availableModels[0]], prompt, careerName, countryCode, observer);

    } catch (error) {
      console.error('Error listing models:', error);
      this.getDefaultMarketData(careerName, countryCode).then(data => {
        observer.next(data);
        observer.complete();
      });
    }
  }

  private tryGeminiModelsWithSDK(
    modelNames: string[],
    prompt: string,
    careerName: string,
    countryCode: string | undefined,
    observer: any
  ): void {
    if (modelNames.length === 0) {
      console.warn('All Gemini models failed, using AI-generated defaults');
      this.getDefaultMarketData(careerName, countryCode).then(data => {
        observer.next(data);
        observer.complete();
      });
      return;
    }

    const modelName = modelNames[0];
    const remainingModels = modelNames.slice(1);

    try {
      const model = this.genAI!.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.3,
          topP: 0.95,
          topK: 40
        }
      });

      model.generateContent(prompt).then(response => {
        try {
          const responseText = response.response.text();
          let jsonText = responseText.trim();
          
          if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          const data = JSON.parse(jsonText);

          const marketData: CareerMarketData = {
            careerName,
            jobOpenings: data.jobOpenings || [],
            salaryRange: data.salaryRange || null, // Keep for backward compatibility
            salaryRangesByLevel: data.salaryRangesByLevel || undefined,
            totalJobCount: data.totalJobCount || undefined,
            jobCountsBySite: data.jobCountsBySite || undefined,
            marketTrend: data.marketTrend || 'unknown',
            lastUpdated: new Date(),
            loading: false,
            error: false
          };

          this.cache[careerName] = marketData;
          observer.next(marketData);
          observer.complete();
        } catch (error: any) {
          this.tryGeminiModelsWithSDK(remainingModels, prompt, careerName, countryCode, observer);
        }
      }).catch(() => {
        this.tryGeminiModelsWithSDK(remainingModels, prompt, careerName, countryCode, observer);
      });
    } catch (error: any) {
      this.tryGeminiModelsWithSDK(remainingModels, prompt, careerName, countryCode, observer);
    }
  }

  private buildMarketDataPrompt(careerName: string, countryCode?: string): string {
    const countryContext = countryCode ? ` in ${this.getCountryName(countryCode)}` : '';
    const currentDate = new Date();
    const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    
    return `Provide comprehensive market information for the career "${careerName}"${countryContext}. 

Return a JSON object with this exact structure:
{
  "jobOpenings": [
    {
      "source": "LinkedIn",
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "url": "https://..."
    }
  ],
  "totalJobCount": 1250,
  "jobCountsBySite": [
    {"site": "LinkedIn", "count": 450},
    {"site": "Indeed", "count": 380},
    {"site": "Glassdoor", "count": 220},
    {"site": "Monster", "count": 200}
  ],
  "salaryRangesByLevel": {
    "junior": {
      "min": 40000,
      "max": 60000,
      "currency": "USD",
      "period": "yearly"
    },
    "mid": {
      "min": 65000,
      "max": 90000,
      "currency": "USD",
      "period": "yearly"
    },
    "senior": {
      "min": 95000,
      "max": 140000,
      "currency": "USD",
      "period": "yearly"
    }
  },
  "marketTrend": "growing"
}

Requirements:
1. Calculate totalJobCount: Total number of job postings from all major job sites (LinkedIn, Indeed, Glassdoor, Monster, etc.) for the last 12 months (from ${oneYearAgo.toLocaleDateString()} to ${lastMonth.toLocaleDateString()})
2. Provide jobCountsBySite: Breakdown of job counts per major job site
3. Provide salaryRangesByLevel: Salary ranges for three levels:
   - junior: Entry-level positions (0-2 years experience)
   - mid: Mid-level positions (3-7 years experience)
   - senior: Senior positions (8+ years experience)
4. Use realistic, current data based on 2024-2025 market conditions
5. If country-specific, adjust salary to local currency and market rates
6. Job counts should be realistic estimates based on typical job board volumes
7. Market trend: "growing", "stable", "declining", or "unknown"

Career: ${careerName}
${countryCode ? `Country: ${this.getCountryName(countryCode)}` : ''}`;
  }


  private async getDefaultMarketData(careerName: string, countryCode?: string): Promise<CareerMarketData> {
    const aiGeneratedDefaults = await this.generateDefaultsWithAI(careerName, countryCode);
    
    return {
      careerName,
      jobOpenings: [
        {
          source: 'LinkedIn',
          title: `Entry-level ${careerName} positions`,
          location: 'Multiple locations',
          url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(careerName)}`
        },
        {
          source: 'Indeed',
          title: `${careerName} jobs`,
          location: 'Various',
          url: `https://www.indeed.com/jobs?q=${encodeURIComponent(careerName)}`
        }
      ],
      salaryRange: aiGeneratedDefaults.salaryRange, // Keep for backward compatibility
      salaryRangesByLevel: aiGeneratedDefaults.salaryRangesByLevel,
      totalJobCount: aiGeneratedDefaults.totalJobCount,
      jobCountsBySite: aiGeneratedDefaults.jobCountsBySite,
      marketTrend: aiGeneratedDefaults.marketTrend,
      lastUpdated: new Date(),
      loading: false,
      error: false
    };
  }

  private async generateDefaultsWithAI(careerName: string, countryCode?: string): Promise<{ 
    salaryRange: SalaryRange; 
    salaryRangesByLevel?: SalaryRangeByLevel;
    totalJobCount?: number;
    jobCountsBySite?: JobCountBySite[];
    marketTrend: 'growing' | 'stable' | 'declining' | 'unknown' 
  }> {
    if (!environment.geminiApiKey || !this.genAI) {
      return this.getHardcodedDefaults(careerName);
    }

    const countryContext = countryCode ? ` in ${this.getCountryName(countryCode)}` : '';
    const currentDate = new Date();
    const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    
    const prompt = `Provide comprehensive market data for "${careerName}"${countryContext}.

Return ONLY a JSON object with this exact structure:
{
  "salaryRange": {
    "min": 40000,
    "max": 60000,
    "currency": "USD",
    "period": "yearly",
    "source": "AI Generated"
  },
  "salaryRangesByLevel": {
    "junior": {
      "min": 40000,
      "max": 60000,
      "currency": "USD",
      "period": "yearly"
    },
    "mid": {
      "min": 65000,
      "max": 90000,
      "currency": "USD",
      "period": "yearly"
    },
    "senior": {
      "min": 95000,
      "max": 140000,
      "currency": "USD",
      "period": "yearly"
    }
  },
  "totalJobCount": 1250,
  "jobCountsBySite": [
    {"site": "LinkedIn", "count": 450},
    {"site": "Indeed", "count": 380},
    {"site": "Glassdoor", "count": 220},
    {"site": "Monster", "count": 200}
  ],
  "marketTrend": "growing"
}

Requirements:
1. Calculate totalJobCount: Total number of job postings from all major job sites for the last 12 months (from ${oneYearAgo.toLocaleDateString()} to ${lastMonth.toLocaleDateString()})
2. Provide jobCountsBySite: Breakdown of job counts per major job site (LinkedIn, Indeed, Glassdoor, Monster, etc.)
3. Provide salaryRangesByLevel: Salary ranges for three levels:
   - junior: Entry-level (0-2 years experience)
   - mid: Mid-level (3-7 years experience)
   - senior: Senior (8+ years experience)
4. Use realistic, current data based on 2024-2025 market conditions
5. Use appropriate currency for the country (USD, KES, ZAR, NGN, etc.)
6. Market trend: "growing", "stable", "declining", or "unknown"
7. Job counts should be realistic estimates based on typical job board volumes

Career: ${careerName}
${countryCode ? `Country: ${this.getCountryName(countryCode)}` : ''}`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.3,
          topP: 0.95,
          topK: 40
        }
      });

      const response = await model.generateContent(prompt);
      const responseText = response.response.text();
      let jsonText = responseText.trim();
      
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const data = JSON.parse(jsonText);
      const hardcoded = this.getHardcodedDefaults(careerName);
      
      return {
        salaryRange: data.salaryRange || hardcoded.salaryRange,
        salaryRangesByLevel: data.salaryRangesByLevel || hardcoded.salaryRangesByLevel,
        totalJobCount: data.totalJobCount || hardcoded.totalJobCount,
        jobCountsBySite: data.jobCountsBySite || hardcoded.jobCountsBySite,
        marketTrend: data.marketTrend || 'unknown'
      };
    } catch (error) {
      console.warn('AI generation of defaults failed, using hardcoded fallback:', error);
      return this.getHardcodedDefaults(careerName);
    }
  }

  private getHardcodedDefaults(careerName: string): { 
    salaryRange: SalaryRange; 
    salaryRangesByLevel?: SalaryRangeByLevel;
    totalJobCount?: number;
    jobCountsBySite?: JobCountBySite[];
    marketTrend: 'growing' | 'stable' | 'declining' | 'unknown' 
  } {
    const salaryRanges: { [key: string]: { min: number; max: number } } = {
      'Doctor': { min: 180000, max: 250000 },
      'Nurse': { min: 55000, max: 75000 },
      'Dentist': { min: 120000, max: 180000 },
      'Pharmacist': { min: 100000, max: 130000 },
      'Engineer': { min: 65000, max: 90000 },
      'Software Engineer': { min: 70000, max: 100000 },
      'Lawyer': { min: 60000, max: 85000 },
      'Teacher': { min: 40000, max: 55000 },
      'Accountant': { min: 50000, max: 70000 },
      'Business Manager': { min: 55000, max: 80000 },
      'IT Specialist': { min: 60000, max: 85000 },
      'Data Scientist': { min: 80000, max: 120000 },
      'Scientist': { min: 60000, max: 85000 },
      'Architect': { min: 55000, max: 75000 },
      'Journalist': { min: 35000, max: 50000 },
      'Social Worker': { min: 40000, max: 55000 },
      'Psychologist': { min: 50000, max: 70000 }
    };

    const range = salaryRanges[careerName] || { min: 40000, max: 60000 };
    
    // Calculate salary ranges by level (junior, mid, senior)
    const juniorMin = range.min;
    const juniorMax = range.min + (range.max - range.min) * 0.4;
    const midMin = range.min + (range.max - range.min) * 0.4;
    const midMax = range.min + (range.max - range.min) * 0.75;
    const seniorMin = range.min + (range.max - range.min) * 0.75;
    const seniorMax = range.max * 1.5; // Senior can go higher
    
    // Estimate job counts (realistic estimates based on career name hash)
    const careerHash = careerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseJobCount = 500 + (careerHash % 1500);
    const linkedInCount = Math.floor(baseJobCount * 0.35);
    const indeedCount = Math.floor(baseJobCount * 0.30);
    const glassdoorCount = Math.floor(baseJobCount * 0.20);
    const monsterCount = Math.floor(baseJobCount * 0.15);
    
    return {
      salaryRange: {
        min: range.min,
        max: range.max,
        currency: 'USD',
        period: 'yearly',
        source: 'Hardcoded Fallback'
      },
      salaryRangesByLevel: {
        junior: {
          min: Math.round(juniorMin),
          max: Math.round(juniorMax),
          currency: 'USD',
          period: 'yearly'
        },
        mid: {
          min: Math.round(midMin),
          max: Math.round(midMax),
          currency: 'USD',
          period: 'yearly'
        },
        senior: {
          min: Math.round(seniorMin),
          max: Math.round(seniorMax),
          currency: 'USD',
          period: 'yearly'
        }
      },
      totalJobCount: baseJobCount,
      jobCountsBySite: [
        { site: 'LinkedIn', count: linkedInCount },
        { site: 'Indeed', count: indeedCount },
        { site: 'Glassdoor', count: glassdoorCount },
        { site: 'Monster', count: monsterCount }
      ],
      marketTrend: 'stable'
    };
  }

  private isCacheValid(data: CareerMarketData): boolean {
    const now = new Date().getTime();
    const lastUpdated = new Date(data.lastUpdated).getTime();
    return (now - lastUpdated) < this.cacheExpiry;
  }

  private getCountryName(code: string): string {
    const countries: { [key: string]: string } = {
      'KE': 'Kenya', 'NG': 'Nigeria', 'ZA': 'South Africa', 'GH': 'Ghana',
      'TZ': 'Tanzania', 'UG': 'Uganda', 'RW': 'Rwanda', 'ET': 'Ethiopia',
      'EG': 'Egypt', 'MA': 'Morocco', 'US': 'United States', 'UK': 'United Kingdom',
      'CA': 'Canada', 'AU': 'Australia'
    };
    return countries[code] || code;
  }

  clearCache(careerName: string): void {
    delete this.cache[careerName];
  }

  clearAllCache(): void {
    this.cache = {};
  }

  private getMarketDataViaFunctions(careerName: string, countryCode?: string): Observable<CareerMarketData> {
    const functionsUrl = environment.firebaseFunctionsUrl || 
      `https://us-central1-${environment.firebaseConfig.projectId}.cloudfunctions.net/getCareerMarketData`;
    
    const body = {
      careerName,
      countryCode: countryCode || null
    };

    return this.http.post<CareerMarketData>(functionsUrl, body).pipe(
      map(data => {
        this.cache[careerName] = data;
        return data;
      }),
      catchError(error => {
        console.error('Error fetching market data from Firebase Functions:', error);
        return new Observable<CareerMarketData>(observer => {
          this.getDefaultMarketData(careerName, countryCode).then(data => {
            observer.next(data);
            observer.complete();
          });
        });
      })
    );
  }
}

