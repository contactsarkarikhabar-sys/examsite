import React, { useState } from 'react';
import { Menu, X, Search, Home, Facebook, Instagram, Youtube, Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { ViewType } from '../types';

interface HeaderProps {
  onSearch: (query: string) => void;
  onNavigate: (view: ViewType) => void;
  onCategoryClick: (category: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onNavigate, onCategoryClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  const handleNavClick = (e: React.MouseEvent, view: ViewType) => {
    e.preventDefault();
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const handleCategoryClick = (e: React.MouseEvent, category: string) => {
    e.preventDefault();
    onCategoryClick(category);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg sticky top-0 z-40">
      {/* Top Bar - Socials & App Link */}
      <div className="bg-red-950 text-xs py-1 px-4 hidden md:flex justify-between items-center">
        <div className="flex space-x-4">
          <a href="#" onClick={(e) => handleNavClick(e, 'contact')} className="hover:text-yellow-400 transition">{t.contactUs}</a>
          <a href="#" onClick={(e) => handleNavClick(e, 'about')} className="hover:text-yellow-400 transition">{t.aboutUs}</a>
          <a href="#" onClick={(e) => handleNavClick(e, 'privacy')} className="hover:text-yellow-400 transition">{t.privacyPolicy}</a>
        </div>
        <div className="flex space-x-3 items-center">
          <span>{t.followUs}</span>
          <Facebook size={14} className="cursor-pointer hover:text-blue-400" />
          <X size={14} className="cursor-pointer hover:text-gray-400" />
          <Instagram size={14} className="cursor-pointer hover:text-pink-400" />
          <Youtube size={14} className="cursor-pointer hover:text-red-500" />
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex flex-col">
          <a href="/" onClick={(e) => handleNavClick(e, 'home')} className="flex flex-col group">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight group-hover:opacity-90 transition-opacity">
              Exam<span className="text-yellow-400">Site</span>
            </h1>
            <span className="text-[10px] md:text-xs text-red-200 font-medium tracking-wider uppercase">
              examsite.in • Your Success Partner
            </span>
          </a>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex space-x-6 text-sm font-semibold items-center">
          <a href="#" onClick={(e) => handleNavClick(e, 'home')} className="flex items-center space-x-1 hover:text-yellow-300 transition"><Home size={16} /><span>{t.home}</span></a>
          <a href="#" onClick={(e) => handleCategoryClick(e, 'Top Online Form')} className="hover:text-yellow-300 transition">{t.latestJobs}</a>
          <a href="#" onClick={(e) => handleCategoryClick(e, 'Results')} className="hover:text-yellow-300 transition">{t.results}</a>
          <a href="#" onClick={(e) => handleCategoryClick(e, 'Admit Card')} className="hover:text-yellow-300 transition">{t.admitCard}</a>
          <a href="#" onClick={(e) => handleCategoryClick(e, 'Answer Key')} className="hover:text-yellow-300 transition">{t.answerKey}</a>
          <a href="#" onClick={(e) => handleCategoryClick(e, 'Syllabus')} className="hover:text-yellow-300 transition">{t.syllabus}</a>
        </nav>

        {/* Controls (Search & Language) */}
        <div className="flex items-center space-x-3">
             {/* Desktop Search Placeholder */}
            <div className="hidden lg:block relative w-64">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={t.searchPlaceholder} 
                    className="w-full pl-8 pr-4 py-1.5 rounded-full bg-red-800 text-white placeholder-red-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 border border-red-600 transition-all"
                />
                <Search size={14} className="absolute left-2.5 top-2 text-red-300" />
            </div>

            {/* Language Toggle */}
            <button 
                onClick={toggleLanguage}
                className="flex items-center space-x-1 bg-red-950/50 hover:bg-red-950 px-3 py-1.5 rounded-full border border-red-600 transition-colors"
                title="Change Language"
            >
                <Languages size={16} className="text-yellow-400" />
                <span className="text-xs font-bold">{language === 'en' ? 'HI' : 'EN'}</span>
            </button>

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden bg-red-800 border-t border-red-700">
          <div className="p-4 pb-0">
             <div className="relative">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder={t.searchPlaceholder} 
                  className="w-full pl-8 pr-4 py-2 rounded-lg bg-red-900 text-white placeholder-red-400 text-sm focus:outline-none border border-red-600"
                />
                <Search size={16} className="absolute left-2.5 top-2.5 text-red-400" />
             </div>
          </div>
          <nav className="flex flex-col p-4 space-y-3 font-medium">
            <a href="#" onClick={(e) => handleNavClick(e, 'home')} className="block hover:text-yellow-300">{t.home}</a>
            <a href="#" onClick={(e) => handleCategoryClick(e, 'Top Online Form')} className="block hover:text-yellow-300">{t.latestJobs}</a>
            <a href="#" onClick={(e) => handleCategoryClick(e, 'Results')} className="block hover:text-yellow-300">{t.results}</a>
            <a href="#" onClick={(e) => handleCategoryClick(e, 'Admit Card')} className="block hover:text-yellow-300">{t.admitCard}</a>
            <a href="#" onClick={(e) => handleCategoryClick(e, 'Answer Key')} className="block hover:text-yellow-300">{t.answerKey}</a>
            <a href="#" onClick={(e) => handleCategoryClick(e, 'Syllabus')} className="block hover:text-yellow-300">{t.syllabus}</a>
            <a href="#" onClick={(e) => handleCategoryClick(e, 'Admission')} className="block hover:text-yellow-300">{t.admission}</a>
            <div className="border-t border-red-700 my-2 pt-2">
                <a href="#" onClick={(e) => handleNavClick(e, 'contact')} className="block hover:text-yellow-300 text-xs text-red-200 py-1">{t.contactUs}</a>
                <a href="#" onClick={(e) => handleNavClick(e, 'about')} className="block hover:text-yellow-300 text-xs text-red-200 py-1">{t.aboutUs}</a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;