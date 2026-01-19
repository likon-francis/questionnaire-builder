'use server';

import { createClient } from '@/lib/supabase-server';
import { Questionnaire, QuestionnaireResponse, Project } from '@/types/schema';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';


export async function getProjects(): Promise<Project[]> {
    noStore();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log('getProjects: No user found in session');
        return [];
    }

    console.log('getProjects: Fetching for user', user.id);

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }

    console.log('getProjects: Found projects:', data.length);

    return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        userId: row.user_id,
        createdAt: new Date(row.created_at).getTime()
    }));
}

export async function getProject(id: string): Promise<Project | undefined> {
    const supabase = await createClient();
    // Trim ID to handle any copy-paste or routing artifacts
    const cleanId = id.trim();

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', cleanId)
        .single();

    if (error || !data) return undefined;

    return {
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: new Date(data.created_at).getTime()
    };
}

export async function saveProject(project: Project): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('projects')
        .update({
            name: project.name,
            description: project.description
        })
        .eq('id', project.id);

    if (error) {
        throw new Error('Failed to save project: ' + error.message);
    }

    revalidatePath('/');
    revalidatePath(`/project/${project.id}`);
}

export async function createProject(name: string, description?: string): Promise<string> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Check subscription limits if necessary (Demo logic)
    const { data: profile } = await supabase.from('profiles').select('subscription_plan').eq('id', user.id).single();
    const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    if (profile?.subscription_plan === 'free' && (count || 0) >= 3) {
        throw new Error('Project limit reached. Please upgrade to Pro for unlimited projects.');
    }

    const id = Math.random().toString(36).substr(2, 9);
    console.log('Creating project for user:', user.id);

    const { error } = await supabase
        .from('projects')
        .insert({
            id,
            name,
            user_id: user.id,
            description: description || null
        });

    if (error) {
        console.error('Supabase Error:', error);
        throw new Error('Failed to create project: ' + error.message);
    }

    revalidatePath('/');
    return id;
}

export async function getQuestionnaires(projectId?: string): Promise<Questionnaire[]> {
    const supabase = await createClient();
    let query = supabase
        .from('questionnaires')
        .select('*')
        .order('created_at', { ascending: false });

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching questionnaires:', error);
        return [];
    }

    return data.map((row: any) => ({
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        status: row.status,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
        questions: row.questions,
        settings: row.settings
    }));
}

export async function getQuestionnaire(id: string): Promise<Questionnaire | undefined> {
    // QUESTIONNAIRE VIEW SHOULD BE PUBLIC (or protected by custom passcode logic, not RLS owner login)
    // We use the anon client here because RLS 'read' policy might restrict access if we use the server client with no user.
    // However, our standard RLS blocks public read.
    // We need a way to allow 'reading a specific questionnaire' if you have the ID.
    // OPTION 1: Use Service Role (Dangerous if not careful)
    // OPTION 2: Use a specific "public" RLS policy for questionnaires.
    // Earlier I set "Users can view questionnaires of their projects."
    // I need to ADD a policy: "Anyone can view questionnaires." (But maybe field restricted?)
    // For now, let's use the server client (which carries auth for admin/owner) BUT if it fails (no user), we might need a fallback?
    // User Requirement: "Respondents" need to see it.
    // IF the user is anonymous, createClient() returns an anon client.
    // Does RLS allow anon select?
    // The policy: EXISTS (SELECT 1 FROM public.projects WHERE projects.id = questionnaires.project_id AND projects.user_id = auth.uid())
    // This policy REQUIRES auth.uid() to match the project owner. So public users CANNOT see it.
    // FIX: We need to allow public read access for 'questionnaires' table?
    // Or at least for necessary fields.
    // Let's use the IMPORTED public shared client for this function to avoid the 'cookies' overhead if not needed,
    // BUT the real issue is RLS.
    // I will assume the admin wants surveys to be public.
    // I will use 'supabase' from imports to keep it simple, but I actually need to fix RLS.
    // Wait, the previous steps replaced 'supabase' logic with 'createClient'.
    // I will revert this specific function to use a client that can fetch it, OR I will modify RLS in the next step.
    // For now, let's use the local 'supabase' import (re-added) or the server client.
    // Actually, I should use the server client to be consistent, but I need to handle the RLS.
    // Let's keep using createClient() but I'll add a comment in my thought process to fix RLS.
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return undefined;

    return {
        id: data.id,
        projectId: data.project_id,
        title: data.title,
        status: data.status,
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : undefined,
        questions: data.questions,
        settings: data.settings
    };
}

export async function saveQuestionnaire(questionnaire: Questionnaire): Promise<void> {
    const supabase = await createClient();
    const now = new Date();
    const { error } = await supabase
        .from('questionnaires')
        .upsert({
            id: questionnaire.id,
            project_id: questionnaire.projectId,
            title: questionnaire.title,
            status: questionnaire.status,
            questions: questionnaire.questions,
            settings: questionnaire.settings || {},
            updated_at: now.toISOString(),
            created_at: questionnaire.createdAt ? new Date(questionnaire.createdAt).toISOString() : now.toISOString()
        });

    if (error) {
        throw new Error('Failed to save questionnaire: ' + error.message);
    }

    revalidatePath('/');
}

export async function deleteQuestionnaire(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('questionnaires')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error('Failed to delete questionnaire');
    }
    revalidatePath('/');
}

export async function submitResponse(response: QuestionnaireResponse): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('responses')
        .insert({
            id: response.id,
            questionnaire_id: response.questionnaireId,
            submitted_at: new Date(response.submittedAt).toISOString(),
            answers: response.answers
        });

    if (error) {
        throw new Error('Failed to submit response');
    }

    // Revalidate all pages that show response counts
    revalidatePath('/');
    revalidatePath('/usage');
    revalidatePath(`/stats/${response.questionnaireId}`);
    revalidatePath(`/report/${response.questionnaireId}`);

    // Also revalidate project page - need to find the project first
    const { data: questionnaire } = await supabase
        .from('questionnaires')
        .select('project_id')
        .eq('id', response.questionnaireId)
        .single();

    if (questionnaire?.project_id) {
        revalidatePath(`/project/${questionnaire.project_id}`);
        revalidatePath(`/usage/${questionnaire.project_id}`);
    }
}

export async function getResponses(questionnaireId: string): Promise<QuestionnaireResponse[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('questionnaire_id', questionnaireId)
        .order('submitted_at', { ascending: false });

    if (error) return [];

    return data.map((row: any) => ({
        id: row.id,
        questionnaireId: row.questionnaire_id,
        submittedAt: new Date(row.submitted_at).getTime(),
        answers: row.answers
    }));
}

export async function getResponseCounts(): Promise<Record<string, number>> {
    noStore();
    const supabase = await createClient();

    // Get counts for all questionnaires in a single query using the view
    const { data: stats, error } = await supabase
        .from('questionnaire_stats')
        .select('questionnaire_id, response_count');

    if (error) {
        console.error('Error fetching response counts:', error);
        return {};
    }

    const counts: Record<string, number> = {};
    stats.forEach(row => {
        counts[row.questionnaire_id] = Number(row.response_count);
    });

    return counts;
}

export async function getProjectStats() {
    noStore();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 1. Fetch all structural data needed in parallel
    const [
        { data: projects },
        { data: questionnaires },
        { data: totalStats },
        { data: monthResponses }
    ] = await Promise.all([
        supabase.from('projects').select('id').eq('user_id', user.id),
        supabase.from('questionnaires').select('id, project_id, questions'),
        supabase.from('questionnaire_stats').select('questionnaire_id, response_count'),
        supabase.from('responses').select('questionnaire_id').gte('submitted_at', startOfMonth)
    ]);

    if (!projects || !questionnaires) return {};

    // 2. Map responses to their counts for fast lookup
    const totalCountMap: Record<string, number> = {};
    totalStats?.forEach(s => totalCountMap[s.questionnaire_id] = Number(s.response_count));

    const monthCountMap: Record<string, number> = {};
    monthResponses?.forEach(r => {
        monthCountMap[r.questionnaire_id] = (monthCountMap[r.questionnaire_id] || 0) + 1;
    });

    // 3. Aggregate stats per project in memory
    const stats: Record<string, {
        questionnaireCount: number;
        questionCount: number;
        responseCount: number;
        thisMonthResponses: number;
    }> = {};

    projects.forEach(project => {
        const projectQuestionnaires = questionnaires.filter(q => q.project_id === project.id);

        let responseCount = 0;
        let thisMonthResponses = 0;
        let questionCount = 0;

        projectQuestionnaires.forEach(q => {
            responseCount += totalCountMap[q.id] || 0;
            thisMonthResponses += monthCountMap[q.id] || 0;
            questionCount += (q.questions?.length || 0);
        });

        stats[project.id] = {
            questionnaireCount: projectQuestionnaires.length,
            questionCount,
            responseCount,
            thisMonthResponses
        };
    });

    return stats;
}


export interface UsageStats {
    overall: {
        totalProjects: number;
        totalQuestionnaires: number;
        totalQuestions: number;
        totalResponses: number;
    };
    thisMonth: {
        newQuestionnaires: number;
        newResponses: number;
    };
    perProject: Record<string, {
        name: string;
        thisMonthResponses: number;
        totalResponses: number;
        lastActivityAt: number;
    }>;
    monthlyTrend: Array<{
        month: string;
        responses: number;
    }>;
}

export async function getUsageStats(): Promise<UsageStats> {
    noStore();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

    // 1. Fetch all data needed in parallel
    const [
        { data: projects },
        { data: questionnaires },
        totalResponseCountResult,
        thisMonthQuestionnaireResult,
        { data: totalStats },
        { data: recentResponses }
    ] = await Promise.all([
        supabase.from('projects').select('id, name').eq('user_id', user.id),
        supabase.from('questionnaires').select('id, project_id, questions, created_at, updated_at'),
        supabase.from('responses').select('id', { count: 'exact', head: true }),
        supabase.from('questionnaires').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
        supabase.from('questionnaire_stats').select('questionnaire_id, response_count'),
        supabase.from('responses').select('questionnaire_id, submitted_at').gte('submitted_at', sixMonthsAgo)
    ]);

    const projectData = projects || [];
    const questionnaireData = questionnaires || [];

    // 2. Pre-process response data for fast aggregation
    const totalCountMap: Record<string, number> = {};
    totalStats?.forEach(s => totalCountMap[s.questionnaire_id] = Number(s.response_count));

    const monthCountMap: Record<string, number> = {};
    const monthlyTrendData: Record<string, number> = {};

    recentResponses?.forEach(r => {
        const submittedAt = new Date(r.submitted_at);

        // Month Responses
        if (submittedAt >= new Date(startOfMonth)) {
            monthCountMap[r.questionnaire_id] = (monthCountMap[r.questionnaire_id] || 0) + 1;
        }

        // Trend Data
        const monthKey = submittedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyTrendData[monthKey] = (monthlyTrendData[monthKey] || 0) + 1;
    });

    // 3. Build per-project stats
    const perProject: UsageStats['perProject'] = {};
    projectData.forEach(p => {
        const pQs = questionnaireData.filter(q => q.project_id === p.id);
        const pQIds = pQs.map(q => q.id);
        let totalResponses = 0;
        let thisMonthResponses = 0;
        let lastActivityAt = 0;

        // Check latest edit time
        pQs.forEach(q => {
            const t = new Date(q.updated_at || q.created_at).getTime();
            if (t > lastActivityAt) lastActivityAt = t;
        });

        // Check responses time
        pQIds.forEach(id => {
            totalResponses += totalCountMap[id] || 0;
            thisMonthResponses += monthCountMap[id] || 0;
        });

        // Check recent response times for activity
        recentResponses?.forEach(r => {
            if (pQIds.includes(r.questionnaire_id)) {
                const t = new Date(r.submitted_at).getTime();
                if (t > lastActivityAt) lastActivityAt = t;
            }
        });

        perProject[p.id] = {
            name: p.name,
            thisMonthResponses,
            totalResponses,
            lastActivityAt
        };
    });

    // 4. Build monthly trend array (preserving order)
    const monthlyTrend = Array.from({ length: 6 }, (_, idx) => {
        const i = 5 - idx;
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return {
            month,
            responses: monthlyTrendData[month] || 0
        };
    });

    return {
        overall: {
            totalProjects: projectData.length,
            totalQuestionnaires: questionnaireData.length,
            totalQuestions: questionnaireData.reduce((sum, q) => sum + (q.questions?.length || 0), 0),
            totalResponses: totalResponseCountResult.count || 0
        },
        thisMonth: {
            newQuestionnaires: thisMonthQuestionnaireResult.count || 0,
            newResponses: Object.values(monthCountMap).reduce((a, b) => a + b, 0)
        },
        perProject,
        monthlyTrend
    };
}

export interface ProjectUsageStats {
    projectId: string;
    projectName: string;
    overall: {
        totalQuestionnaires: number;
        totalQuestions: number;
        totalResponses: number;
    };
    thisMonth: {
        newQuestionnaires: number;
        newResponses: number;
    };
    perQuestionnaire: Array<{
        id: string;
        title: string;
        questionCount: number;
        thisMonthResponses: number;
        totalResponses: number;
    }>;
    monthlyTrend: Array<{
        month: string;
        responses: number;
    }>;
}

export async function getProjectUsageStats(projectId: string): Promise<ProjectUsageStats | null> {
    noStore();
    const supabase = await createClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

    // 1. Fetch project and structural data
    const { data: project, error: pError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .single();

    if (!project) return null;

    // 2. Fetch all project related data in parallel
    const [
        { data: questionnaires },
        { data: totalStats },
        { data: recentResponses }
    ] = await Promise.all([
        supabase.from('questionnaires').select('id, title, questions, created_at').eq('project_id', projectId),
        supabase.from('questionnaire_stats').select('questionnaire_id, response_count'),
        supabase.from('responses').select('questionnaire_id, submitted_at').gte('submitted_at', sixMonthsAgo)
    ]);

    const qData = questionnaires || [];
    const qIds = qData.map(q => q.id);

    // 3. Pre-process response data
    const totalCountMap: Record<string, number> = {};
    totalStats?.forEach(s => totalCountMap[s.questionnaire_id] = Number(s.response_count));

    const monthCountMap: Record<string, number> = {};
    const monthlyTrendData: Record<string, number> = {};

    recentResponses?.forEach(r => {
        // Only process responses for questionnaires in THIS project
        if (!qIds.includes(r.questionnaire_id)) return;

        const submittedAt = new Date(r.submitted_at);

        if (submittedAt >= new Date(startOfMonth)) {
            monthCountMap[r.questionnaire_id] = (monthCountMap[r.questionnaire_id] || 0) + 1;
        }

        const monthKey = submittedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyTrendData[monthKey] = (monthlyTrendData[monthKey] || 0) + 1;
    });

    // 4. Build per-questionnaire stats
    const perQuestionnaire = qData.map(q => ({
        id: q.id,
        title: q.title,
        questionCount: q.questions?.length || 0,
        thisMonthResponses: monthCountMap[q.id] || 0,
        totalResponses: totalCountMap[q.id] || 0
    })).sort((a, b) => b.totalResponses - a.totalResponses);

    // 5. Build monthly trend
    const monthlyTrend = Array.from({ length: 6 }, (_, idx) => {
        const i = 5 - idx;
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return {
            month,
            responses: monthlyTrendData[month] || 0
        };
    });

    return {
        projectId: project.id,
        projectName: project.name,
        overall: {
            totalQuestionnaires: qData.length,
            totalQuestions: qData.reduce((sum, q) => sum + (q.questions?.length || 0), 0),
            totalResponses: perQuestionnaire.reduce((sum, q) => sum + q.totalResponses, 0)
        },
        thisMonth: {
            newQuestionnaires: qData.filter(q => new Date(q.created_at) >= new Date(startOfMonth)).length,
            newResponses: perQuestionnaire.reduce((sum, q) => sum + q.thisMonthResponses, 0)
        },
        perQuestionnaire,
        monthlyTrend
    };
}
