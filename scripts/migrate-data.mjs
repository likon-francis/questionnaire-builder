import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://jnxcgzzdbcqrozdtqgjo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpueGNnenpkYmNxcm96ZHRxZ2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTkwMDQsImV4cCI6MjA4MDk5NTAwNH0.PQr82xiwJFXe5VsTfKDX5vlXasUZx6aJAgGA6HAW9ME'
const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
    // Read questionnaires
    const questionnairesPath = path.join(__dirname, '../data/questionnaires.json')
    const questionnairesData = JSON.parse(fs.readFileSync(questionnairesPath, 'utf8'))

    console.log(`Found ${questionnairesData.length} questionnaires.`)

    for (const q of questionnairesData) {
        const { error } = await supabase
            .from('questionnaires')
            .upsert({
                id: q.id,
                title: q.title,
                status: q.status,
                created_at: new Date(q.createdAt).toISOString(),
                updated_at: q.updatedAt ? new Date(q.updatedAt).toISOString() : null,
                questions: q.questions,
                settings: q.settings || {}
            })

        if (error) {
            console.error(`Error migrating questionnaire ${q.id}:`, error)
        } else {
            console.log(`Migrated questionnaire ${q.id}`)
        }
    }

    // Read responses
    const responsesPath = path.join(__dirname, '../data/responses.json')
    if (fs.existsSync(responsesPath)) {
        const responsesData = JSON.parse(fs.readFileSync(responsesPath, 'utf8'))
        console.log(`Found ${responsesData.length} responses.`)

        for (const r of responsesData) {
            const { error } = await supabase
                .from('responses')
                .upsert({
                    id: r.id,
                    questionnaire_id: r.questionnaireId,
                    submitted_at: new Date(r.submittedAt).toISOString(),
                    answers: r.answers
                })

            if (error) {
                console.error(`Error migrating response ${r.id}:`, error)
            } else {
                console.log(`Migrated response ${r.id}`)
            }
        }
    } else {
        console.log('No responses.json found.')
    }
}

migrate()
