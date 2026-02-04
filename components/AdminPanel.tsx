import React, { useState, useEffect } from 'react';
import { X, Send, Users, Bell, Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { jobService } from '../services/jobService';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const AdminPanel: React.FC<Props> = ({ isOpen, onClose }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Stats
    const [stats, setStats] = useState({ total: 0, verified: 0 });

    // Job Form
    const [jobForm, setJobForm] = useState({
        title: '',
        category: 'SSC',
        shortInfo: '',
        importantDates: '',
        applyLink: ''
    });

    const { language } = useLanguage();

    useEffect(() => {
        if (isAuthenticated && isOpen) {
            loadStats();
        }
    }, [isAuthenticated, isOpen]);

    const loadStats = async () => {
        const data = await jobService.getSubscribersCount(password);
        setStats({ total: data.total, verified: data.verified });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length > 0) {
            setIsLoading(true);
            // Try to fetch stats to verify password
            const data = await jobService.getSubscribersCount(password);
            setIsLoading(false);

            if (data.total >= 0) {
                setIsAuthenticated(true);
                setStats({ total: data.total, verified: data.verified });
            } else {
                setMessage({ type: 'error', text: 'Invalid password' });
            }
        }
    };

    const handlePostJob = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!jobForm.title || !jobForm.shortInfo) {
            setMessage({ type: 'error', text: 'Title and Short Info are required' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        const result = await jobService.postNewJob(jobForm, password);

        setIsLoading(false);

        if (result.success) {
            setMessage({
                type: 'success',
                text: `✅ Job posted! ${result.notificationsSent || 0} emails sent.`
            });
            // Reset form
            setJobForm({
                title: '',
                category: 'SSC',
                shortInfo: '',
                importantDates: '',
                applyLink: ''
            });
            loadStats();
        } else {
            setMessage({ type: 'error', text: result.message });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-5 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Lock size={20} />
                        <h3 className="text-xl font-bold">Admin Panel</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">

                    {/* Login Form */}
                    {!isAuthenticated ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <p className="text-gray-600 text-sm mb-4">
                                Enter admin password to access the panel.
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-gray-500 outline-none"
                                    placeholder="Enter admin password"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-lg flex justify-center items-center"
                            >
                                {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Login'}
                            </button>
                        </form>
                    ) : (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <Users size={28} className="mx-auto text-blue-600 mb-2" />
                                    <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                                    <p className="text-xs text-blue-600 uppercase">Total Subscribers</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <CheckCircle size={28} className="mx-auto text-green-600 mb-2" />
                                    <p className="text-2xl font-bold text-green-700">{stats.verified}</p>
                                    <p className="text-xs text-green-600 uppercase">Verified</p>
                                </div>
                            </div>

                            {/* Message */}
                            {message && (
                                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                    <span className="text-sm">{message.text}</span>
                                </div>
                            )}

                            {/* Post New Job Form */}
                            <div className="bg-gray-50 rounded-xl p-5">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Bell size={18} />
                                    Post New Job & Notify Subscribers
                                </h4>

                                <form onSubmit={handlePostJob} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Job Title *</label>
                                        <input
                                            type="text"
                                            value={jobForm.title}
                                            onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                                            placeholder="e.g. SSC CGL 2026 Recruitment"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                                        <select
                                            value={jobForm.category}
                                            onChange={e => setJobForm({ ...jobForm, category: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                                        >
                                            <option>SSC</option>
                                            <option>Railway</option>
                                            <option>Banking</option>
                                            <option>Police</option>
                                            <option>Teaching</option>
                                            <option>Defence</option>
                                            <option>State Govt</option>
                                            <option>Central Govt</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Short Info *</label>
                                        <textarea
                                            value={jobForm.shortInfo}
                                            onChange={e => setJobForm({ ...jobForm, shortInfo: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                            rows={3}
                                            placeholder="Brief description of the job..."
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Important Dates</label>
                                            <input
                                                type="text"
                                                value={jobForm.importantDates}
                                                onChange={e => setJobForm({ ...jobForm, importantDates: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                                                placeholder="e.g. Last Date: 15 March 2026"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Apply Link</label>
                                            <input
                                                type="url"
                                                value={jobForm.applyLink}
                                                onChange={e => setJobForm({ ...jobForm, applyLink: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex justify-center items-center shadow-lg"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="animate-spin mr-2" size={20} />
                                        ) : (
                                            <>
                                                <Send size={18} className="mr-2" />
                                                Post Job & Send Email Notifications
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
