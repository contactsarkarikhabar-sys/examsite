
export interface JobLink {
  id: string;
  title: string;
  lastDate?: string;
  isNew?: boolean;
  link: string;
}

export interface SectionData {
  title: string;
  color: string; // Tailwind color class prefix e.g. 'red', 'blue'
  items: JobLink[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

// New Types for Detailed View
export interface LinkItem {
  label: string;
  url: string;
}

export interface VacancyItem {
  postName: string;
  totalPost: string;
  eligibility: string;
}

export interface JobDetailData {
  id: string;
  title: string;
  postDate: string;
  shortInfo: string;
  importantDates: string[];
  applicationFee: string[];
  ageLimit: string[];
  vacancyDetails: VacancyItem[];
  importantLinks: LinkItem[];
  videoLink?: string; // YouTube Video ID or URL
}

export type ViewType = 'home' | 'detail' | 'category' | 'about' | 'contact' | 'privacy' | 'terms' | 'disclaimer';
