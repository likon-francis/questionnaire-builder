
import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'

// Get credentials from args or env (simulated here for script)
const supabaseUrl = 'https://jnxcgzzdbcqrozdtqgjo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpueGNnenpkYmNxcm96ZHRxZ2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTkwMDQsImV4cCI6MjA4MDk5NTAwNH0.PQr82xiwJFXe5VsTfKDX5vlXasUZx6aJAgGA6HAW9ME'

const supabase = createClient(supabaseUrl, supabaseKey)

// --- Generators ---

function generateQuestions(count = 50) {
    const questions = []
    const types = ['text', 'number', 'single-select', 'multi-select'] as const

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)]
        const id = faker.string.nanoid(9)

        let options
        if (type === 'single-select' || type === 'multi-select') {
            options = Array.from({ length: 4 }, () => {
                const val = faker.word.sample()
                return { label: val, value: val }
            })
        }

        // Add some random visibility logic to 20% of questions (skip first one)
        let visibilityRules = []
        if (i > 0 && Math.random() < 0.2) {
            const prevQ = questions[i - 1]
            if (prevQ.type === 'single-select' && prevQ.options) {
                visibilityRules.push({
                    questionId: prevQ.id,
                    operator: 'equals',
                    value: prevQ.options[0].value
                })
            }
        }

        questions.push({
            id,
            title: faker.lorem.sentence().replace('.', '?'),
            type,
            required: Math.random() > 0.3,
            options,
            visibilityRules
        })
    }
    return questions
}

function generateResponse(questionnaireId: string, questions: any[]) {
    const answers = []

    // Simulate real user behavior: only answer visible/required questions
    // For simplicity, we just answer everything randomly here

    for (const q of questions) {
        // 10% chance to skip optional questions
        if (!q.required && Math.random() < 0.1) continue

        let value
        switch (q.type) {
            case 'text':
                value = faker.lorem.words(3)
                break
            case 'number':
                value = faker.number.int({ min: 1, max: 100 })
                break
            case 'single-select':
                value = q.options[Math.floor(Math.random() * q.options.length)].value
                break
            case 'multi-select':
                value = [q.options[0].value, q.options[1].value] // simplified
                break
        }

        answers.push({
            questionId: q.id,
            value
        })
    }

    return {
        id: faker.string.nanoid(9), // Use same ID format as app
        questionnaire_id: questionnaireId,
        submitted_at: faker.date.recent({ days: 30 }).toISOString(),
        answers
    }
}

async function runTest() {
    console.log('Starting Performance Test Data Generation...')

    // 1. Fetch existing questionnaires
    const { data: questionnaires, error } = await supabase.from('questionnaires').select('*')
    if (error) throw error

    console.log(`Found ${questionnaires.length} questionnaires. Updating schemas...`)

    for (const q of questionnaires) {
        // 2. Generate new 50 questions
        const newQuestions = generateQuestions(50)

        // Update the questionnaire with NEW massive schema
        // We append to existing or replace? User said "generate 50 questions". 
        // Let's REPLACE to ensure clean state for testing, but keep ID.
        const { error: updateError } = await supabase
            .from('questionnaires')
            .update({
                questions: newQuestions,
                updated_at: new Date().toISOString()
            })
            .eq('id', q.id)

        if (updateError) console.error('Error updating Q:', q.id, updateError)
        else console.log(`Updated Questionnaire ${q.id} with 50 questions.`)

        // 3. Generate 100 responses
        console.log(`Generating 100 responses for ${q.id}...`)
        const responses = []
        for (let i = 0; i < 100; i++) {
            responses.push(generateResponse(q.id, newQuestions))
        }

        const { error: insertError } = await supabase
            .from('responses')
            .insert(responses)

        if (insertError) console.error('Error inserting responses:', insertError)
        else console.log(`Inserted 100 responses for ${q.id}`)
    }

    console.log('Done! Check your Supabase dashboard.')
}

runTest()
