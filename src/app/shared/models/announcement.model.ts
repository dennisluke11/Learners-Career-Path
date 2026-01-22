export interface Announcement {
  id?: string;
  title: string;
  content: string;
  type: 'university_admission' | 'scholarship' | 'training' | 'job' | 'event' | 'general';
  category?: string;
  targetCareers?: string[];
  targetCountries?: string[];
  targetGradeLevels?: number[];
  priority: number;
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
  isPaid: boolean;
  company?: {
    name: string;
    logo?: string;
    website?: string;
    contact?: string;
  };
  actionButton?: {
    text: string;
    url: string;
    type: 'external' | 'internal';
  };
  image?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  views?: number;
  clicks?: number;
  sponsorId?: string;
}





