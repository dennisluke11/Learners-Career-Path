export interface Career {
  name: string;
  minGrades: { [subject: string]: number };
  countryBaselines?: { [countryCode: string]: { [subject: string]: number } };
  category?: string; // University curriculum/field of study (e.g., "Medicine", "Law", "IT", "Engineering")
}

