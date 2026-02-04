
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { ViewType } from '../types';

interface FooterProps {
  onNavigate: (view: ViewType) => void;
  onCategoryClick: (category: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate, onCategoryClick }) => {
  const { language } = useLanguage();
  const t = translations[language];

  const handleNavClick = (e: React.MouseEvent, view: ViewType) => {
    e.preventDefault();
    onNavigate(view);
  };

  const handleCategoryClick = (e: React.MouseEvent, category: string) => {
    e.preventDefault();
    onCategoryClick(category);
    window.scrollTo(0, 0);
  };

  const handleDummyClick = (e: React.MouseEvent) => {
      e.preventDefault();
  }

  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-12 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-white text-lg font-bold mb-4">{t.aboutTitle}</h4>
            <p className="text-sm text-gray-400">
              {t.aboutText}
            </p>
          </div>
          <div>
            <h4 className="text-white text-lg font-bold mb-4">{t.quickLinks}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" onClick={(e) => handleNavClick(e, 'home')} className="hover:text-yellow-400 transition">{t.home}</a></li>
              <li><a href="#" onClick={(e) => handleCategoryClick(e, 'Top Online Form')} className="hover:text-yellow-400 transition">{t.latestJobs}</a></li>
              <li><a href="#" onClick={(e) => handleCategoryClick(e, 'Results')} className="hover:text-yellow-400 transition">{t.results}</a></li>
              <li><a href="#" onClick={(e) => handleNavClick(e, 'contact')} className="hover:text-yellow-400 transition">{t.contactUs}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-lg font-bold mb-4">{t.apps}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" onClick={handleDummyClick} className="hover:text-yellow-400 transition cursor-default opacity-80">{t.androidApp}</a></li>
              <li><a href="#" onClick={handleDummyClick} className="hover:text-yellow-400 transition cursor-default opacity-80">{t.iosApp}</a></li>
              <li><a href="#" onClick={handleDummyClick} className="hover:text-yellow-400 transition cursor-default opacity-80">{t.telegramChannel}</a></li>
              <li><a href="#" onClick={handleDummyClick} className="hover:text-yellow-400 transition cursor-default opacity-80">{t.youtubeChannel}</a></li>
            </ul>
          </div>
          <div>
             <h4 className="text-white text-lg font-bold mb-4">{t.legal}</h4>
             <ul className="space-y-2 text-sm">
               <li><a href="#" onClick={(e) => handleNavClick(e, 'privacy')} className="hover:text-yellow-400 transition">{t.privacyPolicy}</a></li>
               <li><a href="#" onClick={(e) => handleNavClick(e, 'disclaimer')} className="hover:text-yellow-400 transition">{t.disclaimer}</a></li>
               <li><a href="#" onClick={(e) => handleNavClick(e, 'terms')} className="hover:text-yellow-400 transition">{t.terms}</a></li>
             </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
           <p>&copy; {new Date().getFullYear()} ExamSite.in. {t.rightsReserved}</p>
           <p className="mt-1">{t.demoDisclaimer}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
