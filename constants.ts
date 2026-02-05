import { SectionData, JobDetailData } from './types';

export const MARQUEE_TEXTS = [
  "SSC Phase 13 Result 2025 Declared",
  "UPPSC Mains 2024 Result Declared",
  "UPSC Civil Services 2026 Online Form",
  "NTA UGC NET Dec 2025 Result Declared",
  "PM Kisan Samman Nidhi 19th Installment Released",
  "Ayushman Card Online Apply 2026",
  "UP Police Constable 2026 Apply Online",
  "SSC CGL 2026 Notification Soon",
  "Airforce Agniveer Vayu 01/2027 Online Form",
  "Pan Card Link with Aadhar Date Extended"
];

export const MOCK_SECTIONS: SectionData[] = [
  {
    title: "New Updates", 
    color: "red",
    items: [
      { id: "ssc-phase-13-res", title: "SSC Selection Post Phase 13 Result 2025", isNew: true, link: "#" },
      { id: "uppsc-mains-2024-res", title: "UPPSC Mains 2024 Result Declared", isNew: true, link: "#" },
      { id: "ugc-net-dec-res", title: "NTA UGC NET December 2025 Final Answer Key / Result", isNew: true, link: "#" },
      { id: "pm-kisan-19", title: "PM Kisan Samman Nidhi 19th Installment Status Check", isNew: true, link: "#" },
      { id: "ayushman-card", title: "Ayushman Bharat Golden Card Online Apply 2026", isNew: true, link: "#" },
      { id: "bihar-work-insp", title: "Bihar Work Inspector (Mechanical) Online Form 2026", isNew: true, link: "#" },
      { id: "delhi-hc-jja", title: "Delhi High Court JJA & Restorer Online Form 2026", isNew: true, link: "#" },
      { id: "rrb-ntpc-city", title: "Railway NTPC 10+2 Post 2024 Typing Test City", isNew: true, link: "#" },
      { id: "lic-aao-res", title: "LIC AAO (Generalist) Mains Result 2026", isNew: true, link: "#" },
      { id: "airforce-2027", title: "Airforce Agniveer Vayu Intake 01/2027 Online Form", isNew: true, link: "#" },
      { id: "aadhar-update", title: "UIDAI Aadhar Card Online Correction / Update Status", link: "#" }
    ]
  },
  {
    title: "Top Online Form",
    color: "blue",
    items: [
      { id: "upsc-2026", title: "UPSC Civil Services IAS / IFS Pre 2026 Online Form", lastDate: "05-03-2026", isNew: true, link: "#" },
      { id: "rrb-group-d-2026", title: "Railway RRB Group D Online Form 2026", lastDate: "Upcoming", isNew: true, link: "#" },
      { id: "gds-2026", title: "Indian Post Office GDS Online Form 2026", lastDate: "Active", link: "#" },
      { id: "bihar-gd-2026", title: "Bihar Constable GD Online Form 2026", lastDate: "Active", link: "#" },
      { id: "bsnl-exec", title: "BSNL Senior Executive Trainee Online Form 2026", lastDate: "Active", link: "#" },
      { id: "sbi-cbo-2026", title: "SBI Circle Base Officer (CBO) Online Form 2026", lastDate: "Active", link: "#" },
      { id: "up-police-2026", title: "UP Police Constable Online Form 2026", lastDate: "Active", link: "#" },
      { id: "up-lekhpal-edit", title: "UP Lekhpal Edit / Correction Online Form 2026", lastDate: "Active", link: "#" },
      { id: "navy-ssc-2026", title: "Indian Navy SSC Officer Online Form 2026", lastDate: "Active", link: "#" },
      { id: "mp-iti-2026", title: "MPESB MP ITI Training Officer Online Form 2026", lastDate: "Active", link: "#" },
      { id: "sc-clerk", title: "Supreme Court Law Clerk Cum Research Associate 2026", lastDate: "Active", link: "#" },
      { id: "rbi-attendant", title: "RBI Office Attendant Online Form 2026", lastDate: "Active", link: "#" }
    ]
  },
  {
    title: "Admit Card",
    color: "green",
    items: [
      { id: "rrb-je-status", title: "Railway RRB JE 2025 Online Application Status", link: "#", isNew: true },
      { id: "rrb-ntpc-city", title: "Railway NTPC 10+2 Post 2024 Typing Test Exam City", link: "#", isNew: true },
      { id: "rrb-alp-city", title: "Railway RRB ALP 01/2025 Exam City Details 2026", link: "#", isNew: true },
      { id: "up-police-exam", title: "UP Police Constable Exam Date Notice 2026", link: "#", isNew: true },
      { id: "ctet-date", title: "CTET 2026 Entrance Exam Date Schedule", link: "#" },
      { id: "ssc-mts-card", title: "SSC MTS / Havaldar 2025 Exam Admit Card", link: "#" },
      { id: "gate-card", title: "GATE 2026 Hall Ticket Download", link: "#" },
      { id: "afcat-card", title: "AFCAT 01/2026 Admit Card", link: "#" }
    ]
  },
  {
    title: "Results",
    color: "orange",
    items: [
      { id: "ssc-phase-13-res", title: "SSC Selection Post Phase 13 Result 2025", isNew: true, link: "#" },
      { id: "uppsc-mains-2024-res", title: "UPPSC Mains 2024 Result Declared", isNew: true, link: "#" },
      { id: "ugc-net-res", title: "NTA UGC NET December 2025 Final Answer Key / Result", isNew: true, link: "#" },
      { id: "lic-aao-res", title: "LIC AAO (Generalist) Mains Result 2026", isNew: true, link: "#" },
      { id: "ecgc-po-res", title: "ECGC Probationary Officer PO Result 2026", link: "#" },
      { id: "emrs-res", title: "EMRS Teaching / Non Teaching 2025 Result", link: "#" },
      { id: "isro-icrb-res", title: "ISRO ICRB Scientist Engineer 2025 Result", link: "#" },
      { id: "ibps-score", title: "IBPS 14th Office Assistant, Scale I, II Score Card", link: "#" },
      { id: "ssc-cgl-final", title: "SSC CGL 2025 Final Result", link: "#" },
      { id: "sbi-clerk-res", title: "SBI Clerk Final Result 2025", link: "#" }
    ]
  },
  {
    title: "Syllabus",
    color: "indigo",
    items: [
      { id: "ssc-cgl-syll", title: "SSC CGL 2026 Syllabus & Exam Pattern", link: "#", isNew: true },
      { id: "upsc-ias-syll", title: "UPSC IAS Civil Services Syllabus 2026 (Pre + Mains)", link: "#", isNew: true },
      { id: "up-police-syll", title: "UP Police Constable Syllabus 2026 in Hindi", link: "#" },
      { id: "rrb-ntpc-syll", title: "Railway RRB NTPC Syllabus & Exam Pattern", link: "#" },
      { id: "neet-ug-syll", title: "NTA NEET UG 2025 Syllabus (Physics, Chemistry, Biology)", link: "#" },
      { id: "ctet-syll", title: "CTET 2026 Syllabus for Paper I & II", link: "#" },
      { id: "bpsc-syll", title: "BPSC 71st Pre & Mains Syllabus Download", link: "#" },
      { id: "agniveer-syll", title: "Army Agniveer GD Syllabus & Pattern 2026", link: "#" }
    ]
  },
  {
    title: "Answer Key",
    color: "gray",
    items: [
      { id: "emrs-key", title: "EMRS Teaching / Non Teaching Final Answer Key 2026", isNew: true, link: "#" },
      { id: "jee-main-key", title: "NTA JEE Mains 2026 (Session I) Answer Key", isNew: true, link: "#" },
      { id: "ssc-cgl-key", title: "SSC CGL 2025 Mains Answer Key", link: "#" },
      { id: "ctet-key", title: "CTET Jan 2026 Official Answer Key", link: "#" }
    ]
  },
  {
    title: "Admission",
    color: "purple",
    items: [
      { id: "neet-ug-2025", title: "NTA NEET UG 2025 Admission Online Correction", link: "#" },
      { id: "ctet-2026-form", title: "CTET 2026 Entrance Exam Online Form", link: "#" },
      { id: "afcat-01-2026", title: "Airforce AFCAT 01/2026 Batch Online Form", link: "#" },
      { id: "bihar-iti", title: "Bihar ITI CAT Online Counselling 2025", link: "#" },
      { id: "ofss-bihar", title: "OFSS Bihar 11th Admission 2025 Online Form", link: "#" }
    ]
  },
  {
    title: "Other Online Form",
    color: "indigo",
    items: [
      { id: "raj-agri", title: "Rajasthan RSSB Agriculture Supervisor Online Form 2026", link: "#" },
      { id: "raj-ldc", title: "Rajasthan RSSB LDC, Jr Assistant Online Form 2026", link: "#" },
      { id: "haryana-police", title: "Haryana Police Constable Online Form 2026", link: "#" },
      { id: "htet-2025", title: "Haryana Teacher Test Eligibility HTET Online 2025", link: "#" },
      { id: "raj-stat", title: "Rajasthan Statistical Officer Online Form 2025", link: "#" },
      { id: "raj-ayush", title: "Rajsthan RSSB Ayush Officer Online Form 2025", link: "#" }
    ]
  },
  {
    title: "Sarkari Yojana (Government Schemes)",
    color: "pink",
    items: [
      { id: "pm-kisan-19", title: "PM Kisan Samman Nidhi Yojana Registration / Status", isNew: true, link: "#" },
      { id: "ayushman-card", title: "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PMJAY)", isNew: true, link: "#" },
      { id: "e-shram", title: "E-Shram Card Online Registration / Update / Payment Status", link: "#" },
      { id: "pm-awaso", title: "PM Awas Yojana (Gramin / Urban) List 2025-26", link: "#" },
      { id: "kanya-sumangala", title: "UP Kanya Sumangala Yojana Online Form 2025", link: "#" },
      { id: "lakhpati-didi", title: "Lakhpati Didi Yojana Registration 2025", link: "#" },
      { id: "free-silai", title: "PM Vishwakarma Free Silai Machine Yojana 2025", link: "#" },
      { id: "roojgar-sangam", title: "UP Rojgar Sangam Bhatta Yojana Online Form", link: "#" }
    ]
  },
  {
    title: "Certificate Verification",
    color: "teal",
    items: [
      { id: "aadhar-card", title: "Aadhar Card Download / Check Status / Correction", link: "#" },
      { id: "pan-card", title: "Pan Card Online Form (NSDL / UTI) / Link Aadhar", link: "#" },
      { id: "voter-id", title: "Voter ID Card Apply Online / Download E-EPIC", link: "#" },
      { id: "driving-license", title: "Driving License Online Apply (Learner / Permanent)", link: "#" },
      { id: "passport", title: "Passport Online Registration / Status Check", link: "#" },
      { id: "birth-cert", title: "Birth / Death Certificate Online Apply (State Wise)", link: "#" },
      { id: "ration-card", title: "Ration Card Online Apply / Name Add / Delete", link: "#" },
      { id: "ccc-online", title: "NIELIT CCC Online Form 2025 / Certificate Download", link: "#" }
    ]
  }
];

// ----------------------------------------------------------------------
// FULLY POPULATED DATABASE WITH DETAILED DESCRIPTIONS
// ----------------------------------------------------------------------

export const JOB_DETAILS_DB: Record<string, JobDetailData> = {
  // --- RESULTS ---
  "ssc-phase-13-res": {
    id: "ssc-phase-13-res",
    title: "SSC Selection Post Phase 13 Result 2025",
    postDate: "Updated: Today",
    shortInfo: "Staff Selection Commission (SSC) has declared the result for Selection Post Phase XIII (13) Examination 2025. Candidates who appeared for the Computer Based Examination (CBT) can now check their results, cutoff marks, and merit list. The result is available for Matriculation, Higher Secondary (10+2), and Graduate Level posts.",
    importantDates: ["Exam Date: August 2025", "Result Declared: Today"],
    applicationFee: ["NA"],
    ageLimit: ["NA"],
    vacancyDetails: [
        { postName: "Matriculation Level", totalPost: "Various", eligibility: "Class 10th High School Exam Passed" },
        { postName: "Higher Secondary (10+2) Level", totalPost: "Various", eligibility: "10+2 Intermediate Exam Passed" },
        { postName: "Graduate & Above Level", totalPost: "Various", eligibility: "Bachelor Degree in Any Stream" }
    ],
    importantLinks: [
        { label: "Download Result (Matric)", url: "https://ssc.gov.in/" },
        { label: "Download Result (Inter)", url: "https://ssc.gov.in/" },
        { label: "Download Result (Graduate)", url: "https://ssc.gov.in/" },
        { label: "Official Website", url: "https://ssc.gov.in/" }
    ]
  },
  "uppsc-mains-2024-res": {
    id: "uppsc-mains-2024-res",
    title: "UPPSC Mains 2024 Result Declared",
    postDate: "Updated: Today",
    shortInfo: "Uttar Pradesh Public Service Commission (UPPSC) has declared the result for the Combined State / Upper Subordinate Services (Mains) Examination 2024. Candidates who appeared for the mains exam can now check their results and interview schedule.",
    importantDates: ["Mains Result Declared: Today", "Interview Begins: Soon"],
    applicationFee: ["NA"],
    ageLimit: ["NA"],
    vacancyDetails: [
        { postName: "UPPSC Pre 2024", totalPost: "220", eligibility: "Mains Qualified Candidates" }
    ],
    importantLinks: [
        { label: "Download Result", url: "https://uppsc.up.nic.in/Open_PDF.aspx?I4PnQ0tBagke7gAj%2Fgiopt4x4lu4nlW0" },
        { label: "Official Website", url: "https://uppsc.up.nic.in/" }
    ]
  },

  // --- LATEST JOBS ---
  "ssc-cgl-2026": {
    id: "ssc-cgl-2026",
    title: "SSC CGL 2026 Combined Graduate Level Online Form",
    postDate: "10 January 2026 | 11:30 AM",
    shortInfo: "Staff Selection Commission (SSC) has released the tentative examination calendar for the year 2026-27. According to this calendar, the notification for the Combined Graduate Level (CGL) Examination 2026 is expected to be released in April 2026. This is one of the most prestigious examinations in India for graduates, offering recruitment to Group 'B' and Group 'C' posts in various Ministries, Departments, and Organizations of the Government of India. Posts include Assistant Section Officer (ASO) in CSS/MEA/Railway, Inspector of Income Tax, Inspector (Central Excise), Assistant Enforcement Officer, Sub Inspector in CBI, and many more. Candidates who have completed their Bachelor's Degree in any stream from a recognized university are eligible to apply. The selection process will consist of Tier-I and Tier-II computer-based examinations. Aspirants are advised to start their preparation early and keep an eye on the official website for the detailed notification.",
    importantDates: [
        "Application Begin: 01/04/2026 (Tentative)",
        "Last Date for Apply Online: 01/05/2026",
        "Last Date Pay Exam Fee: 02/05/2026",
        "Correction Date: 05-06 May 2026",
        "Tier I Exam Date: June / July 2026",
        "Tier I Admit Card Available: Before Exam",
        "Tier II Exam Date: Notified Soon"
    ],
    applicationFee: [
        "General / OBC / EWS: ₹ 100/-",
        "SC / ST / PH: ₹ 0/-",
        "All Category Female: ₹ 0/-",
        "Correction Charge (1st Time): ₹ 200/-",
        "Correction Charge (2nd Time): ₹ 500/-",
        "Payment Mode: Pay the exam fee through Debit Card, Credit Card, Net Banking, or UPI only."
    ],
    ageLimit: [
        "Minimum Age: 18 Years",
        "Maximum Age: 27-32 Years (Post Wise)",
        "Age Relaxation: As per SSC CGL 2026 Recruitment Rules (OBC: 3 Years, SC/ST: 5 Years, PH: 10 Years)"
    ],
    vacancyDetails: [
        { postName: "Assistant Audit Officer (AAO)", totalPost: "TBA", eligibility: "Bachelor Degree in Any Stream. Desirable: CA/CS/MBA/Cost & Management Accountant." },
        { postName: "Junior Statistical Officer (JSO)", totalPost: "TBA", eligibility: "Bachelor Degree with 60% Marks in Math at 12th Level OR Bachelor Degree with Statistics as one of the subjects." },
        { postName: "Inspector (Central Excise / Preventive Officer / Examiner)", totalPost: "TBA", eligibility: "Bachelor Degree in Any Stream from a Recognized University." },
        { postName: "Sub Inspector (CBI)", totalPost: "TBA", eligibility: "Bachelor Degree in Any Stream." },
        { postName: "Auditor / Accountant / UDC / Tax Assistant", totalPost: "TBA", eligibility: "Bachelor Degree in Any Stream." }
    ],
    importantLinks: [
        { label: "Apply Online (Link Activate 01/04/2026)", url: "https://ssc.gov.in/" },
        { label: "Download Exam Calendar", url: "https://ssc.gov.in/" },
        { label: "Official Website", url: "https://ssc.gov.in/" }
    ]
  },
  
  // --- SYLLABUS DETAILS ---
  "ssc-cgl-syll": {
    id: "ssc-cgl-syll",
    title: "SSC CGL 2026 Syllabus & Exam Pattern",
    postDate: "Updated: 15 Feb 2026",
    shortInfo: "Check the detailed syllabus and exam pattern for the SSC Combined Graduate Level (CGL) 2026 Examination. The exam consists of two tiers. Tier-I is objective type (multiple choice) and Tier-II includes Mathematical Abilities, Reasoning, English Language, General Awareness, and Computer Knowledge Test.",
    importantDates: ["Exam Date: June/July 2026"],
    applicationFee: ["NA"],
    ageLimit: ["NA"],
    vacancyDetails: [
        { postName: "Tier-I Exam", totalPost: "200 Marks", eligibility: "General Intelligence (25), Awareness (25), Quant (25), English (25) - 60 Minutes" },
        { postName: "Tier-II Paper I", totalPost: "450 Marks", eligibility: "Section I (Maths+Reasoning), Section II (English+GA), Section III (Computer)" }
    ],
    importantLinks: [
        { label: "Download Syllabus PDF", url: "https://ssc.gov.in/" },
        { label: "Official Website", url: "https://ssc.gov.in/" }
    ]
  },
  "upsc-ias-syll": {
    id: "upsc-ias-syll",
    title: "UPSC IAS Civil Services Syllabus 2026 (Pre + Mains)",
    postDate: "Updated: Feb 2026",
    shortInfo: "Complete detailed syllabus for UPSC Civil Services IAS / IFS Preliminary and Mains Examination 2026. The Preliminary exam consists of two papers: General Studies I and CSAT. The Mains exam consists of 9 papers including Indian Language, English, Essay, GS I, II, III, IV, and Optional Papers.",
    importantDates: ["Pre Exam: 26/05/2026", "Mains Exam: Sept 2026"],
    applicationFee: ["NA"],
    ageLimit: ["NA"],
    vacancyDetails: [
        { postName: "Prelims GS Paper I", totalPost: "200 Marks", eligibility: "History, Geography, Polity, Economy, Environment, Science, Current Affairs." },
        { postName: "Prelims CSAT Paper II", totalPost: "200 Marks", eligibility: "Comprehension, Logical Reasoning, Basic Numeracy (Class X level). Qualifying (33%)." }
    ],
    importantLinks: [
        { label: "Download Syllabus PDF", url: "https://upsc.gov.in/" },
        { label: "Official Website", url: "https://upsc.gov.in/" }
    ]
  },
  "up-police-syll": {
    id: "up-police-syll",
    title: "UP Police Constable Syllabus 2026 in Hindi",
    postDate: "Updated: Jan 2026",
    shortInfo: "Download UP Police Constable Syllabus 2026 in Hindi and English. The written exam will be of 300 marks consisting of General Knowledge, General Hindi, Numerical & Mental Ability, and Mental Aptitude/IQ/Reasoning Ability. Total 150 questions will be asked.",
    importantDates: ["Exam Date: June 2026"],
    applicationFee: ["NA"],
    ageLimit: ["NA"],
    vacancyDetails: [
        { postName: "Written Exam", totalPost: "300 Marks", eligibility: "150 Questions, 2 Marks each. 0.5 Negative Marking." },
        { postName: "Subjects", totalPost: "4 Sections", eligibility: "GK, Hindi, Maths, Reasoning" }
    ],
    importantLinks: [
        { label: "Download Syllabus PDF", url: "https://uppbpb.gov.in/" },
        { label: "Official Website", url: "https://uppbpb.gov.in/" }
    ]
  },
  "rrb-ntpc-syll": {
    id: "rrb-ntpc-syll",
    title: "Railway RRB NTPC Syllabus & Exam Pattern",
    postDate: "Updated: 2026",
    shortInfo: "Railway Recruitment Board (RRB) NTPC Recruitment Syllabus for CBT 1 and CBT 2. CBT 1 is screening in nature. CBT 2 marks will be used for shortlisting for Typing/Aptitude Test.",
    importantDates: ["Exam: Late 2026"],
    applicationFee: ["NA"],
    ageLimit: ["NA"],
    vacancyDetails: [
        { postName: "CBT 1", totalPost: "100 Marks", eligibility: "General Awareness (40), Maths (30), Reasoning (30). 90 Mins." },
        { postName: "CBT 2", totalPost: "120 Marks", eligibility: "General Awareness (50), Maths (35), Reasoning (35). 90 Mins." }
    ],
    importantLinks: [
        { label: "Download Syllabus", url: "https://indianrailways.gov.in/" }
    ]
  },
  "neet-ug-syll": {
    id: "neet-ug-syll",
    title: "NTA NEET UG 2025 Syllabus (Physics, Chemistry, Biology)",
    postDate: "Updated: 2025",
    shortInfo: "Detailed syllabus for National Eligibility cum Entrance Test (NEET) UG 2025. The syllabus covers Physics, Chemistry, and Biology (Botany & Zoology) from Class 11th and 12th NCERT curriculum.",
    importantDates: ["Exam: May 2025"],
    applicationFee: ["NA"],
    ageLimit: ["NA"],
    vacancyDetails: [
        { postName: "Physics", totalPost: "45 Qs", eligibility: "Mechanics, Optics, Thermodynamics, Electrodynamics etc." },
        { postName: "Chemistry", totalPost: "45 Qs", eligibility: "Physical, Organic, Inorganic Chemistry." },
        { postName: "Biology", totalPost: "90 Qs", eligibility: "Diversity, Structural Org, Cell, Physiology, Genetics, Ecology." }
    ],
    importantLinks: [
        { label: "Download Syllabus", url: "https://exams.nta.ac.in/NEET/" }
    ]
  },
  "ctet-syll": {
    id: "ctet-syll",
    title: "CTET 2026 Syllabus for Paper I & II",
    postDate: "Updated: 2026",
    shortInfo: "Central Teacher Eligibility Test (CTET) Syllabus. Paper I is for teachers for Class I to V. Paper II is for teachers for Class VI to VIII.",
    importantDates: ["Exam: July 2026"],
    applicationFee: ["NA"],
    ageLimit: ["NA"],
    vacancyDetails: [
        { postName: "Paper I", totalPost: "150 Marks", eligibility: "CDP, Language I, Language II, Maths, EVS." },
        { postName: "Paper II", totalPost: "150 Marks", eligibility: "CDP, Language I, Language II, Maths & Science OR Social Studies." }
    ],
    importantLinks: [
        { label: "Download Syllabus", url: "https://ctet.nic.in/" }
    ]
  },
  "bpsc-syll": {
    id: "bpsc-syll",
    title: "BPSC 71st Pre & Mains Syllabus Download",
    postDate: "Updated",
    shortInfo: "Bihar Public Service Commission (BPSC) 71st Combined Competitive Examination Syllabus. Prelims is of 150 Marks (General Studies). Mains consists of GS Paper I, GS Paper II, Essay, and Optional Subject.",
    importantDates: ["Exam: TBA"],
    applicationFee: ["NA"],
    ageLimit: ["NA"],
    vacancyDetails: [
        { postName: "Prelims", totalPost: "150 Marks", eligibility: "General Studies, Bihar GK, Current Affairs, Science, History, Geography, Polity." }
    ],
    importantLinks: [
        { label: "Official Website", url: "https://www.bpsc.bih.nic.in/" }
    ]
  },
  "agniveer-syll": {
    id: "agniveer-syll",
    title: "Army Agniveer GD Syllabus & Pattern 2026",
    postDate: "Updated",
    shortInfo: "Indian Army Agniveer General Duty (GD) Common Entrance Examination (CEE) Syllabus. The exam includes General Knowledge, General Science, Maths, and Logical Reasoning.",
    importantDates: ["Exam: April 2026"],
    applicationFee: ["NA"],
    ageLimit: ["NA"],
    vacancyDetails: [
        { postName: "Agniveer GD", totalPost: "100 Marks", eligibility: "GK (15 Qs), Science (15 Qs), Maths (15 Qs), Reasoning (5 Qs)." }
    ],
    importantLinks: [
        { label: "Join Indian Army", url: "https://joinindianarmy.nic.in/" }
    ]
  },


  // --- SCHEMES & DOCUMENTS ---
  
  "pm-kisan-19": {
    id: "pm-kisan-19",
    title: "PM Kisan Samman Nidhi Yojana 19th Installment",
    postDate: "Updated: Feb 2026",
    shortInfo: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) is a Central Sector scheme with 100% funding from the Government of India. Under the scheme, an income support of ₹ 6,000/- per year in three equal installments is provided to all land-holding farmer families. The 19th Installment is expected to be released soon. Farmers must complete their e-KYC to receive the installment. Check your status, beneficiary list, and e-KYC status using the links below.",
    importantDates: ["Scheme Launched: 24/02/2019", "19th Installment Date: Feb 2026", "e-KYC Last Date: As per Govt Orders"],
    applicationFee: ["Application Fee: ₹ 0/- (Free)", "CSC Center Charge: As applicable"],
    ageLimit: ["Minimum Age: 18 Years", "Must be a land-holding farmer family."],
    vacancyDetails: [{ postName: "PM Kisan Beneficiary", totalPost: "All Eligible Farmers", eligibility: "Small and Marginal Farmers with cultivable landholding." }],
    importantLinks: [
        { label: "Check Beneficiary Status", url: "https://pmkisan.gov.in/" },
        { label: "e-KYC Online", url: "https://pmkisan.gov.in/" },
        { label: "New Farmer Registration", url: "https://pmkisan.gov.in/" }
    ]
  },
  "ayushman-card": {
    id: "ayushman-card",
    title: "Ayushman Bharat Golden Card Online Apply",
    postDate: "Active",
    shortInfo: "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY) is the world's largest health insurance scheme fully financed by the government. It provides a cover of Rs. 5 lakhs per family per year for secondary and tertiary care hospitalization across public and private empanelled hospitals in India. Beneficiaries can now apply for their Ayushman Card (Golden Card) online or download it if already generated. Check your eligibility in the SECC data.",
    importantDates: ["Scheme Active: Yes", "Registration: Open 24x7"],
    applicationFee: ["Self Registration: ₹ 0/-", "CSC Center: ₹ 30/- (approx)"],
    ageLimit: ["No Age Limit", "Eligibility based on SECC 2011 Data"],
    vacancyDetails: [{ postName: "Ayushman Card Holder", totalPost: "50 Crore+ Beneficiaries", eligibility: "Families identified in SECC 2011 database or having Antyodaya Ration Card." }],
    importantLinks: [
        { label: "Download Ayushman Card", url: "https://beneficiary.nha.gov.in/" },
        { label: "Apply Online / KYC", url: "https://beneficiary.nha.gov.in/" },
        { label: "Official Website", url: "https://pmjay.gov.in/" }
    ]
  },
  "e-shram": {
    id: "e-shram",
    title: "E-Shram Card Online Registration 2025",
    postDate: "Active",
    shortInfo: "Ministry of Labour & Employment has launched e-Shram portal to create a National Database of Unorganized Workers (NDUW). Workers can register and get an e-Shram card which will have a 12-digit unique number. It will be helpful for social security schemes.",
    importantDates: ["Registration: Always Open"],
    applicationFee: ["Free"],
    ageLimit: ["16-59 Years"],
    vacancyDetails: [{ postName: "E-Shram Card", totalPost: "Unlimited", eligibility: "Unorganized Worker, No PF/ESIC Member, Not Income Tax Payee" }],
    importantLinks: [{ label: "Apply Online", url: "https://eshram.gov.in/" }]
  },
  "pm-awaso": {
    id: "pm-awaso",
    title: "PM Awas Yojana List 2025-26",
    postDate: "Updated",
    shortInfo: "Pradhan Mantri Awas Yojana (PMAY) aims to provide affordable housing to the urban and rural poor. Check the new beneficiary list for Gramin and Urban areas.",
    importantDates: ["List Updated: Jan 2026"],
    applicationFee: ["Free"],
    ageLimit: ["18+ Years"],
    vacancyDetails: [{ postName: "Home Beneficiary", totalPost: "NA", eligibility: "Homeless or living in kutcha house" }],
    importantLinks: [{ label: "Check List (Gramin)", url: "https://pmayg.nic.in/" }]
  },
  "kanya-sumangala": {
    id: "kanya-sumangala",
    title: "UP Kanya Sumangala Yojana Online Form 2025",
    postDate: "Active",
    shortInfo: "The Mukhyamantri Kanya Sumangala Yojana is a scheme of the Government of Uttar Pradesh to protect the girl child and ensure her development through financial security and education. It provides monetary assistance in 6 stages from birth to graduation.",
    importantDates: ["Application: Active"],
    applicationFee: ["Free"],
    ageLimit: ["Girl Child (Born after 01/04/2019 for Phase 1)"],
    vacancyDetails: [{ postName: "Beneficiary", totalPost: "Open", eligibility: "Resident of UP, Family Income < 3 Lakhs" }],
    importantLinks: [{ label: "Apply Online", url: "https://mksy.up.gov.in/" }]
  },
  "lakhpati-didi": {
    id: "lakhpati-didi",
    title: "Lakhpati Didi Yojana Registration 2025",
    postDate: "New",
    shortInfo: "Lakhpati Didi is a government initiative to empower women in Self Help Groups (SHGs) to earn a sustainable income of at least Rs. 1 Lakh per annum. The scheme provides training in various skills.",
    importantDates: ["Launched: 2024", "Status: Active"],
    applicationFee: ["Free"],
    ageLimit: ["18-60 Years"],
    vacancyDetails: [{ postName: "Lakhpati Didi", totalPost: "3 Crore Women", eligibility: "Member of SHG" }],
    importantLinks: [{ label: "Official Portal", url: "https://lakhpatididi.gov.in/" }]
  },
  "free-silai": {
    id: "free-silai",
    title: "PM Vishwakarma Free Silai Machine Yojana",
    postDate: "Active",
    shortInfo: "Under the PM Vishwakarma Yojana, the government provides training and a toolkit incentive of ₹15,000 which can be used to buy a Silai Machine (Sewing Machine). Darzi (Tailors) are one of the eligible trades.",
    importantDates: ["Registration: Open"],
    applicationFee: ["Free for Registration"],
    ageLimit: ["18+ Years"],
    vacancyDetails: [{ postName: "PM Vishwakarma", totalPost: "Various Trades", eligibility: "Artisan/Craftsman working with hands and tools" }],
    importantLinks: [{ label: "Apply Online", url: "https://pmvishwakarma.gov.in/" }]
  },
  "roojgar-sangam": {
    id: "roojgar-sangam",
    title: "UP Rojgar Sangam Bhatta Yojana 2025",
    postDate: "Active",
    shortInfo: "Uttar Pradesh Government provides unemployment allowance (Berojgari Bhatta) to educated unemployed youth through the Sewayojan (Rojgar Sangam) portal. Candidates can also apply for private and outsourced jobs.",
    importantDates: ["Registration: Always Open"],
    applicationFee: ["Free"],
    ageLimit: ["21-35 Years"],
    vacancyDetails: [{ postName: "Job Seeker", totalPost: "NA", eligibility: "12th Pass / Graduate, Resident of UP" }],
    importantLinks: [{ label: "Register / Login", url: "https://sewayojan.up.nic.in/" }]
  },

  // --- CERTIFICATES ---
  
  "aadhar-card": {
    id: "aadhar-card",
    title: "Aadhar Card Services: Download, Update, Status",
    postDate: "Always Active",
    shortInfo: "Aadhaar is a 12-digit unique identity number that can be obtained voluntarily by residents or passport holders of India, based on their biometric and demographic data. UIDAI provides various online services like downloading E-Aadhaar, checking update status, ordering PVC cards, and locating enrollment centers. Keep your mobile number linked to Aadhaar to avail online services.",
    importantDates: ["Service Status: Active 24x7"],
    applicationFee: ["E-Aadhaar Download: Free", "Address Update Online: ₹ 50/-", "PVC Card Order: ₹ 50/-", "Biometric Update (at Center): ₹ 100/-"],
    ageLimit: ["No Age Limit. Even newborns can get Baal Aadhaar (Blue color)."],
    vacancyDetails: [{ postName: "Aadhaar Card", totalPost: "NA", eligibility: "Resident of India" }],
    importantLinks: [
        { label: "Download E-Aadhaar", url: "https://myaadhaar.uidai.gov.in/" },
        { label: "Check Update Status", url: "https://myaadhaar.uidai.gov.in/" },
        { label: "Book Appointment", url: "https://appointments.uidai.gov.in/bookappointment.aspx" }
    ]
  },
  "pan-card": {
    id: "pan-card",
    title: "PAN Card Apply Online (NSDL / UTI)",
    postDate: "Active",
    shortInfo: "Permanent Account Number (PAN) is a ten-character alphanumeric identifier, issued in the form of a laminated 'PAN card', by the Indian Income Tax Department. It is mandatory for financial transactions. You can apply for a new PAN card (Form 49A) or make corrections in an existing PAN card online via NSDL or UTIITSL portals.",
    importantDates: ["Service Status: Active"],
    applicationFee: ["Indian Citizen (Physical Card): ₹ 107/-", "Foreign Citizen: ₹ 1017/-", "E-PAN Only: ₹ 66/-"],
    ageLimit: ["Min Age: 18 Years for Independent Application", "Minors can apply through Representative Assessee (Parents)."],
    vacancyDetails: [{ postName: "PAN Card", totalPost: "NA", eligibility: "Indian Citizen / Foreign Citizen / Company / Firm" }],
    importantLinks: [
        { label: "Apply Online (NSDL)", url: "https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html" },
        { label: "Apply Online (UTI)", url: "https://www.pan.utiitsl.com/PAN/" },
        { label: "Link PAN with Aadhaar", url: "https://eportal.incometax.gov.in/iec/foservices/#/pre-login/bl-link-aadhaar" }
    ]
  },
  "voter-id": {
    id: "voter-id",
    title: "Voter ID Card Apply Online / Download E-EPIC",
    postDate: "Active",
    shortInfo: "Election Commission of India (ECI) offers online services for Voter ID card. You can apply for a new voter ID (Form 6), apply for corrections (Form 8), or download your digital voter ID (e-EPIC).",
    importantDates: ["Service Status: Active"],
    applicationFee: ["Free"],
    ageLimit: ["18+ Years"],
    vacancyDetails: [{ postName: "Voter ID", totalPost: "NA", eligibility: "Indian Citizen, 18 Years old" }],
    importantLinks: [{ label: "Apply / Download", url: "https://voters.eci.gov.in/" }]
  },
  "driving-license": {
    id: "driving-license",
    title: "Driving License Online Apply (Learner / Permanent)",
    postDate: "Active",
    shortInfo: "Apply for Learner's License (LL) and Driving License (DL) online via the Parivahan Sewa portal. You can also pay fees and book slots for driving tests.",
    importantDates: ["Service: Active"],
    applicationFee: ["Learner: ₹ 150-500", "Permanent: ₹ 1000+ (Varies by State)"],
    ageLimit: ["16+ for MCWOG", "18+ for LMV/MCWG"],
    vacancyDetails: [{ postName: "Driving License", totalPost: "NA", eligibility: "Age limit + Traffic Rules Knowledge" }],
    importantLinks: [{ label: "Apply Online", url: "https://parivahan.gov.in/" }]
  },
  "passport": {
    id: "passport",
    title: "Passport Seva Online Apply",
    postDate: "Active",
    shortInfo: "Apply for a Fresh Passport or Re-issue of Passport via Passport Seva Kendra (PSK).",
    importantDates: ["Active"],
    applicationFee: ["Normal: ₹ 1500", "Tatkaal: ₹ 3500"],
    ageLimit: ["NA"],
    vacancyDetails: [{ postName: "Passport", totalPost: "NA", eligibility: "Indian Citizen" }],
    importantLinks: [{ label: "Apply Online", url: "https://www.passportindia.gov.in/" }]
  },
  "ccc-online": {
    id: "ccc-online",
    title: "NIELIT CCC Online Form 2025",
    postDate: "Every Month Cycle",
    shortInfo: "Course on Computer Concepts (CCC) is a basic computer literacy course. Exams are held every month.",
    importantDates: ["Exam: Monthly"],
    applicationFee: ["₹ 590"],
    ageLimit: ["No Limit"],
    vacancyDetails: [{ postName: "CCC Certificate", totalPost: "NA", eligibility: "No specific eligibility" }],
    importantLinks: [{ label: "Apply Online", url: "https://student.nielit.gov.in/" }]
  },
  "birth-cert": {
    id: "birth-cert",
    title: "Birth / Death Certificate Online Apply",
    postDate: "Active",
    shortInfo: "Apply for Birth or Death Registration online through the Civil Registration System (CRS) or respective state portals. It is a mandatory document for identity.",
    importantDates: ["Registration: Within 21 days (Free)", "Late Registration: With Fee"],
    applicationFee: ["Free (within 21 days)", "Late Fee: Varies"],
    ageLimit: ["NA"],
    vacancyDetails: [{ postName: "Certificate", totalPost: "NA", eligibility: "Resident" }],
    importantLinks: [{ label: "CRS Portal", url: "https://crsorgi.gov.in/" }]
  },
  "ration-card": {
    id: "ration-card",
    title: "Ration Card Online Apply / Name Add",
    postDate: "Active",
    shortInfo: "Apply for a new Ration Card or add/delete names in an existing card. Ration cards are issued by state governments under the NFSA.",
    importantDates: ["Service: Active"],
    applicationFee: ["Nominal Fee (Rs. 10-50)"],
    ageLimit: ["Head of Family: 18+"],
    vacancyDetails: [{ postName: "Ration Card", totalPost: "NA", eligibility: "Income Criteria" }],
    importantLinks: [{ label: "NFSA Portal", url: "https://nfsa.gov.in/" }]
  },

  // --- OTHER JOBS ---
  
  "upsc-2026": {
    id: "upsc-2026",
    title: "UPSC Civil Services IAS / IFS Pre 2026 Online Form",
    postDate: "14 February 2026 | 02:00 PM",
    shortInfo: "Union Public Service Commission (UPSC) has issued the notification for the Civil Services Examination (CSE) 2026 and Indian Forest Service (IFS) Examination 2026. This exam is conducted to recruit officers for the Indian Administrative Service (IAS), Indian Foreign Service (IFS), Indian Police Service (IPS), and other Central Services (Group A and Group B). It is considered the toughest and most prestigious exam in the country. Candidates must hold a Graduate degree to apply. The examination consists of three stages: Preliminary, Mains, and Interview. Interested candidates who meet the eligibility criteria can apply online through the OTR (One Time Registration) system on the UPSC website.",
    importantDates: [
        "Application Begin: 14/02/2026",
        "Last Date for Apply Online: 05/03/2026 (upto 6 PM)",
        "Pay Exam Fee Last Date: 05/03/2026",
        "Correction / Edit Form: 06-12 March 2026",
        "Pre Exam Date: 26/05/2026",
        "Admit Card Available: May 2026"
    ],
    applicationFee: [
        "General / OBC / EWS: ₹ 100/-",
        "SC / ST / PH: ₹ 0/-",
        "All Category Female: ₹ 0/-",
        "Payment Mode: Pay the examination fee through Debit Card, Credit Card, Net Banking, or UPI."
    ],
    ageLimit: [
        "Minimum Age: 21 Years",
        "Maximum Age: 32 Years",
        "Age Calculate on: 01/08/2026",
        "Age Relaxation: SC/ST: 5 Years, OBC: 3 Years, PH: 10 Years (As per rules)"
    ],
    vacancyDetails: [
        { postName: "Indian Administrative Service (IAS)", totalPost: "1056", eligibility: "Bachelor Degree in Any Stream from Any Recognized University in India." },
        { postName: "Indian Forest Service (IFS)", totalPost: "150", eligibility: "Bachelor Degree with at least one of the subjects namely Animal Husbandry & Veterinary Science, Botany, Chemistry, Geology, Mathematics, Physics, Statistics and Zoology or a Bachelor's degree in Agriculture, Forestry or in Engineering." }
    ],
    importantLinks: [
        { label: "Apply Online", url: "https://upsconline.nic.in/" },
        { label: "Download Notification (IAS)", url: "https://upsc.gov.in/" },
        { label: "Download Notification (IFS)", url: "https://upsc.gov.in/" },
        { label: "Official Website", url: "https://upsc.gov.in/" }
    ]
  },
  "airforce-2027": {
    id: "airforce-2027",
    title: "Airforce Agniveer Vayu Intake 01/2027 Recruitment",
    postDate: "01 February 2026",
    shortInfo: "Indian Air Force (IAF) invites online applications from unmarried Indian male and female candidates for selection test for Agniveer Vayu Intake 01/2027 under the Agnipath Scheme. This is a golden opportunity to serve the nation. The selection process involves an online test, physical fitness test (PFT), adaptability test, and medical examination. Selected candidates will be enrolled for a period of 4 years. Upon completion of 4 years, 25% of Agniveers will be enrolled in the regular cadre of the Indian Air Force based on merit and organizational requirements.",
    importantDates: [
        "Application Begin: 17/02/2026",
        "Last Date for Apply Online: 10/03/2026",
        "Exam Date: 20/05/2026 onwards",
        "Admit Card Available: 48 Hours before Exam"
    ],
    applicationFee: [
        "General / OBC / EWS: ₹ 550/-",
        "SC / ST: ₹ 550/-",
        "Payment Mode: Pay the exam fee through Debit Card, Credit Card, Net Banking. (GST charges extra if applicable)"
    ],
    ageLimit: [
        "Minimum Age: 17.5 Years",
        "Maximum Age: 21 Years",
        "Date of Birth Block: Candidates born between 02/07/2005 and 03/01/2009 (both days inclusive) are eligible."
    ],
    vacancyDetails: [
        { postName: "Agniveer Vayu (Science Subjects)", totalPost: "TBA", eligibility: "10+2 Intermediate with Mathematics, Physics and English with Minimum 50% Marks in Aggregate and 50% Marks in English. OR 3 Year Diploma in Engineering (Mechanical / Electrical / Electronics / Automobile / Computer Science / Instrumentation Technology / Information Technology) with 50% Marks." },
        { postName: "Agniveer Vayu (Other than Science Subjects)", totalPost: "TBA", eligibility: "10+2 Intermediate with Minimum 50% Marks Aggregate and 50% Marks in English." }
    ],
    importantLinks: [
        { label: "Apply Online", url: "https://agnipathvayu.cdac.in/" }, 
        { label: "Download Notification", url: "https://agnipathvayu.cdac.in/" },
        { label: "Official Website", url: "https://indianairforce.nic.in/" }
    ]
  },
  "up-police-2026": {
    id: "up-police-2026",
    title: "UP Police Constable Recruitment 2026",
    postDate: "15 January 2026",
    shortInfo: "Uttar Pradesh Police Recruitment & Promotion Board (UPPRPB) Lucknow has released the notification for the direct recruitment of Constables (Civil Police) for 60,244 posts. This is a massive recruitment drive by the UP Government. Both male and female candidates who have passed their 12th (Intermediate) examination are eligible to apply. The selection will be based on a Written Exam, Document Verification, and Physical Standard Test (PST)/Physical Efficiency Test (PET). Candidates are advised to read the full notification before applying.",
    importantDates: [
        "Application Begin: 20/01/2026",
        "Last Date for Apply Online: 20/02/2026",
        "Pay Exam Fee Last Date: 20/02/2026",
        "Correction Last Date: 22/02/2026",
        "Exam Date: June 2026 (Tentative)",
        "Admit Card Available: Before Exam"
    ],
    applicationFee: [
        "General / OBC: ₹ 400/-",
        "SC / ST: ₹ 400/-",
        "All Category Female: ₹ 400/-",
        "Payment Mode: Pay the exam fee through Online Fee Mode Debit Card, Credit Card, Net Banking or Offline E-Challan Mode."
    ],
    ageLimit: [
        "Minimum Age: 18 Years",
        "Maximum Age (Male): 25 Years",
        "Maximum Age (Female): 28 Years",
        "Age Relaxation: SC/ST/OBC/EWS Candidates Relaxation as per UP Govt Rules (Generally 5 Years)."
    ],
    vacancyDetails: [
        { postName: "Constable (Civil Police)", totalPost: "60244", eligibility: "10+2 (Intermediate) Exam Passed from Any Recognized Board in India. (Appearing candidates are not eligible)." }
    ],
    importantLinks: [
        { label: "Apply Online", url: "https://uppbpb.gov.in/" },
        { label: "Download Notification", url: "https://uppbpb.gov.in/" },
        { label: "Official Website", url: "https://uppbpb.gov.in/" }
    ]
  },
  "bihar-gd-2026": {
    id: "bihar-gd-2026",
    title: "CSBC Bihar Police Constable GD 2026",
    postDate: "20 January 2026",
    shortInfo: "Central Selection Board of Constable (CSBC) Bihar has invited online applications for the recruitment of Constable General Duty (GD) in Bihar Police. This recruitment is for filling up vacancies in District Police, Bihar Special Armed Police (BSAP), and other units. The selection process comprises a Written Examination (Qualifying) followed by a Physical Efficiency Test (PET) which determines the final merit list. Candidates from other states can also apply under the General category.",
    importantDates: ["Start: 01/02/2026", "Last Date: 01/03/2026", "Exam Date: To be announced"],
    applicationFee: ["Gen/OBC/EWS/Other State: ₹ 675", "SC/ST/Female: ₹ 180"],
    ageLimit: ["18-25 Years (General)", "Relaxation for OBC/SC/ST as per Bihar Govt Rules"],
    vacancyDetails: [{ postName: "Constable GD", totalPost: "4500+", eligibility: "10+2 Intermediate Exam Passed from Any Recognized Board." }],
    importantLinks: [{ label: "Official Website", url: "https://csbc.bih.nic.in/" }]
  },
  "rrb-group-d-2026": {
    id: "rrb-group-d-2026",
    title: "Railway RRC Group D Recruitment 2026",
    postDate: "Upcoming",
    shortInfo: "Railway Recruitment Cell (RRC) is gearing up for a massive recruitment drive for Level-1 (Group D) posts across various Railway Zones. Posts include Track Maintainer Grade IV, Helper/Assistant in various technical departments (Electrical, Mechanical, and S&T), and Assistant Pointsman. This is one of the largest recruitment drives in the world. The exam will be Computer Based (CBT) followed by Physical Efficiency Test (PET).",
    importantDates: ["Notification: May 2026", "Exam: Late 2026"],
    applicationFee: ["Gen/OBC: ₹ 500 (₹ 400 Refundable)", "SC/ST/Female: ₹ 250 (₹ 250 Refundable)"],
    ageLimit: ["18-33 Years", "Relaxation: OBC 3 Yrs, SC/ST 5 Yrs"],
    vacancyDetails: [{ postName: "Group D (Level-1)", totalPost: "1 Lakh+", eligibility: "10th Pass OR ITI from NCVT/SCVT." }],
    importantLinks: [{ label: "Official Website", url: "https://indianrailways.gov.in/" }]
  },
  "navy-ssc-2026": {
    id: "navy-ssc-2026",
    title: "Indian Navy SSC Officer Recruitment 2026",
    postDate: "10 February 2026",
    shortInfo: "Indian Navy invites applications from unmarried eligible men and unmarried women candidates for grant of Short Service Commission (SSC) in Executive, Education, and Technical Branches. The course will commence in June 2026 at Indian Naval Academy (INA) Ezhimala, Kerala. Candidates must fulfill conditions of nationality as laid down by the Government of India. Selection is based on SSB interview marks.",
    importantDates: ["Start: 24/02/2026", "End: 10/03/2026"],
    applicationFee: ["No Fee for All Candidates"],
    ageLimit: ["Born Between 02/07/2001 to 01/01/2007 (Varies by Branch)"],
    vacancyDetails: [{ postName: "SSC Officer", totalPost: "Various", eligibility: "BE/B.Tech Degree in Relevant Branch with minimum 60% marks." }],
    importantLinks: [{ label: "Apply Online", url: "https://www.joinindiannavy.gov.in/" }]
  },
  "sbi-cbo-2026": {
    id: "sbi-cbo-2026",
    title: "SBI Circle Based Officer (CBO) 2026",
    postDate: "18 January 2026",
    shortInfo: "State Bank of India (SBI) has released advertisement for the recruitment of Circle Based Officers (CBO) in various circles. This is an excellent opportunity for experienced banking professionals to join India's largest bank. The selection process consists of an Online Test and Screening/Interview. Candidates selected will be posted in the applied circle only.",
    importantDates: ["Start: 18/01/2026", "End: 08/02/2026"],
    applicationFee: ["Gen/OBC/EWS: ₹ 750", "SC/ST/PH: ₹ 0"],
    ageLimit: ["21-30 Years (As on 31.10.2025)"],
    vacancyDetails: [{ postName: "Circle Based Officer (CBO)", totalPost: "5280", eligibility: "Graduation in any discipline + Minimum 2 years experience as an officer in any Scheduled Commercial Bank or any Regional Rural Bank." }],
    importantLinks: [{ label: "Apply Online", url: "https://sbi.co.in/web/careers" }]
  },
  "bsnl-exec": {
    id: "bsnl-exec",
    title: "BSNL Senior Executive Trainee 2026",
    postDate: "Feb 2026",
    shortInfo: "Bharat Sanchar Nigam Limited (BSNL) is looking for young and energetic engineers to join as Senior Executive Trainee. BSNL is reviving and expanding its 4G/5G network, offering great career growth. Selection will be based on GATE Score / Online Examination.",
    importantDates: ["Start: Feb 2026", "End: March 2026"],
    applicationFee: ["₹ 1000 (General/OBC)", "₹ 500 (SC/ST)"],
    ageLimit: ["21-30 Years"],
    vacancyDetails: [{ postName: "Executive Trainee", totalPost: "400+", eligibility: "B.E/B.Tech in Electronics / Telecommunication / Computer Science / IT." }],
    importantLinks: [{ label: "Apply", url: "https://www.bsnl.co.in/" }]
  },
  "rrb-je-status": {
      id: "rrb-je-status",
      title: "RRB JE 2025 Application Status",
      postDate: "Check Now",
      shortInfo: "Railway Recruitment Boards (RRBs) have activated the link to check the application status for CEN 03/2024 (Junior Engineer). Candidates can check whether their application is provisionally accepted or rejected. If rejected, the reason for rejection will be displayed. This is a crucial step before the release of Admit Cards.",
      importantDates: ["Status Out: Jan 2026", "Admit Card: 4 Days before exam"],
      applicationFee: ["NA"],
      ageLimit: ["NA"],
      vacancyDetails: [{ postName: "Junior Engineer (JE)", totalPost: "7900+", eligibility: "Diploma/Degree in Engineering" }],
      importantLinks: [{ label: "Check Status", url: "https://indianrailways.gov.in/" }]
  },
  "ctet-date": {
    id: "ctet-date",
    title: "CTET 2026 Exam Date Notice",
    postDate: "Notice Out",
    shortInfo: "Central Board of Secondary Education (CBSE) has released the public notice regarding the Central Teacher Eligibility Test (CTET) July 2026. The 21st edition of CTET will be conducted on Sunday, 07th July 2026. The test will be conducted in twenty languages throughout the country.",
    importantDates: ["Exam Date: 07/07/2026"],
    applicationFee: ["NA"],
    ageLimit: ["NA"],
    vacancyDetails: [{ postName: "CTET Paper I & II", totalPost: "Eligibility Test", eligibility: "B.Ed / D.El.Ed passed or appearing." }],
    importantLinks: [{ label: "Download Notice", url: "https://ctet.nic.in/" }]
  },
  "gate-card": {
    id: "gate-card",
    title: "GATE 2026 Admit Card Download",
    postDate: "Jan 2026",
    shortInfo: "Indian Institute of Technology (IIT) has released the Admit Cards for the Graduate Aptitude Test in Engineering (GATE) 2026. Candidates can download their Hall Ticket by logging into the GOAPS portal. The exam is scheduled for February 2026. GATE score is used for admissions to M.Tech/Ph.D. programs and recruitment in PSUs.",
    importantDates: ["Exam Date: Feb 2026", "Admit Card: Available Now"],
    applicationFee: ["NA"],
    ageLimit: ["NA"],
    vacancyDetails: [{ postName: "GATE 2026", totalPost: "Entrance Exam", eligibility: "B.Tech / B.E / M.Sc" }],
    importantLinks: [{ label: "Download Admit Card", url: "https://gate.iitk.ac.in/" }]
  }
};
