import React, { useMemo, useState, useEffect } from 'react';
import Header from './components/Header';
import Marquee from './components/Marquee';
import CategoryBox from './components/CategoryBox';
import Footer from './components/Footer';
import AIAssistant from './components/AIAssistant';
import JobAlertModal from './components/JobAlertModal';
import JobDetail from './components/JobDetail';
import CategoryDetail from './components/CategoryDetail';
import StaticContent from './components/StaticContent';
import { jobService } from './services/jobService';
import { SectionData, JobDetailData, ViewType } from './types';
import { Grid, Smartphone, Download, Star, BellRing, Loader2, Frown } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { translations } from './utils/translations';

const App: React.FC = () => {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedJob, setSelectedJob] = useState<JobDetailData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SectionData | null>(null);
  const [isNavLoading, setIsNavLoading] = useState(false);

  const { language } = useLanguage();
  const t = translations[language];

  // Initial Data Fetch
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      const data = await jobService.getAllJobs();
      setSections(data);
      setIsLoading(false);
    };
    fetchJobs();
  }, []);

  // Handle Search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    // If we are in detail or category view, go back to home to show results
    if (currentView !== 'home') {
        setCurrentView('home');
        setSelectedJob(null);
        setSelectedCategory(null);
    }

    setIsLoading(true);
    const results = await jobService.searchJobs(query);
    setSections(results);
    setIsLoading(false);
  };

  // General Navigation Handler
  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
    // Reset specific states when navigating
    if (view === 'home' || view === 'contact' || view === 'about' || view === 'privacy' || view === 'terms' || view === 'disclaimer') {
        setSelectedJob(null);
        setSelectedCategory(null);
    }
  };

  // Handle Job Click
  const handleJobClick = async (id: string, title: string) => {
      setIsNavLoading(true);
      const detail = await jobService.getJobDetail(id, title);
      setSelectedJob(detail);
      setCurrentView('detail');
      setIsNavLoading(false);
  };

  // Handle View More (Category) Click
  const handleViewMore = async (categoryTitle: string) => {
      setIsNavLoading(true);
      const categoryData = await jobService.getCategoryJobs(categoryTitle);
      setSelectedCategory(categoryData);
      setCurrentView('category');
      setIsNavLoading(false);
  };

  const handleBackToHome = () => {
      setCurrentView('home');
      setSelectedJob(null);
      setSelectedCategory(null);
  };

  // Updated Logic: Include "New Updates" (previously Upcoming) in top sections
  const topSections = useMemo(() => sections.filter(s => ['New Updates', 'Top Online Form'].includes(s.title)), [sections]);
  const gridSections = useMemo(() => sections.filter(s => !['New Updates', 'Top Online Form'].includes(s.title)), [sections]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      <Header onSearch={handleSearch} onNavigate={handleNavigate} onCategoryClick={handleViewMore} />
      <Marquee />

      <main className="container mx-auto px-4 py-6 flex-grow">
        
        {/* VIEW: STATIC PAGES */}
        {['about', 'contact', 'privacy', 'terms', 'disclaimer'].includes(currentView) && (
             <StaticContent type={currentView} />
        )}

        {/* VIEW: JOB DETAIL */}
        {currentView === 'detail' && selectedJob && (
            <JobDetail job={selectedJob} onBack={handleBackToHome} />
        )}

        {/* VIEW: CATEGORY DETAIL */}
        {currentView === 'category' && selectedCategory && (
            <CategoryDetail 
                category={selectedCategory} 
                onBack={handleBackToHome} 
                onJobClick={handleJobClick}
            />
        )}

        {/* VIEW: DASHBOARD (HOME) */}
        {currentView === 'home' && (
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
                                    onClick={() => setIsAlertModalOpen(true)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-green-700 transition flex items-center animate-bounce-short"
                                >
                                    <BellRing size={16} className="mr-2" /> {t.freeJobAlerts}
                                </button>
                                <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-red-700 transition flex items-center">
                                    <Download size={16} className="mr-2" /> {t.app}
                                </button>
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-blue-700 transition flex items-center">
                                    <Star size={16} className="mr-2" /> {t.telegram}
                                </button>
                            </div>
                        </div>
                        <Smartphone size={180} className="absolute -right-6 -bottom-10 text-gray-100 transform rotate-12 z-0 hidden md:block" />
                    </div>
                )}

                {/* Loading State */}
                {(isLoading || isNavLoading) && (
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
                                        onJobClick={handleJobClick} 
                                        onViewMore={handleViewMore}
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
                                    onJobClick={handleJobClick}
                                    onViewMore={handleViewMore}
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
                        <button onClick={() => handleSearch('')} className="mt-4 text-red-600 hover:underline">{t.viewAllJobs}</button>
                    </div>
                )}

                {/* SEO Text */}
                <div className="mt-12 bg-white p-6 rounded-lg shadow-sm border border-gray-200 prose prose-red max-w-none text-sm text-gray-600">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{t.whyExamSite}</h3>
                    <p className="mb-2">{t.whyContent}</p>
                </div>
            </>
        )}

      </main>

      <Footer onNavigate={handleNavigate} onCategoryClick={handleViewMore} />
      <AIAssistant />
      <JobAlertModal isOpen={isAlertModalOpen} onClose={() => setIsAlertModalOpen(false)} />
      
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