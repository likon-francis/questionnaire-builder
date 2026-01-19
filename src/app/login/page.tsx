'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, Github, Mail, Lock, Loader2, Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                // ALWAYS treat input as username and resolve to email
                const { data: resolvedEmail, error: lookupError } = await supabase.rpc('get_email_by_username', {
                    p_username: email // 'email' state variable now holds the username input
                });

                if (lookupError || !resolvedEmail) {
                    throw new Error('Invalid username or password.');
                }

                const { error } = await supabase.auth.signInWithPassword({
                    email: resolvedEmail,
                    password,
                });
                if (error) throw error;
            } else {
                // Validation for username (simple check)
                if (name.length < 3) throw new Error('Username must be at least 3 characters.');

                // For signup, we still need the email address to create the account
                // BUT we need to distinguish between the 'username' field and 'email' field.
                // Re-using the 'name' state for Username for now, but UI needs clarity.
                // Let's assume the user enters: Username, Email, Password.

                const { error } = await supabase.auth.signUp({
                    email, // This is the actual email address field
                    password,
                    options: {
                        data: {
                            username: name, // Using 'name' state for Username
                            display_name: name, // Default display name to username
                        },
                    },
                });
                if (error) throw error;
                alert('Success! Please check your email for the confirmation link.');
            }
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.05) 0%, transparent 40%), radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.05) 0%, transparent 40%), var(--background)',
            padding: '2rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '450px',
                position: 'relative'
            }}>
                {/* Decorative Elements */}
                <div style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '-40px',
                    width: '120px',
                    height: '120px',
                    background: 'var(--primary)',
                    opacity: 0.1,
                    filter: 'blur(60px)',
                    borderRadius: '50%',
                    zIndex: 0
                }} />

                <div className="card animate-fade-in" style={{
                    padding: '3rem',
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.5)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            background: 'var(--primary)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            margin: '0 auto 1.5rem',
                            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)'
                        }}>
                            <Sparkles size={32} />
                        </div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                            {mode === 'login' ? 'Welcome Back' : 'Get Started'}
                        </h1>
                        <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.9375rem' }}>
                            {mode === 'login' ? 'Sign in with your username' : 'Create an account to build insightful questionnaires'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {mode === 'signup' && (
                            <div>
                                <label className="label">Username</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="username"
                                        style={{ paddingLeft: '2.75rem' }}
                                    />
                                    <UserPlus size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="label">{mode === 'login' ? 'Username' : 'Email Address'}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="input"
                                    type={mode === 'login' ? 'text' : 'email'}
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={mode === 'login' ? 'username' : 'name@example.com'}
                                    style={{ paddingLeft: '2.75rem' }}
                                />
                                {mode === 'login' ? (
                                    <UserPlus size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                ) : (
                                    <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                )}
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="label" style={{ marginBottom: 0 }}>Password</label>
                                {mode === 'login' && (
                                    <button type="button" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                                        Forgot?
                                    </button>
                                )}
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="input"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ paddingLeft: '2.75rem' }}
                                    minLength={6}
                                />
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                padding: '0.875rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: 'var(--radius)',
                                color: '#ef4444',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                textAlign: 'center'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                fontSize: '1rem',
                                marginTop: '0.5rem',
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div style={{
                        marginTop: '2rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: 'var(--secondary-foreground)'
                    }}>
                        {mode === 'login' ? (
                            <>
                                Don't have an account?{' '}
                                <button
                                    onClick={() => setMode('signup')}
                                    style={{ color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    Sign Up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <button
                                    onClick={() => setMode('login')}
                                    style={{ color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    Sign In
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
