import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jnxcgzzdbcqrozdtqgjo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpueGNnenpkYmNxcm96ZHRxZ2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTkwMDQsImV4cCI6MjA4MDk5NTAwNH0.PQr82xiwJFXe5VsTfKDX5vlXasUZx6aJAgGA6HAW9ME'
const supabase = createClient(supabaseUrl, supabaseKey)

async function countResponses() {
    const { count, error } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error counting responses:', error)
        return
    }

    console.log(`Total number of records in responses table: ${count}`)
}

countResponses()
