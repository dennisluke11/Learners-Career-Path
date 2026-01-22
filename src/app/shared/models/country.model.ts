export interface Country {
  code: string;
  name: string;
  flag: string;
  active?: boolean; // For enabling/disabling countries dynamically
}

export const DEFAULT_COUNTRIES: Country[] = [
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', active: true },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', active: true },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', active: true },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', active: true },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', active: true },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', active: true }
];

