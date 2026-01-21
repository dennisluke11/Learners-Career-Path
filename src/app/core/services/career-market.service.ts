import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiRateLimitService } from './gemini-rate-limit.service';
import { FirebaseService } from './firebase.service';

export interface JobOpening {
  source: string;
  title: string;
  company?: string;
  location?: string;
  url?: string;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: string;
  source?: string;
}

export interface JobCountBySite {
  site: string;
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
  salaryRange: SalaryRange | null;
  salaryRangesByLevel?: SalaryRangeByLevel;
  totalJobCount?: number;
  jobCountsBySite?: JobCountBySite[];
  marketTrend: 'growing' | 'stable' | 'declining' | 'unknown';
  lastUpdated: Date;
  loading?: boolean;
  error?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CareerMarketService {
  private cache: { [careerName: string]: CareerMarketData } = {};
  private cacheExpiry = 24 * 60 * 60 * 1000;
  private genAI: GoogleGenerativeAI | null = null;
  private useFirebaseFunctions: boolean = false;
  private readonly FREE_TIER_MODELS = [
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  constructor(
    private http: HttpClient,
    private rateLimitService: GeminiRateLimitService,
    private firebaseService: FirebaseService
  ) {
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
    const cacheKey = `${careerName}_${countryCode || 'default'}`;
    const cached = this.cache[cacheKey];
    if (cached && this.isCacheValid(cached)) {
      return of(cached);
    }

    if (this.firebaseService.isAvailable()) {
      return this.getMarketDataFromFirestore(careerName, countryCode);
    }
    if (this.useFirebaseFunctions) {
      return this.getMarketDataViaFunctions(careerName, countryCode);
    }

    if (!environment.geminiApiKey || !this.genAI) {
      return new Observable<CareerMarketData>(observer => {
        observer.error(new Error('Market data unavailable: Firebase and AI are not configured.'));
          observer.complete();
      });
    }

    const prompt = this.buildMarketDataPrompt(careerName, countryCode);
    return new Observable<CareerMarketData>(observer => {
      this.listAndUseAvailableModel(prompt, careerName, countryCode, observer);
    });
  }

  private getMarketDataFromFirestore(careerName: string, countryCode?: string): Observable<CareerMarketData> {
    return new Observable<CareerMarketData>(observer => {
      const docId = countryCode ? `${careerName}_${countryCode}` : careerName;
      
      this.firebaseService.getDocument('marketData', docId).then((data: any) => {
        if (data) {
          const marketData: CareerMarketData = {
            careerName: data.careerName || careerName,
            jobOpenings: [],
            salaryRange: data.salaryRangesByLevel?.mid || null,
            salaryRangesByLevel: data.salaryRangesByLevel,
            totalJobCount: data.totalJobCount,
            jobCountsBySite: data.jobCountsBySite,
            marketTrend: data.marketTrend || 'unknown',
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
            loading: false,
            error: false
          };

          const cacheKey = `${careerName}_${countryCode || 'default'}`;
          this.cache[cacheKey] = marketData;
          
          console.log(`✅ Loaded market data for ${careerName} from Firestore`);
          observer.next(marketData);
          observer.complete();
        } else {
          console.warn(`⚠️ Market data not found in Firestore for ${careerName}, trying AI...`);
          if (environment.geminiApiKey && this.genAI) {
            const prompt = this.buildMarketDataPrompt(careerName, countryCode);
            this.listAndUseAvailableModel(prompt, careerName, countryCode, observer);
          } else {
            observer.error(new Error(`Market data not found for ${careerName} in Firestore. Please run populate-market-data-firestore.js`));
            observer.complete();
          }
        }
      }).catch((error: any) => {
        console.error('Error fetching market data from Firestore:', error);
        observer.error(error);
        observer.complete();
      });
    });
  }

  private async listAndUseAvailableModel(
    prompt: string,
    careerName: string,
    countryCode: string | undefined,
    observer: any
  ): Promise<void> {
    this.tryGeminiModelsWithSDK(this.FREE_TIER_MODELS, prompt, careerName, countryCode, observer);
  }

  private tryGeminiModelsWithSDK(
    modelNames: string[],
    prompt: string,
    careerName: string,
    countryCode: string | undefined,
    observer: any
  ): void {
    if (modelNames.length === 0) {
      console.error('All Gemini models failed');
      observer.error(new Error(`Failed to generate market data for ${careerName}. Please ensure data is in Firestore or AI is configured.`));
      observer.complete();
      return;
    }

    const rateLimitCheck = this.rateLimitService.canMakeRequest();
    if (!rateLimitCheck.allowed) {
      console.warn(`⚠️ Rate limit: ${rateLimitCheck.reason}`);
      const stats = this.rateLimitService.getUsageStats();
      console.log(`📊 Gemini API Usage: ${stats.requestsToday}/${stats.dailyLimit} today, ${stats.remainingToday} remaining`);
      observer.error(new Error(`Rate limit exceeded. Market data not available for ${careerName}. Please try again later or ensure data is in Firestore.`));
        observer.complete();
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
          topK: 40,
          responseMimeType: 'application/json'
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
            salaryRange: data.salaryRange || null,
            salaryRangesByLevel: data.salaryRangesByLevel || undefined,
            totalJobCount: data.totalJobCount || undefined,
            jobCountsBySite: data.jobCountsBySite || undefined,
            marketTrend: data.marketTrend || 'unknown',
            lastUpdated: new Date(),
            loading: false,
            error: false
          };

          this.rateLimitService.recordRequest();
          const stats = this.rateLimitService.getUsageStats();
          console.log(`✅ Generated market data using ${modelName}. Usage: ${stats.requestsToday}/${stats.dailyLimit} today`);

          this.cache[careerName] = marketData;
          observer.next(marketData);
          observer.complete();
        } catch (error: any) {
          this.tryGeminiModelsWithSDK(remainingModels, prompt, careerName, countryCode, observer);
        }
      }).catch((error: any) => {
        if (error?.message?.includes('429') || error?.message?.includes('rate limit') || error?.message?.includes('quota')) {
          console.warn(`⚠️ Rate limit hit on ${modelName}.`);
          observer.error(new Error(`Rate limit exceeded. Market data not available for ${careerName}. Please try again later or ensure data is in Firestore.`));
          observer.complete();
          return;
        }
        this.tryGeminiModelsWithSDK(remainingModels, prompt, careerName, countryCode, observer);
      });
    } catch (error: any) {
      this.tryGeminiModelsWithSDK(remainingModels, prompt, careerName, countryCode, observer);
    }
  }

  private buildMarketDataPrompt(careerName: string, countryCode?: string): string {
    const countryContext = countryCode ? ` in ${this.getCountryName(countryCode)}` : '';
    const currency = countryCode ? this.getCurrencyForCountry(countryCode) : 'USD';
    
    return `Market data for "${careerName}"${countryContext}.

JSON format:
{
  "totalJobCount": 1250,
  "jobCountsBySite": [{"site": "LinkedIn", "count": 450}, {"site": "Indeed", "count": 380}],
  "salaryRangesByLevel": {
    "junior": {"min": 40000, "max": 60000, "currency": "${currency}", "period": "yearly"},
    "mid": {"min": 65000, "max": 90000, "currency": "${currency}", "period": "yearly"},
    "senior": {"min": 95000, "max": 140000, "currency": "${currency}", "period": "yearly"}
  },
  "marketTrend": "growing"
}

Provide realistic 2024-2025 data. Job counts from major sites (LinkedIn, Indeed, Glassdoor). Salary ranges: junior (0-2yrs), mid (3-7yrs), senior (8+yrs). Use ${currency}. Return JSON only.`;
  }

  private getCurrencyForCountry(countryCode: string): string {
    const currencies: { [key: string]: string } = {
      'KE': 'KES', 'NG': 'NGN', 'ZA': 'ZAR', 'ZW': 'USD', 
      'ET': 'ETB', 'EG': 'EGP', 'GH': 'GHS'
    };
    return currencies[countryCode] || 'USD';
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
          observer.error(new Error(`Failed to fetch market data for ${careerName}. Please ensure data is in Firestore.`));
            observer.complete();
        });
      })
    );
  }
}

