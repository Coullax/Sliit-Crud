import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Candidate } from '../types';
import { Plus, Search, ChevronLeft, ChevronRight, LayoutList, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddCandidateModal from '../components/AddCandidateModal';

const PAGE_SIZE = 10;

export default function DashboardPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchCandidates();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, page, statusFilter]);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('candidates')
                .select('*', { count: 'exact' });

            if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
            }

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            setCandidates(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Error fetching candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Candidates</h2>
                    <p className="text-slate-500 text-sm mt-1">Bird's eye view of all candidates</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Add Candidate
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                        className="h-9 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950"
                    >
                        <option value="all">All Statuses</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    <div className="text-sm text-slate-500 whitespace-nowrap">
                        Showing {candidates.length} of {totalCount}
                    </div>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Contact</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Date Added</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="h-32 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : candidates.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <LayoutList className="h-8 w-8 text-slate-300" />
                                            <p>No candidates found matching your criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                candidates.map((candidate) => (
                                    <tr
                                        key={candidate.id}
                                        onClick={() => navigate(`/candidates/${candidate.id}`)}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    {candidate.name.charAt(0)}
                                                </div>
                                                <div className="font-medium text-slate-900">{candidate.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${candidate.status === 'completed'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                {candidate.status === 'completed' ? (
                                                    <CheckCircle2 size={12} />
                                                ) : (
                                                    <Clock size={12} />
                                                )}
                                                {candidate.status === 'completed' ? 'Completed' : 'In Progress'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex flex-col">
                                                <span>{candidate.email}</span>
                                                <span className="text-xs text-slate-400">{candidate.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(candidate.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft size={14} />
                        Previous
                    </button>
                    <span className="text-sm text-slate-500 font-medium">
                        Page {page} of {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || loading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                        Next
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <AddCandidateModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => { setPage(1); fetchCandidates(); }}
            />
        </div>
    );
}
