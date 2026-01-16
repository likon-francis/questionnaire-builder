'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, BarChart2, Settings, FileText, PieChart, Activity, Box } from 'lucide-react';

export default function Navigation() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Hide if hideNav param is present
    if (searchParams.get('hideNav')) return null;

    // Extract ID if present (assuming routes like /builder/[id], /survey/[id], etc.)
    const segments = pathname?.split('/') || [];
    const activeSection = segments[1];
    const activeId = segments[2];

    const hasId = activeId && activeId !== 'new';

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
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
                        InsightFlow
                    </Link>

                    {/* Nav Links */}
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


                {/* Center/Right: Questionnaire Context Menu */}
                {hasId && (
                    <div className="glass" style={{
                        display: 'flex',
                        gap: '0.25rem',
                        background: 'rgba(241, 245, 249, 0.5)',
                        padding: '0.375rem',
                        borderRadius: 'var(--radius)',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        {[
                            { label: 'Setup', icon: Settings, path: `/builder/${activeId}` },
                            { label: 'Preview', icon: FileText, path: `/survey/${activeId}` },
                            { label: 'Stats', icon: BarChart2, path: `/stats/${activeId}` },
                            { label: 'Report', icon: PieChart, path: `/report/${activeId}` },
                            { label: 'Settings', icon: Settings, path: `/settings/${activeId}` },
                        ].map(item => {
                            const isMatch = pathname.startsWith(item.path);
                            const Icon = item.icon;

                            return (
                                <Link key={item.path} href={item.path} style={{
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.875rem',
                                    borderRadius: 'calc(var(--radius) - 4px)',
                                    textDecoration: 'none',
                                    color: isMatch ? 'white' : 'var(--secondary-foreground)',
                                    background: isMatch ? 'var(--primary)' : 'transparent',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isMatch ? '0 4px 6px -1px rgba(99, 102, 241, 0.2)' : 'none'
                                }}>
                                    <Icon size={16} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Placeholder for Profile or Notification */}
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--secondary)', border: '1px solid var(--border)' }} />
                </div>

            </div>
        </nav>
    );
}
