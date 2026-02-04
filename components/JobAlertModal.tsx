import React, { useState } from 'react';
import { X, Bell, CheckCircle, Mail, Loader2 } from 'lucide-react';
import { jobService } from '../services/jobService';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const JobAlertModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    qualification: '10th Pass',
    location: 'All India',
    interests: [] as string[]
  });

  if (!isOpen) return null;

  const handleInterestChange = (tag: string) => {
    setFormData(prev => {
      if (prev.interests.includes(tag)) {
        return { ...prev, interests: prev.interests.filter(t => t !== tag) };
      } else {
        return { ...prev, interests: [...prev.interests, tag] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Use the service to simulate a real backend call
      await jobService.subscribeUser(formData);
      setSubmitted(true);
      
      // Auto close after showing success
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFormData({ name: '', email: '', qualification: '10th Pass', location: 'All India', interests: [] });
      }, 3000);
    } catch (error) {
      console.error("Subscription failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-red-800 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="animate-pulse" />
            <h3 className="text-xl font-bold">{t.alertTitle}</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">
                {t.alertDesc}
              </p>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t.fullName}</label>
                <input 
                    required 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition" 
                    placeholder={t.enterName}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t.emailAddress}</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    required 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition" 
                    placeholder="you@example.com" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t.qualification}</label>
                  <select 
                    value={formData.qualification}
                    onChange={e => setFormData({...formData, qualification: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                  >
                    <option>10th Pass</option>
                    <option>12th Pass</option>
                    <option>Graduate</option>
                    <option>Post Graduate</option>
                    <option>ITI / Diploma</option>
                  </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t.location}</label>
                    <select 
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                    >
                        <option>All India</option>
                        <option>Uttar Pradesh</option>
                        <option>Bihar</option>
                        <option>Delhi</option>
                        <option>Rajasthan</option>
                        <option>Madhya Pradesh</option>
                    </select>
                </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t.interests}</label>
                 <div className="flex flex-wrap gap-2">
                    {['SSC', 'Railway', 'Banking', 'Police', 'Teaching', 'Defence'].map(tag => (
                        <label key={tag} className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-gray-200">
                            <input 
                                type="checkbox" 
                                className="accent-red-600 rounded" 
                                checked={formData.interests.includes(tag)}
                                onChange={() => handleInterestChange(tag)}
                            />
                            <span>{tag}</span>
                        </label>
                    ))}
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg transform hover:-translate-y-0.5 transition-all mt-2 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : t.subscribeNow}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
               <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                 <CheckCircle size={32} className="text-green-600" />
               </div>
               <h3 className="text-xl font-bold text-gray-800 mb-2">{t.subscribed}</h3>
               <p className="text-gray-600 text-sm">
                 {t.subscribedDesc}
               </p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default JobAlertModal;
