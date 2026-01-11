'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Hide if hideNav param is present
    if (searchParams.get('hideNav')) return null;

    // Extract ID if present (assuming routes like /builder/[id], /survey/[id], etc.)

    // We look for the 3rd segment usually: /section/id
    const segments = pathname?.split('/') || [];
    const activeSection = segments[1]; // builder, survey, stats, report
    const activeId = segments[2];

    const hasId = activeId && activeId !== 'new';

    return (
        <nav style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            padding: '0 1rem'
        }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', height: '60px', justifyContent: 'space-between' }}>

                {/* Left: Brand / Home */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link href="/" style={{ textDecoration: 'none', fontWeight: 700, fontSize: '1.25rem', color: 'var(--foreground)' }}>
                        SurveyApp
                    </Link>

                    {/* Dashboard Link (Always visible) */}
                    <Link href="/" style={{
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        color: pathname === '/' ? 'var(--primary)' : 'var(--secondary-foreground)',
                        fontWeight: 500
                    }}>
                        Dashboard
                    </Link>

                    {/* Usage Link */}
                    <Link href="/usage" style={{
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        color: pathname === '/usage' ? 'var(--primary)' : 'var(--secondary-foreground)',
                        fontWeight: 500
                    }}>
                        Usage
                    </Link>
                </div>


                {/* Center: Questionnaire Context Menu */}
                {hasId && (
                    <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--secondary)', padding: '0.25rem', borderRadius: 'var(--radius)' }}>
                        {[
                            { label: 'Setup', path: `/builder/${activeId}` },
                            { label: 'Form', path: `/survey/${activeId}` },
                            { label: 'Report', path: `/report/${activeId}` },
                            { label: 'Stat', path: `/stats/${activeId}` },
                            { label: 'Settings', path: `/settings/${activeId}` },
                        ].map(item => {
                            const isActive = pathname.startsWith(item.path.split('/')[1] === 'survey' ? item.path : item.path);
                            // Simple check: strict match or prefix? 
                            // Actually item.path is /builder/id. pathname is /builder/id. Match.
                            const isMatch = pathname === item.path;

                            return (
                                <Link key={item.path} href={item.path} style={{
                                    padding: '0.25rem 1rem',
                                    fontSize: '0.875rem',
                                    borderRadius: 'calc(var(--radius) - 2px)',
                                    textDecoration: 'none',
                                    color: isMatch ? 'var(--primary-foreground)' : 'var(--secondary-foreground)',
                                    background: isMatch ? 'var(--primary)' : 'transparent',
                                    fontWeight: 500,
                                    transition: 'all 0.2s'
                                }}>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Right: Actions / Back -- REMOVED as per request */}
                <div></div>

            </div>
        </nav>
    );
}
