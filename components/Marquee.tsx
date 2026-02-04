import React from 'react';
import { Bell } from 'lucide-react';
import { MARQUEE_TEXTS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

const Marquee: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="bg-yellow-400 border-b border-yellow-500 overflow-hidden flex items-center h-10 shadow-sm relative z-30">
        <div className="bg-red-700 text-white px-3 h-full flex items-center font-bold text-xs uppercase tracking-wide flex-shrink-0 z-10 shadow-md">
            <Bell size={14} className="mr-1 animate-pulse" /> {t.latest}
        </div>
        <div className="marquee-container flex-1 overflow-hidden whitespace-nowrap relative">
             <div className="animate-marquee inline-block py-2">
                {MARQUEE_TEXTS.map((text, i) => (
                    <span key={i} className="mx-6 text-red-900 font-bold text-sm hover:underline cursor-pointer">
                        {text} <span className="inline-block w-2 h-2 bg-red-600 rounded-full ml-2 align-middle"></span>
                    </span>
                ))}
             </div>
        </div>
        
        <style>{`
        .animate-marquee {
            animation: marquee 25s linear infinite;
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
