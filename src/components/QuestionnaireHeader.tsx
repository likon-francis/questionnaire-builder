'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, FileText, BarChart2, PieChart, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface QuestionnaireHeaderProps {
    activeId: string;
}

export default function QuestionnaireHeader({ activeId }: QuestionnaireHeaderProps) {
    const pathname = usePathname();
    const [projectId, setProjectId] = useState<string | null>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check auth first
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setShow(true);
        });

        if (!activeId || activeId === 'new') return;

        const fetchProject = async () => {
            const { data } = await supabase
                .from('questionnaires')
                .select('project_id')
                .eq('id', activeId)
                .single();
            if (data?.project_id) {
                setProjectId(data.project_id);
            }
        };
        fetchProject();
    }, [activeId]);

    const tabs = [
        { label: 'Setup', icon: Settings, path: `/builder/${activeId}` },
        { label: 'Preview', icon: FileText, path: `/survey/${activeId}` },
        { label: 'Stats', icon: BarChart2, path: `/stats/${activeId}` },
        { label: 'Report', icon: PieChart, path: `/report/${activeId}` },
        { label: 'Settings', icon: Settings, path: `/settings/${activeId}` },
    ];

    if (!show) return null;

    return (
        <div style={{
            background: 'white',
            borderBottom: '1px solid var(--border)',
            padding: '0.75rem 0',
            marginBottom: '2rem'
        }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                {/* Left: Back Button */}
                <div style={{ width: '200px' }}>
                    {projectId && (
                        <Link
                            href={`/project/${projectId}`}
                            className="btn btn-ghost"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'var(--secondary-foreground)',
                            }}
                        >
                            <ArrowLeft size={16} />
                            <span>Back to Project</span>
                        </Link>
                    )}
                </div>

                {/* Center: Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {tabs.map(item => {
                        const isMatch = pathname.startsWith(item.path);
                        const Icon = item.icon;

                        return (
                            <Link key={item.path} href={item.path} style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.875rem',
                                borderRadius: 'var(--radius)',
                                textDecoration: 'none',
                                color: isMatch ? 'var(--primary)' : 'var(--secondary-foreground)',
                                background: isMatch ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s',
                                border: isMatch ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent'
                            }}>
                                <Icon size={16} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Right: Spacer (to balance center) */}
                <div style={{ width: '200px' }} />
            </div>
        </div>
    );
}
