-- ==========================================
-- ANALYZING JSONB SURVEY DATA IN POSTGRES
-- ==========================================

-- 1. FLATTENING DATA (The most useful technique)
-- This creates a temporary view that looks like a normal table with columns.
-- Replace 'gffnub7uy' with your actual Questionnaire ID.
-- Replace question IDs (e.g., 'fe4dyxo0w') with your actual Question IDs.

WITH flat_responses AS (
    SELECT 
        id as response_id,
        submitted_at,
        
        -- Extract Text Answer (Name)
        -- We loop through the 'answers' array and find the object where questionId matches
        (SELECT value->>'value' 
         FROM jsonb_array_elements(answers) 
         WHERE value->>'questionId' = 'fe4dyxo0w') as respondent_name,
         
        -- Extract Numeric Answer (Age) and cast to integer
        (SELECT (value->>'value')::int 
         FROM jsonb_array_elements(answers) 
         WHERE value->>'questionId' = '6kx5rw107') as respondent_age,
         
        -- Extract Select Answer (Visited HK?)
        (SELECT value->>'value' 
         FROM jsonb_array_elements(answers) 
         WHERE value->>'questionId' = '216g5p2tx') as visited_hk

    FROM responses
    WHERE questionnaire_id = 'gffnub7uy'
)
SELECT * FROM flat_responses;


-- 2. SIMPLE FILTERING
-- Find all respondents who said "Yes" to question '216g5p2tx'
-- The @> operator checks if the JSON on the left contains the JSON on the right.
SELECT *
FROM responses
WHERE questionnaire_id = 'gffnub7uy'
AND answers @> '[{"questionId": "216g5p2tx", "value": "Yes"}]';


-- 3. AGGREGATION & STATISTICS
-- Calculate average age of respondents
SELECT 
    AVG((item->>'value')::int) as average_age,
    MIN((item->>'value')::int) as min_age,
    MAX((item->>'value')::int) as max_age
FROM responses r,
     jsonb_array_elements(r.answers) item
WHERE r.questionnaire_id = 'gffnub7uy'
  AND item->>'questionId' = '6kx5rw107';


-- 4. CREATING A PERMANENT VIEW
-- If you analyze this often, just save it as a View!
-- Then you can query it like a normal table: SELECT * FROM view_questionnaire_2_stats
/*
CREATE OR REPLACE VIEW view_questionnaire_2_stats AS
SELECT 
    id,
    submitted_at,
    (SELECT value->>'value' FROM jsonb_array_elements(answers) WHERE value->>'questionId' = 'fe4dyxo0w') as name,
    (SELECT (value->>'value')::int FROM jsonb_array_elements(answers) WHERE value->>'questionId' = '6kx5rw107') as age
FROM responses
WHERE questionnaire_id = 'gffnub7uy';
*/
