export type CandidateStatus = 'in_progress' | 'hired' | 'rejected';

export interface Candidate {
    id: string;
    created_at: string;
    name: string;
    email: string;
    phone: string;
    status: CandidateStatus;
    user_id: string;
}

export type RoundType = 'technical' | 'hr' | 'director';

export interface Interview {
    id: string;
    created_at: string;
    candidate_id: string;
    round_type: RoundType;
    round_index: number;
    score: number;
    feedback: string;
    user_id: string;
}
