'use client';
import { useEffect, useState, use } from 'react';
import { useParams } from 'next/navigation';
import { Questionnaire, QuestionnaireResponse } from '@/types/schema';
import { getQuestionnaire, getResponses } from '../../actions';
import QuestionnaireHeader from '@/components/QuestionnaireHeader';

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const [q, setQ] = useState<Questionnaire | null>(null);
    const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [foundQ, foundR] = await Promise.all([
                getQuestionnaire(id),
                getResponses(id)
            ]);
            if (foundQ) setQ(foundQ);
            setResponses(foundR || []);
            setLoading(false);
        }
        load();
    }, [id]);

    if (loading) return <div className="container" style={{ padding: '4rem' }}>Loading...</div>;
    if (!q) return <div className="container" style={{ padding: '4rem' }}>Questionnaire not found.</div>;

    return (
        <>
            <QuestionnaireHeader activeId={id} />
            <div className="container" style={{ padding: '2rem 0' }}>
                <h1 style={{ marginBottom: '2rem' }}>Responses Report</h1>

                <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--secondary)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', minWidth: '150px' }}>Submitted At</th>
                                {q.questions.map(question => (
                                    <th key={question.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', minWidth: '200px' }}>
                                        {question.title}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {responses.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', color: 'var(--secondary-foreground)' }}>
                                        {new Date(r.submittedAt).toLocaleString()}
                                    </td>
                                    {q.questions.map(question => {
                                        const answer = r.answers.find(a => a.questionId === question.id);
                                        let displayValue = '-';

                                        if (answer) {
                                            if (Array.isArray(answer.value)) displayValue = answer.value.join(', ');
                                            else displayValue = String(answer.value);
                                        }

                                        return (
                                            <td key={question.id} style={{ padding: '1rem' }}>
                                                {displayValue}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {responses.length === 0 && (
                                <tr>
                                    <td colSpan={q.questions.length + 1} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>
                                        No responses yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
