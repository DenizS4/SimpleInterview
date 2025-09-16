-- Let's check what's actually in the database
SELECT 'Questions:' as debug_info;
SELECT id, title, type, order_index FROM questions WHERE interview_id = '550e8400-e29b-41d4-a716-446655440002' ORDER BY order_index;

SELECT 'Question Options:' as debug_info;
SELECT qo.*, q.title as question_title 
FROM question_options qo 
JOIN questions q ON qo.question_id = q.id 
WHERE q.interview_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY q.order_index, qo.order_index;

-- Clean up and recreate the sample data completely
DELETE FROM question_options WHERE question_id IN (
  SELECT id FROM questions WHERE interview_id = '550e8400-e29b-41d4-a716-446655440002'
);

-- Ensure we have the multiple choice questions
INSERT INTO questions (id, interview_id, type, title, description, order_index, time_limit, settings) VALUES 
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'multiple_choice', 'What is React?', 'Select the best description of React', 1, 120, '{}'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'multiple_choice', 'Which of the following is a React Hook?', 'Select the correct React Hook from the options below', 4, 90, '{}')
ON CONFLICT (id) DO UPDATE SET 
  type = EXCLUDED.type,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index,
  time_limit = EXCLUDED.time_limit,
  settings = EXCLUDED.settings;

-- Insert the options with explicit IDs
INSERT INTO question_options (id, question_id, option_text, is_correct, order_index) VALUES 
-- Options for "What is React?"
('opt-react-1', '550e8400-e29b-41d4-a716-446655440003', 'A JavaScript library for building user interfaces', true, 1),
('opt-react-2', '550e8400-e29b-41d4-a716-446655440003', 'A database management system', false, 2),
('opt-react-3', '550e8400-e29b-41d4-a716-446655440003', 'A CSS framework', false, 3),
('opt-react-4', '550e8400-e29b-41d4-a716-446655440003', 'A server-side language', false, 4),
-- Options for "Which is a React Hook?"
('opt-hook-1', '550e8400-e29b-41d4-a716-446655440014', 'useState', true, 1),
('opt-hook-2', '550e8400-e29b-41d4-a716-446655440014', 'componentDidMount', false, 2),
('opt-hook-3', '550e8400-e29b-41d4-a716-446655440014', 'render', false, 3),
('opt-hook-4', '550e8400-e29b-41d4-a716-446655440014', 'constructor', false, 4);

-- Verify the data was inserted
SELECT 'Final verification:' as debug_info;
SELECT qo.id, qo.question_id, qo.option_text, qo.is_correct, qo.order_index, q.title as question_title 
FROM question_options qo 
JOIN questions q ON qo.question_id = q.id 
WHERE q.interview_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY q.order_index, qo.order_index;
