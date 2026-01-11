
import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'

// Get credentials
const supabaseUrl = 'https://jnxcgzzdbcqrozdtqgjo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpueGNnenpkYmNxcm96ZHRxZ2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTkwMDQsImV4cCI6MjA4MDk5NTAwNH0.PQr82xiwJFXe5VsTfKDX5vlXasUZx6aJAgGA6HAW9ME'

const supabase = createClient(supabaseUrl, supabaseKey)

// --- Generators ---

function generateQuestions(count = 100) {
    const questions = []
    const types = ['text', 'number', 'single-select', 'multi-select'] as const

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)]
        const id = faker.string.nanoid(9)

        let options
        if (type === 'single-select' || type === 'multi-select') {
            options = Array.from({ length: 5 }, () => {
                const val = faker.word.noun()
                return { label: val, value: val }
            })
        }

        // Logic rules
        let visibilityRules = []
        if (i > 0 && Math.random() < 0.15) {
            const prevQ = questions[i - 1]
            if ((prevQ.type === 'single-select' || prevQ.type === 'multi-select') && prevQ.options) {
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
            required: Math.random() > 0.5,
            options,
            visibilityRules
        })
    }
    return questions
}

function generateResponseBatch(questionnaireId: string, questions: any[], count: number) {
    const responses = []

    for (let i = 0; i < count; i++) {
        const answers = []
        for (const q of questions) {
            // 20% skip optional
            if (!q.required && Math.random() < 0.2) continue

            let value
            switch (q.type) {
                case 'text':
                    value = faker.lorem.words(2)
                    break
                case 'number':
                    value = faker.number.int({ min: 1, max: 500 })
                    break
                case 'single-select':
                    value = q.options[Math.floor(Math.random() * q.options.length)].value
                    break
                case 'multi-select':
                    value = [q.options[0].value]
                    if (Math.random() > 0.5) value.push(q.options[1].value)
                    break
            }

            answers.push({ questionId: q.id, value })
        }

        responses.push({
            id: faker.string.nanoid(9),
            questionnaire_id: questionnaireId,
            submitted_at: faker.date.recent({ days: 60 }).toISOString(),
            answers
        })
    }
    return responses
}

async function runMassiveTest() {
    console.log('🚀 Starting MASSIVE Data Generation...')
    console.log('Target: 50 New Questionnaires | 100 Questions each | 1000 Responses each')
    console.log('Total Responses to Generate: 50,000')

    for (let qIdx = 1; qIdx <= 50; qIdx++) {
        const qId = faker.string.nanoid(9)
        const title = `Massive Load Test Q${qIdx} - ${faker.company.name()}`
        const questions = generateQuestions(100)

        // 1. Create Questionnaire
        const { error: qError } = await supabase
            .from('questionnaires')
            .insert({
                id: qId,
                title: title,
                status: 'published',
                created_at: new Date().toISOString(),
                questions: questions,
                settings: { questionsPerPage: 10 }
            })

        if (qError) {
            console.error(`Failed to create Q${qIdx}:`, qError)
            continue
        }
        console.log(`[${qIdx}/50] Created Questionnaire: ${title} (${qId})`)

        // 2. Insert 1000 Responses (in batches of 100 to be safe)
        const BATCH_SIZE = 100
        const TOTAL_RESPONSES = 1000

        console.log(`   -> Generating 1000 responses...`)

        const promises = []
        for (let i = 0; i < TOTAL_RESPONSES; i += BATCH_SIZE) {
            const batch = generateResponseBatch(qId, questions, BATCH_SIZE)
            promises.push(
                supabase.from('responses').insert(batch).then(({ error }) => {
                    if (error) console.error('Error inserting batch:', error.message)
                })
            )
        }

        await Promise.all(promises)
        console.log(`   -> Done inserting responses for ${qId}`)
    }

    console.log('✅ MASSIVE DATA GENERATION COMPLETE!')
}

runMassiveTest()
