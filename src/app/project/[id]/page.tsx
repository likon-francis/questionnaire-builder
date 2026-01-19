'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, FileText, BarChart2, Edit3, Eye, Calendar, Layout, Trash2, CheckCircle2, Clock, PieChart } from 'lucide-react';
import { Questionnaire, Project } from '@/types/schema';
import { getQuestionnaires, getProject, saveProject } from '../../actions';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const [list, setList] = useState<Questionnaire[]>([]);
    const [project, setProject] = useState<Project | undefined>();
    const [loading, setLoading] = useState(true);
    const [editedProject, setEditedProject] = useState<Project | undefined>();

    useEffect(() => {
        async function load() {
            try {
                // Decode the ID to ensure it matches the database value (handling potential URL encoding)
                const projectId = decodeURIComponent(unwrappedParams.id);
                const [data, proj] = await Promise.all([
                    getQuestionnaires(projectId),
                    getProject(projectId)
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
        if (editedProject.name === project.name && editedProject.description === project.description) return;

        try {
            await saveProject(editedProject);
            setProject(editedProject);
        } catch (e) {
            console.error('Failed to save project', e);
            alert('Failed to save project');
            setEditedProject(project);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid var(--secondary)',
                        borderTopColor: 'var(--primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: 'var(--secondary-foreground)', fontWeight: 500 }}>Loading project workspace...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>
                <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Project not found</h2>
                    <Link href="/" className="btn btn-primary">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <main className="container" style={{ padding: '3rem 0 6rem' }}>
            {/* Header & Navigation */}
            <div style={{ marginBottom: '3rem' }}>
                <Link href="/" style={{
                    color: 'var(--secondary-foreground)',
                    marginBottom: '1.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius)',
                    background: 'var(--secondary)'
                }}>
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '2rem' }}>
                    <div style={{ flex: 1 }}>
                        <input
                            className="input"
                            style={{
                                fontSize: '2.5rem',
                                fontWeight: 800,
                                border: 'none',
                                padding: '0.25rem 0',
                                height: 'auto',
                                background: 'transparent',
                                width: '100%',
                                marginBottom: '0.5rem',
                                color: 'var(--foreground)',
                                letterSpacing: '-0.025em'
                            }}
                            value={editedProject?.name || ''}
                            onChange={e => setEditedProject(prev => prev ? { ...prev, name: e.target.value } : prev)}
                            onBlur={handleSave}
                            placeholder="Unnamed Project"
                        />
                        <textarea
                            className="input"
                            style={{
                                border: 'none',
                                padding: '0',
                                background: 'transparent',
                                color: 'var(--secondary-foreground)',
                                width: '100%',
                                minHeight: '1.5rem',
                                height: 'auto',
                                resize: 'none',
                                fontSize: '1.125rem',
                                lineHeight: '1.5'
                            }}
                            rows={1}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${target.scrollHeight}px`;
                            }}
                            value={editedProject?.description || ''}
                            onChange={e => setEditedProject(prev => prev ? { ...prev, description: e.target.value } : prev)}
                            onBlur={handleSave}
                            placeholder="Add a project description..."
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
                        <Link href={`/builder/new?projectId=${project.id}`} className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
                            <Plus size={20} />
                            New Questionnaire
                        </Link>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div className="badge" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                        <FileText size={16} style={{ marginRight: '0.5rem' }} />
                        {list.length} Forms
                    </div>
                </div>
            </div>

            {/* Content List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
                {list.length === 0 ? (
                    <div style={{
                        gridColumn: '1/-1',
                        textAlign: 'center',
                        padding: '8rem 2rem',
                        color: 'var(--secondary-foreground)',
                        background: 'rgba(255,255,255,0.4)',
                        border: '2px dashed var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.5rem'
                    }}>
                        <div style={{ padding: '2rem', background: 'var(--secondary)', borderRadius: '50%', color: 'var(--primary)' }}>
                            <Layout size={64} style={{ opacity: 0.5 }} />
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>Your project is empty</h3>
                            <p style={{ fontSize: '1.125rem' }}>Launch your first questionnaire to start collecting responses.</p>
                        </div>
                        <Link href={`/builder/new?projectId=${project.id}`} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                            <Plus size={20} />
                            Create Questionnaire
                        </Link>
                    </div>
                ) : list.map((q, idx) => (
                    <div key={q.id} className="card animate-fade-in" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        animationDelay: `${idx * 0.05}s`,
                        padding: '1.75rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(139, 92, 246, 0.1)',
                                color: 'var(--accent)',
                                borderRadius: '10px'
                            }}>
                                <FileText size={20} />
                            </div>
                            <div className="badge" style={{
                                background: q.status === 'published' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: q.status === 'published' ? '#059669' : '#d97706',
                                textTransform: 'capitalize'
                            }}>
                                {q.status === 'published' ? <CheckCircle2 size={14} style={{ marginRight: '0.25rem' }} /> : <Clock size={14} style={{ marginRight: '0.25rem' }} />}
                                {q.status}
                            </div>
                        </div>

                        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>{q.title}</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary-foreground)', fontSize: '0.875rem' }}>
                                <Layout size={14} />
                                {q.questions.length} Questions
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary-foreground)', fontSize: '0.875rem' }}>
                                <Calendar size={14} />
                                Updated {new Date(q.updatedAt || q.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto' }}>
                            <Link href={`/survey/${q.id}`} className="btn btn-secondary" style={{ width: '100%' }}>
                                <Eye size={16} />
                                View
                            </Link>
                            <Link href={`/stats/${q.id}`} className="btn btn-secondary" style={{ width: '100%' }}>
                                <BarChart2 size={16} />
                                Stats
                            </Link>
                            <Link href={`/report/${q.id}`} className="btn btn-secondary" style={{ width: '100%' }}>
                                <PieChart size={16} />
                                Report
                            </Link>
                            <Link href={`/builder/${q.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                                <Edit3 size={16} />
                                Edit
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
