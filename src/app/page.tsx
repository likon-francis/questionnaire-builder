'use client';



import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

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



  if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading projects...</div>;



  return (

    <main className="container" style={{ padding: '2rem 0' }}>

      {/* Header */}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>

        <div>

          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Projects</h1>

          <p style={{ color: 'var(--secondary-foreground)' }}>Select a project to view its questionnaires</p>

        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">

          + New Project

        </button>

      </div>



      {/* Create Project Modal */}

      {showCreateModal && (

        <div style={{

          position: 'fixed',

          top: 0,

          left: 0,

          right: 0,

          bottom: 0,

          background: 'rgba(0,0,0,0.5)',

          display: 'flex',

          alignItems: 'center',

          justifyContent: 'center',

          zIndex: 1000

        }} onClick={() => setShowCreateModal(false)}>

          <div className="card" style={{ maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>

            <h2 style={{ marginBottom: '1rem' }}>Create New Project</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div>

                <label className="label">Project Name</label>

                <input

                  className="input"

                  value={newProjectName}

                  onChange={e => setNewProjectName(e.target.value)}

                  placeholder="e.g., Marketing Surveys"

                  autoFocus

                />

              </div>

              <div>

                <label className="label">Description (Optional)</label>

                <textarea

                  className="input"

                  style={{ minHeight: '80px', resize: 'vertical' }}

                  value={newProjectDesc}

                  onChange={e => setNewProjectDesc(e.target.value)}

                  placeholder="Brief description of this project"

                />

              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>

                <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost">Cancel</button>

                <button onClick={handleCreateProject} className="btn btn-primary">Create Project</button>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* List */}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {projects.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--secondary-foreground)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)' }}>
            <p style={{ marginBottom: '1rem' }}>No projects found.</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-secondary">Create your first project</button>
          </div>
        ) : projects.map(p => {
          const projectStats = stats[p.id] || { questionnaireCount: 0, questionCount: 0 };
          return (
            <div key={p.id} className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{p.name}</h3>
              <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                {p.description || 'No description'}
              </p>
              <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {projectStats.questionnaireCount} Questionnaire{projectStats.questionnaireCount !== 1 ? 's' : ''} | {projectStats.questionCount} Question{projectStats.questionCount !== 1 ? 's' : ''}
              </p>
              

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>

                <Link href={`/project/${p.id}`} className="btn btn-primary"

                  style={{

                    flex: 1,

                    display: 'flex',

                    alignItems: 'center',

                    justifyContent: 'center',

                    gap: '0.5rem'

                  }}>

                  Questionnaires

                </Link>

                <Link href={`/usage/${p.id}`} className="btn btn-secondary"

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

                  Usage

                </Link>

              </div>

            </div>

          );

        })}

      </div>

    </main>

  );

}





