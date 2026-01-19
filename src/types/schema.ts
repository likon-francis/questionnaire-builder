export type QuestionType = 'text' | 'number' | 'date' | 'single-select' | 'multi-select' | 'boolean';

export interface LogicRule {
    questionId: string; // The ID of the question this depends on
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number | boolean;
}

export interface QuestionOption {
    value: string;
    label: string;
}

export interface Question {
    id: string;
    title: string;
    description?: string;
    type: QuestionType;
    options?: QuestionOption[]; // For select/multi-select
    required: boolean;
    visibilityRules?: LogicRule[]; // If empty, always visible (unless parent logic hides it, simplified model)
}

export interface QuestionnaireSettings {
    questionsPerPage?: number; // 0 or undefined = all on one page
    webhookUrl?: string; // URL to POST response data to
    passcode?: string; // Optional passcode to access the survey
}

export interface Profile {
    id: string;
    displayName?: string;
    avatarUrl?: string;
    subscriptionPlan: 'free' | 'pro' | 'enterprise';
    role: 'user' | 'admin';
    updatedAt: number;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    userId?: string;
    createdAt: number;
}

export interface Questionnaire {
    id: string;
    projectId?: string;
    title: string;
    description?: string;
    createdAt: number;
    updatedAt?: number;
    status: 'draft' | 'published';
    questions: Question[];
    settings?: QuestionnaireSettings;
}

export interface ResponseValue {
    questionId: string;
    value: string | number | boolean | string[]; // string[] for multi-select, boolean for yes/no
}

export interface QuestionnaireResponse {
    id: string;
    questionnaireId: string;
    submittedAt: number;
    answers: ResponseValue[];
}
