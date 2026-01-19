'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, Sparkles, Zap, Shield, Crown, ArrowRight, Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';

const PLANS = [
    {
        id: 'free',
        name: 'Starter',
        price: '$0',
        description: 'Perfect for small projects and personal use.',
        features: [
            'Up to 3 Projects',
            '10 Questionnaires',
            '100 monthly responses',
            'Basic Analytics',
            'Standard Support'
        ],
        icon: Zap,
        color: 'var(--secondary-foreground)'
    },
    {
        id: 'pro',
        name: 'Professional',
        price: '$29',
        description: 'Advanced features for growing businesses.',
        features: [
            'Unlimited Projects',
            'Unlimited Questionnaires',
            '5,000 monthly responses',
            'Advanced Analytics',
            'Export to CSV/Excel',
            'Priority Email Support',
            'Custom Webhooks'
        ],
        icon: Sparkles,
        color: 'var(--primary)',
        popular: true
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        description: 'Scalable solutions for large organizations.',
        features: [
            'Unlimited Everything',
            'White-label options',
            'Dedicated account manager',
            'SLA guarantees',
            'Advanced Security (SSO)',
            'Custom Integrations'
        ],
        icon: Crown,
        color: 'var(--accent)'
    }
];

export default function SubscriptionPage() {
    const [currentPlan, setCurrentPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('subscription_plan')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setCurrentPlan(profile.subscription_plan);
                }
            }
            setLoading(false);
        }
        loadProfile();
    }, []);

    const handleUpgrade = async (planId: string) => {
        if (planId === currentPlan) return;

        setUpdating(planId);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .update({ subscription_plan: planId })
                .eq('id', user.id);

            if (error) throw error;
            setCurrentPlan(planId);
            alert(`Succesfully upgraded to ${planId.toUpperCase()}!`);
        } catch (err: any) {
            console.error(err);
            alert('Failed to update subscription. Please try again.');
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>Loading plans...</div>;
    }

    return (
        <main>
            <section style={{
                padding: '6rem 0 4rem',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.4)',
                borderBottom: '1px solid var(--border)'
            }}>
                <div className="container">
                    <div className="badge" style={{ marginBottom: '1rem' }}>Pricing Plans</div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em' }}>
                        Choose the right plan for <br />
                        <span style={{ color: 'var(--primary)' }}>your survey needs.</span>
                    </h1>
                    <p style={{ color: 'var(--secondary-foreground)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
                        Simple, transparent pricing that scales with your business. No hidden fees.
                    </p>
                </div>
            </section>

            <div className="container" style={{ padding: '4rem 0' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '2rem',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrent = currentPlan === plan.id;

                        return (
                            <div key={plan.id} className="card animate-fade-in" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '3rem 2.5rem',
                                border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
                                position: 'relative',
                                transform: plan.popular ? 'scale(1.05)' : 'none',
                                zIndex: plan.popular ? 2 : 1,
                                background: plan.popular ? 'white' : 'rgba(255,255,255,0.7)'
                            }}>
                                {plan.popular && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-14px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        padding: '0.25rem 1rem',
                                        borderRadius: '99px',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Most Popular
                                    </div>
                                )}

                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: `${plan.color}10`,
                                        color: plan.color,
                                        borderRadius: '12px',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <Icon size={24} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{plan.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{plan.price}</span>
                                        {plan.id !== 'enterprise' && <span style={{ color: 'var(--secondary-foreground)' }}>/month</span>}
                                    </div>
                                    <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.9375rem', lineHeight: '1.6' }}>
                                        {plan.description}
                                    </p>
                                </div>

                                <div style={{ flex: 1, marginBottom: '2.5rem' }}>
                                    <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        What's included:
                                    </p>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                        {plan.features.map((feature, i) => (
                                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9375rem' }}>
                                                <div style={{
                                                    marginTop: '3px',
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '50%',
                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                    color: '#10b981',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Check size={12} strokeWidth={3} />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={updating === plan.id || isCurrent}
                                    className={plan.popular ? 'btn btn-primary' : 'btn btn-secondary'}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        opacity: isCurrent ? 0.7 : 1
                                    }}
                                >
                                    {updating === plan.id ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : isCurrent ? (
                                        'Current Plan'
                                    ) : (
                                        <>
                                            {plan.id === 'free' ? 'Stay Starter' : plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade Now'}
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <section style={{ padding: '8rem 0', background: 'var(--foreground)', color: 'white', textAlign: 'center' }}>
                <div className="container">
                    <Shield size={48} style={{ color: 'var(--primary)', marginBottom: '2rem' }} />
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Your data is safe with us.</h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
                        We use industry-standard encryption and security practices to ensure your data and your respondents' privacy are always protected.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h4 style={{ fontSize: '1.5rem', fontWeight: 700 }}>99.9%</h4>
                            <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>Uptime Guarantee</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h4 style={{ fontSize: '1.5rem', fontWeight: 700 }}>256-bit</h4>
                            <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>SSL Encryption</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h4 style={{ fontSize: '1.5rem', fontWeight: 700 }}>GDPR</h4>
                            <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>Compliant</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
