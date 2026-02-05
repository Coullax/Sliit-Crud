import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Candidate, Interview, RoundType } from '../types';
import { ArrowLeft, Trash2, Edit2, Calendar, Plus } from 'lucide-react';
import InterviewForm from '../components/InterviewForm';
import EditCandidateModal from '../components/EditCandidateModal';

export default function CandidateDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newRoundType, setNewRoundType] = useState<RoundType | undefined>(undefined);
    const [isEditCandidateOpen, setIsEditCandidateOpen] = useState(false);
    const [editingInterview, setEditingInterview] = useState<Interview | undefined>(undefined);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        // ... existing fetch logic is fine as is, wait, I need to see if fetchData implementation is included in replacement if I replace the whole block?
        // Actually I should just modify the parts I need.
        // The previous prompt had `fetchData` in full.
        // I will replace the imports and state first, then the render.
        // However, replace_file_content replaces a chunk.
        // I need to be careful.
        // I'll use multi_replace to be safer.
        try {
            const { data: candidateData, error: candidateError } = await supabase
                .from('candidates')
                .select('*')
                .eq('id', id)
                .single();

            if (candidateError) throw candidateError;
            setCandidate(candidateData);

            const { data: interviewData, error: interviewError } = await supabase
                .from('interviews')
                .select('*')
                .eq('candidate_id', id)
                .order('created_at', { ascending: true });

            if (interviewError) throw interviewError;
            setInterviews(interviewData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCandidate = async () => {
        if (!confirm('Are you sure you want to delete this candidate?')) return;
        try {
            await supabase.from('candidates').delete().eq('id', id);
            navigate('/');
        } catch (error) {
            console.error('Error deleting candidate:', error);
        }
    };

    const handleDeleteInterview = async (interviewId: string) => {
        if (!confirm('Delete this interview record?')) return;
        try {
            await supabase.from('interviews').delete().eq('id', interviewId);
            fetchData();
        } catch (error) {
            console.error('Error deleting interview:', error);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!candidate) return <div className="p-8">Candidate not found</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button onClick={() => navigate('/')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors w-fit">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Dashboard
                </button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900">{candidate.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${candidate.status === 'hired' ? 'bg-green-100 text-green-700' :
                                candidate.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-50 text-blue-700'
                                }`}>
                                {candidate.status.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-6 text-slate-500 text-sm">
                            <span>{candidate.email}</span>
                            <span>{candidate.phone}</span>
                            <span>Added on {new Date(candidate.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditCandidateOpen(true)}
                            className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Edit2 size={16} />
                            Edit Info
                        </button>
                        <button
                            onClick={handleDeleteCandidate}
                            className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Trash2 size={16} />
                            Delete Candidate
                        </button>
                    </div>
                </div>
            </div>

            {/* Interview Process Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Interview Process</h2>

                    {!showAddForm && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setNewRoundType('technical'); setShowAddForm(true); }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-sm font-medium transition-all shadow-sm"
                            >
                                <Plus size={16} className="text-blue-500" />
                                Add Technical Round
                            </button>
                            <button
                                onClick={() => { setNewRoundType('director'); setShowAddForm(true); }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-lg text-sm font-medium transition-all shadow-sm"
                            >
                                <Plus size={16} className="text-purple-500" />
                                Add Director Round
                            </button>
                        </div>
                    )}
                </div>

                {/* Add New Form Area */}
                {showAddForm && newRoundType && (
                    <div className="mb-8">
                        <InterviewForm
                            candidateId={id!}
                            initialRoundType={newRoundType}
                            currentStatus={candidate.status}
                            otherInterviews={interviews}
                            onSuccess={() => { setShowAddForm(false); fetchData(); }}
                            onCancel={() => setShowAddForm(false)}
                        />
                    </div>
                )}

                {/* Editing Form Area */}
                {editingInterview && (
                    <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-600 mb-2">Editing Interview</h4>
                        <InterviewForm
                            candidateId={id!}
                            existingInterview={editingInterview}
                            currentStatus={candidate.status}
                            otherInterviews={interviews.filter(i => i.id !== editingInterview.id)}
                            onSuccess={() => { setEditingInterview(undefined); fetchData(); }}
                            onCancel={() => setEditingInterview(undefined)}
                        />
                    </div>
                )}

                <div className="space-y-4">
                    {interviews.length === 0 && !showAddForm && (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-500">No interviews recorded yet.</p>
                            <p className="text-sm text-slate-400">Select a round type above to start.</p>
                        </div>
                    )}

                    {interviews.map((interview) => (
                        <div key={interview.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${interview.round_type === 'technical' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                        {interview.round_type === 'technical' ? 'T' : 'D'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 capitalize">
                                            {interview.round_type} Interview
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar size={12} />
                                            {new Date(interview.created_at).toLocaleString()}
                                            <span className="text-slate-300">|</span>
                                            <span>User ID: {interview.user_id?.slice(0, 8)}...</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setEditingInterview(interview); setShowAddForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteInterview(interview.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 grid md:grid-cols-3 gap-6">
                                <div className="md:col-span-1 space-y-1">
                                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overall Score</div>
                                    <div className={`text-3xl font-bold ${interview.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                        {interview.score}%
                                    </div>
                                    <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${interview.score >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {interview.score >= 70 ? 'PASSED' : 'FAILED'}
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-3">
                                    {interview.details && (
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                            {Object.entries(interview.details).map(([key, value]) => (
                                                <div key={key} className="bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                                                    <div className="text-[10px] text-slate-400 uppercase truncate">{key.replace('_', ' ')}</div>
                                                    <div className="font-semibold text-slate-700 text-sm">{typeof value === 'number' ? value + '/10' : value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {interview.feedback && (
                                        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg italic border border-slate-100">
                                            "{interview.feedback}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {candidate && (
                <EditCandidateModal
                    isOpen={isEditCandidateOpen}
                    onClose={() => setIsEditCandidateOpen(false)}
                    candidate={candidate}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
}
