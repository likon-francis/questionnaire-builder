'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Questionnaire, Project } from '@/types/schema';
import { getQuestionnaires, getProject, saveProject } from '../../actions';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const [list, setList] = useState<Questionnaire[]>([]);
    const [project, setProject] = useState<Project | undefined>();
    const [loading, setLoading] = useState(true);
    const [editedProject, setEditedProject] = useState<Project | undefined>();

    useEffect(() => {
        async function load() {
            try {
                const [data, proj] = await Promise.all([
                    getQuestionnaires(unwrappedParams.id),
                    getProject(unwrappedParams.id)
                ]);
                setList(data);
                setProject(proj);
                setEditedProject(proj);
            } catch (e) {
                console.error('Failed to load data', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [unwrappedParams.id]);

    const handleSave = async () => {
        if (!editedProject || !project) return;
        // Only save if changed
        if (editedProject.name === project.name && editedProject.description === project.description) return;

        try {
            await saveProject(editedProject);
            setProject(editedProject);
        } catch (e) {
            console.error('Failed to save project', e);
            alert('Failed to save project');
            // Revert on error
            setEditedProject(project);
        }
    };

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading project...</div>;

    if (!project) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Project not found.</div>;

    return (
        <main className="container" style={{ padding: '2rem 0' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/" style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'inline-block' }}>&larr; Back to Projects</Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <input
                        className="input"
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            border: 'none',
                            padding: '0.5rem',
                            height: 'auto',
                            background: 'transparent',
                            flex: 1
                        }}
                        value={editedProject?.name || ''}
                        onChange={e => setEditedProject(prev => prev ? { ...prev, name: e.target.value } : prev)}
                        onBlur={handleSave}
                        placeholder="Project Name"
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link href={`/builder/new?projectId=${project.id}`} className="btn btn-primary">
                            + New Questionnaire
                        </Link>
                    </div>
                </div>
                <input
                    className="input"
                    style={{
                        border: 'none',
                        padding: '0.5rem',
                        background: 'transparent',
                        color: 'var(--secondary-foreground)',
                        width: '100%'
                    }}
                    value={editedProject?.description || ''}
                    onChange={e => setEditedProject(prev => prev ? { ...prev, description: e.target.value } : prev)}
                    onBlur={handleSave}
                    placeholder="Project description"
                />
            </div>

            {/* List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {list.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--secondary-foreground)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                        <p style={{ marginBottom: '1rem' }}>No questionnaires in this project.</p>
                        <Link href={`/builder/new?projectId=${project.id}`} className="btn btn-secondary">Create one</Link>
                    </div>
                ) : list.map(q => (
                    <div key={q.id} className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{q.title}</h3>
                        <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                            {q.questions.length} Question{q.questions.length !== 1 ? 's' : ''} - {q.status === 'published' ? 'Published' : 'Draft'}
                        </p>
                        <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.75rem', marginBottom: '1.5rem', opacity: 0.8 }}>
                            Created: {new Date(q.createdAt).toLocaleDateString()}
                            {q.updatedAt ? ` ? Updated: ${new Date(q.updatedAt).toLocaleDateString()}` : ''}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            <Link href={`/survey/${q.id}`} className="btn btn-secondary"
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    background: '#d1fae5',
                                    color: '#065f46',
                                    border: '1px solid #6ee7b7'
                                }}>
                                View
                            </Link>
                            <Link href={`/stats/${q.id}`} className="btn btn-secondary"
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    background: '#f3f4f6',
                                    color: '#1f2937',
                                    border: '1px solid #e5e7eb'
                                }}>
                                Stats
                            </Link>
                            <Link href={`/builder/${q.id}`} className="btn btn-secondary"
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    background: '#fff7ed',
                                    color: '#9a3412',
                                    border: '1px solid #fdba74'
                                }}>
                                Edit
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
