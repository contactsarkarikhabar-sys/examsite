const TRUSTED_SITES = [
    'ssc.gov.in',
    'upsc.gov.in',
    'indianrailways.gov.in',
    'ibps.in',
    'rbi.org.in',
    'drdo.gov.in',
    'isro.gov.in',
    'joinindianarmy.nic.in',
    'joinindiannavy.gov.in',
    'agnipathvayu.cdac.in'
];

const GENERIC_HEAD_RE =
    /^(recruitments?|recruitment|vacancies|vacancy notification|notification|news and notification|recruitment\/engagement|online form|vacancy\s*(?:&|and)\s*online form)\b/i;

const ACTION_ONLY_RE =
    /^(online form|online application status|vacancy\s*(?:&|and)\s*online form|vacancy)$/i;

export type JobTitleLike = {
    title?: string;
    shortInfo?: string;
    importantDates?: string[];
    importantLinks?: Array<{ url?: string }>;
    applyLink?: string;
};

const normalizeSpaces = (s: string) => s.replace(/\s{2,}/g, ' ').trim();

export const isTrustedDomain = (urlStr: string): boolean => {
    try {
        const host = new URL(urlStr).hostname;
        if (!host) return false;
        if (/\.(gov\.in|nic\.in)$/.test(host)) return true;
        return TRUSTED_SITES.some(s => host.endsWith(s));
    } catch {
        return false;
    }
};

export const isGenericHeadTitle = (rawTitle: string): boolean => {
    return GENERIC_HEAD_RE.test(String(rawTitle || '').toLowerCase());
};

export const stripGenericHeadPrefix = (rawTitle: string): string => {
    return normalizeSpaces(
        String(rawTitle || '')
            .replace(GENERIC_HEAD_RE, '')
            .replace(/\s*[\|\-:]\s*/g, ' ')
    );
};

export const isActionOnlyTitle = (title: string): boolean => {
    const normalized = normalizeSpaces(String(title || ''));
    const withoutYear = normalizeSpaces(normalized.replace(/\b20\d{2}\b/g, ' '));
    return ACTION_ONLY_RE.test(withoutYear);
};

export const deriveReadableTitle = (job: JobTitleLike): string => {
    const rawTitle = (job.title || '').trim();
    const info = (job.shortInfo || '').trim();
    const url = job.importantLinks?.[0]?.url || job.applyLink || '';

    const titleNoUrl = normalizeSpaces(
        rawTitle
            .replace(/https?:\/\/\S+/ig, ' ')
            .replace(/\s*\|\s*/g, ' ')
    );
    const infoNoUrl = normalizeSpaces(info.replace(/https?:\/\/\S+/ig, ' '));

    const cleanedBase = normalizeSpaces(
        titleNoUrl.replace(
            /\b(recruitments?|recruitment\/engagement|news and notification|notifications?|vacancies?|vacancy notification|notification|advertisement|state of|declared)\b/ig,
            ' '
        )
    );

    const cleanedForExamGuess = normalizeSpaces(
        cleanedBase
            .replace(
                /\b(online form|apply online|online application|application status|status|result|admit card|hall ticket|call letter|answer key|syllabus|exam pattern)\b/ig,
                ' '
            )
            .replace(/\b20\d{2}\b/g, ' ')
    );

    const lowerAll = normalizeSpaces(`${cleanedBase} ${infoNoUrl}`).toLowerCase();
    const datesText = Array.isArray(job.importantDates) ? job.importantDates.join(' ') : '';
    const yearMatch =
        cleanedBase.match(/20\d{2}/) || infoNoUrl.match(/20\d{2}/) || datesText.match(/20\d{2}/);
    const year = yearMatch ? yearMatch[0] : String(new Date().getFullYear());

    const patterns: Array<{ re: RegExp; name: string }> = [
        { re: /\brrb\s*je\b/i, name: 'Railway RRB JE' },
        { re: /\brrb\s*group\s*d\b/i, name: 'Railway RRB Group D' },
        { re: /\brrb\s*alp\b/i, name: 'Railway RRB ALP' },
        { re: /\bssc\s*cgl\b/i, name: 'SSC CGL' },
        { re: /\bssc\s*chsl\b/i, name: 'SSC CHSL' },
        { re: /\bssc\s*mts\b/i, name: 'SSC MTS' },
        { re: /\buppsc\b/i, name: 'Uttar Pradesh Public Service Commission (UPPSC)' },
        { re: /\bupsssc\b/i, name: 'Uttar Pradesh Subordinate Services Selection Commission (UPSSSC)' },
        { re: /\bnational\s+health\s+mission\b.*\bmaharashtra\b/i, name: 'National Health Mission (NHM) Maharashtra' },
        { re: /\bnhm\W*maharashtra\b/i, name: 'National Health Mission (NHM) Maharashtra' },
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
        { re: /\bkpsc\b/i, name: 'KPSC' },
        { re: /\bgpsc\b/i, name: 'GPSC' },
        { re: /\bhpsc\b/i, name: 'HPSC' },
        { re: /\bhppsc\b/i, name: 'HPPSC' },
        { re: /\bopsc\b/i, name: 'OPSC' },
        { re: /\btnpsc\b/i, name: 'TNPSC' },
        { re: /\btspsc\b/i, name: 'TSPSC' },
        { re: /\bappsc\b/i, name: 'APPSC' },
        { re: /\bossc\b/i, name: 'OSSC' },
        { re: /\bhssc\b/i, name: 'HSSC' },
        { re: /\buksssc\b/i, name: 'UKSSSC' },
        { re: /\bbssc\b/i, name: 'BSSC' },
        { re: /\bdsssb\b/i, name: 'DSSSB' },
        { re: /\bjssc\b/i, name: 'JSSC' },
        { re: /\bcgpsc\b/i, name: 'CGPSC' },
        { re: /\bmpesb\b/i, name: 'MPESB' }
    ];

    let exam = '';
    for (const p of patterns) {
        if (p.re.test(cleanedBase) || p.re.test(info)) {
            exam = p.name;
            break;
        }
    }

    if (!exam) {
        try {
            const host = url ? new URL(url).hostname : '';
            if (/sssb\.punjab\.gov\.in$/i.test(host)) exam = 'Punjab SSSB';
            else if (/rpsc\.rajasthan\.gov\.in$/i.test(host)) exam = 'RPSC';
            else if (/upsssc\.gov\.in$/i.test(host)) exam = 'Uttar Pradesh Subordinate Services Selection Commission (UPSSSC)';
            else if (/uppsc\.up\.nic\.in$/i.test(host)) exam = 'Uttar Pradesh Public Service Commission (UPPSC)';
            else if (/esb\.mp\.gov\.in$/i.test(host)) exam = 'MPESB';
        } catch {}
    }

    let action = 'Online Form';
    if (lowerAll.includes('admit card') || lowerAll.includes('hall ticket') || lowerAll.includes('call letter')) {
        action = 'Admit Card';
    } else if (lowerAll.includes('answer key')) {
        action = 'Answer Key';
    } else if (lowerAll.includes('syllabus') || lowerAll.includes('pattern')) {
        action = 'Syllabus';
    } else if (lowerAll.includes('result')) {
        action = 'Result';
    } else if (lowerAll.includes('status')) {
        action = 'Online Application Status';
    } else if (lowerAll.includes('counselling') || lowerAll.includes('admission')) {
        action = 'Admission';
    } else if (lowerAll.includes('online form') || lowerAll.includes('apply online')) {
        action = 'Online Form';
    }

    if (/application\s+status|status\s+check/i.test(lowerAll)) {
        action = 'Online Application Status';
    }

    const examName = normalizeSpaces(exam || cleanedForExamGuess || cleanedBase);
    const composed = normalizeSpaces(`${examName} ${year} ${action}`)
        .replace(
            /\b(recruitments?|recruitment\/engagement|news and notification|notifications?|vacancies?|vacancy notification|notification|advertisement|declared)\b/ig,
            ' '
        )
        .replace(/\s{2,}/g, ' ')
        .trim();
    return composed || normalizeSpaces(rawTitle) || 'Job Notification';
};

export const isDisplayableJob = (job: JobTitleLike): boolean => {
    const rawTitle = String(job.title || '');
    const title = normalizeSpaces(rawTitle.toLowerCase());
    const info = normalizeSpaces(String(job.shortInfo || '').toLowerCase());
    const titleLen = title.length;
    const infoLen = info.length;

    const genericHead = isGenericHeadTitle(rawTitle);
    const strippedTitle = stripGenericHeadPrefix(rawTitle);
    const genericHeadBad = genericHead && strippedTitle.length < 12;

    const looksLikeUrl = /^https?:\/\//i.test(rawTitle) || /https?:\/\//i.test(info);
    const hasQueryNoise = /(\bkey=|utm_|ref=)/i.test(rawTitle) || /(\bkey=|utm_|ref=)/i.test(info);

    const keywords = [
        'ssc', 'upsc', 'railway', 'rrb', 'nhm', 'police', 'constable', 'group d', 'bank', 'ibps', 'sbi', 'rbi', 'teacher',
        'engineer', 'clerk', 'apprentice', 'uppsc', 'upsssc', 'rpsc', 'rsmssb', 'mppsc', 'bpsc', 'wbpsc', 'jkpsc', 'jpsc',
        'mpsc', 'kpsc', 'gpsc', 'hpsc', 'hppsc', 'opsc', 'tnpsc', 'tspsc', 'appsc', 'ossc', 'hssc', 'uksssc', 'bssc',
        'dsssb', 'psssb', 'jssc', 'cgpsc', 'mpesb'
    ];
    const hasKeyword = keywords.some(k => title.includes(k) || info.includes(k));

    const link = job.importantLinks?.[0]?.url || job.applyLink || '';
    const domainOk = isTrustedDomain(link);
    const hasLink = !!(link && link.trim().length > 0);

    const derived = deriveReadableTitle(job);
    const actionOnly = isActionOnlyTitle(derived);

    return (
        !genericHeadBad &&
        !looksLikeUrl &&
        !hasQueryNoise &&
        !actionOnly &&
        (titleLen >= 20 || infoLen >= 40 || hasKeyword || domainOk) &&
        hasLink
    );
};
