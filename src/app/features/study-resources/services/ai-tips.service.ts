import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface AITip {
  subject: string;
  improvement: number;
  tip: string;
  loading?: boolean;
  error?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AITipsService {
  private apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private http: HttpClient) {}

  /**
   * Generate AI-powered improvement tips for a subject
   * @param subject The subject name
   * @param currentGrade Current grade percentage
   * @param requiredGrade Required grade percentage
   * @param improvementNeeded Points needed to improve
   * @param careerName The career name for context
   */
  generateTip(
    subject: string,
    currentGrade: number,
    requiredGrade: number,
    improvementNeeded: number,
    careerName: string
  ): Observable<string> {
    // If no API key is configured, return a default tip
    if (!environment.openaiApiKey) {
      return of(this.getDefaultTip(subject, improvementNeeded));
    }

    const prompt = `As an educational advisor, provide a concise, actionable tip (2-3 sentences) for a student who needs to improve their ${subject} grade by ${improvementNeeded} percentage points (from ${currentGrade}% to ${requiredGrade}%) to pursue a career as a ${careerName}. Focus on specific study strategies, key topics to review, or practice methods. Be encouraging and practical.`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.openaiApiKey}`
    });

    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful educational advisor providing study tips to students.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    };

    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      map(response => {
        if (response.choices && response.choices.length > 0) {
          return response.choices[0].message.content.trim();
        }
        return this.getDefaultTip(subject, improvementNeeded);
      }),
      catchError(error => {
        console.error('Error fetching AI tip:', error);
        return of(this.getDefaultTip(subject, improvementNeeded));
      })
    );
  }

  /**
   * Generate tips for multiple subjects
   */
  generateTipsForSubjects(
    improvements: { [subject: string]: number },
    grades: { [subject: string]: number },
    career: { name: string; minGrades: { [subject: string]: number } }
  ): Observable<AITip[]> {
    const tips: AITip[] = [];
    const subjects = Object.keys(improvements);

    subjects.forEach(subject => {
      const currentGrade = grades[subject] || 0;
      const requiredGrade = career.minGrades[subject];
      const improvementNeeded = improvements[subject];

      tips.push({
        subject,
        improvement: improvementNeeded,
        tip: '',
        loading: true,
        error: false
      });

      this.generateTip(subject, currentGrade, requiredGrade, improvementNeeded, career.name)
        .subscribe({
          next: (tip) => {
            const tipIndex = tips.findIndex(t => t.subject === subject);
            if (tipIndex !== -1) {
              tips[tipIndex].tip = tip;
              tips[tipIndex].loading = false;
            }
          },
          error: () => {
            const tipIndex = tips.findIndex(t => t.subject === subject);
            if (tipIndex !== -1) {
              tips[tipIndex].tip = this.getDefaultTip(subject, improvementNeeded);
              tips[tipIndex].loading = false;
              tips[tipIndex].error = true;
            }
          }
        });
    });

    return of(tips);
  }

  /**
   * Fallback default tips when AI is not available
   */
  private getDefaultTip(subject: string, improvementNeeded: number): string {
    const tips: { [key: string]: string[] } = {
      'Math': [
        `Focus on practicing problem-solving daily. Review fundamental concepts and work through past exam papers to improve by ${improvementNeeded} points.`,
        `Strengthen your understanding of core formulas and practice applying them to different problem types. Consistent daily practice will help you reach your target.`
      ],
      'Physics': [
        `Understand the underlying principles and practice applying them to real-world scenarios. Work through numerical problems and conceptual questions to improve by ${improvementNeeded} points.`,
        `Focus on mastering key concepts and their applications. Regular practice with problem sets and understanding the theory behind each topic will boost your grade.`
      ],
      'Chemistry': [
        `Review chemical reactions, equations, and periodic trends. Practice balancing equations and understanding molecular structures to improve by ${improvementNeeded} points.`,
        `Focus on stoichiometry, organic chemistry basics, and periodic table relationships. Daily practice with past papers will help you achieve your target grade.`
      ],
      'Biology': [
        `Study key biological processes, diagrams, and terminology. Create visual aids and practice explaining concepts to improve by ${improvementNeeded} points.`,
        `Focus on understanding life processes, cell biology, and genetics. Regular revision with flashcards and practice questions will help you reach your goal.`
      ],
      'English': [
        `Improve your writing skills through regular practice. Focus on grammar, essay structure, and reading comprehension to improve by ${improvementNeeded} points.`,
        `Read widely and practice writing essays. Work on vocabulary, sentence structure, and critical analysis to boost your English grade.`
      ],
      'History': [
        `Create timelines and study key events chronologically. Practice essay writing and source analysis to improve by ${improvementNeeded} points.`,
        `Focus on understanding cause and effect relationships. Regular revision of key dates, events, and their significance will help you achieve your target.`
      ]
    };

    const subjectTips = tips[subject] || tips['Math'];
    return subjectTips[Math.floor(Math.random() * subjectTips.length)];
  }
}

