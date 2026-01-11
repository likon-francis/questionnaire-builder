'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Note: In a real app we would use imports from @/types/schema, but for this step ensuring types match
import { Questionnaire, Question, QuestionType, LogicRule } from '@/types/schema';
import { saveQuestionnaire } from '../actions';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function Builder() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectIdParam = searchParams.get('projectId');
    const projectId = projectIdParam && projectIdParam.trim() !== '' ? projectIdParam : undefined;

    const [questionnaire, setQuestionnaire] = useState<Questionnaire>({
        id: generateId(),
        projectId: projectId,
        title: 'Untitled Questionnaire',
        status: 'draft',
        createdAt: Date.now(),
        questions: []
    });

    const addQuestion = () => {
        const newQ: Question = {
            id: generateId(),
            title: 'New Question',
            type: 'text',
            required: true
        };
        setQuestionnaire(prev => ({ ...prev, questions: [...prev.questions, newQ] }));
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestionnaire(prev => ({
            ...prev,
            questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
        }));
    };

    const deleteQuestion = (id: string) => {
        setQuestionnaire(prev => ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== id)
        }));
    }

    const save = async () => {
        try {
            await saveQuestionnaire({ ...questionnaire, status: 'published' });
            // Redirect to project page if created from project, otherwise to home
            if (projectId) {
                router.push(`/project/${projectId}`);
            } else {
                router.push('/');
            }
        } catch (e) {
            console.error('Failed to save', e);
            alert('Failed to save questionnaire');
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 0', maxWidth: '800px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <input
                    className="input"
                    style={{ fontSize: '1.5rem', fontWeight: 600, border: 'none', padding: 0.5, height: 'auto', background: 'transparent' }}
                    value={questionnaire.title}
                    onChange={e => setQuestionnaire({ ...questionnaire, title: e.target.value })}
                    placeholder="Questionnaire Title"
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => router.push('/')} className="btn btn-ghost">Cancel</button>
                    <button onClick={save} className="btn btn-primary">Save & Publish</button>
                </div>
            </div>

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {questionnaire.questions.map((q, index) => (
                    <div key={q.id} className="card animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <h4 style={{ color: 'var(--primary)' }}>Question {index + 1}</h4>
                            <button onClick={() => deleteQuestion(q.id)} style={{ color: 'red', fontSize: '0.875rem' }} className="btn btn-ghost">Delete</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="label">Question Title</label>
                                <input className="input" value={q.title} onChange={e => updateQuestion(q.id, { title: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Type</label>
                                <select className="input" value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value as QuestionType })}>
                                    <option value="text">Text Input</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="boolean">Yes/No</option>
                                    <option value="single-select">Single Select</option>
                                    <option value="multi-select">Multi Select</option>
                                </select>
                            </div>
                        </div>

                        {/* Options for Select */}
                        {(q.type === 'single-select' || q.type === 'multi-select') && (
                            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius)' }}>
                                <label className="label">Options (one per line)</label>
                                <textarea
                                    className="input"
                                    style={{ height: 'auto', minHeight: '120px', padding: '0.75rem', resize: 'vertical' }}
                                    value={q.options?.map(o => o.label).join('\n') || ''}
                                    onChange={e => {
                                        // Split by newline to allow commas in options
                                        const opts = e.target.value.split('\n').map(s => ({ label: s, value: s }));
                                        updateQuestion(q.id, { options: opts });
                                    }}
                                    placeholder="Yes&#10;No, maybe&#10;Definitely"
                                />
                            </div>
                        )}
                        {/* Logic / Visibility */}
                        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span>Logic / Follow-Up Rule</span>
                                {(!q.visibilityRules || q.visibilityRules.length === 0) && (
                                    <button className="btn btn-sm btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', border: '1px solid var(--border)' }}
                                        onClick={() => updateQuestion(q.id, { visibilityRules: [{ questionId: '', operator: 'equals', value: '' }] })}>
                                        + Add Rule
                                    </button>
                                )}
                            </label>

                            {q.visibilityRules?.map((rule, rIndex) => (
                                <div key={rIndex} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)' }}>Show if</span>
                                    <select className="input" style={{ width: 'auto', minWidth: '120px' }}
                                        value={rule.questionId}
                                        onChange={e => {
                                            const newRules = [...(q.visibilityRules || [])];
                                            newRules[rIndex] = { ...rule, questionId: e.target.value };
                                            updateQuestion(q.id, { visibilityRules: newRules });
                                        }}
                                    >
                                        <option value="">Select Question</option>
                                        {questionnaire.questions.slice(0, index).map(prevQ => (
                                            <option key={prevQ.id} value={prevQ.id}>{prevQ.title}</option>
                                        ))}
                                    </select>
                                    <select className="input" style={{ width: 'auto' }}
                                        value={rule.operator}
                                        onChange={e => {
                                            const newRules = [...(q.visibilityRules || [])];
                                            newRules[rIndex] = { ...rule, operator: e.target.value as any };
                                            updateQuestion(q.id, { visibilityRules: newRules });
                                        }}
                                    >
                                        <option value="equals">Equals</option>
                                        <option value="not_equals">Does not equal</option>
                                        <option value="contains">Contains</option>
                                    </select>
                                    <input className="input" style={{ flex: 1, minWidth: '100px' }} placeholder="Value match"
                                        value={String(rule.value)}
                                        onChange={e => {
                                            const newRules = [...(q.visibilityRules || [])];
                                            newRules[rIndex] = { ...rule, value: e.target.value };
                                            updateQuestion(q.id, { visibilityRules: newRules });
                                        }}
                                    />
                                    <button onClick={() => updateQuestion(q.id, { visibilityRules: undefined })} className="btn btn-ghost" style={{ color: 'red', padding: '0.5rem' }}>x</button>
                                </div>
                            ))}
                            <p style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', marginTop: '0.5rem' }}>
                                Determines when this question is displayed. Leave empty to always show.
                            </p>
                        </div>

                    </div>
                ))}

                <button onClick={addQuestion} className="btn btn-secondary" style={{ padding: '2rem', borderStyle: 'dashed', borderWidth: '2px', width: '100%' }}>
                    + Add Question
                </button>
            </div>
        </div>
    );
}
