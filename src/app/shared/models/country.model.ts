export interface Country {
  code: string;
  name: string;
  flag: string;
  active?: boolean; // For enabling/disabling countries dynamically
}

// Fallback countries - only South Africa is active by default
// Other countries should be enabled via Firestore (backend-driven)
export const DEFAULT_COUNTRIES: Country[] = [
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', active: true },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', active: false },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', active: false },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', active: false },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', active: false },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', active: false }
];

