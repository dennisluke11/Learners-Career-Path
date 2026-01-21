import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Country } from '../../../shared/models/country.model';
import { GradeLevel } from '../../../shared/models/grade-level.model';
import { Career } from '../../../shared/models/career.model';
import { StudyResource, StudyResourcesResponse } from '../../../shared/models/study-resource.model';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiRateLimitService } from '../../../core/services/gemini-rate-limit.service';
import { FirebaseService } from '../../../core/services/firebase.service';

@Injectable({ providedIn: 'root' })
export class StudyResourcesService {
  private genAI: GoogleGenerativeAI | null = null;
  // Use Flash-Lite for best free tier limits (15 RPM, 1000 RPD)
  private readonly FREE_TIER_MODELS = [
    'gemini-2.0-flash-lite',  // Best free tier: 15 RPM, 1000 RPD
    'gemini-2.5-flash-lite',  // Alternative: 15 RPM, 1000 RPD
    'gemini-2.0-flash',        // Fallback: 10 RPM, 250 RPD
    'gemini-1.5-flash'         // Legacy fallback
  ];

  constructor(
    private http: HttpClient,
    private rateLimitService: GeminiRateLimitService,
    private firebaseService: FirebaseService
  ) {
    if (environment.geminiApiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
      } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
      }
    }
  }

  generateStudyResources(
    subject: string,
    gradeLevel: GradeLevel,
    country: Country,
    career?: Career | null
  ): Observable<StudyResource> {
    if (this.firebaseService.isAvailable()) {
      return this.getStudyResourcesFromFirestore(subject, gradeLevel, country, career);
    }

    if (!environment.geminiApiKey || !this.genAI) {
      return new Observable<StudyResource>(observer => {
        observer.error(new Error('Study resources unavailable: Firebase and AI are not configured.'));
        observer.complete();
      });
    }

    const careerContext = career 
      ? `The student is working towards a career as a ${career.name} and needs to improve in ${subject} to meet the career requirements.`
      : '';
    
    // Optimized prompt - shorter to reduce token usage
    const curriculum = this.getCurriculumName(country.code);
    const prompt = `Study resources for ${subject} (${gradeLevel.displayName}, ${country.name}, ${curriculum})${career ? `. Career: ${career.name}` : ''}.

JSON format:
{
  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "recommendedSites": [{"name": "Site", "url": "https://url.com", "description": "Brief"}],
  "pastPapers": [{"name": "Paper", "url": "https://url.com", "description": "Brief", "year": "2023"}]
}

Provide 5-7 topics, 5-8 sites (free platforms, country-specific), 3-5 past papers (official exam boards). All URLs must be real. Return JSON only.`;

    return new Observable<StudyResource>(observer => {
      this.generateWithGemini(prompt, subject, gradeLevel, country, career, observer);
    });
  }

  private getStudyResourcesFromFirestore(
    subject: string,
    gradeLevel: GradeLevel,
    country: Country,
    career?: Career | null
  ): Observable<StudyResource> {
    return new Observable<StudyResource>(observer => {
      const docId = `${subject}_${country.code}_${gradeLevel.displayName.replace(/\s+/g, '_')}`;
      
      this.firebaseService.getDocument('studyResources', docId).then(data => {
        if (data) {
          const resource: StudyResource = {
            subject: data.subject || subject,
            topics: data.topics || [],
            recommendedSites: data.recommendedSites || [],
            pastPapers: data.pastPapers || [],
            loading: false,
            error: false
          };

          console.log(`✅ Loaded study resources for ${subject} (${country.code}, ${gradeLevel.displayName}) from Firestore`);
          observer.next(resource);
          observer.complete();
        } else {
          // Not found in Firestore, try AI as fallback
          console.warn(`⚠️ Study resources not found in Firestore for ${subject}, trying AI...`);
          if (environment.geminiApiKey && this.genAI) {
            const careerContext = career 
              ? `The student is working towards a career as a ${career.name} and needs to improve in ${subject} to meet the career requirements.`
              : '';
            const curriculum = this.getCurriculumName(country.code);
            const prompt = `Study resources for ${subject} (${gradeLevel.displayName}, ${country.name}, ${curriculum})${career ? `. Career: ${career.name}` : ''}.

JSON format:
{
  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "recommendedSites": [{"name": "Site", "url": "https://url.com", "description": "Brief"}],
  "pastPapers": [{"name": "Paper", "url": "https://url.com", "description": "Brief", "year": "2023"}]
}

Provide 5-7 topics, 5-8 sites (free platforms, country-specific), 3-5 past papers (official exam boards). All URLs must be real. Return JSON only.`;
            this.generateWithGemini(prompt, subject, gradeLevel, country, career, observer);
          } else {
            observer.error(new Error(`Study resources not found for ${subject} in Firestore. Please run populate-study-resources-firestore.js`));
            observer.complete();
          }
        }
      }).catch(error => {
        console.error('Error fetching study resources from Firestore:', error);
        observer.error(error);
        observer.complete();
      });
    });
  }

  private async generateWithGemini(
    prompt: string,
    subject: string,
    gradeLevel: GradeLevel,
    country: Country,
    career: Career | null | undefined,
    observer: any
  ): Promise<void> {
    const rateLimitCheck = this.rateLimitService.canMakeRequest();
    if (!rateLimitCheck.allowed) {
      console.warn(`⚠️ Rate limit: ${rateLimitCheck.reason}`);
      const stats = this.rateLimitService.getUsageStats();
      console.log(`📊 Gemini API Usage: ${stats.requestsToday}/${stats.dailyLimit} today, ${stats.remainingToday} remaining`);
      observer.error(new Error(`Rate limit exceeded. Study resources not available. Please try again later or ensure data is in Firestore.`));
      observer.complete();
      return;
    }

    let lastError: any = null;
    for (const modelName of this.FREE_TIER_MODELS) {
      try {
        const model = this.genAI!.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            responseMimeType: 'application/json' // Request JSON directly to reduce tokens
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
        
        const parsed = JSON.parse(jsonText);
        
        const resource: StudyResource = {
          subject,
          topics: parsed.topics || [],
          recommendedSites: parsed.recommendedSites || [],
          pastPapers: parsed.pastPapers || [],
          loading: false,
          error: false
        };

        this.rateLimitService.recordRequest();
        const stats = this.rateLimitService.getUsageStats();
        console.log(`✅ Generated study resources using ${modelName}. Usage: ${stats.requestsToday}/${stats.dailyLimit} today`);
        
        observer.next(resource);
        observer.complete();
        return;
      } catch (error: any) {
        lastError = error;
        
        if (error?.message?.includes('429') || error?.message?.includes('rate limit') || error?.message?.includes('quota')) {
          console.warn(`⚠️ Rate limit hit on ${modelName}`);
          observer.error(new Error(`Rate limit exceeded. Study resources not available. Please try again later or ensure data is in Firestore.`));
          observer.complete();
          return;
        }
        
        if (error?.message?.includes('404') || error?.message?.includes('not found')) {
          continue;
        }
        
        console.log(`⚠️ Model ${modelName} failed: ${error?.message || error}, trying next model...`);
        continue;
      }
    }
    
    console.warn(`⚠️ AI generation failed with all models. Last error:`, lastError?.message || lastError);
    observer.error(new Error(`Failed to generate study resources for ${subject}. Please ensure data is in Firestore or AI is configured.`));
    observer.complete();
  }

  private getCurriculumName(countryCode: string): string {
    const curricula: { [key: string]: string } = {
      'ZA': 'CAPS/NSC (Matric)',
      'KE': 'KCSE/CBC',
      'NG': 'WAEC/WASSCE',
      'ZW': 'ZIMSEC',
      'ET': 'General Education',
      'EG': 'Thanaweya Amma'
    };
    return curricula[countryCode] || 'National Curriculum';
  }

}

