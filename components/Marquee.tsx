import React, { useMemo } from 'react';
import { Bell } from 'lucide-react';
import { MARQUEE_TEXTS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { SectionData } from '../types';

interface MarqueeProps {
  onItemClick?: (text: string, id?: string) => void;
  sections?: SectionData[];
}

const Marquee: React.FC<MarqueeProps> = ({ onItemClick, sections = [] }) => {
  const { language } = useLanguage();
  const t = translations[language];

  const items = useMemo(() => {
    // If we have sections data, derive dynamic items
    if (sections && sections.length > 0) {
        const newUpdates = sections.find(s => s.title === 'New Updates')?.items || [];
        const topOnline = sections.find(s => s.title === 'Top Online Form')?.items || [];
        
        const dynamicItems = [
            ...newUpdates.slice(0, 6),
            ...topOnline.slice(0, 4)
        ].map(item => ({
            text: item.title + (item.isNew ? ' 🔴' : ''), 
            id: item.id
        }));

        if (dynamicItems.length > 0) {
            return dynamicItems;
        }
    }
    
    // Fallback to static text if no data available
    return MARQUEE_TEXTS.map(text => ({ text, id: undefined }));
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
