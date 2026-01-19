'use client';

import { useState } from 'react';
import { Sparkles, X, Loader2, MessageSquarePlus } from 'lucide-react';
import { generateAIQuestions } from '@/app/ai-actions';
import { Question } from '@/types/schema';

interface AIGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuestionsGenerated: (questions: Question[]) => void;
}

export default function AIGeneratorModal({ isOpen, onClose, onQuestionsGenerated }: AIGeneratorModalProps) {
    const [topic, setTopic] = useState('');
    const [count, setCount] = useState(5);
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const questions = await generateAIQuestions(topic, count, details);
            onQuestionsGenerated(questions);
            onClose();
        } catch (e: any) {
            setError(e.message || 'Failed to generate questions');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card animate-fade-in" style={{
                width: '100%',
                maxWidth: '500px',
                padding: '0',
                overflow: 'hidden',
                background: 'white',
                border: '1px solid var(--border)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(to right, #f8f9fa, white)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '32px', height: '32px',
                            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
                        }}>
                            <Sparkles size={18} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.125rem' }}>AI Question Generator</h3>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {error && (
                        <div style={{
                            background: '#fee2e2',
                            color: '#e11d48',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius)',
                            fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            What is this questionnaire about?
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g. Customer Satisfaction, Employee Feedback"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            How many questions? ({count})
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={count}
                            onChange={e => setCount(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--primary)' }}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Additional Details (Optional)
                        </label>
                        <textarea
                            className="input"
                            rows={3}
                            placeholder="Specific tone, audience, or key areas to cover..."
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            disabled={loading}
                            style={{ resize: 'none' }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: '#f9fafb',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem'
                }}>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        className="btn btn-primary"
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            paddingLeft: '1.5rem',
                            paddingRight: '1.5rem',
                            background: loading ? 'var(--secondary)' : 'linear-gradient(135deg, var(--primary), var(--accent))'
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Generate
                            </>
                        )}
                    </button>
                </div>
            </div>
            <style jsx>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
