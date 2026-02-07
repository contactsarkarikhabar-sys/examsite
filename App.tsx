import React, { useMemo, useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Marquee from './components/Marquee';
import CategoryBox from './components/CategoryBox';
import Footer from './components/Footer';
import AIAssistant from './components/AIAssistant';
import JobAlertModal from './components/JobAlertModal';
import AdminPanel from './components/AdminPanel';
import JobDetail from './components/JobDetail';
import CategoryDetail from './components/CategoryDetail';
import StaticContent from './components/StaticContent';
import { jobService } from './services/jobService';
import { SectionData, JobDetailData, ViewType } from './types';
import { Smartphone, Download, Star, BellRing, Loader2, Frown } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { translations } from './utils/translations';

// ==================== HOME PAGE COMPONENT ====================
const HomePage: React.FC<{
    searchQuery: string;
    onJobClick: (id: string, title: string) => void;
    onViewMore: (categoryTitle: string) => void;
    onAlertModalOpen: () => void;
    onInstallApp: () => void;
    onClearSearch: () => void;
}> = ({ searchQuery, onJobClick, onViewMore, onAlertModalOpen, onInstallApp, onClearSearch }) => {
    const [sections, setSections] = useState<SectionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { language } = useLanguage();
    const t = translations[language];

    useEffect(() => {
        const fetchJobs = async () => {
            setIsLoading(true);
            const data = await jobService.getAllJobs();
            setSections(data);
            setIsLoading(false);
        };
        fetchJobs();
    }, []);

    useEffect(() => {
        const runSearch = async () => {
            setIsLoading(true);
            const query = searchQuery.trim();
            if (query) {
                const filtered = await jobService.searchJobs(query);
                setSections(filtered);
            } else {
                const data = await jobService.getAllJobs();
                setSections(data);
            }
            setIsLoading(false);
        };
        runSearch();
    }, [searchQuery]);
    const topSections = useMemo(() => sections.filter(s => ['New Updates', 'Top Online Form'].includes(s.title)), [sections]);
    const gridSections = useMemo(() => sections.filter(s => !['New Updates', 'Top Online Form'].includes(s.title)), [sections]);

    return (
        <>
            {/* Welcome / Intro Banner */}
            {!searchQuery && (
                <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center md:text-left md:flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.welcomeTitle} <span className="text-red-600">ExamSite.in</span></h2>
                        <p className="text-gray-600 text-sm max-w-xl">
                            {t.welcomeSubtitle}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
                            <button
                                onClick={onAlertModalOpen}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-green-700 transition flex items-center animate-bounce-short"
                            >
                                <BellRing size={16} className="mr-2" /> {t.freeJobAlerts}
                            </button>
                            <button onClick={onInstallApp} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-red-700 transition flex items-center">
                                <Download size={16} className="mr-2" /> {t.app}
                            </button>
                            <a href="https://t.me/Exam_site" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-blue-700 transition flex items-center">
                                <Star size={16} className="mr-2" /> {t.telegram}
                            </a>
                        </div>
                    </div>
                    <Smartphone size={180} className="absolute -right-6 -bottom-10 text-gray-100 transform rotate-12 z-0 hidden md:block" />
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex justify-center items-center">
                    <Loader2 size={40} className="text-red-600 animate-spin" />
                </div>
            )}

            {/* Content */}
            {!isLoading && sections.length > 0 && (
                <>
                    {/* Major Sections (New Updates & Top Online Form) */}
                    {topSections.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {topSections.map((section: SectionData) => (
                                <CategoryBox
                                    key={section.title}
                                    data={section}
                                    onJobClick={onJobClick}
                                    onViewMore={onViewMore}
                                />
                            ))}
                        </div>
                    )}

                    {/* Quick Links Box */}
                    {!searchQuery && (
                        <div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-4 rounded-lg mb-8 shadow-md text-center border-t-4 border-yellow-400">
                            <p className="font-bold text-yellow-400 text-sm md:text-lg tracking-wide uppercase animate-pulse">
                                ★ {t.welcomeBanner} ★
                            </p>
                        </div>
                    )}

                    {/* Grid Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {gridSections.map((section: SectionData) => (
                            <CategoryBox
                                key={section.title}
                                data={section}
                                onJobClick={onJobClick}
                                onViewMore={onViewMore}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* No Results State */}
            {!isLoading && sections.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Frown size={64} className="mb-4 text-gray-300" />
                    <h3 className="text-xl font-bold text-gray-700">
                        {searchQuery?.trim()
                            ? `${t.noMatching} "${searchQuery}"`
                            : t.noJobsFound}
                    </h3>
                    {searchQuery?.trim() && (
                        <button
                            onClick={onClearSearch}
                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow hover:bg-red-700 transition"
                        >
                            {t.clearSearch}
                        </button>
                    )}
                </div>
            )}

            {/* SEO Text */}
            <div className="mt-12 bg-white p-6 rounded-lg shadow-sm border border-gray-200 prose prose-red max-w-none text-sm text-gray-600">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{t.whyExamSite}</h3>
                <p className="mb-2">{t.whyContent}</p>
            </div>
        </>
    );
};

// ==================== JOB DETAIL PAGE ====================
const JobDetailPage: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [job, setJob] = useState<JobDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            if (jobId) {
                setIsLoading(true);
                const state = location.state as { title?: string } | null;
                
                // Attempt to fetch job details
                try {
                    const detail = await jobService.getJobDetail(jobId, state?.title);
                    setJob(detail);
                } catch (error) {
                    console.error("Failed to load job, generating smart fallback", error);
                    // This block might not be reached if jobService handles errors internally,
                    // but it's good practice.
                }
                setIsLoading(false);
            }
        };
        fetchJob();
    }, [jobId, location.state]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 size={40} className="text-red-600 animate-spin" />
            </div>
        );
    }

    // If job is null (should rare now due to service fallback), show simple not found
    if (!job) {
        return <div className="text-center py-20">Job details unavailable. Please try again.</div>;
    }

    return <JobDetail job={job} onBack={() => navigate('/')} />;
};

// ==================== CATEGORY PAGE ====================
const CategoryPage: React.FC = () => {
    const { categoryName } = useParams<{ categoryName: string }>();
    const navigate = useNavigate();
    const [category, setCategory] = useState<SectionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategory = async () => {
            if (categoryName) {
                setIsLoading(true);
                const data = await jobService.getCategoryJobs(decodeURIComponent(categoryName));
                setCategory(data);
                setIsLoading(false);
            }
        };
        fetchCategory();
    }, [categoryName]);

    const handleJobClick = (id: string, title: string) => {
        navigate(`/job/${encodeURIComponent(id)}`, { state: { title } });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 size={40} className="text-red-600 animate-spin" />
            </div>
        );
    }

    if (!category) {
        return <div className="text-center py-20">Category not found</div>;
    }

    return <CategoryDetail category={category} onBack={() => navigate('/')} onJobClick={handleJobClick} />;
};

// ==================== MAIN APP COMPONENT ====================
const App: React.FC = () => {
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sections, setSections] = useState<SectionData[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useLanguage();

    // Capture PWA install prompt
    useEffect(() => {
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    useEffect(() => {
        const loadSections = async () => {
            const query = searchQuery.trim();
            if (query) {
                const filtered = await jobService.searchJobs(query);
                setSections(filtered);
                return;
            }
            const data = await jobService.getAllJobs();
            setSections(data);
        };
        loadSections();
    }, [searchQuery]);

    // Navigation handlers
    const handleNavigate = (view: ViewType) => {
        const routes: Record<string, string> = {
            'home': '/',
            'about': '/about',
            'contact': '/contact',
            'privacy': '/privacy',
            'terms': '/terms',
            'disclaimer': '/disclaimer',
        };
        navigate(routes[view] || '/');
    };

    const handleJobClick = (id: string, title: string) => {
        navigate(`/job/${encodeURIComponent(id)}`, { state: { title } });
    };

    const handleViewMore = (categoryTitle: string) => {
        navigate(`/category/${encodeURIComponent(categoryTitle)}`);
    };

    const handleSearch = async (query: string) => {
        if (location.pathname !== '/') {
            navigate('/');
        }
        setSearchQuery(query);
    };

    // Marquee Click Handler
    const handleMarqueeClick = (text: string, id?: string) => {
        // 1. Direct ID (Standard Navigation)
        if (id) {
            handleJobClick(id, text);
            return;
        }

        // 2. Fallback: Lookup in current sections state
        // Remove emoji and trim to match title
        const cleanText = text.replace(/🔴/g, '').trim();
        
        for (const section of sections) {
             const found = section.items.find(item => item.title === cleanText || cleanText.includes(item.title) || item.title.includes(cleanText));
             if (found) {
                 handleJobClick(found.id, found.title);
                 return;
             }
        }
        
        // 3. Last Resort: Generate a Slug ID from Text and Navigate
        // Instead of searching, we FORCE navigation to a detail page
        const generatedId = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        handleJobClick(generatedId, cleanText);
    };

    // PWA Install handler
    const handleInstallApp = () => {
        if (deferredPrompt) {
            // Show native install prompt
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
        } else {
            // Detect device and show appropriate instructions
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isAndroid = /Android/.test(navigator.userAgent);
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

            if (isStandalone) {
                alert(language === 'hi' ? '✅ ऐप पहले से इंस्टॉल है!' : '✅ App is already installed!');
                return;
            }

            let msg = '';
            if (isIOS) {
                msg = language === 'hi'
                    ? '📱 iOS पर इंस्टॉल करें:\n\n1. Safari में यह पेज खोलें\n2. Share बटन (⬆️) पर टैप करें\n3. "Add to Home Screen" चुनें\n4. "Add" पर टैप करें'
                    : '📱 Install on iOS:\n\n1. Open this page in Safari\n2. Tap the Share button (⬆️)\n3. Select "Add to Home Screen"\n4. Tap "Add"';
            } else if (isAndroid) {
                msg = language === 'hi'
                    ? '📱 Android पर इंस्टॉल करें:\n\n1. Chrome में यह पेज खोलें\n2. Menu (⋮) पर टैप करें\n3. "Install App" या "Add to Home screen" चुनें\n4. "Install" पर टैप करें'
                    : '📱 Install on Android:\n\n1. Open this page in Chrome\n2. Tap the Menu (⋮)\n3. Select "Install App" or "Add to Home screen"\n4. Tap "Install"';
            } else {
                msg = language === 'hi'
                    ? '💻 Desktop पर इंस्टॉल करें:\n\n1. Chrome/Edge में यह पेज खोलें\n2. Address bar में Install icon (⊕) पर क्लिक करें\n   या Menu → "Install ExamSite..."\n3. "Install" पर क्लिक करें'
                    : '💻 Install on Desktop:\n\n1. Open this page in Chrome/Edge\n2. Click Install icon (⊕) in address bar\n   or Menu → "Install ExamSite..."\n3. Click "Install"';
            }
            alert(msg);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
            <Header onSearch={handleSearch} onNavigate={handleNavigate} onCategoryClick={handleViewMore} />
            <Marquee onItemClick={handleMarqueeClick} sections={sections} />

            <main className="container mx-auto px-4 py-6 flex-grow">
                <Routes>
                    {/* Home Page */}
                    <Route
                        path="/"
                        element={
                            <HomePage
                                searchQuery={searchQuery}
                                onJobClick={handleJobClick}
                                onViewMore={handleViewMore}
                                onAlertModalOpen={() => setIsAlertModalOpen(true)}
                                onInstallApp={handleInstallApp}
                                onClearSearch={() => setSearchQuery('')}
                            />
                        }
                    />

                    {/* Static Pages */}
                    <Route path="/about" element={<StaticContent type="about" />} />
                    <Route path="/contact" element={<StaticContent type="contact" />} />
                    <Route path="/privacy" element={<StaticContent type="privacy" />} />
                    <Route path="/terms" element={<StaticContent type="terms" />} />
                    <Route path="/disclaimer" element={<StaticContent type="disclaimer" />} />

                    {/* Job Detail Page */}
                    <Route path="/job/:jobId" element={<JobDetailPage />} />

                    {/* Category Page */}
                    <Route path="/category/:categoryName" element={<CategoryPage />} />

                    {/* 404 - Redirect to Home */}
                    <Route
                        path="*"
                        element={
                            <HomePage
                                searchQuery={searchQuery}
                                onJobClick={handleJobClick}
                                onViewMore={handleViewMore}
                                onAlertModalOpen={() => setIsAlertModalOpen(true)}
                                onInstallApp={handleInstallApp}
                                onClearSearch={() => setSearchQuery('')}
                            />
                        }
                    />
                </Routes>
            </main>

            <Footer onNavigate={handleNavigate} onCategoryClick={handleViewMore} />
            <AIAssistant />
            <JobAlertModal isOpen={isAlertModalOpen} onClose={() => setIsAlertModalOpen(false)} />
            <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />

            {/* Hidden Admin Access - Click bottom right corner */}
            <div
                className="fixed bottom-4 right-4 w-2 h-2 opacity-0 hover:opacity-20 cursor-pointer"
                onClick={() => setIsAdminPanelOpen(true)}
                title="Admin Panel"
            />

            <style>{`
                @keyframes bounce-short {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-short {
                    animation: bounce-short 2s infinite;
                }
            `}</style>
        </div>
    );
};

export default App;
