'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Folder, Layout, ListChecks, BarChart3, Clock, ArrowRight, X, Sparkles } from 'lucide-react';
import { Project } from '@/types/schema';
import { getProjects, getProjectStats, createProject } from './actions';

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Record<string, { questionnaireCount: number; questionCount: number; responseCount: number; thisMonthResponses: number }>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [data, statsData] = await Promise.all([
          getProjects(),
          getProjectStats()
        ]);
        setProjects(data);
        setStats(statsData);
      } catch (e) {
        console.error('Failed to load projects', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Please enter a project name');
      return;
    }
    try {
      const id = await createProject(newProjectName, newProjectDesc);
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      router.push(`/project/${id}`);
    } catch (e) {
      console.error('Failed to create project', e);
      alert('Failed to create project');
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
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'var(--secondary-foreground)', fontWeight: 500 }}>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <main style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '5rem 0 7rem',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border)',
        marginBottom: '3rem',
        background: 'rgba(255, 255, 255, 0.3)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '650px' }} className="animate-slide-in">
            <div className="badge" style={{ marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <Sparkles size={14} style={{ marginRight: '0.5rem' }} />
              Professional Survey Workspace
            </div>
            <h1 style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '1.5rem', fontWeight: 800 }}>
              Craft Insightful <br />
              <span style={{
                background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Questionnaires.</span>
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--secondary-foreground)', marginBottom: '2.5rem', maxWidth: '520px', lineHeight: '1.7' }}>
              Build, manage, and analyze your surveys with our premium workspace. Everything you need to gather meaningful data in one place.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                <Plus size={20} />
                Create New Project
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary-foreground)', fontSize: '0.875rem', fontWeight: 500 }}>
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
                Live System Status: Optimal
              </div>
            </div>
          </div>

          <div className="animate-fade-in" style={{
            width: '480px',
            height: '420px',
            position: 'relative',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-premium)',
            border: '8px solid white'
          }}>
            <img
              src="/hero.png"
              alt="Survey Illustration"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Background blobs */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
          zIndex: 0
        }} />
      </section>

      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Folder size={24} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Your Projects</h2>
            </div>
            <p style={{ color: 'var(--secondary-foreground)', fontSize: '1rem' }}>Manage and monitor your active survey campaigns from this central hub.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="glass" style={{ padding: '0.625rem 1.25rem', borderRadius: 'var(--radius)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layout size={16} />
              {projects.length} Total Projects
            </div>
          </div>
        </div>

        {/* List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
          {projects.length === 0 ? (
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
                <Folder size={64} style={{ opacity: 0.5 }} />
              </div>
              <div>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>No projects found</h3>
                <p style={{ fontSize: '1.125rem' }}>Start by creating your first project to organize your questionnaires.</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                <Plus size={20} />
                Create your first project
              </button>
            </div>
          ) : projects.map((p, idx) => {
            const projectStats = stats[p.id] || { questionnaireCount: 0, questionCount: 0, responseCount: 0 };
            return (
              <div key={p.id} className="card animate-fade-in" style={{
                display: 'flex',
                flexDirection: 'column',
                animationDelay: `${idx * 0.05}s`,
                padding: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: 'var(--primary)',
                    borderRadius: '12px'
                  }}>
                    <Folder size={24} />
                  </div>
                  <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    {projectStats.responseCount} Responses
                  </div>
                </div>

                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.375rem' }}>{p.name}</h3>
                <p style={{
                  color: 'var(--secondary-foreground)',
                  fontSize: '0.9375rem',
                  marginBottom: '1.75rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: '2.8rem',
                  lineHeight: '1.5'
                }}>
                  {p.description || 'Our comprehensive survey project designed to gather actionable insights from participants.'}
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1.25rem',
                  marginBottom: '2rem',
                  padding: '1.25rem',
                  background: 'rgba(241, 245, 249, 0.5)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary-foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em' }}>Questionnaires</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontWeight: 800, fontSize: '1.125rem' }}>
                      <Layout size={16} style={{ color: 'var(--primary)' }} />
                      {projectStats.questionnaireCount}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary-foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em' }}>Questions</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontWeight: 800, fontSize: '1.125rem' }}>
                      <ListChecks size={16} style={{ color: 'var(--accent)' }} />
                      {projectStats.questionCount}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.875rem', marginTop: 'auto' }}>
                  <Link href={`/project/${p.id}`} className="btn btn-primary" style={{ flex: 1.5 }}>
                    <Layout size={18} />
                    View Forms
                  </Link>
                  <Link href={`/usage/${p.id}`} className="btn btn-secondary" style={{ flex: 1 }}>
                    <BarChart3 size={18} />
                    Analytics
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setShowCreateModal(false)}>
          <div className="card animate-fade-in" style={{ maxWidth: '540px', width: '100%', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>New Project</h2>
                <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem' }}>Define your survey goal to get started</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ color: 'var(--secondary-foreground)', padding: '0.5rem', borderRadius: '50%', background: 'var(--secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div>
                <label className="label">Project Name</label>
                <input
                  className="input"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="e.g., Customer Satisfaction Survey 2024"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Description (Optional)</label>
                <textarea
                  className="input"
                  style={{ minHeight: '120px', resize: 'vertical', paddingTop: '0.875rem' }}
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  placeholder="Tell us a bit more about the objectives of this project..."
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleCreateProject} className="btn btn-primary" style={{ flex: 1.5 }}>
                  Create Workspace
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
