import { useState, useEffect } from 'react';
import type { Interview, RoundType, TechnicalScoreBreakdown, DirectorScoreBreakdown, CandidateStatus } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Loader2 } from 'lucide-react';

interface InterviewFormProps {
    candidateId: string;
    onSuccess: () => void;
    onCancel: () => void;
    initialRoundType?: RoundType;
    existingInterview?: Interview;
    currentStatus?: CandidateStatus;
    otherInterviews?: Interview[];
}

export default function InterviewForm({ candidateId, onSuccess, onCancel, initialRoundType, existingInterview, currentStatus, otherInterviews = [] }: InterviewFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    // If editing, use existing type. If creating, use initial (which might be passed from the dropdown) or default.
    const [roundType, setRoundType] = useState<RoundType>(existingInterview?.round_type || initialRoundType || 'technical');
    const [score, setScore] = useState(existingInterview?.score?.toString() || '');
    const [feedback, setFeedback] = useState(existingInterview?.feedback || '');

    // Technical Breakdown State
    const [techBreakdown, setTechBreakdown] = useState<TechnicalScoreBreakdown>({
        programming_fundamentals: (existingInterview?.details as TechnicalScoreBreakdown)?.programming_fundamentals || 0,
        database_system: (existingInterview?.details as TechnicalScoreBreakdown)?.database_system || 0,
        code_quality: (existingInterview?.details as TechnicalScoreBreakdown)?.code_quality || 0,
        dsa: (existingInterview?.details as TechnicalScoreBreakdown)?.dsa || 0,
        cicd: (existingInterview?.details as TechnicalScoreBreakdown)?.cicd || 0,
        error_handling: (existingInterview?.details as TechnicalScoreBreakdown)?.error_handling || 0,
    });

    // Director Breakdown State
    const [directorBreakdown, setDirectorBreakdown] = useState<DirectorScoreBreakdown>({
        personality: (existingInterview?.details as DirectorScoreBreakdown)?.personality || 0,
        communication: (existingInterview?.details as DirectorScoreBreakdown)?.communication || 0,
        team_work: (existingInterview?.details as DirectorScoreBreakdown)?.team_work || 0,
        problem_solving: (existingInterview?.details as DirectorScoreBreakdown)?.problem_solving || 0,
        prompt_engineering: (existingInterview?.details as DirectorScoreBreakdown)?.prompt_engineering || 0,
    });

    // Update local state if props change (mainly for roundType from parent dropdown)
    useEffect(() => {
        if (!existingInterview && initialRoundType) {
            setRoundType(initialRoundType);
        }
    }, [initialRoundType, existingInterview]);

    // Format Date/Time helper
    const now = new Date();
    const dateTime = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    // Auto-calculate score
    useEffect(() => {
        if (roundType === 'technical') {
            const values = Object.values(techBreakdown);
            const total = values.reduce((sum, val) => sum + val, 0);
            const calculatedScore = Math.round((total / 60) * 100);
            setScore(calculatedScore.toString());
        } else if (roundType === 'director') {
            const values = Object.values(directorBreakdown);
            const total = values.reduce((sum, val) => sum + val, 0);
            const calculatedScore = Math.round((total / 50) * 100);
            setScore(calculatedScore.toString());
        }
    }, [techBreakdown, directorBreakdown, roundType]);



    const [candidateStatus, setCandidateStatus] = useState<CandidateStatus>(currentStatus || 'in_progress');

    // Auto-calculate suggested status based on OVERALL score
    useEffect(() => {
        // Only run logic if we have a current score
        if (!score) return;

        const currentScoreVal = parseFloat(score);
        let overallScore = currentScoreVal;

        // Try to find the OTHER round type to average with
        const otherType = roundType === 'technical' ? 'director' : 'technical';
        const otherRound = otherInterviews.find(i => i.round_type === otherType);

        if (otherRound) {
            overallScore = (currentScoreVal + otherRound.score) / 2;
            // If we have both rounds, we can definitely make a Hired/Rejected decision
            if (overallScore >= 70) {
                setCandidateStatus('hired');
            } else {
                setCandidateStatus('rejected');
            }
        }

        // Optional: logic for single round? 
        // For now, let's strictly follow "based on the marks Overall score from both"
        // If we only have one round, maybe we don't auto-set to hired/rejected unless user manually picks it?
        // Or maybe strictly speaking, if it's just one round, it's still In Progress until both are done?
        // Let's stick to: If we have BOTH, we auto-set. If not, we leave it as is (likely in_progress).

    }, [score, roundType, otherInterviews]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        const interviewData: any = {
            candidate_id: candidateId,
            round_type: roundType,
            score: parseFloat(score),
            feedback,
            user_id: user.id,
            details: roundType === 'technical' ? techBreakdown : roundType === 'director' ? directorBreakdown : null
        };

        try {
            // 1. Save Interview
            if (existingInterview) {
                const { error } = await supabase
                    .from('interviews')
                    .update({ ...interviewData, round_index: existingInterview.round_index })
                    .eq('id', existingInterview.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('interviews').insert([interviewData]);
                if (error) throw error;
            }

            // 2. Update Candidate Status if changed from default/current logic (or just always update to be safe)
            // We only update if the user explicitly chose a terminal status or confirmed in_progress
            if (candidateStatus) {
                const { error: statusError } = await supabase
                    .from('candidates')
                    .update({ status: candidateStatus })
                    .eq('id', candidateId);
                if (statusError) throw statusError;
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving interview:', error);
            alert('Failed to save interview');
        } finally {
            setLoading(false);
        }
    };

    const updateTechBreakdown = (field: keyof TechnicalScoreBreakdown, value: string) => {
        const numValue = Math.min(10, Math.max(0, Number(value) || 0));
        setTechBreakdown(prev => ({ ...prev, [field]: numValue }));
    };

    const updateDirectorBreakdown = (field: keyof DirectorScoreBreakdown, value: string) => {
        const numValue = Math.min(10, Math.max(0, Number(value) || 0));
        setDirectorBreakdown(prev => ({ ...prev, [field]: numValue }));
    };

    return (
        <div className="bg-white border rounded-lg shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center rounded-t-lg">
                <div className="flex flex-col">
                    <h3 className="font-semibold text-slate-900">
                        {existingInterview ? 'Edit Interview' : `New ${roundType.charAt(0).toUpperCase() + roundType.slice(1)} Round`}
                    </h3>
                    <span className="text-xs text-slate-500 flex gap-2">
                        <span>{dateTime}</span>
                        <span>•</span>
                        <span>Interviewer: {user?.email}</span>
                    </span>
                </div>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={18} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Score Breakdowns */}
                {roundType === 'technical' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-slate-900">Technical Competencies (0-10)</h4>
                            <span className={`text-sm font-bold ${Number(score) >= 70 ? 'text-green-600' : 'text-slate-600'}`}>
                                Total: {score}%
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.keys(techBreakdown).map((key) => (
                                <div key={key} className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        {key.replace('_', ' ')}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={techBreakdown[key as keyof TechnicalScoreBreakdown]}
                                        onChange={(e) => updateTechBreakdown(key as keyof TechnicalScoreBreakdown, e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {roundType === 'director' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-slate-900">Leadership Competencies (0-10)</h4>
                            <span className={`text-sm font-bold ${Number(score) >= 70 ? 'text-green-600' : 'text-slate-600'}`}>
                                Total: {score}%
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.keys(directorBreakdown).map((key) => (
                                <div key={key} className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        {key.replace('_', ' ')}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={directorBreakdown[key as keyof DirectorScoreBreakdown]}
                                        onChange={(e) => updateDirectorBreakdown(key as keyof DirectorScoreBreakdown, e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Feedback / Notes
                    </label>
                    <textarea
                        rows={3}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        placeholder="Enter interview feedback..."
                    />
                </div>

                {/* Automated Status Display */}
                <div className={`p-4 rounded-lg border flex items-center justify-between ${candidateStatus === 'hired' ? 'bg-green-50 border-green-200 text-green-800' :
                    candidateStatus === 'rejected' ? 'bg-red-50 border-red-200 text-red-800' :
                        'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                            Resulting Status
                        </span>
                        <span className="font-bold text-lg capitalize">
                            {candidateStatus.replace('_', ' ')}
                        </span>
                    </div>
                    {candidateStatus === 'in_progress' && (
                        <div className="text-xs max-w-[200px] text-right opacity-80">
                            both rounds required for final decision
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 hover:bg-slate-100 hover:text-slate-900"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !score}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 h-9 px-4 py-2"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Result
                    </button>
                </div>
            </form>
        </div>
    );
}
