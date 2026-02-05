import React, { useState, useEffect } from 'react';
import { X, Check, User, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { type RoundType } from '../types';

interface AddCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddCandidateModal({ isOpen, onClose, onSuccess }: AddCandidateModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // Scheduling State
    const [scheduleInterview, setScheduleInterview] = useState(false);
    const [roundType, setRoundType] = useState<RoundType>('technical');
    const [scheduledAt, setScheduledAt] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setScheduleInterview(false);
            setScheduledAt('');
            setAvailableSlots([]);
            setBookedSlots([]);
        }
    }, [isOpen]);

    // Fetch booked slots
    useEffect(() => {
        const fetchBookedSlots = async () => {
            if (!user || !selectedDate) return;

            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from('interviews')
                .select('scheduled_at')
                .eq('user_id', user.id)
                .gte('scheduled_at', startOfDay.toISOString())
                .lte('scheduled_at', endOfDay.toISOString());

            if (error) {
                console.error('Error fetching booked slots:', error);
                return;
            }

            const booked = data.map(item => {
                const date = new Date(item.scheduled_at);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            });
            setBookedSlots(booked);
        };

        fetchBookedSlots();
    }, [selectedDate, user, isOpen]);

    // Generate 10-minute slots
    useEffect(() => {
        if (!selectedDate || !scheduleInterview) return;

        const slots = [];
        const startHour = 0;
        const endHour = 24;

        for (let hour = startHour; hour < endHour; hour++) {
            for (let min = 0; min < 60; min += 10) {
                const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                slots.push(timeString);
            }
        }
        setAvailableSlots(slots);
    }, [selectedDate, scheduleInterview]);

    const handleSlotSelect = (timeStr: string) => {
        const dateTimeStr = `${selectedDate}T${timeStr}:00`;
        setScheduledAt(dateTimeStr);
    };

    const isSlotSelected = (timeStr: string) => {
        if (!scheduledAt) return false;
        const scheduledTime = new Date(scheduledAt).toTimeString().slice(0, 5);
        const scheduledDatePart = scheduledAt.split('T')[0];
        return scheduledDatePart === selectedDate && scheduledTime === timeStr;
    };

    const isSlotBooked = (timeStr: string) => {
        return bookedSlots.includes(timeStr);
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            // 1. Create Candidate
            const { data: candidateData, error: candidateError } = await supabase
                .from('candidates')
                .insert([{
                    ...formData,
                    user_id: user.id,
                    status: 'in_progress'
                }])
                .select()
                .single();

            if (candidateError) throw candidateError;

            // 2. Create Interview Schedule (if selected)
            if (scheduleInterview && scheduledAt && candidateData) {
                const { error: interviewError } = await supabase
                    .from('interviews')
                    .insert([{
                        candidate_id: candidateData.id,
                        round_type: roundType,
                        score: 0,
                        feedback: '',
                        user_id: user.id,
                        scheduled_at: new Date(scheduledAt).toISOString(),
                        details: {} // Empty details
                    }]);

                if (interviewError) {
                    console.error('Error creating interview schedule:', interviewError);
                    alert('Candidate added, but failed to schedule interview. Please schedule manually.');
                }
            }

            onSuccess();
            onClose();
            setFormData({ name: '', email: '', phone: '' });
        } catch (error) {
            console.error('Error adding candidate:', error);
            alert('Failed to add candidate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 my-8">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">Add New Candidate</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column: Candidate Details */}
                        <div className="space-y-6">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                <User size={18} className="text-blue-500" />
                                Personal Information
                            </h4>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Scheduling */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <CalendarIcon size={18} className="text-purple-500" />
                                    Initial Interview
                                </h4>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={scheduleInterview}
                                        onChange={(e) => setScheduleInterview(e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                    <span className="ml-2 text-xs font-medium text-slate-600">Schedule Now</span>
                                </label>
                            </div>

                            <div className={`space-y-4 transition-all duration-300 ${scheduleInterview ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Round Type</label>
                                    <select
                                        value={roundType}
                                        onChange={(e) => setRoundType(e.target.value as RoundType)}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                                    >
                                        <option value="technical">Technical Round</option>
                                        <option value="director">Director Round</option>
                                        <option value="hr">HR Round</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Select Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Available Slots (10m)</label>
                                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                        {availableSlots.map(time => {
                                            const booked = isSlotBooked(time);
                                            return (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    disabled={booked}
                                                    onClick={() => !booked && handleSlotSelect(time)}
                                                    className={`text-xs py-1.5 px-1 rounded border transition-all ${booked
                                                        ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed decoration-slate-400 line-through'
                                                        : isSlotSelected(time)
                                                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600'
                                                        }`}
                                                >
                                                    {time}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {scheduledAt && (
                                        <p className="text-xs text-purple-600 font-medium mt-2">
                                            Selected: {new Date(scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-lg shadow-slate-900/20 transition-all disabled:opacity-50"
                        >
                            <Check size={18} />
                            {loading ? 'Processing...' : (scheduleInterview && scheduledAt ? 'Add & Schedule' : 'Add Candidate')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
