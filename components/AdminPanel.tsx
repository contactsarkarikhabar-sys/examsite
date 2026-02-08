import React, { useState, useEffect } from 'react';
import { X, Send, Users, Bell, Loader2, CheckCircle, AlertCircle, Lock, Plus, Trash2, Copy, Edit, Search } from 'lucide-react';
import { jobService } from '../services/jobService';
import { useLanguage } from '../contexts/LanguageContext';
import { VacancyColumn, VacancyRow, LinkItem, JobDetailData } from '../types';
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
    vacancyColumns: [
        { key: 'postName', label: 'Post Name' },
        { key: 'totalPost', label: 'Total Post' },
        { key: 'eligibility', label: 'Eligibility / Pay Scale' }
    ] as VacancyColumn[],
    vacancyDetails: [{ postName: '', totalPost: '', eligibility: '' }] as VacancyRow[],
    importantLinks: [{ label: '', url: '' }]
};

const AdminPanel: React.FC<Props> = ({ isOpen, onClose }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'quick' | 'full' | 'pending'>('quick');

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
    const [newVacancyColKey, setNewVacancyColKey] = useState('');
    const [newVacancyColLabel, setNewVacancyColLabel] = useState('');
    const [searchFilter, setSearchFilter] = useState('');
    const [pendingJobs, setPendingJobs] = useState<Array<{ id: string; title: string; post_date?: string; is_active?: number; created_by?: string; source_domain?: string; updated_at?: string }>>([]);
    const [pendingView, setPendingView] = useState<'pending' | 'active' | 'all'>('pending');

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

    useEffect(() => {
        if (isAuthenticated && isOpen && activeTab === 'pending') {
            loadPending();
        }
    }, [isAuthenticated, isOpen, activeTab, pendingView]);

    const loadStats = async () => {
        const data: any = await jobService.getSubscribersCount(password);
        if (typeof data?.total === 'number' && data.total >= 0) {
            setStats({ total: data.total, verified: data.verified });
        }
    };

    const loadPending = async () => {
        const result = await jobService.getAdminJobs(password, pendingView);
        if (result.success) {
            setPendingJobs(result.jobs);
        } else {
            setPendingJobs([]);
            setMessage({ type: 'error', text: result.message || 'Failed to load jobs' });
        }
    };

    const handleLoadDbJobForEdit = async (jobId: string) => {
        setIsLoading(true);
        setMessage(null);
        const result = await jobService.getAdminJobById(jobId, password);
        setIsLoading(false);
        if (result.success && result.job) {
            const job = result.job as any;
            setFullJobForm({
                id: String(job.id || ''),
                title: String(job.title || ''),
                category: String(job.category || 'Latest Jobs'),
                postDate: String(job.postDate || ''),
                shortInfo: String(job.shortInfo || ''),
                importantDates: Array.isArray(job.importantDates) && job.importantDates.length ? job.importantDates : [''],
                applicationFee: Array.isArray(job.applicationFee) && job.applicationFee.length ? job.applicationFee : [''],
                ageLimit: Array.isArray(job.ageLimit) && job.ageLimit.length ? job.ageLimit : [''],
                vacancyColumns: Array.isArray(job.vacancyColumns) && job.vacancyColumns.length
                    ? job.vacancyColumns
                    : emptyJobForm.vacancyColumns,
                vacancyDetails: Array.isArray(job.vacancyDetails) && job.vacancyDetails.length ? job.vacancyDetails : [{ postName: '', totalPost: '', eligibility: '' }],
                importantLinks: Array.isArray(job.importantLinks) && job.importantLinks.length ? job.importantLinks : [{ label: '', url: '' }]
            });
            setSelectedJobId(String(job.id || jobId));
            setIsEditMode(true);
            setGeneratedCode('');
            setActiveTab('full');
            setMessage({ type: 'success', text: `✅ Loaded from DB: ${job.title || jobId}` });
        } else {
            setMessage({ type: 'error', text: result.message || 'Failed to load job' });
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length > 0) {
            setIsLoading(true);
            setMessage(null);
            try {
                const data: any = await jobService.getSubscribersCount(password);
                if (data.total >= 0) {
                    setIsAuthenticated(true);
                    setStats({ total: data.total, verified: data.verified });
                } else if (data.total === -1) {
                    setMessage({ type: 'error', text: data.error || 'Invalid password' });
                } else {
                    setMessage({ type: 'error', text: data.error || 'API error' });
                }
            } catch (e) {
                setMessage({ type: 'error', text: e instanceof Error ? e.message : String(e) });
            } finally {
                setIsLoading(false);
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
        const row: any = {};
        for (const c of fullJobForm.vacancyColumns) row[c.key] = '';
        row.postName = row.postName ?? '';
        row.totalPost = row.totalPost ?? '';
        row.eligibility = row.eligibility ?? '';
        setFullJobForm({
            ...fullJobForm,
            vacancyDetails: [...fullJobForm.vacancyDetails, row]
        });
    };

    const removeVacancy = (index: number) => {
        const newArr = fullJobForm.vacancyDetails.filter((_, i) => i !== index);
        setFullJobForm({
            ...fullJobForm,
            vacancyDetails: newArr.length ? newArr : [{ postName: '', totalPost: '', eligibility: '' }]
        });
    };

    const updateVacancy = (index: number, field: string, value: string) => {
        const newArr = [...fullJobForm.vacancyDetails];
        newArr[index] = { ...newArr[index], [field]: value };
        setFullJobForm({ ...fullJobForm, vacancyDetails: newArr });
    };

    const addVacancyColumn = () => {
        const keyRaw = (newVacancyColKey || '').trim().replace(/[^a-zA-Z0-9_]/g, '');
        const key = keyRaw && /^[a-zA-Z]/.test(keyRaw) ? keyRaw.slice(0, 32) : '';
        const label = (newVacancyColLabel || '').trim().slice(0, 50);
        if (!key || !label) return;
        const existingKeys = new Set(fullJobForm.vacancyColumns.map(c => c.key));
        if (existingKeys.has(key)) return;
        const columns = [...fullJobForm.vacancyColumns, { key, label }];
        const rows = fullJobForm.vacancyDetails.map(r => ({ ...r, [key]: String((r as any)?.[key] ?? '') }));
        setFullJobForm({ ...fullJobForm, vacancyColumns: columns, vacancyDetails: rows });
        setNewVacancyColKey('');
        setNewVacancyColLabel('');
    };

    const removeVacancyColumn = (key: string) => {
        if (key === 'postName' || key === 'totalPost' || key === 'eligibility') return;
        const columns = fullJobForm.vacancyColumns.filter(c => c.key !== key);
        const rows = fullJobForm.vacancyDetails.map(r => {
            const copy: any = { ...r };
            delete copy[key];
            return copy;
        });
        setFullJobForm({ ...fullJobForm, vacancyColumns: columns, vacancyDetails: rows });
    };

    const updateVacancyColumnLabel = (key: string, label: string) => {
        const columns = fullJobForm.vacancyColumns.map(c => c.key === key ? { ...c, label } : c);
        setFullJobForm({ ...fullJobForm, vacancyColumns: columns });
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

    // Save job directly to database
    const handleSaveToDb = async () => {
        if (!fullJobForm.id || !fullJobForm.title) {
            setMessage({ type: 'error', text: 'ID and Title are required' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        const result = await jobService.saveJob({
            id: fullJobForm.id,
            title: fullJobForm.title,
            category: fullJobForm.category,
            postDate: fullJobForm.postDate,
            shortInfo: fullJobForm.shortInfo,
            importantDates: fullJobForm.importantDates.filter(d => d),
            applicationFee: fullJobForm.applicationFee.filter(f => f),
            ageLimit: fullJobForm.ageLimit.filter(a => a),
            vacancyColumns: fullJobForm.vacancyColumns,
            vacancyDetails: fullJobForm.vacancyDetails
                .filter(v => String((v as any)?.postName || '').trim().length > 0)
                .map(v => {
                    const row: any = {};
                    for (const c of fullJobForm.vacancyColumns) row[c.key] = String((v as any)?.[c.key] ?? '');
                    row.postName = String((v as any)?.postName ?? '');
                    row.totalPost = String((v as any)?.totalPost ?? '');
                    row.eligibility = String((v as any)?.eligibility ?? '');
                    return row;
                }),
            importantLinks: fullJobForm.importantLinks.filter(l => l.label)
        }, password);

        setIsLoading(false);

        if (result.success) {
            setMessage({ type: 'success', text: `✅ ${result.message}` });
            // Optionally reset form after save
        } else {
            setMessage({ type: 'error', text: result.message });
        }
    };

    // Delete job from database
    const handleDeleteFromDb = async (jobId: string) => {
        if (!confirm(`Are you sure you want to delete "${jobId}"?`)) {
            return;
        }

        setIsLoading(true);
        const result = await jobService.deleteJob(jobId, password);
        setIsLoading(false);

        if (result.success) {
            setMessage({ type: 'success', text: `🗑️ ${result.message}` });
            resetForm();
        } else {
            setMessage({ type: 'error', text: result.message });
        }
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
                vacancyColumns: emptyJobForm.vacancyColumns,
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

    const handleCleanupJunk = async () => {
        setIsLoading(true);
        setMessage(null);
        const result = await jobService.cleanupJunkJobs(password);
        setIsLoading(false);
        if (result.success) {
            setMessage({ type: 'success', text: '✅ Junk jobs cleaned' });
            if (activeTab === 'pending') {
                loadPending();
            }
        } else {
            setMessage({ type: 'error', text: result.message || 'Cleanup failed' });
        }
    };

    const handleRunAgentNow = async () => {
        setIsLoading(true);
        setMessage(null);
        const result = await jobService.runAgentNow(password);
        setIsLoading(false);
        if (result.success) {
            setMessage({ type: 'success', text: `✅ Agent run complete. Added: ${result.jobsAdded || 0}` });
            if (activeTab === 'pending') {
                loadPending();
            }
            loadStats();
        } else {
            setMessage({ type: 'error', text: result.message || 'Agent run failed' });
        }
    };

    const handleApprove = async (jobId: string) => {
        setIsLoading(true);
        setMessage(null);
        const result = await jobService.approveJob(jobId, password);
        setIsLoading(false);
        if (result.success) {
            setMessage({ type: 'success', text: '✅ Approved' });
            loadPending();
        } else {
            setMessage({ type: 'error', text: result.message || 'Approve failed' });
        }
    };

    const handleReject = async (jobId: string) => {
        setIsLoading(true);
        setMessage(null);
        const result = await jobService.rejectJob(jobId, password);
        setIsLoading(false);
        if (result.success) {
            setMessage({ type: 'success', text: '✅ Rejected' });
            loadPending();
        } else {
            setMessage({ type: 'error', text: result.message || 'Reject failed' });
        }
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
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition ${activeTab === 'pending' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    ✅ Pending
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
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                                                    <input
                                                        type="text"
                                                        value={newVacancyColKey}
                                                        onChange={e => setNewVacancyColKey(e.target.value)}
                                                        className="md:w-1/3 border border-gray-300 rounded-lg p-2 text-sm"
                                                        placeholder="Column key (e.g. payScale)"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={newVacancyColLabel}
                                                        onChange={e => setNewVacancyColLabel(e.target.value)}
                                                        className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                                                        placeholder="Heading label (e.g. Pay Scale)"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addVacancyColumn}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={14} /> Add Column
                                                    </button>
                                                </div>

                                                <div
                                                    className="grid gap-2"
                                                    style={{ gridTemplateColumns: `repeat(${Math.max(1, fullJobForm.vacancyColumns.length)}, minmax(0, 1fr))` }}
                                                >
                                                    {fullJobForm.vacancyColumns.map((c) => (
                                                        <div key={c.key} className="flex items-center gap-1">
                                                            <input
                                                                type="text"
                                                                value={c.label}
                                                                onChange={e => updateVacancyColumnLabel(c.key, e.target.value)}
                                                                className="flex-1 border border-gray-300 rounded-lg p-2 text-xs font-bold"
                                                                placeholder="Heading"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeVacancyColumn(c.key)}
                                                                disabled={c.key === 'postName' || c.key === 'totalPost' || c.key === 'eligibility'}
                                                                className="text-red-500 disabled:text-gray-300 p-2"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {fullJobForm.vacancyDetails.map((vacancy, i) => (
                                                <div key={i} className="bg-white p-3 rounded-lg mb-2 border">
                                                    <div
                                                        className="grid gap-2"
                                                        style={{ gridTemplateColumns: `repeat(${Math.max(1, fullJobForm.vacancyColumns.length)}, minmax(0, 1fr))` }}
                                                    >
                                                        {fullJobForm.vacancyColumns.map((c) => (
                                                            <input
                                                                key={c.key}
                                                                type="text"
                                                                value={String((vacancy as any)?.[c.key] ?? '')}
                                                                onChange={e => updateVacancy(i, c.key, e.target.value)}
                                                                className="border border-gray-300 rounded-lg p-2 text-sm"
                                                                placeholder={c.label}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-end mt-2">
                                                        <button type="button" onClick={() => removeVacancy(i)} className="text-red-500 p-2">
                                                            <Trash2 size={16} />
                                                        </button>
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
                                                onClick={handleSaveToDb}
                                                disabled={isLoading}
                                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : '💾'}
                                                {isEditMode ? 'Update in Database' : 'Save to Database'}
                                            </button>
                                            {isEditMode && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteFromDb(fullJobForm.id)}
                                                    disabled={isLoading}
                                                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} /> Delete
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={resetForm}
                                                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg"
                                            >
                                                {isEditMode ? 'New' : 'Reset'}
                                            </button>
                                        </div>

                                        {/* Generate Code (Secondary option) */}
                                        <div className="border-t mt-4 pt-4">
                                            <button
                                                type="button"
                                                onClick={generateCode}
                                                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg flex justify-center items-center gap-2 text-sm"
                                            >
                                                ⚡ Generate Code (for manual paste)
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
                                                    📋 Copy this code and paste it into <code className="bg-gray-200 px-1 rounded">constants.ts</code>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'pending' && (
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h4 className="font-bold text-gray-800">Pending approvals</h4>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPendingView('pending')}
                                                className={`text-sm font-bold py-2 px-3 rounded-lg border ${pendingView === 'pending' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                Pending
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPendingView('active')}
                                                className={`text-sm font-bold py-2 px-3 rounded-lg border ${pendingView === 'active' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                Active
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPendingView('all')}
                                                className={`text-sm font-bold py-2 px-3 rounded-lg border ${pendingView === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                All
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleRunAgentNow}
                                                disabled={isLoading}
                                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center gap-2"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                                Run agent
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCleanupJunk}
                                                disabled={isLoading}
                                                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center gap-2"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                                Cleanup junk
                                            </button>
                                        </div>
                                    </div>

                                    {pendingJobs.length === 0 ? (
                                        <div className="text-sm text-gray-600">
                                            {pendingView === 'pending' ? 'No pending jobs.' : 'No jobs.'}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {pendingJobs.slice(0, 50).map(j => (
                                                <div key={j.id} className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg p-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="text-sm font-bold text-gray-800 truncate">{j.title}</div>
                                                            {(() => {
                                                                const s = Number(j.is_active ?? 1);
                                                                const label = s === 0 ? 'Pending' : (s === 1 ? 'Active' : 'Rejected');
                                                                const cls = s === 0
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : (s === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800');
                                                                return (
                                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
                                                                        {label}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="text-xs text-gray-500 truncate">
                                                            {j.id}
                                                            {j.post_date ? ` • ${j.post_date}` : ''}
                                                            {j.source_domain ? ` • ${j.source_domain}` : ''}
                                                            {j.created_by ? ` • ${j.created_by}` : ''}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLoadDbJobForEdit(j.id)}
                                                            disabled={isLoading}
                                                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center gap-2"
                                                        >
                                                            <Edit size={14} /> Edit
                                                        </button>
                                                        {Number(j.is_active ?? 1) === 0 ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleReject(j.id)}
                                                                    disabled={isLoading}
                                                                    className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-bold py-2 px-3 rounded-lg text-sm"
                                                                >
                                                                    Reject
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleApprove(j.id)}
                                                                    disabled={isLoading}
                                                                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-2 px-3 rounded-lg text-sm"
                                                                >
                                                                    Approve
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleReject(j.id)}
                                                                disabled={isLoading}
                                                                className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-bold py-2 px-3 rounded-lg text-sm"
                                                            >
                                                                Deactivate
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
