import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Candidate } from '../types';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddCandidateModal from '../components/AddCandidateModal';

export default function DashboardPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const { data, error } = await supabase
                .from('candidates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCandidates(data || []);
        } catch (error) {
            console.error('Error fetching candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Candidates</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage pipeline and interviews</p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus size={16} />
                    Add Candidate
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Filter candidates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Kanban Board */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-x-auto pb-4">
                    {/* In Progress Column */}
                    <div className="flex flex-col bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <h3 className="font-semibold text-slate-700">In Progress</h3>
                            </div>
                            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">
                                {filteredCandidates.filter(c => c.status === 'in_progress').length}
                            </span>
                        </div>
                        <div className="flex-1 space-y-3">
                            {filteredCandidates
                                .filter(c => c.status === 'in_progress')
                                .map(candidate => (
                                    <CandidateCard key={candidate.id} candidate={candidate} navigate={navigate} />
                                ))}
                            {filteredCandidates.filter(c => c.status === 'in_progress').length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-300 rounded-lg">
                                    No active candidates
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hired Column */}
                    <div className="flex flex-col bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <h3 className="font-semibold text-slate-700">Hired</h3>
                            </div>
                            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">
                                {filteredCandidates.filter(c => c.status === 'hired').length}
                            </span>
                        </div>
                        <div className="flex-1 space-y-3">
                            {filteredCandidates
                                .filter(c => c.status === 'hired')
                                .map(candidate => (
                                    <CandidateCard key={candidate.id} candidate={candidate} navigate={navigate} />
                                ))}
                            {filteredCandidates.filter(c => c.status === 'hired').length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-300 rounded-lg">
                                    No hired candidates yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rejected Column */}
                    <div className="flex flex-col bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <h3 className="font-semibold text-slate-700">Rejected</h3>
                            </div>
                            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">
                                {filteredCandidates.filter(c => c.status === 'rejected').length}
                            </span>
                        </div>
                        <div className="flex-1 space-y-3">
                            {filteredCandidates
                                .filter(c => c.status === 'rejected')
                                .map(candidate => (
                                    <CandidateCard key={candidate.id} candidate={candidate} navigate={navigate} />
                                ))}
                            {filteredCandidates.filter(c => c.status === 'rejected').length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-300 rounded-lg">
                                    No rejected candidates
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <AddCandidateModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchCandidates}
            />
        </div>
    );
}

function CandidateCard({ candidate, navigate }: { candidate: Candidate; navigate: (path: string) => void }) {
    return (
        <div
            onClick={() => navigate(`/candidates/${candidate.id}`)}
            className="group bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer relative"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${candidate.status === 'hired' ? 'bg-green-500' :
                    candidate.status === 'rejected' ? 'bg-red-500' :
                        'bg-blue-500'
                    }`}>
                    {candidate.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 truncate text-sm group-hover:text-blue-600 transition-colors">
                        {candidate.name}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{candidate.email}</p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                <span className="text-[10px] text-slate-400">
                    {new Date(candidate.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
}
