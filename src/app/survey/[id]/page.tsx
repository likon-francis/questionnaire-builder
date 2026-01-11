'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Questionnaire, Question, LogicRule } from '@/types/schema';
import { getQuestionnaire, submitResponse } from '../../actions';

export default function SurveyViewer() {
    const params = useParams();
    const id = params?.id as string;
    const searchParams = useSearchParams();

    const [q, setQ] = useState<Questionnaire | null>(null);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitted, setSubmitted] = useState(false);
    const [page, setPage] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Auth State
    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const [passcodeInput, setPasscodeInput] = useState('');

    useEffect(() => {
        if (!id) return;
        async function load() {
            const found = await getQuestionnaire(id);
            if (found) {
                setQ(found);

                // Check Passcode
                const requiredPass = found.settings?.passcode;
                if (!requiredPass) {
                    setAuthorized(true);
                } else {
                    const urlPass = searchParams.get('pass');
                    if (urlPass === requiredPass) {
                        setAuthorized(true);
                    } else {
                        setAuthorized(false);
                    }
                }
            }
        }
        load();
    }, [id, searchParams]); // warning: searchParams in dep? yes.

    const handlePasscodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (q?.settings?.passcode && passcodeInput === q.settings.passcode) {
            setAuthorized(true);
        } else {
            alert('Incorrect Passcode');
        }
    };

    const isVisible = (question: Question): boolean => {
        if (!question.visibilityRules || question.visibilityRules.length === 0) return true;
        return question.visibilityRules.every(rule => {
            if (!rule.questionId) return true;
            const dependentAnswer = answers[rule.questionId];
            if (dependentAnswer === undefined || dependentAnswer === '' || dependentAnswer === null) return false;
            const targetVal = rule.value;
            switch (rule.operator) {
                case 'equals': return String(dependentAnswer) == String(targetVal);
                case 'not_equals': return String(dependentAnswer) != String(targetVal);
                case 'contains': return String(dependentAnswer).includes(String(targetVal));
                default: return true;
            }
        });
    };

    const handleBack = () => {
        if (page > 0) {
            setPage(p => p - 1);
            window.scrollTo(0, 0);
        }
    };

    // Render
    if (!q && !submitted) return <div className="container" style={{ padding: '4rem' }}>Loading...</div>;

    if (authorized === false) {
        return (
            <div className="container" style={{ padding: '4rem 0', maxWidth: '400px', textAlign: 'center' }}>
                <div className="card">
                    <h2 style={{ marginBottom: '1rem' }}>Enter Passcode</h2>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--secondary-foreground)' }}>This survey is password protected.</p>
                    <form onSubmit={handlePasscodeSubmit}>
                        <input
                            type="password"
                            className="input"
                            style={{ marginBottom: '1rem' }}
                            value={passcodeInput}
                            onChange={e => setPasscodeInput(e.target.value)}
                            placeholder="Passcode"
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Access Survey
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Pagination Helper
    // Default to 5 if undefined. If 0, it means all on one page (but we need to ensure 0 is treated as such if intent was 'all').
    // User request: "default value for number of question per page is 5"
    // So if settings.questionsPerPage is undefined, use 5. 
    // If it is explicitly 0, we can treat it as 'all'.
    // Let's assume 0 denotes 'infinite' or 'all', and undefined defaults to 5.
    const settingVal = q?.settings?.questionsPerPage;
    const perPage = (settingVal === undefined) ? 5 : settingVal;

    // We should only count *visible* questions? No, usually pagination is based on defined order.
    // However, if a whole page is hidden, that's awkward.
    // Let's stick to simple slicing of the *filtered* visible questions?
    // Actually, logic rules might depend on future questions? No, usually previous.
    // If we paginate, we must allow going back.

    // Simplest robust way: Render all, but CSS hide non-current page?
    // Or slice. Let's slice.

    // Filter visible questions FIRST?
    // If we do that, the total number of pages changes dynamically. That's actually good UX.
    // Let's try: Get ALL visible questions. Then paginate that list.

    const visibleQuestions = q?.questions.filter(isVisible) || [];
    const totalQuestions = visibleQuestions.length;
    const hasPagination = perPage > 0;
    const totalPages = hasPagination ? Math.ceil(totalQuestions / perPage) : 1;

    // Ensure page is valid
    if (page >= totalPages && totalPages > 0) setPage(totalPages - 1);

    const currentQuestions = hasPagination
        ? visibleQuestions.slice(page * perPage, (page + 1) * perPage)
        : visibleQuestions;



    const validate = (questionsToCheck: Question[]): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        questionsToCheck.forEach(q => {
            if (q.required) {
                const answer = answers[q.id];
                const isEmpty = answer === undefined || answer === null || answer === '' || (Array.isArray(answer) && answer.length === 0);

                if (isEmpty) {
                    newErrors[q.id] = 'This field is required';
                    isValid = false;
                }
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleNext = () => {
        if (!validate(currentQuestions)) return;
        if (page < totalPages - 1) {
            setPage(p => p + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        if (!q) return;
        if (!validate(currentQuestions)) return;
        try {
            const newResponse = {
                id: Math.random().toString(36).substr(2, 9),
                questionnaireId: id,
                submittedAt: Date.now(),
                answers: Object.entries(answers).map(([k, v]) => ({ questionId: k, value: v }))
            };
            await submitResponse(newResponse);
            setSubmitted(true);
        } catch (e) {
            console.error('Failed to submit', e);
            alert('Failed to submit response');
        }
    };

    if (submitted) return (
        // ... existing submitted UI ...
        <div className="container card" style={{ textAlign: 'center', marginTop: '4rem', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Thank you!</h2>
            <p style={{ marginBottom: '2rem' }}>Your response has been recorded.</p>
            <Link href="/" className="btn btn-primary">Back to Dashboard</Link>
        </div>
    );

    return (
        <div className="container" style={{ padding: '2rem 0', maxWidth: '600px' }}>
            <div className="card">
                <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>{q?.title}</h1>
                <p style={{ marginBottom: '2rem', color: 'var(--secondary-foreground)' }}>Please answer the following questions.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {currentQuestions.map(question => (
                        <div key={question.id} className="animate-fade-in">
                            <label className="label">
                                {question.title} {question.required && <span style={{ color: 'red' }}>*</span>}
                            </label>

                            {/* Render Input based on type */}
                            {question.type === 'text' && (
                                <input className={`input ${errors[question.id] ? 'input-error' : ''}`}
                                    style={errors[question.id] ? { borderColor: 'red' } : {}}
                                    value={answers[question.id] || ''}
                                    onChange={e => {
                                        setAnswers({ ...answers, [question.id]: e.target.value });
                                        if (errors[question.id]) setErrors({ ...errors, [question.id]: '' });
                                    }}
                                    placeholder="Your answer"
                                />
                            )}
                            {question.type === 'number' && (
                                <input className="input" type="number"
                                    style={errors[question.id] ? { borderColor: 'red' } : {}}
                                    value={answers[question.id] || ''}
                                    onChange={e => {
                                        setAnswers({ ...answers, [question.id]: Number(e.target.value) });
                                        if (errors[question.id]) setErrors({ ...errors, [question.id]: '' });
                                    }}
                                />
                            )}
                            {question.type === 'date' && (
                                <input className="input" type="date"
                                    style={errors[question.id] ? { borderColor: 'red' } : {}}
                                    value={answers[question.id] || ''}
                                    onChange={e => {
                                        setAnswers({ ...answers, [question.id]: e.target.value });
                                        if (errors[question.id]) setErrors({ ...errors, [question.id]: '' });
                                    }}
                                />
                            )}
                            {(question.type === 'single-select') && (
                                <select className="input"
                                    style={errors[question.id] ? { borderColor: 'red' } : {}}
                                    value={answers[question.id] || ''}
                                    onChange={e => {
                                        setAnswers({ ...answers, [question.id]: e.target.value });
                                        if (errors[question.id]) setErrors({ ...errors, [question.id]: '' });
                                    }}
                                >
                                    <option value="">Select...</option>
                                    {question.options?.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            )}
                            {question.type === 'multi-select' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem', border: errors[question.id] ? '1px solid red' : '1px solid transparent', borderRadius: 'var(--radius)' }}>
                                    {question.options?.map(o => (
                                        <label key={o.value} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
                                            <input type="checkbox"
                                                checked={((answers[question.id] as string[]) || []).includes(o.value)}
                                                onChange={e => {
                                                    const current = (answers[question.id] as string[]) || [];
                                                    let newVal;
                                                    if (e.target.checked) newVal = [...current, o.value];
                                                    else newVal = current.filter(v => v !== o.value);

                                                    setAnswers({ ...answers, [question.id]: newVal });
                                                    if (errors[question.id]) setErrors({ ...errors, [question.id]: '' });
                                                }}
                                            />
                                            {o.label}
                                        </label>
                                    ))}
                                </div>
                            )}
                            {question.type === 'boolean' && (
                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    border: errors[question.id] ? '1px solid red' : '1px solid transparent',
                                    borderRadius: 'var(--radius)',
                                    padding: '0.5rem'
                                }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem 1.5rem',
                                        background: answers[question.id] === true ? '#d1fae5' : 'var(--secondary)',
                                        border: answers[question.id] === true ? '2px solid #10b981' : '2px solid transparent',
                                        borderRadius: 'var(--radius)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}>
                                        <input
                                            type="radio"
                                            name={question.id}
                                            checked={answers[question.id] === true}
                                            onChange={() => {
                                                setAnswers({ ...answers, [question.id]: true });
                                                if (errors[question.id]) setErrors({ ...errors, [question.id]: '' });
                                            }}
                                            style={{ display: 'none' }}
                                        />
                                        <span style={{ fontWeight: answers[question.id] === true ? 600 : 400 }}>Yes</span>
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem 1.5rem',
                                        background: answers[question.id] === false ? '#fee2e2' : 'var(--secondary)',
                                        border: answers[question.id] === false ? '2px solid #ef4444' : '2px solid transparent',
                                        borderRadius: 'var(--radius)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}>
                                        <input
                                            type="radio"
                                            name={question.id}
                                            checked={answers[question.id] === false}
                                            onChange={() => {
                                                setAnswers({ ...answers, [question.id]: false });
                                                if (errors[question.id]) setErrors({ ...errors, [question.id]: '' });
                                            }}
                                            style={{ display: 'none' }}
                                        />
                                        <span style={{ fontWeight: answers[question.id] === false ? 600 : 400 }}>No</span>
                                    </label>
                                </div>
                            )}
                            {errors[question.id] && <span style={{ color: 'red', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors[question.id]}</span>}
                        </div>
                    ))}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        {hasPagination && page > 0 && (
                            <button onClick={handleBack} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                        )}

                        {(!hasPagination || page === totalPages - 1) ? (
                            <button onClick={handleSubmit} className="btn btn-primary" style={{ flex: 1 }}>
                                Submit Response
                            </button>
                        ) : (
                            <button onClick={handleNext} className="btn btn-primary" style={{ flex: 1 }}>
                                Next
                            </button>
                        )}
                    </div>
                    {hasPagination && <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--secondary-foreground)' }}>Page {page + 1} of {totalPages}</div>}
                </div>
            </div>
        </div>
    );
}
