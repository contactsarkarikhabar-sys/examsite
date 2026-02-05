
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Shield, FileText, Info, AlertTriangle, MapPin, ArrowLeft, Send } from 'lucide-react';
import { ViewType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

interface Props {
  type: ViewType;
}

const StaticContent: React.FC<Props> = ({ type }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  // Back Button Component
  const BackButton = () => (
    <button
      onClick={() => navigate('/')}
      className="flex items-center text-gray-600 hover:text-red-600 transition mb-6 group"
    >
      <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
      <span className="font-medium">{language === 'hi' ? 'होम पेज पर वापस जाएं' : 'Back to Home'}</span>
    </button>
  );

  // Section Header Component
  const SectionHeader = ({ icon: Icon, title, bgColor, iconColor }: { icon: any; title: string; bgColor: string; iconColor: string }) => (
    <div className={`${bgColor} text-white p-8 text-center`}>
      <Icon size={48} className={`mx-auto mb-4 ${iconColor}`} />
      <h1 className="text-3xl font-bold">{title}</h1>
    </div>
  );

  // Content Section Component
  const ContentSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-4 mb-4">{title}</h2>
      <div className="text-gray-600 leading-relaxed pl-4">{children}</div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'contact':
        return (
          <div className="max-w-4xl mx-auto">
            <BackButton />
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <SectionHeader icon={Mail} title={t.contactUs} bgColor="bg-red-700" iconColor="text-white" />
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Contact Info */}
                  <div>
                    <ContentSection title={language === 'hi' ? '📧 संपर्क जानकारी' : '📧 Contact Information'}>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border">
                          <Mail className="text-red-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-gray-800">Email</p>
                            <a href="mailto:contact.examsite@gmail.com" className="text-red-600 hover:underline">
                              contact.examsite@gmail.com
                            </a>
                          </div>
                        </div>
                        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border">
                          <MapPin className="text-red-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-gray-800">{language === 'hi' ? 'पता' : 'Address'}</p>
                            <p className="text-gray-600">New Delhi, India</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm italic mt-4">
                        {language === 'hi'
                          ? '✅ हम 24-48 घंटों के भीतर जवाब देते हैं।'
                          : '✅ We respond within 24-48 hours.'}
                      </p>
                    </ContentSection>
                  </div>

                  {/* Contact Form */}
                  <div>
                    <ContentSection title={language === 'hi' ? '✉️ संदेश भेजें' : '✉️ Send Message'}>
                      <form className="space-y-4" onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                        const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;

                        if (!name || !email || !message) {
                          alert(language === 'hi' ? 'कृपया सभी फ़ील्ड भरें' : 'Please fill all fields');
                          return;
                        }

                        const subject = encodeURIComponent(`Contact from ${name} - ExamSite.in`);
                        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
                        window.location.href = `mailto:contact.examsite@gmail.com?subject=${subject}&body=${body}`;

                        alert(language === 'hi' ? '✅ आपका ईमेल ऐप खुलेगा। कृपया वहां से संदेश भेजें।' : '✅ Your email app will open. Please send the message from there.');
                      }}>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'hi' ? 'आपका नाम' : 'Your Name'}
                          </label>
                          <input name="name" type="text" required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder={language === 'hi' ? 'नाम दर्ज करें' : 'Enter your name'} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'hi' ? 'ईमेल' : 'Email'}
                          </label>
                          <input name="email" type="email" required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder={language === 'hi' ? 'ईमेल दर्ज करें' : 'Enter your email'} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'hi' ? 'संदेश' : 'Message'}
                          </label>
                          <textarea name="message" rows={4} required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder={language === 'hi' ? 'अपना संदेश लिखें...' : 'Write your message...'}></textarea>
                        </div>
                        <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition flex items-center justify-center">
                          <Send size={18} className="mr-2" />
                          {language === 'hi' ? 'संदेश भेजें' : 'Send Message'}
                        </button>
                      </form>
                    </ContentSection>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="max-w-4xl mx-auto">
            <BackButton />
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <SectionHeader icon={Shield} title={t.privacyPolicy} bgColor="bg-green-700" iconColor="text-white" />
              <div className="p-8">
                <p className="text-gray-500 text-sm mb-6">📅 Last Updated: February 2026</p>

                <ContentSection title="1️⃣ Introduction">
                  <p>At ExamSite.in, your privacy is our priority. This Privacy Policy explains how we collect, use, and protect your personal information when you visit our website.</p>
                </ContentSection>

                <ContentSection title="2️⃣ Information We Collect">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Email address (when you subscribe to job alerts)</li>
                    <li>Name and location (for personalized notifications)</li>
                    <li>Browser information and IP address (for analytics)</li>
                  </ul>
                </ContentSection>

                <ContentSection title="3️⃣ How We Use Your Information">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Send job alerts and notifications</li>
                    <li>Improve website experience</li>
                    <li>Analyze website traffic</li>
                    <li>Prevent spam and abuse</li>
                  </ul>
                </ContentSection>

                <ContentSection title="4️⃣ Data Protection">
                  <p>We use industry-standard security measures including encryption, secure servers, and regular security audits to protect your data.</p>
                </ContentSection>

                <ContentSection title="5️⃣ Contact Us">
                  <p>For privacy-related questions, email us at: <strong className="text-red-600">contact.examsite@gmail.com</strong></p>
                </ContentSection>
              </div>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="max-w-4xl mx-auto">
            <BackButton />
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <SectionHeader icon={FileText} title={t.terms} bgColor="bg-blue-700" iconColor="text-white" />
              <div className="p-8">
                <ContentSection title="1️⃣ Acceptance of Terms">
                  <p>By accessing ExamSite.in, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our website.</p>
                </ContentSection>

                <ContentSection title="2️⃣ Use of Website">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Content is for personal, non-commercial use only</li>
                    <li>Do not copy or redistribute our content without permission</li>
                    <li>Do not attempt to hack or disrupt our services</li>
                  </ul>
                </ContentSection>

                <ContentSection title="3️⃣ Information Accuracy">
                  <p>While we strive for accuracy, job information may change. Always verify details from official government websites before applying.</p>
                </ContentSection>

                <ContentSection title="4️⃣ Limitation of Liability">
                  <p>ExamSite.in is not responsible for any damages arising from the use of our website. Use the information at your own discretion.</p>
                </ContentSection>

                <ContentSection title="5️⃣ Changes to Terms">
                  <p>We may update these terms at any time. Continued use of the website constitutes acceptance of the updated terms.</p>
                </ContentSection>
              </div>
            </div>
          </div>
        );

      case 'disclaimer':
        return (
          <div className="max-w-4xl mx-auto">
            <BackButton />
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <SectionHeader icon={AlertTriangle} title={t.disclaimer} bgColor="bg-yellow-600" iconColor="text-white" />
              <div className="p-8">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <p className="font-bold text-red-700">⚠️ {language === 'hi' ? 'कृपया ध्यान से पढ़ें' : 'Please Read Carefully'}</p>
                </div>

                <ContentSection title="🏛️ Not a Government Website">
                  <p className="font-medium">ExamSite.in is <span className="text-red-600 font-bold">NOT</span> an official government website.</p>
                  <p className="mt-2">We are an information aggregator that collects job notifications from various official sources and presents them in a simplified, user-friendly format.</p>
                </ContentSection>

                <ContentSection title="✅ Verification Required">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="font-medium">Before applying for any job, please:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Visit the official organization/board website</li>
                      <li>Verify all dates, eligibility, and fees</li>
                      <li>Use only official links for application</li>
                    </ul>
                  </div>
                </ContentSection>

                <ContentSection title="📋 Information Accuracy">
                  <p>We provide information in good faith, but we cannot guarantee 100% accuracy. Job details, dates, and eligibility criteria are subject to change by the respective authorities.</p>
                </ContentSection>

                <ContentSection title="🔗 External Links">
                  <p>Our website contains links to official government websites. We are not responsible for the content or availability of these external sites.</p>
                </ContentSection>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="max-w-4xl mx-auto">
            <BackButton />
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <SectionHeader icon={Info} title={t.aboutUs} bgColor="bg-red-700" iconColor="text-white" />
              <div className="p-8">
                <ContentSection title="🏆 Who We Are">
                  <p><strong>ExamSite.in</strong> is India's most trusted education and employment portal. Founded with the mission to make government job information accessible to every student in India, especially those in rural areas.</p>
                </ContentSection>

                <ContentSection title="📋 What We Provide">
                  <div className="grid grid-cols-2 gap-3">
                    {['Sarkari Naukri (Govt Jobs)', 'Admit Cards', 'Exam Results', 'Answer Keys', 'Syllabus & Pattern', 'Admission Forms'].map((item) => (
                      <div key={item} className="flex items-center bg-gray-50 p-3 rounded-lg border">
                        <span className="text-green-600 mr-2">✓</span>
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </ContentSection>

                <ContentSection title="🎯 Our Mission">
                  <p>To be the one-stop solution for every student's career journey, providing <strong>accurate</strong>, <strong>timely</strong>, and <strong>free</strong> information about government jobs and exams.</p>
                </ContentSection>

                <ContentSection title="💡 Why Choose Us">
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Fast Updates:</strong> Get notifications as soon as they're released</li>
                    <li><strong>Simplified Format:</strong> Complex notifications made easy to understand</li>
                    <li><strong>Free Alerts:</strong> Email notifications at no cost</li>
                    <li><strong>Bilingual Support:</strong> Available in Hindi and English</li>
                  </ul>
                </ContentSection>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {renderContent()}
    </div>
  );
};

export default StaticContent;
