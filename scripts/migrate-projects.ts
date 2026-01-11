
import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'

const supabaseUrl = 'https://jnxcgzzdbcqrozdtqgjo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpueGNnenpkYmNxcm96ZHRxZ2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTkwMDQsImV4cCI6MjA4MDk5NTAwNH0.PQr82xiwJFXe5VsTfKDX5vlXasUZx6aJAgGA6HAW9ME'

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateProjects() {
    console.log('Creating 4 projects...')

    const projects = [
        { id: faker.string.nanoid(9), name: 'Marketing Surveys', description: 'Surveys for marketing campaigns' },
        { id: faker.string.nanoid(9), name: 'Customer Feedback', description: 'Collecting feedback from customers' },
        { id: faker.string.nanoid(9), name: 'Employee Engagement', description: 'Internal employee surveys' },
        { id: faker.string.nanoid(9), name: 'Product Research', description: 'Research for new product features' }
    ]

    const { error: projError } = await supabase.from('projects').insert(projects)
    if (projError) {
        console.error('Error creating projects:', projError)
        return
    }
    console.log('Projects created:', projects.map(p => p.name).join(', '))

    console.log('Fetching existing questionnaires...')
    const { data: questionnaires, error: qError } = await supabase.from('questionnaires').select('id')
    if (qError) {
        console.error('Error fetching questionnaires:', qError)
        return
    }

    console.log(`Found ${questionnaires.length} questionnaires. Distributing...`)

    for (const q of questionnaires) {
        const randomProject = projects[Math.floor(Math.random() * projects.length)]
        const { error: updateError } = await supabase
            .from('questionnaires')
            .update({ project_id: randomProject.id })
            .eq('id', q.id)

        if (updateError) {
            console.error(`Error updating Q ${q.id}:`, updateError)
        }
    }

    console.log('Done! Questionnaires distributed.')
}

migrateProjects()
