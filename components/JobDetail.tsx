import React, { useEffect } from 'react';
import { ArrowLeft, ExternalLink, Calendar, CreditCard, User, AlertCircle, Download, Globe, CheckCircle, Youtube, Clock, MapPin, BookOpen, GraduationCap, PlayCircle } from 'lucide-react';
import { JobDetailData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

interface Props {
  job: JobDetailData;
  onBack: () => void;
}

const JobDetail: React.FC<Props> = ({ job, onBack }) => {
  const { language } = useLanguage();
  const t = translations[language];
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [job]);

  // Generate a smart YouTube search query based on the job title
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(job.title + " online apply form fill up process 2025")}`;

  return (
    <div className="bg-gray-50 min-h-screen animate-fade-in relative">
      
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-6 md:p-10 shadow-lg relative overflow-hidden rounded-b-3xl">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
            <BookOpen size={200} />
        </div>
        
        <div className="container mx-auto relative z-10">
            <div className="flex justify-between items-start mb-6">
                <button 
                onClick={onBack}
                className="flex items-center text-red-100 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-all w-fit"
                >
                <ArrowLeft size={18} className="mr-2" /> {t.backToJobs}
                </button>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-extrabold mb-3 leading-tight tracking-tight shadow-black drop-shadow-md">
                {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-red-100 font-medium">
                <span className="flex items-center bg-red-950/30 px-3 py-1 rounded-lg backdrop-blur-sm border border-red-700/50">
                    <Calendar size={16} className="mr-2 text-yellow-400" /> 
                    {t.postDate} <span className="text-white ml-1">{job.postDate}</span>
                </span>
                <span className="flex items-center bg-red-950/30 px-3 py-1 rounded-lg backdrop-blur-sm border border-red-700/50">
                    <Globe size={16} className="mr-2 text-blue-300" /> 
                    {t.source}
                </span>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-6">
        
        {job.shortInfo && job.shortInfo.trim().length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 transform transition-all hover:shadow-xl relative z-20">
              <h2 className="text-lg font-bold text-red-800 mb-2 flex items-center">
                  <AlertCircle className="mr-2" /> {t.shortInfo}
              </h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed text-justify">
                  {job.shortInfo}
              </p>
          </div>
        )}

        {/* Video Section - Improved Logic */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8 hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gray-900 text-white py-3 px-5 font-bold flex items-center border-b border-gray-800">
                <Youtube size={20} className="mr-2 text-red-500" /> 
                {t.videoGuide}
            </div>
            
            {/* If a direct video link is provided and it's a valid embed link */}
            {job.videoLink && job.videoLink.includes('embed') ? (
                <div className="aspect-w-16 aspect-h-9 bg-black">
                     <iframe 
                        className="w-full h-[250px] md:h-[450px]"
                        src={job.videoLink} 
                        title="YouTube video player" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                     ></iframe>
                </div>
            ) : (
                /* Fallback / Default: Search Button for Latest Videos */
                <div className="p-8 text-center bg-gray-50 flex flex-col items-center justify-center">
                    <Youtube size={48} className="text-red-600 mb-3" />
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{t.watchVideo}</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-md">
                        {t.watchVideoDesc}
                    </p>
                    <a 
                        href={youtubeSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                    >
                        <PlayCircle size={20} className="mr-2" />
                        {t.searchYoutube}
                    </a>
                </div>
            )}
            
            {/* If we have a direct video, still show the search button below as an option */}
            {job.videoLink && (
                <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
                    <a href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline flex justify-center items-center">
                        {t.notWorking} <ExternalLink size={10} className="ml-1" />
                    </a>
                </div>
            )}
        </div>

        {/* Dynamic Grid for Important Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            {job.importantDates && job.importantDates.length > 0 && job.importantDates[0].trim().length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-0 overflow-hidden hover:scale-[1.02] transition-transform duration-300 border-t-4 border-green-600 group">
                  <div className="bg-green-50 p-4 border-b border-green-100 flex justify-between items-center group-hover:bg-green-100 transition-colors">
                      <h3 className="font-bold text-green-800 flex items-center text-lg">
                          <Calendar className="mr-2" size={20} /> {t.importantDates}
                      </h3>
                  </div>
                  <div className="p-5">
                      <ul className="space-y-3">
                          {job.importantDates.map((date, idx) => (
                              <li key={idx} className="flex items-start text-sm text-gray-700">
                                  <Clock size={16} className="mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="font-medium">{date}</span>
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>
            )}

            {job.applicationFee && job.applicationFee.length > 0 && job.applicationFee[0].trim().length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-0 overflow-hidden hover:scale-[1.02] transition-transform duration-300 border-t-4 border-blue-600 group">
                  <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center group-hover:bg-blue-100 transition-colors">
                      <h3 className="font-bold text-blue-800 flex items-center text-lg">
                          <CreditCard className="mr-2" size={20} /> {t.applicationFee}
                      </h3>
                  </div>
                  <div className="p-5">
                      <ul className="space-y-3">
                          {job.applicationFee.map((fee, idx) => (
                              <li key={idx} className="flex items-start text-sm text-gray-700">
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2.5 mt-1.5 flex-shrink-0"></span>
                                  <span className="font-medium">{fee}</span>
                              </li>
                          ))}
                      </ul>
                      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 italic">
                          {t.paymentMode}
                      </div>
                  </div>
              </div>
            )}

            {job.ageLimit && job.ageLimit.length > 0 && job.ageLimit[0].trim().length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-0 overflow-hidden hover:scale-[1.02] transition-transform duration-300 border-t-4 border-purple-600 group md:col-span-2 lg:col-span-1">
                  <div className="bg-purple-50 p-4 border-b border-purple-100 flex justify-between items-center group-hover:bg-purple-100 transition-colors">
                      <h3 className="font-bold text-purple-800 flex items-center text-lg">
                          <User className="mr-2" size={20} /> {t.ageLimit}
                      </h3>
                  </div>
                  <div className="p-5">
                      <ul className="space-y-3">
                          {job.ageLimit.map((age, idx) => (
                              <li key={idx} className="flex items-start text-sm text-gray-700">
                                  <CheckCircle size={16} className="mr-2 text-purple-600 mt-0.5 flex-shrink-0" />
                                  <span className="font-medium">{age}</span>
                              </li>
                          ))}
                      </ul>
                      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                          {t.ageRelaxation}
                      </div>
                  </div>
              </div>
            )}
        </div>

        {job.vacancyDetails && job.vacancyDetails.length > 0 && String(job.vacancyDetails[0]?.postName || '').trim().length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center">
                      <GraduationCap className="text-yellow-400 mr-2" /> {t.vacancyDetails}
                  </h3>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 text-gray-700 uppercase tracking-wider text-xs">
                          <tr>
                              <th className="px-6 py-4 font-bold border-b">{t.postName}</th>
                              <th className="px-6 py-4 font-bold border-b">{t.totalPost}</th>
                              <th className="px-6 py-4 font-bold border-b">{t.eligibilityCriteria}</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {job.vacancyDetails.map((row, idx) => (
                              <tr key={idx} className="hover:bg-red-50/50 transition-colors">
                                  <td className="px-6 py-4 font-bold text-red-700 whitespace-nowrap">{String(row?.postName || '')}</td>
                                  <td className="px-6 py-4 font-bold text-gray-800">{String(row?.totalPost || '')}</td>
                                  <td className="px-6 py-4 text-gray-600 leading-relaxed min-w-[300px]">{String(row?.eligibility || '')}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
        )}

        {/* How to Fill Form (Static Text for SEO/Help) */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8 hover:shadow-lg transition-all">
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">{t.howToFill}</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                {t.howToFillList.map((item, idx) => (
                    <li key={idx}>{item}</li>
                ))}
            </ul>
        </div>

        {job.importantLinks && job.importantLinks.length > 0 && String(job.importantLinks[0]?.url || '').trim().length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-red-50 p-4 border-b border-red-100">
                  <h3 className="text-xl font-bold text-red-800 flex items-center">
                      <ExternalLink className="mr-2" /> {t.importantLinks}
                  </h3>
              </div>
              <div className="divide-y divide-gray-100">
                  {job.importantLinks.map((link, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                          <div className="flex items-center mb-3 md:mb-0">
                               <div className="w-2 h-2 bg-red-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></div>
                               <span className="font-bold text-gray-700 group-hover:text-red-700 transition-colors">
                                  {link.label}
                               </span>
                          </div>
                          <a 
                              href={String(link?.url || '')} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all w-full md:w-auto"
                          >
                              {String(link?.label || '').toLowerCase().includes("download") ? <Download size={16} className="mr-2" /> : 
                               String(link?.label || '').toLowerCase().includes("official") ? <Globe size={16} className="mr-2" /> : 
                               <ExternalLink size={16} className="mr-2" />}
                              {t.clickHere}
                          </a>
                      </div>
                  ))}
              </div>
          </div>
        )}

      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default JobDetail;
