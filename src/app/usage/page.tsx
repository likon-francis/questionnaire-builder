'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Box, CheckCircle2, FileText, Layout, ListChecks, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { getUsageStats, UsageStats } from '../actions';

export default function UsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getUsageStats();
        setStats(data);
      } catch (e) {
        console.error('Failed to load usage stats', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
          <p style={{ color: 'var(--secondary-foreground)', fontWeight: 500 }}>Aggregating platform metrics...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1rem' }}>Data Unavailable</h2>
          <Link href="/" className="btn btn-primary">Return to Safety</Link>
        </div>
      </div>
    );
  }

  const maxResponses = Math.max(...stats.monthlyTrend.map(m => m.responses), 1);

  return (
    <main className="container" style={{ padding: '3rem 0 6rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '3.5rem' }}>
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
          Back to Projects
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Usage & Insights</h1>
            <p style={{ color: 'var(--secondary-foreground)', fontSize: '1.125rem' }}>A comprehensive overview of your platform activity and resource consumption.</p>
          </div>
          <div className="badge" style={{ padding: '0.625rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.875rem' }}>
            <TrendingUp size={16} style={{ marginRight: '0.5rem' }} />
            System Active
          </div>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Box size={20} style={{ color: 'var(--primary)' }} />
        Global Resource Summary
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layout size={16} />
            Total Projects
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.overall.totalProjects}</div>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
            <Layout size={100} />
          </div>
        </div>

        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} />
            Questionnaires
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)' }}>{stats.overall.totalQuestionnaires}</div>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
            <FileText size={100} />
          </div>
        </div>

        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ListChecks size={16} />
            Total Questions
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.overall.totalQuestions.toLocaleString()}</div>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
            <ListChecks size={100} />
          </div>
        </div>

        <div className="card" style={{ position: 'relative', overflow: 'hidden', background: 'var(--primary)', color: 'white' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={16} />
            Collected Responses
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.overall.totalResponses.toLocaleString()}</div>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1 }}>
            <MessageSquare size={100} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Monthly Trend Chart */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Monthly Response Trend</h2>
              <div className="badge">Last 6 Months</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', height: '240px', padding: '1rem 0', position: 'relative' }}>
              {/* Grid lines */}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: '25%', borderBottom: '1px dashed var(--border)', zIndex: 0 }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: '50%', borderBottom: '1px dashed var(--border)', zIndex: 0 }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: '75%', borderBottom: '1px dashed var(--border)', zIndex: 0 }} />

              {stats.monthlyTrend.map((m, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)' }}>{m.responses.toLocaleString()}</span>
                  <div
                    className="animate-fade-in"
                    style={{
                      width: '100%',
                      maxWidth: '60px',
                      height: `${(m.responses / maxResponses) * 160}px`,
                      minHeight: '8px',
                      background: i === stats.monthlyTrend.length - 1 ? 'linear-gradient(180deg, var(--primary) 0%, var(--accent) 100%)' : 'var(--secondary)',
                      borderRadius: '8px 8px 4px 4px',
                      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                      animationDelay: `${i * 0.1}s`,
                      boxShadow: i === stats.monthlyTrend.length - 1 ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--secondary-foreground)', fontWeight: 600 }}>{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per Project Usage */}
          <div className="card">
            <h2 style={{ marginBottom: '2rem', fontSize: '1.25rem' }}>Usage by Project</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--secondary-foreground)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>Project</th>
                    <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--secondary-foreground)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>Activity</th>
                    <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--secondary-foreground)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>Responses</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.perProject).map(([id, project]) => (
                    <tr key={id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        <Link href={`/project/${id}`} style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }} />
                          {project.name}
                        </Link>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                        {project.thisMonthResponses > 0 ? (
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#059669',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            +{project.thisMonthResponses} this month
                          </span>
                        ) : (Date.now() - (project.lastActivityAt || 0) < 30 * 24 * 60 * 60 * 1000) ? (
                          <span style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#2563eb',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            Active
                          </span>
                        ) : (
                          <span style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem' }}>No recent responses</span>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: 700 }}>
                        {project.totalResponses.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* This Month Highlight */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', color: 'rgba(255,255,255,0.7)' }}>Platform Activity</h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>Aggregated results for the current billing cycle.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>New Forms</div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.thisMonth.newQuestionnaires}</div>
              </div>
              <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Incoming Responses</div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.thisMonth.newResponses.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ marginTop: '3rem', padding: '1.25rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius)', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users size={20} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Need more capacity?</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>Upgrade your plan for unlimited responses and advanced logic.</p>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Quick Tips</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
                  <CheckCircle2 size={18} />
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)' }}>Regularly archive old projects to keep your dashboard clean.</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
                  <CheckCircle2 size={18} />
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)' }}>Use data tags to filter responses in the analytics view.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
