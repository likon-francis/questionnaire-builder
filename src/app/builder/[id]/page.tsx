import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Share2, Plus, Trash2, GripVertical, Check, Copy, ExternalLink, Settings as SettingsIcon, ChevronRight, FileText } from 'lucide-react';
import { Questionnaire, Question, QuestionType } from '@/types/schema';
import { getQuestionnaire, saveQuestionnaire } from '../../actions';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const generateId = () => Math.random().toString(36).substr(2, 9);

function SortableItem(props: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.75rem'
    };
    return (
        <div ref={setNodeRef} style={style}>
            <div style={{ flex: 1 }}>
                {props.children}
            </div>
            <div {...attributes} {...listeners} style={{
                cursor: 'grab',
                width: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--secondary)',
                borderRadius: 'var(--radius)',
                flexShrink: 0,
                color: 'var(--secondary-foreground)',
                opacity: 0.5
            }}>
                <GripVertical size={20} />
            </div>
        </div>
    );
}

export default function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const router = useRouter();
    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [loading, setLoading] = useState(true);

    // Share / Integration State
    const [showShare, setShowShare] = useState(false);
    const [origin, setOrigin] = useState('');
    const [includePasscode, setIncludePasscode] = useState(false);

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const getShareUrl = () => {
        let url = `${origin}/survey/${id !== 'new' ? id : ''}?hideNav=true`;
        if (includePasscode && questionnaire?.settings?.passcode) {
            url += `&pass=${questionnaire.settings.passcode}`;
        }
        return url;
    };

    const shareUrl = getShareUrl();
    const embedCode = `<iframe src="${shareUrl}" width="100%" height="800px" frameborder="0"></iframe>`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        async function init() {
            if (id !== 'new') {
                const data = await getQuestionnaire(id);
                if (data) {
                    setQuestionnaire(data);
                } else {
                    setQuestionnaire({
                        id: id,
                        title: 'Untitled Questionnaire',
                        status: 'draft',
                        createdAt: Date.now(),
                        questions: []
                    });
                }
            } else {
                setQuestionnaire({
                    id: generateId(),
                    title: 'Untitled Questionnaire',
                    status: 'draft',
                    createdAt: Date.now(),
                    questions: []
                });
            }
            setLoading(false);
        }
        init();
    }, [id]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && questionnaire) {
            setQuestionnaire((items) => {
                if (!items) return null;
                const oldIndex = items.questions.findIndex((q) => q.id === active.id);
                const newIndex = items.questions.findIndex((q) => q.id === over?.id);
                return {
                    ...items,
                    questions: arrayMove(items.questions, oldIndex, newIndex)
                };
            });
        }
    };

    const addQuestion = () => {
        if (!questionnaire) return;
        const newQ: Question = {
            id: generateId(),
            title: 'New Question',
            type: 'text',
            required: true
        };
        setQuestionnaire(prev => prev ? ({ ...prev, questions: [...prev.questions, newQ] }) : null);
    };

    const updateQuestion = (qId: string, updates: Partial<Question>) => {
        setQuestionnaire(prev => prev ? ({
            ...prev,
            questions: prev.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
        }) : null);
    };

    const deleteQuestion = (qId: string) => {
        setQuestionnaire(prev => prev ? ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== qId)
        }) : null);
    }

    const save = async () => {
        if (!questionnaire) return;
        try {
            const cleanQuestions = questionnaire.questions.map(q => ({
                ...q,
                visibilityRules: q.visibilityRules?.filter(r => r.questionId && r.questionId.trim() !== '')
            }));

            await saveQuestionnaire({ ...questionnaire, questions: cleanQuestions, status: 'published' });

            if (id === 'new') {
                router.push(`/builder/${questionnaire.id}`);
            } else {
                alert('Saved!');
            }
        } catch (e) {
            console.error('Failed to save', e);
            alert('Failed to save questionnaire');
        }
    };

    if (loading) return <div className="container" style={{ padding: '4rem' }}>Loading...</div>;
    if (!questionnaire) return <div className="container">Error</div>;

    return (
        <div className="container" style={{ padding: '2rem 0', maxWidth: '800px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '2rem',
                alignItems: 'center',
                position: 'sticky',
                top: '60px',
                background: 'var(--background)',
                zIndex: 90,
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border)'
            }}>
                <input
                    className="input"
                    style={{ fontSize: '1.5rem', fontWeight: 600, border: 'none', padding: 0.5, height: 'auto', background: 'transparent' }}
                    value={questionnaire.title}
                    onChange={e => setQuestionnaire({ ...questionnaire, title: e.target.value })}
                    placeholder="Questionnaire Title"
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setShowShare(!showShare)} className="btn btn-secondary">
                        <Share2 size={18} />
                        Share
                    </button>
                    <button onClick={save} className="btn btn-primary">
                        <Save size={18} />
                        Save & Publish
                    </button>
                </div>
            </div>

            {/* Share Panel */}

            {showShare && (
                <div className="card animate-fade-in" style={{ marginBottom: '2rem', background: 'var(--surface)', border: '1px solid var(--primary)', position: 'relative' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Integration & Sharing</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem' }}>
                        <div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Public URL</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input className="input" readOnly value={shareUrl} />
                                    <button onClick={() => copyToClipboard(shareUrl)} className="btn btn-secondary">Copy</button>
                                </div>
                            </div>

                            {questionnaire?.settings?.passcode && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={includePasscode}
                                            onChange={e => setIncludePasscode(e.target.checked)}
                                        />
                                        Include Passcode in Link/QR Code
                                    </label>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', marginLeft: '1.5rem' }}>
                                        Warning: Anyone with this link can access the survey without entering the passcode manually.
                                    </p>
                                </div>
                            )}

                            <div style={{ marginBottom: '0.5rem' }}>
                                <label className="label">Embed Code (Iframe)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <textarea className="input" readOnly value={embedCode} style={{ height: '80px', fontFamily: 'monospace', fontSize: '0.875rem' }} />
                                    <button onClick={() => copyToClipboard(embedCode)} className="btn btn-secondary" style={{ height: 'auto' }}>Copy</button>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', marginTop: '0.5rem' }}>
                                    Use this code to embed the questionnaire into your existing website or application.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '1rem', borderRadius: 'var(--radius)' }}>
                            <QRCodeSVG value={shareUrl} size={150} />
                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'black' }}>Scan to View</p>
                        </div>
                    </div>
                </div>
            )}


            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={questionnaire.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                        {questionnaire.questions.map((q, index) => (
                            <SortableItem key={q.id} id={q.id}>
                                <div className="card animate-fade-in">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                        <h4 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FileText size={16} />
                                            Question {index + 1}
                                        </h4>
                                        <button onClick={() => deleteQuestion(q.id)}
                                            style={{
                                                color: '#ef4444',
                                                background: '#fee2e2',
                                                border: '1px solid #fca5a5',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                padding: '0.4rem 0.75rem'
                                            }}
                                            className="btn btn-ghost">
                                            <Trash2 size={14} />
                                            Delete
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr auto', gap: '1rem', marginBottom: '1rem', alignItems: 'end' }}>
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
                                        <div style={{ paddingBottom: '0.8rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={q.required}
                                                    onChange={e => updateQuestion(q.id, { required: e.target.checked })}
                                                />
                                                Required
                                            </label>
                                        </div>
                                    </div>

                                    {(q.type === 'single-select' || q.type === 'multi-select') && (
                                        <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius)' }}>
                                            <label className="label">Options (one per line)</label>
                                            <textarea
                                                className="input"
                                                style={{ height: 'auto', minHeight: '120px', padding: '0.75rem', resize: 'vertical' }}
                                                value={q.options?.map(o => o.label).join('\n') || ''}
                                                onChange={e => {
                                                    const opts = e.target.value.split('\n').map(s => ({ label: s, value: s }));
                                                    updateQuestion(q.id, { options: opts });
                                                }}
                                                placeholder="Yes&#10;No, maybe&#10;Definitely"
                                            />
                                        </div>
                                    )}

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
                                    </div>
                                </div>
                            </SortableItem>
                        ))}
                    </SortableContext>
                </DndContext>

                <button onClick={addQuestion} className="btn btn-secondary" style={{ padding: '2rem', borderStyle: 'dashed', borderWidth: '2px', width: '100%' }}>
                    + Add Question
                </button>
            </div>
        </div>
    );
}
