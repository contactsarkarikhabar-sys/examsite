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

const deriveReadableTitle = (job: JobDetailData): string => {
  const rawTitle = (job.title || '').trim();
  const info = (job.shortInfo || '').trim();
  const url = job.importantLinks?.[0]?.url || '';

  const cleanedBase = rawTitle
    .replace(/\b(news and notification|notifications?|vacancies?|vacancy notification|state of|recruitment\/engagement)\b/ig, '')
    .replace(/https?:\/\/\S+/ig, '')
    .replace(/\s*\|\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const lowerAll = (cleanedBase + ' ' + info).toLowerCase();
  const yearMatch = (cleanedBase.match(/20\d{2}/) || info.match(/20\d{2}/));
  const year = yearMatch ? yearMatch[0] : '';

  const patterns: Array<{ re: RegExp; name: string }> = [
    { re: /\brrb\s*je\b/i, name: 'Railway RRB JE' },
    { re: /\brrb\s*group\s*d\b/i, name: 'Railway RRB Group D' },
    { re: /\brrb\s*alp\b/i, name: 'Railway RRB ALP' },
    { re: /\bssc\s*cgl\b/i, name: 'SSC CGL' },
    { re: /\bssc\s*chsl\b/i, name: 'SSC CHSL' },
    { re: /\bssc\s*mts\b/i, name: 'SSC MTS' },
    { re: /\buppsc\b/i, name: 'UPPSC' },
    { re: /\bupsssc\b/i, name: 'UPSSSC' },
    { re: /\bnhm\s+maharashtra\b/i, name: 'NHM Maharashtra' },
    { re: /\b(tshc|telangana\s+high\s+court)\b/i, name: 'Telangana High Court' },
    { re: /\bpsssb\b/i, name: 'Punjab SSSB' },
    { re: /\brpsc\b/i, name: 'RPSC' },
    { re: /\brsmssb|rssb\b/i, name: 'RSMSSB' },
    { re: /\bmppsc\b/i, name: 'MPPSC' },
    { re: /\bbpsc\b/i, name: 'BPSC' },
    { re: /\bwbpsc\b/i, name: 'WBPSC' },
    { re: /\bjkpsc\b/i, name: 'JKPSC' },
    { re: /\bjpsc\b/i, name: 'JPSC' },
    { re: /\bmpsc\b/i, name: 'MPSC' },
    { re: /\bgpsc\b/i, name: 'GPSC' },
    { re: /\bhpsc\b/i, name: 'HPSC' },
    { re: /\bhssc\b/i, name: 'HSSC' },
    { re: /\buksssc\b/i, name: 'UKSSSC' },
    { re: /\bossc\b/i, name: 'OSSC' },
  ];

  let exam = '';
  for (const p of patterns) {
    if (p.re.test(cleanedBase) || p.re.test(info)) {
      exam = p.name;
      break;
    }
  }

  // Fallback to organization from domain
  if (!exam) {
    try {
      const host = url ? new URL(url).hostname : '';
      if (/sssb\.punjab\.gov\.in$/i.test(host)) exam = 'Punjab SSSB';
      else if (/rpsc\.rajasthan\.gov\.in$/i.test(host)) exam = 'RPSC';
      else if (/upsssc\.gov\.in$/i.test(host)) exam = 'UPSSSC';
      else if (/uppsc\.up\.nic\.in$/i.test(host)) exam = 'UPPSC';
      else if (/esb\.mp\.gov\.in$/i.test(host)) exam = 'MPESB';
    } catch {}
  }

  // Decide action based on classification or content
  let action = 'Online Form';
  const t = cleanedBase.toLowerCase();
  if (t.includes('admit card') || t.includes('hall ticket') || t.includes('call letter')) {
    action = 'Admit Card';
  } else if (t.includes('answer key')) {
    action = 'Answer Key';
  } else if (t.includes('syllabus') || t.includes('pattern')) {
    action = 'Syllabus';
  } else if (t.includes('result')) {
    action = 'Result';
  } else if (t.includes('status')) {
    action = 'Online Application Status';
  } else if (t.includes('counselling') || t.includes('admission')) {
    action = 'Admission';
  }

  // Prefer "Online Application Status" if content indicates application status
  if (/application\s+status|status\s+check/i.test(lowerAll)) {
    action = 'Online Application Status';
  }

  // Compose: Exam + Year + Action, without generic words
  const composed = `${(exam || cleanedBase).trim()}${year ? ' ' + year : ''} ${action}`.replace(/\s{2,}/g, ' ').trim();
  return composed;
};

const isDisplayableJob = (job: JobDetailData): boolean => {
  const rawTitle = (job.title || '');
  const title = rawTitle.toLowerCase().replace(/\s{2,}/g, ' ').trim();
  const info = (job.shortInfo || '').toLowerCase().replace(/\s{2,}/g, ' ').trim();
  const titleLen = title.length;
  const infoLen = info.length;
  const genericHead = /^(recruitment|vacancies|vacancy notification|notification|news and notification|recruitment\/engagement|online form|vacancy\s*(?:&|and)\s*online form)\b/i.test(rawTitle.toLowerCase());
  const looksLikeUrl = /^https?:\/\//i.test(rawTitle) || /https?:\/\//i.test(info);
  const hasQueryNoise = /(\bkey=|utm_|ref=)/i.test(rawTitle) || /(\bkey=|utm_|ref=)/i.test(info);
  const keywords = ['ssc', 'upsc', 'railway', 'rrb', 'nhm', 'police', 'constable', 'group d', 'bank', 'ibps', 'sbi', 'rbi', 'teacher', 'engineer', 'clerk', 'apprentice',
    'uppsc','upsssc','rpsc','rsmssb','mppsc','bpsc','wbpsc','jkpsc','jpsc','mpsc','kpsc','gpsc','hpsc','hppsc','opsc','tnpsc','tspsc','appsc','ossc','hssc','uksssc','bssc','dsssb','psssb','jssc','cgpsc','mpesb'
  ];
  const hasKeyword = keywords.some(k => title.includes(k) || info.includes(k));
  let domainOk = false;
  try {
    const url = job.importantLinks?.[0]?.url || '';
    const host = url ? new URL(url).hostname : '';
    domainOk = /\.(gov\.in|nic\.in)$/.test(host) || /upsc\.gov\.in|ssc\.gov\.in|ibps\.in|sbi\.co\.in|rbi\.org\.in/.test(host);
  } catch {}
  const hasLink = !!(job.importantLinks?.[0]?.url);
  const derived = deriveReadableTitle(job).toLowerCase();
  const actionOnly = /^(online form|online application status|vacancy\s*(?:&|and)\s*online form|vacancy)$/i.test(derived);
  return (!genericHead && !looksLikeUrl && !hasQueryNoise && !actionOnly && (titleLen >= 20 || infoLen >= 40 || hasKeyword || domainOk)) && hasLink;
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

export const jobService = {
  // Fetch all jobs from Backend API (With Caching)
  getAllJobs: async (forceRefresh = false): Promise<SectionData[]> => {
    const now = Date.now();

    // Return cached if available and fresh
    if (!forceRefresh && cachedSections && (now - lastFetchTime < CACHE_DURATION)) {
      return JSON.parse(JSON.stringify(cachedSections)); // Return copy to avoid mutation
    }

    try {
      const workerUrl = import.meta.env.VITE_WORKER_URL || '';
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
      const workerUrl = import.meta.env.VITE_WORKER_URL || '';
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

  postNewJob: async (
    jobData: any,
    adminPassword: string
  ): Promise<{ success: boolean; message: string; notificationsSent?: number }> => {
    const workerUrl = import.meta.env.VITE_WORKER_URL || '';
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

  saveJob: async (
    jobData: any,
    adminPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    const workerUrl = import.meta.env.VITE_WORKER_URL || '';
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
    const workerUrl = import.meta.env.VITE_WORKER_URL || '';
    const response = await fetch(`${workerUrl}/api/admin/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminPassword}` },
    });
    return await response.json() as { success: boolean; message: string };
  }
};
