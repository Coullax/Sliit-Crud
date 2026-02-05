import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Candidate, Interview, RoundType } from '../types';
import { ArrowLeft, Plus, Trash2, Edit2, Calendar, Check } from 'lucide-react';
import InterviewModal from '../components/InterviewModal';
import EditCandidateModal from '../components/EditCandidateModal';

export default function CandidateDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditCandidateOpen, setIsEditCandidateOpen] = useState(false);
    const [editingInterview, setEditingInterview] = useState<Interview | undefined>(undefined);
    const [initialRoundType, setInitialRoundType] = useState<RoundType | undefined>(undefined);

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
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Interview Process</h2>

                <div className="space-y-4">
                    {/* 1. Technical Round */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
                                <h3 className="text-lg font-bold text-slate-900">Technical Interview</h3>
                            </div>
                            {interviews.some(i => i.round_type === 'technical') && (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                    <Check size={14} /> Completed
                                </span>
                            )}
                        </div>

                        <div className="pl-12 space-y-4">
                            {interviews.filter(i => i.round_type === 'technical').map(interview => (
                                <div key={interview.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Calendar size={14} />
                                            {new Date(interview.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => { setEditingInterview(interview); setInitialRoundType(undefined); setIsModalOpen(true); }}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                            >
                                                <Edit2 size={14} /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteInterview(interview.id)}
                                                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Score: </span>
                                            <span className={`font-bold ${interview.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                                {interview.score}/100
                                            </span>
                                        </div>

                                        {interview.details && (
                                            <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                                                {Object.entries(interview.details).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-500 capitalize">{key.replace('_', ' ')}</span>
                                                        <span className="font-semibold text-slate-700">{typeof value === 'number' ? value + '/10' : value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="text-sm text-slate-600">
                                            <span className="font-medium text-slate-700">Feedback: </span>
                                            {interview.feedback}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => { setInitialRoundType('technical'); setEditingInterview(undefined); setIsModalOpen(true); }}
                                className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Plus size={16} />
                                Add {interviews.some(i => i.round_type === 'technical') ? 'Another ' : ''}Technical Interview
                            </button>
                        </div>
                    </div>

                    {/* 2. Director Round */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</div>
                                <h3 className="text-lg font-bold text-slate-900">Director Interview</h3>
                            </div>
                            {interviews.some(i => i.round_type === 'director') ? (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                    <Check size={14} /> Completed
                                </span>
                            ) : (
                                <span className="text-slate-400 text-sm">Not Started</span>
                            )}
                        </div>

                        <div className="pl-12">
                            {interviews.filter(i => i.round_type === 'director').map(interview => (
                                <div key={interview.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Calendar size={14} />
                                            {new Date(interview.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => { setEditingInterview(interview); setInitialRoundType(undefined); setIsModalOpen(true); }}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                            >
                                                <Edit2 size={14} /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteInterview(interview.id)}
                                                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Score: </span>
                                            <span className={`font-bold ${interview.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                                {interview.score}/100
                                            </span>
                                        </div>

                                        {interview.details && (
                                            <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                                                {Object.entries(interview.details).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-500 capitalize">{key.replace('_', ' ')}</span>
                                                        <span className="font-semibold text-slate-700">{typeof value === 'number' ? value + '/10' : value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="text-sm text-slate-600">
                                            <span className="font-medium text-slate-700">Feedback: </span>
                                            {interview.feedback}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {!interviews.some(i => i.round_type === 'director') && (
                                <button
                                    onClick={() => { setInitialRoundType('director'); setEditingInterview(undefined); setIsModalOpen(true); }}
                                    className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <Plus size={16} />
                                    Add Director Interview
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <InterviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                candidateId={id || ''}
                onSuccess={fetchData}
                interview={editingInterview}
                initialRoundType={initialRoundType}
            />

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
