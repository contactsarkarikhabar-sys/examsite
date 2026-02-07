import { deriveReadableTitle, isDisplayableJob } from '../shared/jobTitle';

export type IncomingJob = {
  title?: string;
  shortInfo?: string;
  importantDates?: string[] | string;
  importantLinks?: Array<{ label?: string; url?: string }> | string;
  applyLink?: string;
};

const normalizeText = (s: string) => String(s || '').replace(/\s{2,}/g, ' ').trim();

export const normalizeTitle = (job: IncomingJob): string => {
  const importantDates = Array.isArray(job.importantDates)
    ? job.importantDates
    : (() => {
        try {
          return JSON.parse(String(job.importantDates || '[]'));
        } catch {
          return [];
        }
      })();

  const importantLinks = Array.isArray(job.importantLinks)
    ? job.importantLinks
    : (() => {
        try {
          return JSON.parse(String(job.importantLinks || '[]'));
        } catch {
          return [];
        }
      })();

  return deriveReadableTitle({
    title: normalizeText(job.title || ''),
    shortInfo: normalizeText(job.shortInfo || ''),
    importantDates,
    importantLinks: importantLinks.map((l: any) => ({ url: String(l?.url || '') })),
    applyLink: String(job.applyLink || '')
  });
};

export const validateJob = (job: IncomingJob): { ok: boolean; reason?: string; normalizedTitle?: string } => {
  const normalizedTitle = normalizeTitle(job);

  const ok = isDisplayableJob({
    title: normalizeText(job.title || ''),
    shortInfo: normalizeText(job.shortInfo || ''),
    importantDates: Array.isArray(job.importantDates) ? job.importantDates : undefined,
    importantLinks: Array.isArray(job.importantLinks)
      ? job.importantLinks.map(l => ({ url: String(l?.url || '') }))
      : undefined,
    applyLink: String(job.applyLink || '')
  });

  if (!ok) {
    return { ok: false, reason: 'Policy rejected job (low quality / unsafe / missing fields)', normalizedTitle };
  }

  if (!normalizedTitle || /\(\s*\)/.test(normalizedTitle) || normalizedTitle.toLowerCase() === 'job notification') {
    return { ok: false, reason: 'Normalized title invalid', normalizedTitle };
  }

  return { ok: true, normalizedTitle };
};

export const isAllowedSourceUrl = (link: string, title: string, snippet: string): boolean => {
  const text = `${title || ''} ${snippet || ''}`.toLowerCase();
  const keywords = [
    'ssc',
    'upsc',
    'railway',
    'rrb',
    'ntpc',
    'alp',
    'group d',
    'ibps',
    'sbi',
    'rbi',
    'lic',
    'afcat',
    'agniveer',
    'uppsc',
    'upsssc',
    'rpsc',
    'rsmssb',
    'bpsc',
    'mppsc',
    'wbpsc',
    'dsssb',
    'psssb',
    'uksssc',
    'cgpsc',
    'mpesb',
    'csbc'
  ];
  const hasKeyword = keywords.some(k => text.includes(k));

  try {
    const url = new URL(link);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const knownBoards = [
      'ssc.gov.in',
      'upsc.gov.in',
      'indianrailways.gov.in',
      'ibps.in',
      'sbi.co.in',
      'opportunities.rbi.org.in',
      'rbi.org.in',
      'licindia.in',
      'afcat.cdac.in',
      'agnipathvayu.cdac.in',
      'joinindianarmy.nic.in',
      'joinindiannavy.gov.in',
      'csbc.bih.nic.in',
      'uppbpb.gov.in',
      'upsssc.gov.in',
      'uppsc.up.nic.in'
    ];
    const isKnownBoard = knownBoards.some(d => host === d || host.endsWith(`.${d}`));
    if (isKnownBoard) return true;

    const isGov = host.endsWith('.gov.in') || host.endsWith('.nic.in');
    const recruitmentPath = /(recruit|career|vacanc|notification|advertis|employment|jobs?)/i.test(path);
    if (isGov && hasKeyword && recruitmentPath) return true;

    return false;
  } catch {
    return false;
  }
};

