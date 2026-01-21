export interface QualificationLevel {
  level: 'Degree' | 'BTech' | 'Diploma' | 'Certificate';
  nqfLevel?: number; // NQF level (e.g., 7 for Degree, 6 for Diploma, 5 for Certificate)
  minGrades: { [subject: string]: number };
  aps?: number; // Admission Point Score (if applicable)
  notes?: string; // Additional notes (e.g., "Mathematics required, not Mathematical Literacy")
  sources?: {
    url?: string; // Official source URL
    institution?: string; // Source institution name (e.g., "University of Cape Town")
    verifiedDate?: string; // ISO date when verified (e.g., "2024-01-15")
    notes?: string; // Additional notes about the source
  };
}

export interface Career {
  name: string;
  minGrades: { [subject: string]: number }; // Default/fallback requirements
  countryBaselines?: { [countryCode: string]: { [subject: string]: number } }; // Legacy: country-specific requirements
  qualificationLevels?: { [countryCode: string]: QualificationLevel[] }; // New: qualification level-specific requirements
  category?: string; // University curriculum/field of study (e.g., "Medicine", "Law", "IT", "Engineering")
  // Source attribution (optional, for verified requirements) - Legacy format
  sources?: {
    [countryCode: string]: {
      url?: string; // Official source URL
      institution?: string; // Source institution name (e.g., "University of Cape Town")
      verifiedDate?: string; // ISO date when verified (e.g., "2024-01-15")
      notes?: string; // Additional notes about the source
    };
  };
  lastVerified?: string; // ISO date when requirements were last verified
  verificationStatus?: 'verified' | 'estimated' | 'needs-review'; // Status of requirements
}

