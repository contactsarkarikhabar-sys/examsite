import React, { useMemo } from 'react';
import { Bell } from 'lucide-react';
import { MOCK_SECTIONS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { SectionData } from '../types';
import { deriveReadableTitle } from '../shared/jobTitle';

interface MarqueeProps {
  onItemClick?: (text: string, id?: string) => void;
  sections?: SectionData[];
}

const Marquee: React.FC<MarqueeProps> = ({ onItemClick, sections = [] }) => {
  const { language } = useLanguage();
  const t = translations[language];

  const items = useMemo(() => {
    // Use passed sections or fallback to MOCK_SECTIONS (which has IDs)
    const sourceSections = (sections && sections.length > 0) ? sections : MOCK_SECTIONS;
    
    const newUpdates = sourceSections.find(s => s.title === 'New Updates')?.items || [];
    const topOnline = sourceSections.find(s => s.title === 'Top Online Form')?.items || [];
    
    const dynamicItems = [
        ...newUpdates.slice(0, 6),
        ...topOnline.slice(0, 4)
    ].map(item => ({
        text: deriveReadableTitle({ title: item.title }) + (item.isNew ? ' 🔴' : ''), 
        id: item.id
    }));

    if (dynamicItems.length > 0) {
        return dynamicItems;
    }
    
    // Ultimate fallback (should rarely be reached if MOCK_SECTIONS is valid)
    return [{ text: "Welcome to ExamSite - Your Success Partner", id: undefined }];
  }, [sections]);

  return (
    <div className="bg-yellow-400 border-b border-yellow-500 overflow-hidden flex items-center h-10 shadow-sm relative z-30">
        <div className="bg-red-700 text-white px-3 h-full flex items-center font-bold text-xs uppercase tracking-wide flex-shrink-0 z-10 shadow-md">
            <Bell size={14} className="mr-1 animate-pulse" /> {t.latest}
        </div>
        <div className="marquee-container flex-1 overflow-hidden whitespace-nowrap relative group">
             <div className="animate-marquee inline-block py-2 group-hover:pause-animation">
                {items.map((item, i) => (
                    <span 
                      key={i} 
                      onClick={() => onItemClick && onItemClick(item.text, item.id)}
                      className="mx-6 text-red-900 font-bold text-sm hover:underline cursor-pointer hover:text-red-700 transition-colors"
                    >
                        {item.text} <span className="inline-block w-2 h-2 bg-red-600 rounded-full ml-2 align-middle"></span>
                    </span>
                ))}
             </div>
        </div>
        
        <style>{`
        .animate-marquee {
            animation: marquee 60s linear infinite;
        }
        .group:hover .animate-marquee {
            animation-play-state: paused;
        }
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
        `}</style>
    </div>
  );
};

export default Marquee;
