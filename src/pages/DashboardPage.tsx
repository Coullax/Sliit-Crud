import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Candidate } from '../types';
import { Plus, Search, Phone, Mail } from 'lucide-react';
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Candidates</h2>
                    <p className="text-slate-500 mt-1">Manage and track candidate progress</p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus size={20} />
                    Add Candidate
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Search candidates by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCandidates.map((candidate) => (
                        <div
                            key={candidate.id}
                            onClick={() => navigate(`/candidates/${candidate.id}`)}
                            className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-100 hover:-translate-y-1 cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                                    {candidate.name.charAt(0)}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${candidate.status === 'hired' ? 'bg-green-100 text-green-700' :
                                    candidate.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-blue-50 text-blue-700'
                                    }`}>
                                    {candidate.status.replace('_', ' ')}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                                {candidate.name}
                            </h3>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <Mail size={16} />
                                    {candidate.email}
                                </div>
                                {candidate.phone && (
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Phone size={16} />
                                        {candidate.phone}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-50">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">View Details</span>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Plus size={16} className="rotate-45 group-hover:rotate-0 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredCandidates.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-400">
                            No candidates found. Start by adding one!
                        </div>
                    )}
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
