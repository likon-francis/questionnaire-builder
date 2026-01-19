'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Shield, Search, Filter, MoreVertical, Edit2, Trash2, Mail, Calendar, UserCheck, UserX, Loader2 } from 'lucide-react';

interface UserProfile {
    id: string;
    display_name: string;
    subscription_plan: string;
    role: string;
    updated_at: string;
}

export default function AdminPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function checkAdminAndLoadUsers() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!profile || profile.role !== 'admin') {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            setIsAdmin(true);
            const { data: allUsers, error } = await supabase
                .from('profiles')
                .select('*')
                .order('updated_at', { ascending: false });

            if (!error && allUsers) {
                setUsers(allUsers);
            }
            setLoading(false);
        }

        checkAdminAndLoadUsers();
    }, []);

    const updateUserRole = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            alert('Failed to update role');
        }
    };

    const updatePlan = async (userId: string, newPlan: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ subscription_plan: newPlan })
                .eq('id', userId);

            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, subscription_plan: newPlan } : u));
        } catch (err) {
            alert('Failed to update plan');
        }
    };

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Verifying admin access...</div>;

    if (isAdmin === false) {
        return (
            <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>
                <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <div style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                        <Shield size={40} />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Restricted Access</h2>
                    <p style={{ color: 'var(--secondary-foreground)', marginBottom: '2rem' }}>You do not have the required permissions to view this page. Please contact your system administrator.</p>
                    <button onClick={() => window.location.href = '/'} className="btn btn-primary">Back to Home</button>
                </div>
            </div>
        );
    }

    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [userProjects, setUserProjects] = useState<any[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);

    const toggleUser = async (userId: string) => {
        if (expandedUser === userId) {
            setExpandedUser(null);
            setUserProjects([]);
            return;
        }

        setExpandedUser(userId);
        setProjectsLoading(true);
        try {
            const { data } = await supabase
                .from('projects')
                .select('*, questionnaires(count)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            setUserProjects(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setProjectsLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.display_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.subscription_plan.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <main className="container" style={{ padding: '4rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                    <div className="badge" style={{ marginBottom: '1rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                        System Administration
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Account Management</h1>
                    <p style={{ color: 'var(--secondary-foreground)', fontSize: '1.125rem', marginTop: '0.5rem' }}>Manage user profiles, subscriptions, and system roles.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input
                            className="input"
                            placeholder="Search users..."
                            style={{ paddingLeft: '2.75rem', minWidth: '300px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ width: '40px' }}></th>
                            <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                            <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                            <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan</th>
                            <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Active</th>
                            <th style={{ textAlign: 'right', padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((u) => (
                            <>
                                <tr key={u.id} style={{ borderBottom: expandedUser === u.id ? 'none' : '1px solid var(--border)', transition: 'background 0.2s', background: expandedUser === u.id ? 'var(--secondary)' : 'transparent' }}>
                                    <td style={{ padding: '0 0 0 1rem' }}>
                                        <button onClick={() => toggleUser(u.id)} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}>
                                            {expandedUser === u.id ? '▼' : '▶'}
                                        </button>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', background: 'var(--background)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', border: '1px solid var(--border)' }}>
                                                {u.display_name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{u.display_name || 'Anonymous User'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>{u.id.substring(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <select
                                            value={u.role}
                                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                                            style={{
                                                background: u.role === 'admin' ? '#e0e7ff' : 'var(--background)',
                                                color: u.role === 'admin' ? '#4338ca' : 'var(--foreground)',
                                                border: '1px solid var(--border)',
                                                padding: '0.375rem 0.75rem',
                                                borderRadius: '6px',
                                                fontSize: '0.8125rem',
                                                fontWeight: 700
                                            }}
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <select
                                            value={u.subscription_plan}
                                            onChange={(e) => updatePlan(u.id, e.target.value)}
                                            style={{
                                                background: 'var(--background)',
                                                border: '1px solid var(--border)',
                                                padding: '0.375rem 0.75rem',
                                                borderRadius: '6px',
                                                fontSize: '0.8125rem'
                                            }}
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--secondary-foreground)', fontSize: '0.875rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={14} />
                                            {new Date(u.updated_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                        <button className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                                {expandedUser === u.id && (
                                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                                        <td colSpan={6} style={{ padding: '0 2rem 2rem 2rem' }}>
                                            <div style={{ background: 'var(--background)', borderRadius: 'var(--radius)', padding: '1.5rem', border: '1px solid var(--border)' }}>
                                                <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--secondary-foreground)' }}>User Content</h4>
                                                {projectsLoading ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--secondary-foreground)' }}>
                                                        <Loader2 className="animate-spin" size={16} /> Loading projects...
                                                    </div>
                                                ) : userProjects.length === 0 ? (
                                                    <p style={{ color: 'var(--secondary-foreground)', fontStyle: 'italic' }}>No projects found for this user.</p>
                                                ) : (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                                        {userProjects.map(p => (
                                                            <div key={p.id} style={{ padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'white' }}>
                                                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{p.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', marginBottom: '0.75rem' }}>
                                                                    Created {new Date(p.created_at).toLocaleDateString()}
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', display: 'flex', gap: '1rem' }}>
                                                                    <span>{p.questionnaires?.[0]?.count || 0} Questionnaires</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>
                        <Users size={48} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
                        <p>No users found matching your search.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
