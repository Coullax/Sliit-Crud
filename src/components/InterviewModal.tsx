import React, { useState } from 'react';
import type { Interview, RoundType, TechnicalScoreBreakdown, DirectorScoreBreakdown } from '../types';
import { X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface InterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateId: string;
    onSuccess: () => void;
    interview?: Interview;
    initialRoundType?: RoundType;
}

export default function InterviewModal({ isOpen, onClose, candidateId, onSuccess, interview, initialRoundType }: InterviewModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [roundType, setRoundType] = useState<RoundType>(interview?.round_type || initialRoundType || 'technical');
    const [score, setScore] = useState(interview?.score?.toString() || '');
    const [feedback, setFeedback] = useState(interview?.feedback || '');

    // Technical Breakdown State
    const [techBreakdown, setTechBreakdown] = useState<TechnicalScoreBreakdown>({
        programming_fundamentals: (interview?.details as TechnicalScoreBreakdown)?.programming_fundamentals || 0,
        database_system: (interview?.details as TechnicalScoreBreakdown)?.database_system || 0,
        code_quality: (interview?.details as TechnicalScoreBreakdown)?.code_quality || 0,
        dsa: (interview?.details as TechnicalScoreBreakdown)?.dsa || 0,
        cicd: (interview?.details as TechnicalScoreBreakdown)?.cicd || 0,
        error_handling: (interview?.details as TechnicalScoreBreakdown)?.error_handling || 0,
    });

    // Director Breakdown State
    const [directorBreakdown, setDirectorBreakdown] = useState<DirectorScoreBreakdown>({
        personality: (interview?.details as DirectorScoreBreakdown)?.personality || 0,
        communication: (interview?.details as DirectorScoreBreakdown)?.communication || 0,
        team_work: (interview?.details as DirectorScoreBreakdown)?.team_work || 0,
        problem_solving: (interview?.details as DirectorScoreBreakdown)?.problem_solving || 0,
        prompt_engineering: (interview?.details as DirectorScoreBreakdown)?.prompt_engineering || 0,
    });

    React.useEffect(() => {
        if (isOpen) {
            setRoundType(interview?.round_type || initialRoundType || 'technical');
            setScore(interview?.score?.toString() || '');
            setFeedback(interview?.feedback || '');

            if (interview?.details && interview.round_type === 'technical') {
                setTechBreakdown(interview.details as TechnicalScoreBreakdown);
                setDirectorBreakdown({
                    personality: 0, communication: 0, team_work: 0, problem_solving: 0, prompt_engineering: 0
                });
            } else if (interview?.details && interview.round_type === 'director') {
                setDirectorBreakdown(interview.details as DirectorScoreBreakdown);
                setTechBreakdown({
                    programming_fundamentals: 0, database_system: 0, code_quality: 0, dsa: 0, cicd: 0, error_handling: 0
                });
            } else {
                // Reset defaults
                setTechBreakdown({ programming_fundamentals: 0, database_system: 0, code_quality: 0, dsa: 0, cicd: 0, error_handling: 0 });
                setDirectorBreakdown({ personality: 0, communication: 0, team_work: 0, problem_solving: 0, prompt_engineering: 0 });
            }
        }
    }, [isOpen, interview, initialRoundType]);

    // Auto-calculate score
    React.useEffect(() => {
        if (roundType === 'technical') {
            const values = Object.values(techBreakdown);
            const total = values.reduce((sum, val) => sum + val, 0);
            const calculatedScore = Math.round((total / 60) * 100);
            setScore(calculatedScore.toString());
        } else if (roundType === 'director') {
            const values = Object.values(directorBreakdown);
            const total = values.reduce((sum, val) => sum + val, 0);
            // 5 categories * 10 points = 50 max points
            const calculatedScore = Math.round((total / 50) * 100);
            setScore(calculatedScore.toString());
        }
    }, [techBreakdown, directorBreakdown, roundType]);

    if (!isOpen) return null;

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
            if (interview) {
                const { error } = await supabase
                    .from('interviews')
                    .update({ ...interviewData, round_index: interview.round_index })
                    .eq('id', interview.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('interviews').insert([interviewData]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-slate-900">
                        {interview ? 'Edit Interview' : 'New Interview Round'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Round Type</label>
                        <select
                            value={roundType}
                            onChange={(e) => setRoundType(e.target.value as RoundType)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={!!initialRoundType}
                        >
                            <option value="technical">Technical Round</option>
                            <option value="director">Director Round</option>
                        </select>
                    </div>

                    {roundType === 'technical' && (
                        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-semibold text-slate-700 text-sm">Detailed Scoring (0-10)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.keys(techBreakdown).map((key) => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500 capitalize">
                                            {key.replace('_', ' ')}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={techBreakdown[key as keyof TechnicalScoreBreakdown]}
                                            onChange={(e) => updateTechBreakdown(key as keyof TechnicalScoreBreakdown, e.target.value)}
                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                <span className="font-bold text-slate-700 text-sm">Calculated Total:</span>
                                <span className={`text-lg font-bold ${Number(score) >= 70 ? 'text-green-600' : 'text-slate-900'}`}>{score}%</span>
                            </div>
                        </div>
                    )}

                    {roundType === 'director' && (
                        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-semibold text-slate-700 text-sm">Director Scoring (0-10)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.keys(directorBreakdown).map((key) => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500 capitalize">
                                            {key.replace('_', ' ')}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={directorBreakdown[key as keyof DirectorScoreBreakdown]}
                                            onChange={(e) => updateDirectorBreakdown(key as keyof DirectorScoreBreakdown, e.target.value)}
                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                <span className="font-bold text-slate-700 text-sm">Calculated Total:</span>
                                <span className={`text-lg font-bold ${Number(score) >= 70 ? 'text-green-600' : 'text-slate-900'}`}>{score}%</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Feedback</label>
                        <textarea
                            rows={4}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                            placeholder="Enter detailed feedback..."
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (!score)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                        >
                            <Check size={18} />
                            {loading ? 'Saving...' : 'Save Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
