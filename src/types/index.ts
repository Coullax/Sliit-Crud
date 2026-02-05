export type CandidateStatus = 'in_progress' | 'completed';

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
    details?: TechnicalScoreBreakdown | DirectorScoreBreakdown;
    scheduled_at?: string;
}

export interface TechnicalScoreBreakdown {
    programming_fundamentals: number;
    database_system: number;
    code_quality: number;
    dsa: number;
    cicd: number;
    error_handling: number;
}

export interface DirectorScoreBreakdown {
    personality: number;
    communication: number;
    team_work: number;
    problem_solving: number;
    prompt_engineering: number;
}
