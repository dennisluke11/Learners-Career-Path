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

@Injectable({ providedIn: 'root' })
export class StudyResourcesService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private http: HttpClient) {
    if (environment.geminiApiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
      } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
      }
    }
  }

  /**
   * Generate study resources for a subject using AI
   * Focuses on subjects needing improvement for the selected career
   */
  generateStudyResources(
    subject: string,
    gradeLevel: GradeLevel,
    country: Country,
    career?: Career | null
  ): Observable<StudyResource> {
    // If no Gemini API key, return default resources
    if (!environment.geminiApiKey || !this.genAI) {
      return new Observable<StudyResource>(observer => {
        this.getDefaultResources(subject, gradeLevel, country, career).then(resource => {
          observer.next(resource);
          observer.complete();
        });
      });
    }

    // Build context-aware prompt
    const careerContext = career 
      ? `The student is working towards a career as a ${career.name} and needs to improve in ${subject} to meet the career requirements.`
      : '';
    
    const prompt = `As an educational advisor, provide comprehensive study resources for a ${country.name} student in ${gradeLevel.displayName} studying ${subject}. ${careerContext}

Provide study resources in this EXACT JSON format:
{
  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "recommendedSites": [
    {"name": "Site Name", "url": "https://actual-url.com", "description": "Brief description of what the site offers"}
  ],
  "pastPapers": [
    {"name": "Paper Name", "url": "https://actual-url.com", "description": "Brief description", "year": "2023"}
  ]
}

Requirements:
1. Key Topics: Provide 5-7 specific topics relevant to ${subject} at ${gradeLevel.displayName} level in ${country.name}'s curriculum
2. Recommended Websites: Provide 5-8 real, accessible online study resources with actual URLs. Focus on:
   - Free educational platforms (Khan Academy, Coursera, etc.)
   - Country-specific educational sites for ${country.name}
   - Subject-specific learning platforms
   - Interactive practice sites
3. Past Papers: Provide 3-5 past paper resources with actual URLs. Focus on:
   - ${country.name}'s official exam board websites
   - Past paper repositories
   - Practice exam sites
4. All URLs must be real and accessible
5. Be specific to ${country.name}'s curriculum (${this.getCurriculumName(country.code)})
6. Focus on ${gradeLevel.displayName} level content

${career ? `Career Context: The student needs to improve ${subject} to qualify for ${career.name}. Make resources relevant to this career path.` : ''}

Return ONLY valid JSON, no markdown, no explanations.`;

    return new Observable<StudyResource>(observer => {
      this.generateWithGemini(prompt, subject, gradeLevel, country, career, observer);
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
    // Try multiple model names in order of preference
    // Note: Some models may not be available depending on API key permissions
    const modelNames = [
      'gemini-1.0-pro',      // Try v1.0 first (more widely available)
      'gemini-1.5-flash',    // Fast and reliable
      'gemini-1.5-pro',      // More capable but slower
      'gemini-pro'           // Legacy fallback
    ];

    let lastError: any = null;
    for (const modelName of modelNames) {
      try {
        const model = this.genAI!.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40
          }
        });

        const response = await model.generateContent(prompt);
        const responseText = response.response.text();
        let jsonText = responseText.trim();
        
        // Extract JSON from markdown code blocks if present
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

        console.log(`✅ Successfully generated study resources using model: ${modelName}`);
        observer.next(resource);
        observer.complete();
        return; // Success, exit the function
      } catch (error: any) {
        lastError = error;
        // Only log once per model attempt to avoid spam
        if (error?.message?.includes('404') || error?.message?.includes('not found')) {
          // Model not available, try next one silently
          continue;
        } else {
          // Other error (rate limit, invalid response, etc.), try next model
          console.log(`⚠️ Model ${modelName} failed: ${error?.message || error}, trying next model...`);
          continue;
        }
      }
    }
    
    // All models failed, use defaults
    console.warn(`⚠️ AI generation failed with all models (API key may not have access to these models), using defaults. Last error:`, lastError?.message || lastError);
    const defaultResource = await this.getDefaultResources(subject, gradeLevel, country, career);
    observer.next(defaultResource);
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

  /**
   * Get default study resources when AI is not available
   */
  private async getDefaultResources(
    subject: string,
    gradeLevel: GradeLevel,
    country: Country,
    career?: Career | null
  ): Promise<StudyResource> {
    const countryResources = this.getCountrySpecificResources(country.code, subject, gradeLevel, career);
    
    return {
      subject,
      topics: countryResources.topics,
      recommendedSites: countryResources.sites,
      pastPapers: countryResources.pastPapers,
      loading: false,
      error: false
    };
  }

  /**
   * Get country-specific default resources
   */
  private getCountrySpecificResources(
    countryCode: string, 
    subject: string,
    gradeLevel?: GradeLevel,
    career?: Career | null
  ): {
    topics: string[];
    sites: { name: string; url: string; description: string }[];
    pastPapers: { name: string; url: string; description: string; year?: string }[];
  } {
    const commonTopics: { [key: string]: string[] } = {
      'Math': ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics'],
      'Physics': ['Mechanics', 'Thermodynamics', 'Electricity and Magnetism', 'Waves', 'Optics'],
      'Chemistry': ['Atomic Structure', 'Chemical Bonding', 'Organic Chemistry', 'Acids and Bases', 'Stoichiometry'],
      'Biology': ['Cell Biology', 'Genetics', 'Human Anatomy', 'Ecology', 'Evolution'],
      'English': ['Grammar', 'Composition', 'Literature Analysis', 'Reading Comprehension', 'Vocabulary'],
      'History': ['World History', 'National History', 'Political Systems', 'Economic History', 'Social Movements']
    };

    const countrySites: { [key: string]: { name: string; url: string; description: string }[] } = {
      'KE': [
        { name: 'KCSE Past Papers', url: 'https://www.kcsepastpapers.com', description: 'Kenya Certificate of Secondary Education past papers' },
        { name: 'Elimu Library', url: 'https://www.elimulibrary.com', description: 'Kenyan educational resources and materials' },
        { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
        { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities' }
      ],
      'NG': [
        { name: 'WAEC Past Questions', url: 'https://www.waeconline.org.ng', description: 'West African Examinations Council past questions' },
        { name: 'Nigerian Educational Portal', url: 'https://www.nigerianeducation.com', description: 'Educational resources for Nigerian students' },
        { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
        { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities' }
      ],
      'ZA': [
        { name: 'Department of Basic Education', url: 'https://www.education.gov.za', description: 'South African curriculum and past papers' },
        { name: 'Mindset Learn', url: 'https://learn.mindset.africa', description: 'Free educational content for South African students' },
        { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
        { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities' }
      ],
      'ZW': [
        { name: 'ZIMSEC Past Papers', url: 'https://www.zimsec.co.zw', description: 'Zimbabwe School Examinations Council past papers' },
        { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
        { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities' }
      ],
      'ET': [
        { name: 'Ethiopian Education Portal', url: 'https://www.moe.gov.et', description: 'Ministry of Education resources' },
        { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
        { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities' }
      ],
      'EG': [
        { name: 'Egyptian Education Portal', url: 'https://moe.gov.eg', description: 'Ministry of Education resources' },
        { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
        { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities' }
      ],
      'GH': [
        { name: 'WASSCE Past Questions', url: 'https://www.wassce.com', description: 'West African Senior School Certificate Examination past questions' },
        { name: 'Ghana Education Service', url: 'https://ges.gov.gh', description: 'Official Ghana education resources' }
      ],
      'UK': [
        { name: 'BBC Bitesize', url: 'https://www.bbc.co.uk/bitesize', description: 'Free study support for GCSE and A-Levels' },
        { name: 'Exam Papers Plus', url: 'https://www.exampapersplus.co.uk', description: 'Past papers for GCSE and A-Levels' }
      ],
      'US': [
        { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
        { name: 'College Board', url: 'https://www.collegeboard.org', description: 'SAT and AP exam resources' }
      ]
    };

    const countryPastPapers: { [key: string]: { name: string; url: string; description: string; year?: string }[] } = {
      'KE': [
        { name: 'KCSE Past Papers 2023', url: 'https://www.kcsepastpapers.com/2023', description: 'Latest KCSE examination papers', year: '2023' },
        { name: 'KCSE Past Papers Archive', url: 'https://www.kcsepastpapers.com/archive', description: 'Historical KCSE papers' },
        { name: 'KNEC Past Papers', url: 'https://www.knec.ac.ke', description: 'Kenya National Examinations Council official papers' }
      ],
      'NG': [
        { name: 'WAEC Past Questions 2023', url: 'https://www.waeconline.org.ng/past-questions', description: 'Latest WAEC examination questions', year: '2023' },
        { name: 'JAMB Past Questions', url: 'https://www.jamb.gov.ng', description: 'Joint Admissions and Matriculation Board past questions' },
        { name: 'NECO Past Papers', url: 'https://www.neco.gov.ng', description: 'National Examinations Council past papers' }
      ],
      'ZA': [
        { name: 'Matric Past Papers 2023', url: 'https://www.education.gov.za/past-papers', description: 'Latest Matric examination papers', year: '2023' },
        { name: 'IEB Past Papers', url: 'https://www.ieb.co.za', description: 'Independent Examinations Board papers' },
        { name: 'DBE Past Papers', url: 'https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations.aspx', description: 'Department of Basic Education official papers' }
      ],
      'ZW': [
        { name: 'ZIMSEC O-Level Past Papers', url: 'https://www.zimsec.co.zw/past-exam-papers', description: 'ZIMSEC O-Level examination papers' },
        { name: 'ZIMSEC A-Level Past Papers', url: 'https://www.zimsec.co.zw/past-exam-papers', description: 'ZIMSEC A-Level examination papers' }
      ],
      'ET': [
        { name: 'Ethiopian National Exam Papers', url: 'https://www.moe.gov.et/exam-papers', description: 'Ethiopian national examination past papers' },
        { name: 'ESLCE Past Papers', url: 'https://www.moe.gov.et/eslce', description: 'Ethiopian School Leaving Certificate Examination papers' }
      ],
      'EG': [
        { name: 'Thanaweya Amma Past Papers', url: 'https://moe.gov.eg/past-papers', description: 'Egyptian General Secondary Certificate past papers' },
        { name: 'Ministry of Education Papers', url: 'https://moe.gov.eg/exams', description: 'Official examination papers from Ministry of Education' }
      ],
      'GH': [
        { name: 'WASSCE Past Questions 2023', url: 'https://www.wassce.com/past-questions', description: 'Latest WASSCE examination questions', year: '2023' }
      ],
      'UK': [
        { name: 'GCSE Past Papers', url: 'https://www.aqa.org.uk/pastpapers', description: 'AQA GCSE past papers' },
        { name: 'A-Level Past Papers', url: 'https://www.aqa.org.uk/pastpapers', description: 'AQA A-Level past papers' }
      ],
      'US': [
        { name: 'SAT Practice Tests', url: 'https://www.collegeboard.org/sat/practice', description: 'Official SAT practice tests' },
        { name: 'AP Exam Resources', url: 'https://apcentral.collegeboard.org', description: 'Advanced Placement exam resources' }
      ]
    };

    return {
      topics: commonTopics[subject] || ['General Topics', 'Key Concepts', 'Important Areas'],
      sites: countrySites[countryCode] || [
        { name: 'General Educational Resources', url: 'https://www.khanacademy.org', description: 'Free online educational content' }
      ],
      pastPapers: countryPastPapers[countryCode] || [
        { name: 'Past Papers Archive', url: '#', description: 'Check your local education board website' }
      ]
    };
  }
}

