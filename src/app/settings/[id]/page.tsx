'use client';
import { useEffect, useState, use } from 'react';
import { Questionnaire } from '@/types/schema';
import { getQuestionnaire, saveQuestionnaire } from '../../actions';

export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [q, setQ] = useState<Questionnaire | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [perPage, setPerPage] = useState<number | ''>('');
    const [webhook, setWebhook] = useState('');
    const [passcode, setPasscode] = useState('');

    useEffect(() => {
        async function load() {
            const data = await getQuestionnaire(id);
            if (data) {
                setQ(data);
                setPerPage(data.settings?.questionsPerPage || '');
                setWebhook(data.settings?.webhookUrl || '');
                setPasscode(data.settings?.passcode || '');
            }
            setLoading(false);
        }
        load();
    }, [id]);

    const handleSave = async () => {
        if (!q) return;
        setSaving(true);
        try {
            const updated: Questionnaire = {
                ...q,
                settings: {
                    questionsPerPage: perPage === '' ? undefined : Number(perPage),
                    webhookUrl: webhook || undefined,
                    passcode: passcode || undefined
                }
            };
            await saveQuestionnaire(updated);
            alert('Settings saved!');
            setQ(updated);
        } catch (e) {
            console.error(e);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '4rem' }}>Loading...</div>;
    if (!q) return <div className="container" style={{ padding: '4rem' }}>Questionnaire not found</div>;

    return (
        <div className="container" style={{ padding: '2rem 0', maxWidth: '600px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Settings</h1>

            <div className="card">
                <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>General Settings</h3>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="label">Questions Per Page</label>
                    <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.5rem' }}>
                        Default is 5. Set to 0 to show all questions on one page.
                    </p>
                    <input
                        type="number"
                        className="input"
                        value={perPage}
                        onChange={e => setPerPage(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Default: 5"
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="label">Webhook URL</label>
                    <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.5rem' }}>
                        We will send a POST request with the response JSON to this URL upon submission.
                    </p>
                    <input
                        className="input"
                        value={webhook}
                        onChange={e => setWebhook(e.target.value)}
                        placeholder="https://api.yourapp.com/hook"
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="label">Access Passcode</label>
                    <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.5rem' }}>
                        Optional: Require users to enter this passcode to view the survey.
                    </p>
                    <input
                        className="input"
                        value={passcode}
                        onChange={e => setPasscode(e.target.value)}
                        placeholder="e.g. 1234"
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
