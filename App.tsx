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
    onJobClick: (id: string, title: string) => void;
    onViewMore: (categoryTitle: string) => void;
    onAlertModalOpen: () => void;
}> = ({ onJobClick, onViewMore, onAlertModalOpen }) => {
    const [sections, setSections] = useState<SectionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
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
                            <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-red-700 transition flex items-center">
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
                    <h3 className="text-xl font-bold text-gray-700">{t.noJobsFound}</h3>
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
    const [job, setJob] = useState<JobDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            if (jobId) {
                setIsLoading(true);
                const detail = await jobService.getJobDetail(jobId, decodeURIComponent(jobId));
                setJob(detail);
                setIsLoading(false);
            }
        };
        fetchJob();
    }, [jobId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 size={40} className="text-red-600 animate-spin" />
            </div>
        );
    }

    if (!job) {
        return <div className="text-center py-20">Job not found</div>;
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
        navigate(`/job/${encodeURIComponent(title)}`);
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
    const navigate = useNavigate();
    const location = useLocation();

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

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
        navigate(`/job/${encodeURIComponent(title)}`);
    };

    const handleViewMore = (categoryTitle: string) => {
        navigate(`/category/${encodeURIComponent(categoryTitle)}`);
    };

    const handleSearch = async (query: string) => {
        if (location.pathname !== '/') {
            navigate('/');
        }
        // Search is handled in HomePage component
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
            <Header onSearch={handleSearch} onNavigate={handleNavigate} onCategoryClick={handleViewMore} />
            <Marquee />

            <main className="container mx-auto px-4 py-6 flex-grow">
                <Routes>
                    {/* Home Page */}
                    <Route
                        path="/"
                        element={
                            <HomePage
                                onJobClick={handleJobClick}
                                onViewMore={handleViewMore}
                                onAlertModalOpen={() => setIsAlertModalOpen(true)}
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
                    <Route path="*" element={<HomePage onJobClick={handleJobClick} onViewMore={handleViewMore} onAlertModalOpen={() => setIsAlertModalOpen(true)} />} />
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