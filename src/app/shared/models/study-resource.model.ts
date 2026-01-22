export interface StudyResource {
  subject: string;
  topics: string[];
  recommendedSites: {
    name: string;
    url: string;
    description: string;
  }[];
  pastPapers: {
    name: string;
    url: string;
    description: string;
    year?: string;
  }[];
  loading?: boolean;
  error?: boolean;
}

export interface StudyResourcesResponse {
  [subject: string]: StudyResource;
}

