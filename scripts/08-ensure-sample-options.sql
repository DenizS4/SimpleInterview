-- Ensure we have proper sample data with multiple choice options
-- This script will clean up and recreate the sample data

-- First, let's check what we have
DO $$
BEGIN
    RAISE NOTICE 'Current questions count: %', (SELECT COUNT(*) FROM questions);
    RAISE NOTICE 'Current options count: %', (SELECT COUNT(*) FROM question_options);
    RAISE NOTICE 'Multiple choice questions: %', (SELECT COUNT(*) FROM questions WHERE type = 'multiple_choice');
END $$;

-- Clean up existing sample data to avoid conflicts
DELETE FROM question_options WHERE question_id IN (
    SELECT id FROM questions WHERE interview_id = '550e8400-e29b-41d4-a716-446655440002'
);

-- Ensure we have the multiple choice questions
INSERT INTO questions (id, interview_id, type, title, description, order_index, time_limit, settings) VALUES 
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'multiple_choice', 'What is React?', 'Select the best description of React', 1, 60, '{}'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'multiple_choice', 'Which of the following is a React Hook?', 'Select the correct React Hook from the options below', 4, 90, '{}')
ON CONFLICT (id) DO UPDATE SET
    type = EXCLUDED.type,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    time_limit = EXCLUDED.time_limit;

-- Insert options for "What is React?" question
INSERT INTO question_options (id, question_id, option_text, is_correct, order_index) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440003', 'A JavaScript library for building user interfaces', true, 1),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'A database management system', false, 2),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'A CSS framework', false, 3),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'A server-side language', false, 4)
ON CONFLICT (id) DO UPDATE SET
    option_text = EXCLUDED.option_text,
    is_correct = EXCLUDED.is_correct,
    order_index = EXCLUDED.order_index;

-- Insert options for "React Hook" question
INSERT INTO question_options (id, question_id, option_text, is_correct, order_index) VALUES 
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014', 'useState', true, 1),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440014', 'componentDidMount', false, 2),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440014', 'render', false, 3),
('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440014', 'constructor', false, 4)
ON CONFLICT (id) DO UPDATE SET
    option_text = EXCLUDED.option_text,
    is_correct = EXCLUDED.is_correct,
    order_index = EXCLUDED.order_index;

-- Verify the data
DO $$
BEGIN
    RAISE NOTICE 'After cleanup - Questions count: %', (SELECT COUNT(*) FROM questions);
    RAISE NOTICE 'After cleanup - Options count: %', (SELECT COUNT(*) FROM question_options);
    RAISE NOTICE 'After cleanup - Multiple choice questions: %', (SELECT COUNT(*) FROM questions WHERE type = 'multiple_choice');
    
    -- Show the options for each multiple choice question
    RAISE NOTICE 'Options for React question: %', (
        SELECT COUNT(*) FROM question_options 
        WHERE question_id = '550e8400-e29b-41d4-a716-446655440003'
    );
    
    RAISE NOTICE 'Options for Hook question: %', (
        SELECT COUNT(*) FROM question_options 
        WHERE question_id = '550e8400-e29b-41d4-a716-446655440014'
    );
END $$;

-- Show sample of the data
SELECT 
    q.id,
    q.title,
    q.type,
    COUNT(qo.id) as option_count
FROM questions q
LEFT JOIN question_options qo ON q.id = qo.question_id
WHERE q.interview_id = '550e8400-e29b-41d4-a716-446655440002'
GROUP BY q.id, q.title, q.type
ORDER BY q.order_index;
