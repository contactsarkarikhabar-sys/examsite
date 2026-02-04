
import React, { useEffect } from 'react';
import { Mail, Shield, FileText, Info, AlertTriangle, Phone, MapPin } from 'lucide-react';
import { ViewType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

interface Props {
  type: ViewType;
}

const StaticContent: React.FC<Props> = ({ type }) => {
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  const renderContent = () => {
    switch (type) {
      case 'contact':
        return (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-red-800 text-white p-8 text-center">
              <Mail size={48} className="mx-auto mb-4 opacity-90" />
              <h1 className="text-3xl font-bold">{t.contactUs}</h1>
              <p className="opacity-90 mt-2">{language === 'hi' ? 'हम आपकी मदद के लिए यहाँ हैं' : 'We are here to help you'}</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-2">
                    {language === 'hi' ? 'संपर्क जानकारी' : 'Contact Information'}
                  </h3>
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <Mail className="text-red-600 mt-1" />
                    <div>
                      <p className="font-bold text-gray-700">Email Address</p>
                      <a href="mailto:contact.examsite@gmail.com" className="text-red-600 hover:underline">
                        contact.examsite@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <MapPin className="text-red-600 mt-1" />
                    <div>
                      <p className="font-bold text-gray-700">{language === 'hi' ? 'पता' : 'Address'}</p>
                      <p className="text-gray-600">New Delhi, India</p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm italic mt-4">
                    {language === 'hi' 
                     ? 'हम आमतौर पर 24-48 घंटों के भीतर जवाब देते हैं।' 
                     : 'We usually respond within 24-48 hours.'}
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {language === 'hi' ? 'हमें संदेश भेजें' : 'Send us a Message'}
                  </h3>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'hi' ? 'नाम' : 'Name'}</label>
                      <input type="text" className="w-full border border-gray-300 rounded-md p-2 focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'hi' ? 'ईमेल' : 'Email'}</label>
                      <input type="email" className="w-full border border-gray-300 rounded-md p-2 focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'hi' ? 'संदेश' : 'Message'}</label>
                      <textarea rows={4} className="w-full border border-gray-300 rounded-md p-2 focus:ring-red-500 focus:border-red-500"></textarea>
                    </div>
                    <button className="w-full bg-red-700 text-white font-bold py-2 rounded-md hover:bg-red-800 transition">
                      {language === 'hi' ? 'संदेश भेजें' : 'Send Message'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
             <div className="bg-gray-800 text-white p-6 flex items-center">
                <Shield size={32} className="mr-3 text-green-400" />
                <h1 className="text-2xl font-bold">{t.privacyPolicy}</h1>
             </div>
             <div className="p-8 prose prose-red max-w-none">
                <p className="text-gray-600 mb-4">Last Updated: February 2026</p>
                
                <h3>1. Introduction</h3>
                <p>At ExamSite.in, accessible from https://examsite.in, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by ExamSite.in and how we use it.</p>
                
                <h3>2. Information We Collect</h3>
                <p>We may collect personal identification information from Users in a variety of ways, including, but not limited to, when Users visit our site, subscribe to the newsletter, and in connection with other activities, services, features or resources we make available on our Site.</p>
                
                <h3>3. How We Use Your Information</h3>
                <p>We use the information we collect in various ways, including to:</p>
                <ul>
                    <li>Provide, operate, and maintain our website</li>
                    <li>Improve, personalize, and expand our website</li>
                    <li>Understand and analyze how you use our website</li>
                    <li>Send you emails regarding job updates (if subscribed)</li>
                </ul>

                <h3>4. Cookies and Web Beacons</h3>
                <p>Like any other website, ExamSite.in uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited.</p>

                <h3>5. Contact Us</h3>
                <p>If you have any questions about this Privacy Policy, You can contact us: <strong>contact.examsite@gmail.com</strong></p>
             </div>
          </div>
        );

      case 'terms':
        return (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
             <div className="bg-gray-800 text-white p-6 flex items-center">
                <FileText size={32} className="mr-3 text-blue-400" />
                <h1 className="text-2xl font-bold">{t.terms}</h1>
             </div>
             <div className="p-8 prose prose-red max-w-none">
                <h3>1. Terms</h3>
                <p>By accessing this Website, accessible from ExamSite.in, you are agreeing to be bound by these Website Terms and Conditions of Use and agree that you are responsible for the agreement with any applicable local laws.</p>
                
                <h3>2. Use License</h3>
                <p>Permission is granted to temporarily download one copy of the materials on ExamSite.in's Website for personal, non-commercial transitory viewing only.</p>
                
                <h3>3. Disclaimer</h3>
                <p>All the materials on ExamSite.in’s Website are provided "as is". ExamSite.in makes no warranties, may it be expressed or implied, therefore negates all other warranties.</p>
                
                <h3>4. Limitations</h3>
                <p>ExamSite.in or its suppliers will not be hold accountable for any damages that will arise with the use or inability to use the materials on ExamSite.in’s Website.</p>
             </div>
          </div>
        );

      case 'disclaimer':
        return (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
             <div className="bg-gray-800 text-white p-6 flex items-center">
                <AlertTriangle size={32} className="mr-3 text-yellow-400" />
                <h1 className="text-2xl font-bold">{t.disclaimer}</h1>
             </div>
             <div className="p-8 prose prose-red max-w-none">
                <p className="font-bold text-red-600">Please Read Carefully:</p>
                <p>The information provided on ExamSite.in is for general informational purposes only. All information on the Site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability or completeness of any information on the Site.</p>
                
                <h3>Not a Government Website</h3>
                <p>ExamSite.in is <strong>NOT</strong> an official website of the Government of India or any State Government. We are an information aggregator service. We collect information from various official notification sources and present it in a simplified format.</p>
                
                <h3>Verification Recommended</h3>
                <p>Candidates are strictly advised to check the official website of the respective organization/board before applying for any job or trusting any date/result. Links to official websites are provided on every job page.</p>
             </div>
          </div>
        );

      case 'about':
        return (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
             <div className="bg-red-800 text-white p-6 flex items-center">
                <Info size={32} className="mr-3 text-white" />
                <h1 className="text-2xl font-bold">{t.aboutUs}</h1>
             </div>
             <div className="p-8 prose prose-red max-w-none">
                <h3>Who We Are</h3>
                <p>ExamSite.in is India's most trusted education and employment portal. Founded with the mission to make government job information accessible to every student in India, especially those in rural areas.</p>
                
                <h3>What We Do</h3>
                <p>We provide real-time updates for:</p>
                <ul>
                    <li>Sarkari Naukri (Government Jobs)</li>
                    <li>Admit Cards</li>
                    <li>Results</li>
                    <li>Answer Keys</li>
                    <li>Syllabus</li>
                    <li>Admission Forms</li>
                </ul>

                <h3>Our Vision</h3>
                <p>To be the one-stop solution for every student's career journey, providing accurate, timely, and free information.</p>
             </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      {renderContent()}
    </div>
  );
};

export default StaticContent;
