-- First, let's clean up and recreate the sample question options with proper conflict handling
DELETE FROM question_options WHERE question_id = '550e8400-e29b-41d4-a716-446655440003';

-- Insert the sample options for the "What is React?" question with proper structure
INSERT INTO question_options (id, question_id, option_text, is_correct, order_index) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 'A JavaScript library for building user interfaces', true, 1),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 'A database management system', false, 2),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 'A CSS framework', false, 3),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 'A server-side language', false, 4);

-- Let's also add another multiple choice question for better testing
INSERT INTO questions (id, interview_id, type, title, description, order_index, time_limit, settings) VALUES 
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'multiple_choice', 'Which of the following is a React Hook?', 'Select the correct React Hook from the options below', 4, 90, '{}')
ON CONFLICT (id) DO NOTHING;

-- Add options for the new question
INSERT INTO question_options (id, question_id, option_text, is_correct, order_index) VALUES 
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440014', 'useState', true, 1),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440014', 'componentDidMount', false, 2),
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440014', 'render', false, 3),
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440014', 'constructor', false, 4);
