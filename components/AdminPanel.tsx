import React, { useState, useEffect } from 'react';
import { X, Send, Users, Bell, Loader2, CheckCircle, AlertCircle, Lock, Plus, Trash2, Copy, Edit, Search } from 'lucide-react';
import { jobService } from '../services/jobService';
import { useLanguage } from '../contexts/LanguageContext';
import { VacancyItem, LinkItem, JobDetailData } from '../types';
import { JOB_DETAILS_DB } from '../constants';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// Empty form template
const emptyJobForm = {
    id: '',
    title: '',
    category: 'Latest Jobs',
    postDate: '',
    shortInfo: '',
    importantDates: [''],
    applicationFee: [''],
    ageLimit: [''],
    vacancyDetails: [{ postName: '', totalPost: '', eligibility: '' }],
    importantLinks: [{ label: '', url: '' }]
};

const AdminPanel: React.FC<Props> = ({ isOpen, onClose }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'quick' | 'full'>('quick');

    // Stats
    const [stats, setStats] = useState({ total: 0, verified: 0 });

    // Quick Job Form (for email notification)
    const [quickJobForm, setQuickJobForm] = useState({
        title: '',
        category: 'SSC',
        shortInfo: '',
        importantDates: '',
        applyLink: ''
    });

    // Full Job Form (complete details)
    const [fullJobForm, setFullJobForm] = useState(emptyJobForm);
    const [generatedCode, setGeneratedCode] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [searchFilter, setSearchFilter] = useState('');

    // Get job list from constants
    const jobList = Object.keys(JOB_DETAILS_DB).map(id => ({ id, title: JOB_DETAILS_DB[id].title }));
    const filteredJobList = jobList.filter(job =>
        job.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        job.id.toLowerCase().includes(searchFilter.toLowerCase())
    );

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

    const handleQuickPostJob = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!quickJobForm.title || !quickJobForm.shortInfo) {
            setMessage({ type: 'error', text: 'Title and Short Info are required' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        const result = await jobService.postNewJob(quickJobForm, password);

        setIsLoading(false);

        if (result.success) {
            setMessage({
                type: 'success',
                text: `✅ Job posted! ${result.notificationsSent || 0} emails sent.`
            });
            setQuickJobForm({
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

    // Generate ID from title
    const generateId = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 30);
    };

    // Add/Remove array items
    const addArrayItem = (field: 'importantDates' | 'applicationFee' | 'ageLimit') => {
        setFullJobForm({ ...fullJobForm, [field]: [...fullJobForm[field], ''] });
    };

    const removeArrayItem = (field: 'importantDates' | 'applicationFee' | 'ageLimit', index: number) => {
        const newArr = fullJobForm[field].filter((_, i) => i !== index);
        setFullJobForm({ ...fullJobForm, [field]: newArr.length ? newArr : [''] });
    };

    const updateArrayItem = (field: 'importantDates' | 'applicationFee' | 'ageLimit', index: number, value: string) => {
        const newArr = [...fullJobForm[field]];
        newArr[index] = value;
        setFullJobForm({ ...fullJobForm, [field]: newArr });
    };

    // Vacancy management
    const addVacancy = () => {
        setFullJobForm({
            ...fullJobForm,
            vacancyDetails: [...fullJobForm.vacancyDetails, { postName: '', totalPost: '', eligibility: '' }]
        });
    };

    const removeVacancy = (index: number) => {
        const newArr = fullJobForm.vacancyDetails.filter((_, i) => i !== index);
        setFullJobForm({
            ...fullJobForm,
            vacancyDetails: newArr.length ? newArr : [{ postName: '', totalPost: '', eligibility: '' }]
        });
    };

    const updateVacancy = (index: number, field: keyof VacancyItem, value: string) => {
        const newArr = [...fullJobForm.vacancyDetails];
        newArr[index] = { ...newArr[index], [field]: value };
        setFullJobForm({ ...fullJobForm, vacancyDetails: newArr });
    };

    // Links management
    const addLink = () => {
        setFullJobForm({
            ...fullJobForm,
            importantLinks: [...fullJobForm.importantLinks, { label: '', url: '' }]
        });
    };

    const removeLink = (index: number) => {
        const newArr = fullJobForm.importantLinks.filter((_, i) => i !== index);
        setFullJobForm({
            ...fullJobForm,
            importantLinks: newArr.length ? newArr : [{ label: '', url: '' }]
        });
    };

    const updateLink = (index: number, field: keyof LinkItem, value: string) => {
        const newArr = [...fullJobForm.importantLinks];
        newArr[index] = { ...newArr[index], [field]: value };
        setFullJobForm({ ...fullJobForm, importantLinks: newArr });
    };

    // Generate TypeScript code
    const generateCode = () => {
        const id = fullJobForm.id || generateId(fullJobForm.title);
        const category = fullJobForm.category;

        // Map category to section title
        const sectionMap: Record<string, string> = {
            'Latest Jobs': 'New Updates',
            'Results': 'Results',
            'Admit Card': 'Admit Card',
            'Answer Key': 'Answer Key',
            'Syllabus': 'Syllabus',
            'Admission': 'Admission'
        };
        const sectionTitle = sectionMap[category] || 'New Updates';

        const detailsCode = `  "${id}": {
    id: "${id}",
    title: "${fullJobForm.title}",
    postDate: "${fullJobForm.postDate}",
    shortInfo: "${fullJobForm.shortInfo.replace(/"/g, '\\"')}",
    importantDates: [
${fullJobForm.importantDates.filter(d => d).map(d => `      "${d}"`).join(',\n')}
    ],
    applicationFee: [
${fullJobForm.applicationFee.filter(f => f).map(f => `      "${f}"`).join(',\n')}
    ],
    ageLimit: [
${fullJobForm.ageLimit.filter(a => a).map(a => `      "${a}"`).join(',\n')}
    ],
    vacancyDetails: [
${fullJobForm.vacancyDetails.filter(v => v.postName).map(v =>
            `      { postName: "${v.postName}", totalPost: "${v.totalPost}", eligibility: "${v.eligibility.replace(/"/g, '\\"')}" }`
        ).join(',\n')}
    ],
    importantLinks: [
${fullJobForm.importantLinks.filter(l => l.label).map(l =>
            `      { label: "${l.label}", url: "${l.url}" }`
        ).join(',\n')}
    ]
  },`;

        const sectionCode = `// ═══════════════════════════════════════════════════════════
// STEP 1: Add this to JOB_DETAILS_DB in constants.ts:
// ═══════════════════════════════════════════════════════════

${detailsCode}

// ═══════════════════════════════════════════════════════════
// STEP 2: Add to MOCK_SECTIONS → "${sectionTitle}" section:
// Find the section with title: "${sectionTitle}" and add this to items[]:
// ═══════════════════════════════════════════════════════════

{ id: "${id}", title: "${fullJobForm.title}", isNew: true, link: "#" },`;

        setGeneratedCode(sectionCode);
        setMessage({ type: 'success', text: `✅ Code generated! Add to "${sectionTitle}" section` });
    };

    const copyCode = () => {
        navigator.clipboard.writeText(generatedCode);
        setMessage({ type: 'success', text: '✅ Code copied to clipboard!' });
    };

    // Load existing job for editing
    const loadExistingJob = (jobId: string) => {
        const job = JOB_DETAILS_DB[jobId];
        if (job) {
            setFullJobForm({
                id: job.id,
                title: job.title,
                category: 'Latest Jobs',
                postDate: job.postDate,
                shortInfo: job.shortInfo,
                importantDates: job.importantDates.length ? job.importantDates : [''],
                applicationFee: job.applicationFee.length ? job.applicationFee : [''],
                ageLimit: job.ageLimit.length ? job.ageLimit : [''],
                vacancyDetails: job.vacancyDetails.length ? job.vacancyDetails : [{ postName: '', totalPost: '', eligibility: '' }],
                importantLinks: job.importantLinks.length ? job.importantLinks : [{ label: '', url: '' }]
            });
            setSelectedJobId(jobId);
            setIsEditMode(true);
            setGeneratedCode('');
            setMessage({ type: 'success', text: `✅ Loaded: ${job.title}` });
        }
    };

    // Generate delete instruction
    const generateDeleteCode = (jobId: string) => {
        const deleteCode = `// DELETE THIS ENTRY FROM constants.ts:
// Find and remove the following entry in JOB_DETAILS_DB:

"${jobId}": {
  // ... entire object ...
},

// Also remove from MOCK_SECTIONS if listed there.`;
        setGeneratedCode(deleteCode);
        setMessage({ type: 'success', text: `🗑️ Delete instructions generated for: ${jobId}` });
    };

    const resetForm = () => {
        setFullJobForm(emptyJobForm);
        setGeneratedCode('');
        setMessage(null);
        setIsEditMode(false);
        setSelectedJobId('');
        setSearchFilter('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">

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
                        <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
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

                            {/* Tab Buttons */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setActiveTab('quick')}
                                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition ${activeTab === 'quick' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    📧 Quick Post + Email
                                </button>
                                <button
                                    onClick={() => setActiveTab('full')}
                                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition ${activeTab === 'full' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    📝 Full Job Details
                                </button>
                            </div>

                            {/* Quick Post Tab */}
                            {activeTab === 'quick' && (
                                <div className="bg-gray-50 rounded-xl p-5">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Bell size={18} />
                                        Post New Job & Notify Subscribers
                                    </h4>

                                    <form onSubmit={handleQuickPostJob} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Job Title *</label>
                                            <input
                                                type="text"
                                                value={quickJobForm.title}
                                                onChange={e => setQuickJobForm({ ...quickJobForm, title: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                                                placeholder="e.g. SSC CGL 2026 Recruitment"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                                            <select
                                                value={quickJobForm.category}
                                                onChange={e => setQuickJobForm({ ...quickJobForm, category: e.target.value })}
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
                                                value={quickJobForm.shortInfo}
                                                onChange={e => setQuickJobForm({ ...quickJobForm, shortInfo: e.target.value })}
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
                                                    value={quickJobForm.importantDates}
                                                    onChange={e => setQuickJobForm({ ...quickJobForm, importantDates: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                                                    placeholder="e.g. Last Date: 15 March 2026"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Apply Link</label>
                                                <input
                                                    type="url"
                                                    value={quickJobForm.applyLink}
                                                    onChange={e => setQuickJobForm({ ...quickJobForm, applyLink: e.target.value })}
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
                            )}

                            {/* Full Job Details Tab */}
                            {activeTab === 'full' && (
                                <div className="bg-blue-50 rounded-xl p-5">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        📝 {isEditMode ? `Edit: ${selectedJobId}` : 'Create New Job Details'}
                                    </h4>

                                    {/* Load Existing Job Section */}
                                    <div className="bg-white p-4 rounded-lg border mb-4">
                                        <p className="text-sm font-bold text-gray-700 mb-2">📂 Load Existing Job to Edit/Delete:</p>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={searchFilter}
                                                    onChange={e => setSearchFilter(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
                                                    placeholder="Search jobs by title or ID..."
                                                />
                                            </div>
                                        </div>
                                        {searchFilter && (
                                            <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg bg-gray-50">
                                                {filteredJobList.slice(0, 10).map(job => (
                                                    <div key={job.id} className="flex justify-between items-center p-2 hover:bg-blue-50 border-b last:border-b-0">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{job.title}</p>
                                                            <p className="text-xs text-gray-500">{job.id}</p>
                                                        </div>
                                                        <div className="flex gap-1 ml-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => { loadExistingJob(job.id); setSearchFilter(''); }}
                                                                className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                                            >
                                                                <Edit size={12} /> Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { generateDeleteCode(job.id); setSearchFilter(''); }}
                                                                className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                                            >
                                                                <Trash2 size={12} /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {filteredJobList.length > 10 && (
                                                    <p className="text-xs text-gray-500 p-2 text-center">+{filteredJobList.length - 10} more results...</p>
                                                )}
                                                {filteredJobList.length === 0 && (
                                                    <p className="text-xs text-gray-500 p-2 text-center">No jobs found</p>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">Total: {jobList.length} jobs in database</p>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-4">
                                        {isEditMode ? '✏️ Edit the loaded job and click "Generate Code" to get updated code.' : 'Fill the form below. Click "Generate Code" to get TypeScript code for constants.ts'}
                                    </p>

                                    <div className="space-y-4">
                                        {/* Basic Info */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Job Title *</label>
                                                <input
                                                    type="text"
                                                    value={fullJobForm.title}
                                                    onChange={e => setFullJobForm({ ...fullJobForm, title: e.target.value, id: generateId(e.target.value) })}
                                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                                    placeholder="e.g. SSC CGL 2026 Recruitment"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ID (auto-generated)</label>
                                                <input
                                                    type="text"
                                                    value={fullJobForm.id}
                                                    onChange={e => setFullJobForm({ ...fullJobForm, id: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-gray-100"
                                                    placeholder="ssc-cgl-2026"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                                                <select
                                                    value={fullJobForm.category}
                                                    onChange={e => setFullJobForm({ ...fullJobForm, category: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                                                >
                                                    <option>Latest Jobs</option>
                                                    <option>Results</option>
                                                    <option>Admit Card</option>
                                                    <option>Answer Key</option>
                                                    <option>Syllabus</option>
                                                    <option>Admission</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Post Date</label>
                                                <input
                                                    type="text"
                                                    value={fullJobForm.postDate}
                                                    onChange={e => setFullJobForm({ ...fullJobForm, postDate: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                                    placeholder="e.g. 05 February 2026"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Short Info *</label>
                                            <textarea
                                                value={fullJobForm.shortInfo}
                                                onChange={e => setFullJobForm({ ...fullJobForm, shortInfo: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                                rows={3}
                                                placeholder="Detailed description of the job..."
                                            />
                                        </div>

                                        {/* Important Dates */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-gray-700 uppercase">Important Dates</label>
                                                <button type="button" onClick={() => addArrayItem('importantDates')} className="text-blue-600 text-xs flex items-center gap-1">
                                                    <Plus size={14} /> Add
                                                </button>
                                            </div>
                                            {fullJobForm.importantDates.map((date, i) => (
                                                <div key={i} className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={date}
                                                        onChange={e => updateArrayItem('importantDates', i, e.target.value)}
                                                        className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                                                        placeholder="e.g. Application Begin: 01/04/2026"
                                                    />
                                                    <button type="button" onClick={() => removeArrayItem('importantDates', i)} className="text-red-500 p-2">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Application Fee */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-gray-700 uppercase">Application Fee</label>
                                                <button type="button" onClick={() => addArrayItem('applicationFee')} className="text-blue-600 text-xs flex items-center gap-1">
                                                    <Plus size={14} /> Add
                                                </button>
                                            </div>
                                            {fullJobForm.applicationFee.map((fee, i) => (
                                                <div key={i} className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={fee}
                                                        onChange={e => updateArrayItem('applicationFee', i, e.target.value)}
                                                        className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                                                        placeholder="e.g. General / OBC: ₹ 100/-"
                                                    />
                                                    <button type="button" onClick={() => removeArrayItem('applicationFee', i)} className="text-red-500 p-2">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Age Limit */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-gray-700 uppercase">Age Limit</label>
                                                <button type="button" onClick={() => addArrayItem('ageLimit')} className="text-blue-600 text-xs flex items-center gap-1">
                                                    <Plus size={14} /> Add
                                                </button>
                                            </div>
                                            {fullJobForm.ageLimit.map((age, i) => (
                                                <div key={i} className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={age}
                                                        onChange={e => updateArrayItem('ageLimit', i, e.target.value)}
                                                        className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                                                        placeholder="e.g. Minimum Age: 18 Years"
                                                    />
                                                    <button type="button" onClick={() => removeArrayItem('ageLimit', i)} className="text-red-500 p-2">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Vacancy Details */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-gray-700 uppercase">Vacancy Details</label>
                                                <button type="button" onClick={addVacancy} className="text-blue-600 text-xs flex items-center gap-1">
                                                    <Plus size={14} /> Add Post
                                                </button>
                                            </div>
                                            {fullJobForm.vacancyDetails.map((vacancy, i) => (
                                                <div key={i} className="bg-white p-3 rounded-lg mb-2 border">
                                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={vacancy.postName}
                                                            onChange={e => updateVacancy(i, 'postName', e.target.value)}
                                                            className="border border-gray-300 rounded-lg p-2 text-sm"
                                                            placeholder="Post Name"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={vacancy.totalPost}
                                                            onChange={e => updateVacancy(i, 'totalPost', e.target.value)}
                                                            className="border border-gray-300 rounded-lg p-2 text-sm"
                                                            placeholder="Total Posts"
                                                        />
                                                        <div className="flex gap-1">
                                                            <input
                                                                type="text"
                                                                value={vacancy.eligibility}
                                                                onChange={e => updateVacancy(i, 'eligibility', e.target.value)}
                                                                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                                                                placeholder="Eligibility"
                                                            />
                                                            <button type="button" onClick={() => removeVacancy(i)} className="text-red-500 p-2">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Important Links */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-gray-700 uppercase">Important Links</label>
                                                <button type="button" onClick={addLink} className="text-blue-600 text-xs flex items-center gap-1">
                                                    <Plus size={14} /> Add Link
                                                </button>
                                            </div>
                                            {fullJobForm.importantLinks.map((link, i) => (
                                                <div key={i} className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={link.label}
                                                        onChange={e => updateLink(i, 'label', e.target.value)}
                                                        className="w-1/3 border border-gray-300 rounded-lg p-2 text-sm"
                                                        placeholder="Label (e.g. Apply Online)"
                                                    />
                                                    <input
                                                        type="url"
                                                        value={link.url}
                                                        onChange={e => updateLink(i, 'url', e.target.value)}
                                                        className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                                                        placeholder="URL (https://...)"
                                                    />
                                                    <button type="button" onClick={() => removeLink(i)} className="text-red-500 p-2">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={generateCode}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex justify-center items-center"
                                            >
                                                ⚡ Generate Code
                                            </button>
                                            <button
                                                type="button"
                                                onClick={resetForm}
                                                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg"
                                            >
                                                Reset
                                            </button>
                                        </div>

                                        {/* Generated Code */}
                                        {generatedCode && (
                                            <div className="mt-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs font-bold text-gray-700 uppercase">Generated Code</label>
                                                    <button
                                                        type="button"
                                                        onClick={copyCode}
                                                        className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-700"
                                                    >
                                                        <Copy size={14} /> Copy Code
                                                    </button>
                                                </div>
                                                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-60">
                                                    {generatedCode}
                                                </pre>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    📋 Copy this code and paste it into <code className="bg-gray-200 px-1 rounded">constants.ts</code> inside the <code className="bg-gray-200 px-1 rounded">JOB_DETAILS_DB</code> object.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
