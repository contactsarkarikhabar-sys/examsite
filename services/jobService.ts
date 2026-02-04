import { SectionData, JobDetailData } from '../types';
import { MOCK_SECTIONS, JOB_DETAILS_DB } from '../constants';

// Simulated latency - reduced for snappier feel
const DELAY = 100;

// SMART LOGIC: Get Official Website or Fallback to Google Search
const getSmartLink = (title: string): string => {
  const t = title.toLowerCase();

  // --- TOP PRIORITY OFFICIAL DOMAINS (Verified HTTPS) ---

  // SSC
  if (t.includes('ssc') && (t.includes('gd') || t.includes('cgl') || t.includes('chsl') || t.includes('mts'))) return "https://ssc.gov.in/";
  if (t.includes('ssc')) return "https://ssc.gov.in/";

  // UPSC
  if (t.includes('upsc')) return "https://upsc.gov.in/";

  // RAILWAY (RRB)
  if (t.includes('railway') || t.includes('rrb') || t.includes('ntpc') || t.includes('group d') || t.includes('alp')) {
    return "https://indianrailways.gov.in/";
  }

  // BANKING
  if (t.includes('ibps')) return "https://www.ibps.in/";
  if (t.includes('sbi')) return "https://sbi.co.in/web/careers/";
  if (t.includes('rbi')) return "https://opportunities.rbi.org.in/";
  if (t.includes('lic')) return "https://licindia.in/";

  // DEFENCE
  if (t.includes('airforce') || t.includes('afcat') || t.includes('agniveer vayu')) return "https://agnipathvayu.cdac.in/";
  if (t.includes('navy') || t.includes('ssr')) return "https://www.joinindiannavy.gov.in/";
  if (t.includes('army') || t.includes('agniveer')) return "https://joinindianarmy.nic.in/";
  if (t.includes('coast guard')) return "https://joinindiancoastguard.cdac.in/";
  if (t.includes('drdo')) return "https://www.drdo.gov.in/";
  if (t.includes('isro')) return "https://www.isro.gov.in/";
  if (t.includes('bsf')) return "https://rectt.bsf.gov.in/";
  if (t.includes('cisf')) return "https://cisfrectt.cisf.gov.in/";
  if (t.includes('crpf')) return "https://rect.crpf.gov.in/";
  if (t.includes('itbp')) return "https://recruitment.itbpolice.nic.in/";

  // TEACHING / NTA
  if (t.includes('ctet')) return "https://ctet.nic.in/";
  if (t.includes('ugc net')) return "https://ugcnet.nta.ac.in/";
  if (t.includes('neet')) return "https://exams.nta.ac.in/NEET/";
  if (t.includes('jee')) return "https://jeemain.nta.ac.in/";
  if (t.includes('kvs')) return "https://kvsangathan.nic.in/";
  if (t.includes('nvs')) return "https://navodaya.gov.in/";

  // STATE POLICE & PUBLIC SERVICE COMMISSIONS
  // UP
  if (t.includes('up police') || t.includes('uppbpb')) return "https://uppbpb.gov.in/";
  if (t.includes('uppsc')) return "https://uppsc.up.nic.in/";
  if (t.includes('upsssc')) return "https://upsssc.gov.in/";

  // Bihar
  if (t.includes('bihar police') || t.includes('csbc')) return "https://csbc.bih.nic.in/";
  if (t.includes('bssc')) return "https://bssc.bihar.gov.in/";
  if (t.includes('bpsc')) return "https://www.bpsc.bih.nic.in/";

  // Rajasthan
  if (t.includes('rajasthan') || t.includes('rsmssb') || t.includes('rssb')) return "https://rsmssb.rajasthan.gov.in/";
  if (t.includes('rpsc')) return "https://rpsc.rajasthan.gov.in/";

  // Haryana
  if (t.includes('haryana') || t.includes('hssc')) return "https://hssc.gov.in/";
  if (t.includes('hpsc')) return "https://hpsc.gov.in/";

  // Delhi
  if (t.includes('dsssb')) return "https://dsssb.delhi.gov.in/";
  if (t.includes('delhi police')) return "https://delhipolice.gov.in/";

  // Madhya Pradesh
  if (t.includes('mp') && (t.includes('esb') || t.includes('vyapam'))) return "https://esb.mp.gov.in/";
  if (t.includes('mppsc')) return "https://mppsc.mp.gov.in/";

  // Others
  if (t.includes('post office') || t.includes('gds')) return "https://indiapostgdsonline.gov.in/";
  if (t.includes('gate')) return "https://gate.iitk.ac.in/";
  if (t.includes('ignou')) return "https://ignou.ac.in/";
  if (t.includes('cbse')) return "https://www.cbse.gov.in/";

  // --- FAIL SAFE: GOOGLE SEARCH ---
  // If we don't know the exact site, search for it. This guarantees the user finds it.
  // Example: "Bihar Work Inspector Official Website Apply Online"
  return `https://www.google.com/search?q=${encodeURIComponent(title + " official website apply online")}`;
};

export const jobService = {
  // Fetch all jobs
  getAllJobs: async (): Promise<SectionData[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const enrichedSections = MOCK_SECTIONS.map(section => ({
          ...section,
          items: section.items.map(item => ({
            ...item,
            // If link is empty or hash, use Smart Link
            link: (item.link === '#' || !item.link) ? getSmartLink(item.title) : item.link
          }))
        }));

        resolve(enrichedSections);
      }, DELAY);
    });
  },

  // Fetch Category Jobs
  getCategoryJobs: async (categoryTitle: string): Promise<SectionData> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const section = MOCK_SECTIONS.find(s => s.title === categoryTitle);
        if (!section) {
          resolve({ title: categoryTitle, color: 'gray', items: [] });
          return;
        }

        const enrichedSection = {
          ...section,
          items: section.items.map(item => ({
            ...item,
            link: (item.link === '#' || !item.link) ? getSmartLink(item.title) : item.link
          }))
        };

        resolve(enrichedSection);
      }, DELAY);
    });
  },

  // Search Jobs
  searchJobs: async (query: string): Promise<SectionData[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!query.trim()) {
          jobService.getAllJobs().then(resolve);
          return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = MOCK_SECTIONS.map(section => ({
          ...section,
          items: section.items
            .filter(item =>
              item.title.toLowerCase().includes(lowerQuery) ||
              section.title.toLowerCase().includes(lowerQuery)
            )
            .map(item => ({
              ...item,
              link: (item.link === '#' || !item.link) ? getSmartLink(item.title) : item.link
            }))
        })).filter(section => section.items.length > 0);

        resolve(filtered);
      }, DELAY);
    });
  },

  // Get Detailed Job Info
  getJobDetail: async (id: string, title?: string): Promise<JobDetailData> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const detail = JOB_DETAILS_DB[id];

        if (detail) {
          resolve(detail);
        } else {
          // Smart Link for details fallback
          const smartLink = getSmartLink(title || "");

          resolve({
            id,
            title: title || "Job Notification Details",
            postDate: new Date().toLocaleDateString(),
            shortInfo: `This is the detailed information page for ${title}. Candidates are advised to read the full notification before applying.`,
            importantDates: ["Check Official Notification"],
            applicationFee: ["As per rules"],
            ageLimit: ["As per rules"],
            vacancyDetails: [
              { postName: "Various Posts", totalPost: "See Notification", eligibility: "See Notification" }
            ],
            importantLinks: [
              { label: "Apply Online / Official Website", url: smartLink },
              { label: "Download Notification", url: smartLink }
            ]
          });
        }
      }, DELAY);
    });
  },

  // Subscribe User - Call backend API
  subscribeUser: async (userData: {
    name: string;
    email: string;
    qualification?: string;
    location?: string;
    interests?: string[];
  }): Promise<{ success: boolean; message: string; needsVerification?: boolean }> => {
    try {
      // Try to call the real API
      const workerUrl = import.meta.env.VITE_WORKER_URL || '';

      if (workerUrl) {
        const response = await fetch(`${workerUrl}/api/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });

        const data = await response.json();
        return {
          success: data.success,
          message: data.message || 'Subscribed successfully!',
          needsVerification: data.needsVerification,
        };
      }

      // Fallback to localStorage if no worker URL configured
      const existingSubs = JSON.parse(localStorage.getItem('examSite_subscribers') || '[]');
      if (existingSubs.some((sub: { email: string }) => sub.email === userData.email)) {
        return { success: true, message: 'Already subscribed!' };
      }
      existingSubs.push({ ...userData, date: new Date().toISOString() });
      localStorage.setItem('examSite_subscribers', JSON.stringify(existingSubs));
      return { success: true, message: 'Successfully subscribed!' };
    } catch (error) {
      console.error('Subscribe error:', error);
      // Fallback to localStorage on error
      const existingSubs = JSON.parse(localStorage.getItem('examSite_subscribers') || '[]');
      existingSubs.push({ ...userData, date: new Date().toISOString() });
      localStorage.setItem('examSite_subscribers', JSON.stringify(existingSubs));
      return { success: true, message: 'Subscribed (offline mode)' };
    }
  },

  // Admin: Post new job and notify subscribers
  postNewJob: async (
    jobData: {
      title: string;
      category: string;
      shortInfo: string;
      importantDates: string;
      applyLink: string;
    },
    adminPassword: string
  ): Promise<{ success: boolean; message: string; notificationsSent?: number }> => {
    try {
      const workerUrl = import.meta.env.VITE_WORKER_URL || '';

      if (!workerUrl) {
        return { success: false, message: 'Worker URL not configured' };
      }

      const response = await fetch(`${workerUrl}/api/admin/post-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`,
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();
      return {
        success: data.success,
        message: data.message || 'Job posted!',
        notificationsSent: data.notificationsSent,
      };
    } catch (error) {
      console.error('Post job error:', error);
      return { success: false, message: 'Failed to post job' };
    }
  },

  // Admin: Get subscribers count
  getSubscribersCount: async (adminPassword: string): Promise<{ total: number; verified: number }> => {
    try {
      const workerUrl = import.meta.env.VITE_WORKER_URL || '';

      if (!workerUrl) {
        return { total: 0, verified: 0 };
      }

      const response = await fetch(`${workerUrl}/api/admin/subscribers`, {
        headers: { 'Authorization': `Bearer ${adminPassword}` },
      });

      const data = await response.json();
      return {
        total: data.totalSubscribers || 0,
        verified: data.verifiedSubscribers || 0,
      };
    } catch (error) {
      return { total: 0, verified: 0 };
    }
  }
};