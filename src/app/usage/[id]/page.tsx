'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getProjectUsageStats, ProjectUsageStats } from '../../actions';

export default function ProjectUsagePage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const [stats, setStats] = useState<ProjectUsageStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getProjectUsageStats(unwrappedParams.id);
                setStats(data);
            } catch (e) {
                console.error('Failed to load usage stats', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [unwrappedParams.id]);

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading usage statistics...</div>;
    if (!stats) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Project not found.</div>;

    const maxResponses = Math.max(...stats.monthlyTrend.map(m => m.responses), 1);

    return (
        <main className="container" style={{ padding: '2rem 0' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link href={`/project/${stats.projectId}`} style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'inline-block' }}>&larr; Back to {stats.projectName}</Link>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stats.projectName} - Usage</h1>
                <p style={{ color: 'var(--secondary-foreground)' }}>Usage statistics for this project</p>
            </div>

            {/* Overall Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Questionnaires</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.overall.totalQuestionnaires}</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Questions</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.overall.totalQuestions.toLocaleString()}</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Responses</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.overall.totalResponses.toLocaleString()}</p>
                </div>
            </div>

            {/* This Month Stats */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>📅 This Month</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius)' }}>
                        <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem' }}>New Questionnaires</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 600 }}>{stats.thisMonth.newQuestionnaires}</p>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius)' }}>
                        <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem' }}>New Responses</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 600 }}>{stats.thisMonth.newResponses.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>📊 Monthly Response Trend</h2>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '180px', padding: '1rem 0' }}>
                    {stats.monthlyTrend.map((m, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{m.responses.toLocaleString()}</span>
                            <div
                                style={{
                                    width: '100%',
                                    height: `${(m.responses / maxResponses) * 130}px`,
                                    minHeight: '4px',
                                    background: 'linear-gradient(180deg, var(--primary) 0%, #60a5fa 100%)',
                                    borderRadius: 'var(--radius) var(--radius) 0 0',
                                    transition: 'height 0.3s ease'
                                }}
                            />
                            <span style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>{m.month}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Per Questionnaire Usage */}
            <div className="card">
                <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>📋 Usage by Questionnaire</h2>
                {stats.perQuestionnaire.length === 0 ? (
                    <p style={{ color: 'var(--secondary-foreground)', textAlign: 'center', padding: '2rem' }}>
                        No questionnaires in this project yet.
                    </p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--secondary-foreground)', fontWeight: 500 }}>Questionnaire</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--secondary-foreground)', fontWeight: 500 }}>Questions</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--secondary-foreground)', fontWeight: 500 }}>This Month</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--secondary-foreground)', fontWeight: 500 }}>Total Responses</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.perQuestionnaire.map(q => (
                                <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                        <Link href={`/stats/${q.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                            {q.title}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--secondary-foreground)' }}>
                                        {q.questionCount}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        {q.thisMonthResponses > 0 && (
                                            <span style={{
                                                background: '#d1fae5',
                                                color: '#065f46',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem'
                                            }}>
                                                +{q.thisMonthResponses}
                                            </span>
                                        )}
                                        {q.thisMonthResponses === 0 && <span style={{ color: 'var(--secondary-foreground)' }}>-</span>}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                                        {q.totalResponses.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
}
