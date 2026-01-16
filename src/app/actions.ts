'use server';

import { supabase } from '@/lib/supabase';
import { Questionnaire, QuestionnaireResponse, Project } from '@/types/schema';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';


export async function getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }

    return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: new Date(row.created_at).getTime()
    }));
}

export async function getProject(id: string): Promise<Project | undefined> {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
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
    const id = Math.random().toString(36).substr(2, 9);
    const { error } = await supabase
        .from('projects')
        .insert({
            id,
            name,
            description: description || null
        });

    if (error) {
        throw new Error('Failed to create project: ' + error.message);
    }

    revalidatePath('/');
    return id;
}

export async function getQuestionnaires(projectId?: string): Promise<Questionnaire[]> {
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

    // Get all questionnaire IDs first
    const { data: questionnaires } = await supabase
        .from('questionnaires')
        .select('id');

    if (!questionnaires || questionnaires.length === 0) return {};

    // Get count for each questionnaire IN PARALLEL
    const countPromises = questionnaires.map(async (q) => {
        const { count } = await supabase
            .from('responses')
            .select('*', { count: 'exact', head: true })
            .eq('questionnaire_id', q.id);
        return { id: q.id, count: count || 0 };
    });

    const results = await Promise.all(countPromises);

    const counts: Record<string, number> = {};
    results.forEach(r => {
        counts[r.id] = r.count;
    });

    return counts;
}

export async function getProjectStats() {
    noStore();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get all projects
    const { data: projects, error: projError } = await supabase
        .from('projects')
        .select('id');

    if (projError || !projects) return {};

    // Get all questionnaires with project_id
    const { data: questionnaires, error: qError } = await supabase
        .from('questionnaires')
        .select('id, project_id, questions');

    if (qError || !questionnaires) return {};

    // Calculate stats per project using PARALLEL count queries
    const projectPromises = projects.map(async (project) => {
        const projectQuestionnaires = questionnaires.filter(q => q.project_id === project.id);

        const qIds = projectQuestionnaires.map(q => q.id);
        let responseCount = 0;
        let thisMonthResponses = 0;
        if (qIds.length > 0) {
            const [totalRes, monthRes] = await Promise.all([
                supabase.from('responses').select('*', { count: 'exact', head: true }).in('questionnaire_id', qIds),
                supabase.from('responses').select('*', { count: 'exact', head: true }).in('questionnaire_id', qIds).gte('submitted_at', startOfMonth)
            ]);
            responseCount = totalRes.count || 0;
            thisMonthResponses = monthRes.count || 0;
        }

        return {
            projectId: project.id,
            stats: {
                questionnaireCount: projectQuestionnaires.length,
                questionCount: projectQuestionnaires.reduce((sum, q) => sum + (q.questions?.length || 0), 0),
                responseCount,
                thisMonthResponses
            }
        };
    });

    const results = await Promise.all(projectPromises);

    const stats: Record<string, {
        questionnaireCount: number;
        questionCount: number;
        responseCount: number;
        thisMonthResponses: number;
    }> = {};

    results.forEach(r => {
        stats[r.projectId] = r.stats;
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
    }>;
    monthlyTrend: Array<{
        month: string;
        responses: number;
    }>;
}

export async function getUsageStats(): Promise<UsageStats> {
    noStore();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get all projects and questionnaires in parallel
    const [projectsResult, questionnairesResult] = await Promise.all([
        supabase.from('projects').select('id, name'),
        supabase.from('questionnaires').select('id, project_id, questions, created_at')
    ]);

    const projects = projectsResult.data || [];
    const questionnaires = questionnairesResult.data || [];

    // Run all top-level count queries in parallel
    const [totalResponseResult, thisMonthQResult, thisMonthRResult] = await Promise.all([
        supabase.from('responses').select('*', { count: 'exact', head: true }),
        supabase.from('questionnaires').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
        supabase.from('responses').select('*', { count: 'exact', head: true }).gte('submitted_at', startOfMonth)
    ]);

    // Calculate overall stats
    const totalQuestions = questionnaires.reduce((sum, q) => sum + (q.questions?.length || 0), 0);

    // Calculate per-project stats in PARALLEL
    const projectPromises = projects.map(async (project) => {
        const projectQIds = questionnaires.filter(q => q.project_id === project.id).map(q => q.id);

        if (projectQIds.length === 0) {
            return { projectId: project.id, name: project.name, thisMonthResponses: 0, totalResponses: 0 };
        }

        const [totalResult, thisMonthResult] = await Promise.all([
            supabase.from('responses').select('*', { count: 'exact', head: true }).in('questionnaire_id', projectQIds),
            supabase.from('responses').select('*', { count: 'exact', head: true }).in('questionnaire_id', projectQIds).gte('submitted_at', startOfMonth)
        ]);

        return {
            projectId: project.id,
            name: project.name,
            thisMonthResponses: thisMonthResult.count || 0,
            totalResponses: totalResult.count || 0
        };
    });

    // Calculate monthly trend in PARALLEL
    const monthPromises = Array.from({ length: 6 }, (_, idx) => {
        const i = 5 - idx;
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        return supabase
            .from('responses')
            .select('*', { count: 'exact', head: true })
            .gte('submitted_at', monthStart.toISOString())
            .lte('submitted_at', monthEnd.toISOString())
            .then(result => ({
                month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                responses: result.count || 0
            }));
    });

    // Wait for all parallel operations
    const [projectResults, monthResults] = await Promise.all([
        Promise.all(projectPromises),
        Promise.all(monthPromises)
    ]);

    // Build perProject object
    const perProject: UsageStats['perProject'] = {};
    projectResults.forEach(r => {
        perProject[r.projectId] = {
            name: r.name,
            thisMonthResponses: r.thisMonthResponses,
            totalResponses: r.totalResponses
        };
    });

    return {
        overall: {
            totalProjects: projects.length,
            totalQuestionnaires: questionnaires.length,
            totalQuestions,
            totalResponses: totalResponseResult.count || 0
        },
        thisMonth: {
            newQuestionnaires: thisMonthQResult.count || 0,
            newResponses: thisMonthRResult.count || 0
        },
        perProject,
        monthlyTrend: monthResults
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get project
    const { data: project } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .single();

    if (!project) return null;

    // Get questionnaires for this project
    const { data: questionnaires } = await supabase
        .from('questionnaires')
        .select('id, title, questions, created_at')
        .eq('project_id', projectId);

    const questionnaireIds = questionnaires?.map(q => q.id) || [];

    // Get total response count using count option
    let totalResponseCount = 0;
    let thisMonthResponsesCount = 0;

    if (questionnaireIds.length > 0) {
        const { count: total } = await supabase
            .from('responses')
            .select('*', { count: 'exact', head: true })
            .in('questionnaire_id', questionnaireIds);

        const { count: thisMonth } = await supabase
            .from('responses')
            .select('*', { count: 'exact', head: true })
            .in('questionnaire_id', questionnaireIds)
            .gte('submitted_at', startOfMonth);

        totalResponseCount = total || 0;
        thisMonthResponsesCount = thisMonth || 0;
    }

    // Calculate overall stats
    const totalQuestions = questionnaires?.reduce((sum, q) => sum + (q.questions?.length || 0), 0) || 0;

    // This month questionnaires
    const thisMonthQuestionnaires = questionnaires?.filter(q =>
        new Date(q.created_at) >= new Date(startOfMonth)
    ) || [];

    // Per questionnaire stats using count
    const perQuestionnaire: ProjectUsageStats['perQuestionnaire'] = [];
    for (const q of (questionnaires || [])) {
        const { count: qTotal } = await supabase
            .from('responses')
            .select('*', { count: 'exact', head: true })
            .eq('questionnaire_id', q.id);

        const { count: qThisMonth } = await supabase
            .from('responses')
            .select('*', { count: 'exact', head: true })
            .eq('questionnaire_id', q.id)
            .gte('submitted_at', startOfMonth);

        perQuestionnaire.push({
            id: q.id,
            title: q.title,
            questionCount: q.questions?.length || 0,
            thisMonthResponses: qThisMonth || 0,
            totalResponses: qTotal || 0
        });
    }
    perQuestionnaire.sort((a, b) => b.totalResponses - a.totalResponses);

    // Monthly trend (last 6 months) using count
    const monthlyTrend: ProjectUsageStats['monthlyTrend'] = [];
    for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        let monthCount = 0;
        if (questionnaireIds.length > 0) {
            const { count } = await supabase
                .from('responses')
                .select('*', { count: 'exact', head: true })
                .in('questionnaire_id', questionnaireIds)
                .gte('submitted_at', monthStart.toISOString())
                .lte('submitted_at', monthEnd.toISOString());
            monthCount = count || 0;
        }

        monthlyTrend.push({
            month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            responses: monthCount
        });
    }

    return {
        projectId: project.id,
        projectName: project.name,
        overall: {
            totalQuestionnaires: questionnaires?.length || 0,
            totalQuestions,
            totalResponses: totalResponseCount
        },
        thisMonth: {
            newQuestionnaires: thisMonthQuestionnaires.length,
            newResponses: thisMonthResponsesCount
        },
        perQuestionnaire,
        monthlyTrend
    };
}
