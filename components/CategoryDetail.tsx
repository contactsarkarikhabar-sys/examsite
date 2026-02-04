import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Calendar, ChevronRight, Filter } from 'lucide-react';
import { SectionData, JobLink } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { translations, translateSectionTitle } from '../utils/translations';

interface Props {
  category: SectionData;
  onBack: () => void;
  onJobClick: (id: string, title: string) => void;
}

const CategoryDetail: React.FC<Props> = ({ category, onBack, onJobClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<JobLink[]>(category.items);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(category.items);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredItems(category.items.filter(item => 
        item.title.toLowerCase().includes(lower)
      ));
    }
  }, [searchTerm, category.items]);

  // Dynamic Header Color
  const headerColorMap: Record<string, string> = {
    red: 'bg-red-700',
    blue: 'bg-blue-700',
    green: 'bg-green-700',
    orange: 'bg-orange-700',
    purple: 'bg-purple-700',
    teal: 'bg-teal-700',
    indigo: 'bg-indigo-700',
    pink: 'bg-pink-700',
  };
  const bgColor = headerColorMap[category.color] || 'bg-gray-700';

  const displayTitle = translateSectionTitle(category.title, language);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in min-h-[600px]">
      
      {/* Header */}
      <div className={`${bgColor} text-white p-6 relative`}>
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="mt-8 md:mt-0 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{displayTitle}</h1>
            <p className="text-white/80 text-sm">{t.showingUpdates}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <div className="relative max-w-md mx-auto">
            <input 
                type="text"
                placeholder={`${t.searchIn} ${displayTitle}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>
      </div>

      {/* List */}
      <div className="p-4 md:p-6">
        {filteredItems.length > 0 ? (
            <div className="space-y-3">
                {filteredItems.map((item, index) => (
                    <div 
                        key={item.id}
                        onClick={() => onJobClick(item.id, item.title)}
                        className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-red-300 transition cursor-pointer"
                    >
                        <div className="flex-1 pr-4">
                            <h3 className="text-sm md:text-base font-semibold text-gray-800 group-hover:text-red-700 transition-colors line-clamp-2">
                                {item.title}
                                {item.isNew && (
                                    <span className="ml-2 inline-block px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full border border-red-200">
                                        {t.new}
                                    </span>
                                )}
                            </h3>
                            {item.lastDate && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                    <Calendar size={12} className="mr-1" />
                                    {item.lastDate === 'Active' || item.lastDate === 'Coming Soon' || item.lastDate === 'Various' 
                                        ? <span>{t.status}: <span className="text-green-600 font-medium">{item.lastDate}</span></span> 
                                        : <span>{t.lastDate}: {item.lastDate}</span>
                                    }
                                </p>
                            )}
                        </div>
                        <div className="text-gray-300 group-hover:text-red-600 transition-colors">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-20 text-gray-500">
                <Filter size={48} className="mx-auto mb-3 text-gray-300" />
                <p>{t.noMatching} "{searchTerm}"</p>
                <button 
                    onClick={() => setSearchTerm('')} 
                    className="mt-2 text-red-600 font-medium text-sm hover:underline"
                >
                    {t.clearSearch}
                </button>
            </div>
        )}
      </div>

       <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CategoryDetail;
