'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, BarChart2, Settings, FileText, PieChart, Activity, Box, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Navigation() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);
    const [projectId, setProjectId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Extract ID if present (assuming routes like /builder/[id], /survey/[id], etc.)
    const segments = pathname?.split('/') || [];
    const activeSection = segments[1];
    const activeId = segments[2];

    const questionnaireSections = ['builder', 'survey', 'stats', 'report', 'settings'];
    const hasId = activeId && activeId !== 'new' && questionnaireSections.includes(activeSection);

    useEffect(() => {
        if (hasId) {
            supabase
                .from('questionnaires')
                .select('project_id')
                .eq('id', activeId)
                .single()
                .then(({ data }) => {
                    if (data?.project_id) {
                        setProjectId(data.project_id);
                    }
                });
        } else {
            setProjectId(null);
        }
    }, [activeId, hasId]);

    // Prevent hydration mismatch - return null until mounted
    if (!mounted) return null;

    // Hide if hideNav param is present OR if we are on a public survey page
    if (searchParams.get('hideNav') || pathname?.startsWith('/survey/')) return null;

    return (
        <nav style={{
            borderBottom: '1px solid var(--border)',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            padding: '0 1.5rem'
        }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', height: '72px', justifyContent: 'space-between' }}>

                {/* Left: Brand / Home */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link href="/" style={{
                        textDecoration: 'none',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        color: 'var(--foreground)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        letterSpacing: '-0.03em'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'var(--primary)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}>
                            <Activity size={20} strokeWidth={3} />
                        </div>
                        <span className="hidden-mobile">InsightFlow</span>
                    </Link>

                    {/* Global Nav Links - Always Visible */}
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <Link href="/" style={{
                            textDecoration: 'none',
                            fontSize: '0.9375rem',
                            color: pathname === '/' ? 'var(--primary)' : 'var(--secondary-foreground)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.25rem',
                            borderBottom: pathname === '/' ? '2px solid var(--primary)' : '2px solid transparent',
                            transition: 'all 0.2s'
                        }}>
                            <LayoutDashboard size={18} />
                            Dashboard
                        </Link>

                        <Link href="/usage" style={{
                            textDecoration: 'none',
                            fontSize: '0.9375rem',
                            color: pathname === '/usage' ? 'var(--primary)' : 'var(--secondary-foreground)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.25rem',
                            borderBottom: pathname === '/usage' ? '2px solid var(--primary)' : '2px solid transparent',
                            transition: 'all 0.2s'
                        }}>
                            <Box size={18} />
                            Resources
                        </Link>
                    </div>
                </div>

                {/* Right: Auth */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <NavLinks />
                    <AuthStatus />
                </div>
            </div>
        </nav>
    );
}

function NavLinks() {
    const pathname = usePathname();
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                setRole(profile?.role || 'user');
            } else {
                setRole(null);
            }
        };
        fetchRole();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) fetchRole();
            else setRole(null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const links = [
        { label: 'Admin', path: '/admin', role: 'admin' },
        { label: 'Pricing', path: '/subscription' },
    ].filter(link => !link.role || link.role === role);

    return (
        <div style={{ display: 'flex', gap: '1rem' }}>
            {links.map(link => (
                <Link key={link.path} href={link.path} style={{
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    color: pathname === link.path ? 'var(--primary)' : 'var(--secondary-foreground)',
                    fontWeight: 600,
                }}>
                    {link.label}
                </Link>
            ))}
        </div>
    );
}

function AuthStatus() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) return <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--secondary)' }} />;

    if (!user) {
        return (
            <Link href="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', textDecoration: 'none' }}>
                Sign In
            </Link>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Removed Text Display of Name/Email to save space */}
            <div style={{ position: 'relative' }}>
                <button
                    onClick={handleSignOut}
                    className="btn btn-ghost"
                    title={`Signed in as ${user.user_metadata?.display_name || user.email}`}
                    style={{ padding: '0.2rem', borderRadius: '50%', border: '2px solid transparent', transition: 'border-color 0.2s', cursor: 'pointer' }}
                >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        {user.user_metadata?.username?.[0].toUpperCase() || user.email?.[0].toUpperCase()}
                    </div>
                </button>
            </div>
        </div>
    );
}
