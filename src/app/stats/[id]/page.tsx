'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Questionnaire, QuestionnaireResponse, Question } from '@/types/schema';
import { getQuestionnaire, getResponses } from '../../actions';

import QuestionnaireHeader from '@/components/QuestionnaireHeader';

export default function StatsViewer() {
    const params = useParams();
    const id = params?.id as string;
    const [q, setQ] = useState<Questionnaire | null>(null);
    const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);

    useEffect(() => {
        if (!id) return;
        async function load() {
            const foundQ = await getQuestionnaire(id);
            if (foundQ) setQ(foundQ);

            const foundR = await getResponses(id);
            setResponses(foundR);
        }
        load();
    }, [id]);

    if (!q) return <div className="container" style={{ padding: '4rem' }}>Loading...</div>;

    return (
        <>
            <QuestionnaireHeader activeId={id} />
            <div className="container" style={{ padding: '2rem 0' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem' }}>Statistics: {q.title}</h1>
                    <p style={{ color: 'var(--secondary-foreground)' }}>Total Responses: <strong style={{ color: 'var(--primary)' }}>{responses.length}</strong></p>
                </div>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    {q.questions.map(question => {
                        const questionResponses = responses.map(r => r.answers.find(a => a.questionId === question.id)?.value).filter(v => v !== undefined && v !== '');

                        return (
                            <div key={question.id} className="card">
                                <h3 style={{ marginBottom: '1rem' }}>{question.title}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '1rem' }}>
                                    Answered: {questionResponses.length} / {responses.length}
                                </p>

                                {/* Analysis based on type */}
                                {(question.type === 'single-select' || question.type === 'multi-select') ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {question.options?.map(opt => {
                                            const count = questionResponses.filter(v =>
                                                Array.isArray(v) ? v.includes(opt.value) : v === opt.value
                                            ).length;
                                            const percent = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;

                                            return (
                                                <div key={opt.value}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                                        <span>{opt.label}</span>
                                                        <span>{count} ({percent}%)</span>
                                                    </div>
                                                    <div style={{ height: '8px', width: '100%', background: 'var(--secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${percent}%`, background: 'var(--primary)' }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                                        <ul style={{ listStyle: 'none', fontSize: '0.875rem' }}>
                                            {questionResponses.slice(0, 10).map((res, i) => (
                                                <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                                    {String(res)}
                                                </li>
                                            ))}
                                            {questionResponses.length > 10 && <li style={{ paddingTop: '0.5rem', color: 'var(--secondary-foreground)' }}>...and {questionResponses.length - 10} more</li>}
                                            {questionResponses.length === 0 && <li style={{ color: 'var(--secondary-foreground)' }}>No text responses yet.</li>}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
