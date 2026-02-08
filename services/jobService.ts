import { SectionData, JobDetailData, JobLink } from '../types';
import { MOCK_SECTIONS } from '../constants';
import { deriveReadableTitle, isDisplayableJob } from '../shared/jobTitle';

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
  // --- State PSC / SSSC Common Official Portals ---
  if (t.includes('uppsc')) return "https://uppsc.up.nic.in/";
  if (t.includes('upsssc')) return "https://upsssc.gov.in/";
  if (t.includes('rpsc')) return "https://rpsc.rajasthan.gov.in/";
  if (t.includes('rsmssb') || t.includes('rssb')) return "https://rsmssb.rajasthan.gov.in/";
  if (t.includes('mppsc')) return "https://mppsc.mp.gov.in/";
  if (t.includes('bpsc')) return "https://www.bpsc.bih.nic.in/";
  if (t.includes('wbpsc')) return "https://wbpsc.gov.in/";
  if (t.includes('jkpsc')) return "https://jkpsc.nic.in/";
  if (t.includes('jpsc')) return "https://www.jpsc.gov.in/";
  if (/\bmpsc\b/.test(t) || (t.includes('maharashtra') && t.includes('psc'))) return "https://mpsc.gov.in/";
  if (t.includes('kpsc')) return "https://www.kpsc.kar.nic.in/";
  if (t.includes('gpsc')) return "https://gpsc.gujarat.gov.in/";
  if (t.includes('hpsc')) return "https://hpsc.gov.in/";
  if (t.includes('hppsc')) return "https://hppsc.hp.gov.in/hppsc/";
  if (t.includes('opsc')) return "https://www.opsc.gov.in/";
  if (t.includes('tnpsc')) return "https://www.tnpsc.gov.in/";
  if (t.includes('tspsc')) return "https://www.tspsc.gov.in/";
  if (t.includes('appsc')) return "https://psc.ap.gov.in/";
  if (t.includes('ossc')) return "https://www.ossc.gov.in/";
  if (t.includes('hssc')) return "https://www.hssc.gov.in/";
  if (t.includes('uksssc')) return "https://sssc.uk.gov.in/";
  if (t.includes('bssc')) return "https://bssc.bihar.gov.in/";
  if (t.includes('dsssb')) return "https://dsssb.delhi.gov.in/";
  if (t.includes('psssb') || t.includes('punjab sssb')) return "https://sssb.punjab.gov.in/";
  if (t.includes('jssc')) return "https://jssc.nic.in/";
  if (t.includes('cgpsc')) return "https://psc.cg.gov.in/";
  if (t.includes('mpesb') || t.includes('vyapam')) return "https://esb.mp.gov.in/";

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

// Initial Sections Structure (Clone from MOCK to keep colors/order AND items)
const getInitialSections = (): SectionData[] => {
  // Deep copy to avoid mutating the original constant if we modify it later
  return JSON.parse(JSON.stringify(MOCK_SECTIONS));
};

// --- CACHING LOGIC ---
let cachedSections: SectionData[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minutes

const getWorkerBaseUrl = (): string => {
  const configured = (import.meta.env.VITE_WORKER_URL || '').trim().replace(/\/$/, '');
  if (configured) return configured;
  try {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8787';
    }
  } catch {}
  return '';
};

export const jobService = {
  // Fetch all jobs from Backend API (With Caching)
  getAllJobs: async (forceRefresh = false): Promise<SectionData[]> => {
    const now = Date.now();

    // Return cached if available and fresh
    if (!forceRefresh && cachedSections && (now - lastFetchTime < CACHE_DURATION)) {
      return JSON.parse(JSON.stringify(cachedSections)); // Return copy to avoid mutation
    }

    try {
      const workerUrl = getWorkerBaseUrl();
      const apiUrl = workerUrl ? `${workerUrl}/api/jobs` : '/api/jobs';

      // Start with Mock Data (Hybrid Approach)
      const sections = getInitialSections();

      try {
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json() as { success: boolean, jobs: JobDetailData[] };
          const jobs = data.jobs || [];

          const newUpdatesItems: JobLink[] = [];

          jobs.forEach(job => {
            if (!isDisplayableJob(job)) {
              return;
            }
            // Create Link Item
            const linkItem: JobLink = {
              id: job.id,
              title: deriveReadableTitle(job),
              isNew: true, // New jobs from DB are always "New"
              link: job.importantLinks?.[0]?.url || getSmartLink(job.title),
              lastDate: job.importantDates?.[1]
            };

            // 1. Add to classified section
            const sectionTitle = classifyJob(job);
            const section = sections.find(s => s.title === sectionTitle);
            if (section) {
              // Prepend to show at top
              section.items.unshift(linkItem);
            } else {
              const otherSection = sections.find(s => s.title === 'Other Online Form');
              otherSection?.items.unshift(linkItem);
            }

            // 2. Add to "New Updates" (Top 15 candidate)
            newUpdatesItems.push(linkItem);
          });

          // Prepend new updates to the existing "New Updates" section
          const newUpdatesSection = sections.find(s => s.title === "New Updates");
          if (newUpdatesSection) {
            // Add new DB jobs to the top of New Updates
            newUpdatesSection.items = [...newUpdatesItems, ...newUpdatesSection.items];
          }
        }
      } catch (err) {
        console.warn('API fetch failed, using mock/cached data', err);
        // If API fails but we have cache (even if old), return it? 
        // Better to return the "Fresh Mock" sections we just created to be safe,
        // OR return stale cache. For now, let's stick to returning the sections we prepared (Mock).
      }

      // Update Cache
      cachedSections = sections;
      lastFetchTime = now;

      return sections;

    } catch (error) {
      console.error('Critical error in getAllJobs:', error);
      return MOCK_SECTIONS;
    }
  },

  // Search Jobs (Client-side filtering for now)
  searchJobs: async (query: string): Promise<SectionData[]> => {
    // Fetch all (which might be cached by browser or SWR in future)
    const allSections = await jobService.getAllJobs();

    if (!query.trim()) return allSections;

    const lowerQuery = query.toLowerCase();
    const tokens = lowerQuery
      .replace(/[^\w\s/.-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 && !['declared'].includes(t));

    const filtered = allSections.map(section => {
      const sectionTitle = section.title.toLowerCase();
      const items = section.items.filter(item => {
        const title = item.title.toLowerCase();
        const direct = title.includes(lowerQuery) || sectionTitle.includes(lowerQuery);
        if (direct) return true;
        if (tokens.length === 0) return false;
        const matchCount = tokens.reduce((acc, tok) => acc + (title.includes(tok) ? 1 : 0), 0);
        return matchCount >= Math.min(2, tokens.length);
      });
      return { ...section, items };
    }).filter(section => section.items.length > 0);

    return filtered.length > 0 ? filtered : allSections;
  },

  // Get Detailed Job Info
  getJobDetail: async (id: string, title?: string): Promise<JobDetailData> => {
    // 1. Check if it's a mock job in our extensive internal DB
    // This ensures rich details for "static" jobs even if API is down or empty
    const { JOB_DETAILS_DB } = await import('../constants'); // Dynamic import to avoid circular dependency issues if any
    if (JOB_DETAILS_DB[id]) {
      return JOB_DETAILS_DB[id];
    }

    try {
      const workerUrl = getWorkerBaseUrl();
      const apiUrl = workerUrl ? `${workerUrl}/api/jobs/${id}` : `/api/jobs/${id}`;

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Job not found');

      const data = await response.json() as { success: boolean, job: JobDetailData };
      const job = data.job;
      const readable = deriveReadableTitle(job);
      return { ...job, title: readable };

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
      const workerUrl = getWorkerBaseUrl();
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

  postNewJob: async (
    jobData: any,
    adminPassword: string
  ): Promise<{ success: boolean; message: string; notificationsSent?: number }> => {
    const workerUrl = getWorkerBaseUrl();
    const response = await fetch(`${workerUrl}/api/admin/post-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminPassword}`,
      },
      body: JSON.stringify(jobData),
    });
    return await response.json() as { success: boolean; message: string; notificationsSent?: number };
  },

  getSubscribersCount: async (adminPassword: string) => {
    const workerUrl = getWorkerBaseUrl();
    const apiUrl = workerUrl ? `${workerUrl}/api/admin/subscribers` : '/api/admin/subscribers';
    try {
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${adminPassword}` },
      });
      const data = await response.json() as any;
      if (!response.ok || data?.success === false) {
        return { total: -1, verified: 0, error: data?.error || 'Unauthorized' };
      }
      return { total: data.totalSubscribers || 0, verified: data.verifiedSubscribers || 0 };
    } catch (e) {
      return { total: -2, verified: 0, error: e instanceof Error ? e.message : String(e) };
    }
  },

  getAllDbJobs: async (adminPassword: string) => {
    const workerUrl = getWorkerBaseUrl();
    const response = await fetch(`${workerUrl}/api/jobs`, {
      headers: { 'Authorization': `Bearer ${adminPassword}` },
    });
    const data = await response.json() as any;
    return data.jobs || [];
  },

  saveJob: async (
    jobData: any,
    adminPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    const workerUrl = getWorkerBaseUrl();
    const response = await fetch(`${workerUrl}/api/admin/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminPassword}`,
      },
      body: JSON.stringify(jobData),
    });
    return await response.json() as { success: boolean; message: string };
  },

  deleteJob: async (
    jobId: string,
    adminPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    const workerUrl = getWorkerBaseUrl();
    const response = await fetch(`${workerUrl}/api/admin/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminPassword}` },
    });
    return await response.json() as { success: boolean; message: string };
  },

  getPendingJobs: async (adminPassword: string): Promise<Array<{ id: string; title: string; post_date?: string }>> => {
    const workerUrl = getWorkerBaseUrl();
    const apiUrl = workerUrl ? `${workerUrl}/api/admin/pending` : '/api/admin/pending';
    const response = await fetch(apiUrl, {
      headers: { 'Authorization': `Bearer ${adminPassword}` },
    });
    const data = await response.json() as any;
    return data.pending || [];
  },

  approveJob: async (jobId: string, adminPassword: string): Promise<{ success: boolean; message?: string }> => {
    const workerUrl = getWorkerBaseUrl();
    const apiUrl = workerUrl ? `${workerUrl}/api/admin/approve/${encodeURIComponent(jobId)}` : `/api/admin/approve/${encodeURIComponent(jobId)}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminPassword}` },
    });
    return await response.json() as any;
  },

  rejectJob: async (jobId: string, adminPassword: string): Promise<{ success: boolean; message?: string }> => {
    const workerUrl = getWorkerBaseUrl();
    const apiUrl = workerUrl ? `${workerUrl}/api/admin/reject/${encodeURIComponent(jobId)}` : `/api/admin/reject/${encodeURIComponent(jobId)}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminPassword}` },
    });
    return await response.json() as any;
  },

  cleanupJunkJobs: async (adminPassword: string): Promise<{ success: boolean; message?: string }> => {
    const workerUrl = getWorkerBaseUrl();
    const apiUrl = workerUrl ? `${workerUrl}/api/admin/cleanup-junk` : '/api/admin/cleanup-junk';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminPassword}` },
    });
    return await response.json() as any;
  },
};
