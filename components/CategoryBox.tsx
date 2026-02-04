import React from 'react';
import { SectionData, JobLink } from '../types';
import { ExternalLink, ChevronsRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations, translateSectionTitle } from '../utils/translations';

interface Props {
  data: SectionData;
  onJobClick?: (id: string, title: string) => void;
  onViewMore?: (title: string) => void;
}

const CategoryBox: React.FC<Props> = ({ data, onJobClick, onViewMore }) => {
  const { language } = useLanguage();
  const t = translations[language];

  // Map standard colors to Tailwind classes
  const colorMap: Record<string, string> = {
    red: 'border-red-500 bg-red-50',
    blue: 'border-blue-500 bg-blue-50',
    green: 'border-green-500 bg-green-50',
    orange: 'border-orange-500 bg-orange-50',
    purple: 'border-purple-500 bg-purple-50',
    teal: 'border-teal-500 bg-teal-50',
    indigo: 'border-indigo-500 bg-indigo-50',
    pink: 'border-pink-500 bg-pink-50',
  };

  const headerColorMap: Record<string, string> = {
    red: 'bg-red-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    purple: 'bg-purple-600',
    teal: 'bg-teal-600',
    indigo: 'bg-indigo-600',
    pink: 'bg-pink-600',
  };

  const linkHoverColor: Record<string, string> = {
     red: 'hover:text-red-700',
     blue: 'hover:text-blue-700',
     green: 'hover:text-green-700',
     orange: 'hover:text-orange-700',
     purple: 'hover:text-purple-700',
     teal: 'hover:text-teal-700',
     indigo: 'hover:text-indigo-700',
     pink: 'hover:text-pink-700',
  }

  const borderColor = colorMap[data.color] || 'border-gray-500 bg-gray-50';
  const headerColor = headerColorMap[data.color] || 'bg-gray-700';
  const hoverClass = linkHoverColor[data.color] || 'hover:text-gray-700';

  const handleClick = (e: React.MouseEvent, item: JobLink) => {
      e.preventDefault();
      if (onJobClick) {
          onJobClick(item.id, item.title);
      }
  };

  const handleViewMoreClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (onViewMore) {
          onViewMore(data.title);
      }
  };

  // Show 8 items to match the density of popular job portals
  const displayItems = data.items.slice(0, 8);
  
  // Translate title
  const displayTitle = translateSectionTitle(data.title, language);

  return (
    <div className={`border-t-4 ${borderColor.split(' ')[0]} bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full hover:shadow-xl transition-shadow duration-300`}>
      <div className={`${headerColor} text-white py-2 px-3 font-bold text-center uppercase tracking-wide text-sm flex justify-center items-center`}>
        {displayTitle}
      </div>
      <ul className="flex-1 divide-y divide-gray-100 p-1">
        {displayItems.map((item) => (
          <li key={item.id} className="p-2 transition-colors hover:bg-gray-50">
            <a 
                href={item.link} 
                onClick={(e) => handleClick(e, item)}
                className={`block text-xs md:text-sm font-medium text-gray-700 ${hoverClass} flex items-start group cursor-pointer`}
            >
               <ChevronsRight size={14} className={`mr-1.5 mt-0.5 flex-shrink-0 text-gray-400 group-hover:${hoverClass.replace('text-', 'text-opacity-100 text-')}`} />
               <span className="leading-snug">
                {item.title}
                {item.isNew && (
                  <span className="inline-block ml-2 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded animate-pulse">
                    {t.new}
                  </span>
                )}
               </span>
            </a>
          </li>
        ))}
      </ul>
      <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
        <button 
            onClick={handleViewMoreClick}
            className={`text-xs font-bold text-gray-500 hover:text-gray-800 uppercase flex justify-center items-center w-full focus:outline-none`}
        >
           {t.viewMore} <ExternalLink size={10} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

export default CategoryBox;