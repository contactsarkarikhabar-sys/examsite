import { SectionData, JobDetailData, JobLink } from '../types';
import { MOCK_SECTIONS } from '../constants';

// Simulated latency (optional, can be removed)
const DELAY = 100;

// Helper: Get Official Website or Fallback to Google Search
const getSmartLink = (title: string): string => {
  const t = title.toLowerCase();

  // --- TOP PRIORITY OFFICIAL DOMAINS (Verified HTTPS) ---
  if (t.includes('ssc')) return "https://ssc.gov.in/";
  if (t.includes('upsc')) return "https://upsc.gov.in/";
  if (t.includes('railway') || t.includes('rrb') || t.includes('ntpc')) return "https://indianrailways.gov.in/";
  if (t.includes('ibps')) return "https://www.ibps.in/";
  if (t.includes('sbi')) return "https://sbi.co.in/web/careers/";
  if (t.includes('rbi')) return "https://opportunities.rbi.org.in/";
  if (t.includes('lic')) return "https://licindia.in/";
  if (t.includes('airforce') || t.includes('afcat')) return "https://agnipathvayu.cdac.in/";
  if (t.includes('navy')) return "https://www.joinindiannavy.gov.in/";
  if (t.includes('army') || t.includes('agniveer')) return "https://joinindianarmy.nic.in/";

  // --- FAIL SAFE: GOOGLE SEARCH ---
  return `https://www.google.com/search?q=${encodeURIComponent(title + " official website apply online")}`;
};

// Helper: Classify Job into Section based on Title/Category
const classifyJob = (job: JobDetailData): string => {
  const t = job.title.toLowerCase();

  if (t.includes('result')) return 'Results';
  if (t.includes('admit card') || t.includes('hall ticket') || t.includes('call letter')) return 'Admit Card';
  if (t.includes('answer key')) return 'Answer Key';
  if (t.includes('syllabus') || t.includes('pattern')) return 'Syllabus';
  if (t.includes('admission') || t.includes('counselling')) return 'Admission';
  if (t.includes('verification') || t.includes('certificate')) return 'Certificate Verification';
  if (t.includes('yojana') || t.includes('scheme')) return 'Sarkari Yojana (Government Schemes)';

  // Default to Top Online Form for recruitment notifications
  return 'Top Online Form';
};

// Initial Sections Structure (Clone from MOCK to keep colors/order)
const getInitialSections = (): SectionData[] => {
  return MOCK_SECTIONS.map(s => ({
    title: s.title,
    color: s.color,
    items: []
  }));
};

export const jobService = {
  // Fetch all jobs from Backend API
  getAllJobs: async (): Promise<SectionData[]> => {
    try {
      const workerUrl = import.meta.env.VITE_WORKER_URL || '';
      // If running locally without env, it might be empty. Fallback or relative path if proxied?
      // For now, assuming relative path '/api' works if served from same origin, or full URL if env set.
      const apiUrl = workerUrl ? `${workerUrl}/api/jobs` : '/api/jobs';

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json() as { success: boolean, jobs: JobDetailData[] };
      const jobs = data.jobs || [];

      // Initialize Sections
      const sections = getInitialSections();
      const newUpdatesItems: JobLink[] = [];

      // Sort jobs by ID desc (proxy for date) or distinct date field if available
      // Assuming ID structure allows some chronological sorting or just reverse list
      // The API sorts by updated_at DESC, so we can iterate.

      jobs.forEach(job => {
        // Create Link Item
        const linkItem: JobLink = {
          id: job.id,
          title: job.title,
          isNew: true, // You might want logic here: e.g. within last 7 days
          link: job.importantLinks?.[0]?.url || getSmartLink(job.title),
          lastDate: job.importantDates?.[1] // Approximating "Last Date" from index 1 if exists
        };

        // 1. Add to classified section
        const sectionTitle = classifyJob(job);
        const section = sections.find(s => s.title === sectionTitle);
        if (section) {
          section.items.push(linkItem);
        } else {
          // Fallback to 'Other Online Form' if category not found
          const otherSection = sections.find(s => s.title === 'Other Online Form');
          otherSection?.items.push(linkItem);
        }

        // 2. Add to "New Updates" (Top 15)
        if (newUpdatesItems.length < 15) {
          newUpdatesItems.push(linkItem);
        }
      });

      // Special handling: "New Updates" section needs to be populated explicitly
      const newUpdatesSection = sections.find(s => s.title === "New Updates");
      if (newUpdatesSection) {
        newUpdatesSection.items = newUpdatesItems;
      }

      return sections;

    } catch (error) {
      console.error('API Fetch failed, using Mock Data:', error);
      return new Promise((resolve) => setTimeout(() => resolve(MOCK_SECTIONS), DELAY));
    }
  },

  // Search Jobs (Client-side filtering for now)
  searchJobs: async (query: string): Promise<SectionData[]> => {
    // Fetch all (which might be cached by browser or SWR in future)
    const allSections = await jobService.getAllJobs();

    if (!query.trim()) return allSections;

    const lowerQuery = query.toLowerCase();

    return allSections.map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        section.title.toLowerCase().includes(lowerQuery)
      )
    })).filter(section => section.items.length > 0);
  },

  // Get Detailed Job Info
  getJobDetail: async (id: string, title?: string): Promise<JobDetailData> => {
    try {
      const workerUrl = import.meta.env.VITE_WORKER_URL || '';
      const apiUrl = workerUrl ? `${workerUrl}/api/jobs/${id}` : `/api/jobs/${id}`;

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Job not found');

      const data = await response.json() as { success: boolean, job: JobDetailData };
      return data.job;

    } catch (error) {
      console.warn('Job API failed, falling back to mock or smart generation', error);

      // Fallback logic from previous implementation
      const smartLink = getSmartLink(title || "");
      return {
        id,
        title: title || "Job Notification Details",
        postDate: new Date().toLocaleDateString(),
        shortInfo: `This is the detailed information page for ${title}. Details could not be loaded from the server.`,
        importantDates: ["Check Official Notification"],
        applicationFee: ["As per rules"],
        ageLimit: ["As per rules"],
        vacancyDetails: [
          { postName: "Various Posts", totalPost: "See Notification", eligibility: "See Notification" }
        ],
        importantLinks: [
          { label: "Apply Online / Official Website", url: smartLink },
          { label: "Official Website", url: smartLink }
        ]
      };
    }
  },

  // Fetch Category Jobs (Reuse getAllJobs and filter)
  getCategoryJobs: async (categoryTitle: string): Promise<SectionData> => {
    const allSections = await jobService.getAllJobs();
    const section = allSections.find(s => s.title === categoryTitle);

    if (section) return section;

    return { title: categoryTitle, color: 'gray', items: [] };
  },

  // Subscribe User
  subscribeUser: async (userData: any): Promise<{ success: boolean; message: string; needsVerification?: boolean }> => {
    try {
      const workerUrl = import.meta.env.VITE_WORKER_URL || '';
      const apiUrl = workerUrl ? `${workerUrl}/api/subscribe` : '/api/subscribe';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json() as any;
      return {
        success: !!data.success,
        message: data.message || 'Subscribed successfully!',
        needsVerification: data.needsVerification,
      };
    } catch (error) {
      console.error('Subscribe error:', error);
      return { success: false, message: 'Subscription failed. Please try again.' };
    }
  },

  // Admin and other methods remain valid if they were using fetch already...
  // Re-implementing them here to ensure full file replacement is correct.

  postNewJob: async (jobData: any, adminPassword: string) => {
    const workerUrl = import.meta.env.VITE_WORKER_URL || '';
    const response = await fetch(`${workerUrl}/api/admin/post-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminPassword}`,
      },
      body: JSON.stringify(jobData),
    });
    return await response.json();
  },

  getSubscribersCount: async (adminPassword: string) => {
    const workerUrl = import.meta.env.VITE_WORKER_URL || '';
    const response = await fetch(`${workerUrl}/api/admin/subscribers`, {
      headers: { 'Authorization': `Bearer ${adminPassword}` },
    });
    const data = await response.json() as any;
    return { total: data.totalSubscribers || 0, verified: data.verifiedSubscribers || 0 };
  },

  getAllDbJobs: async (adminPassword: string) => {
    const workerUrl = import.meta.env.VITE_WORKER_URL || '';
    const response = await fetch(`${workerUrl}/api/jobs`, {
      headers: { 'Authorization': `Bearer ${adminPassword}` },
    });
    const data = await response.json() as any;
    return data.jobs || [];
  },

  saveJob: async (jobData: any, adminPassword: string) => {
    const workerUrl = import.meta.env.VITE_WORKER_URL || '';
    const response = await fetch(`${workerUrl}/api/admin/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminPassword}`,
      },
      body: JSON.stringify(jobData),
    });
    return await response.json();
  },

  deleteJob: async (jobId: string, adminPassword: string) => {
    const workerUrl = import.meta.env.VITE_WORKER_URL || '';
    const response = await fetch(`${workerUrl}/api/admin/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminPassword}` },
    });
    return await response.json();
  }
};