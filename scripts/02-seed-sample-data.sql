-- Insert sample organization
INSERT INTO organizations (id, name, domain) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Demo Company', 'demo.com')
ON CONFLICT (id) DO NOTHING;

-- Insert sample admin user
INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', '$2b$10$hash', 'admin', 'Admin', 'User')
ON CONFLICT (email) DO NOTHING;

-- Link admin to organization
INSERT INTO admin_organizations (admin_id, organization_id, role) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'owner')
ON CONFLICT (admin_id, organization_id) DO NOTHING;

-- Insert sample interview
INSERT INTO interviews (id, title, description, organization_id, created_by, status) VALUES 
('550e8400-e29b-41d4-a716-446655440002', 'Frontend Developer Assessment', 'Comprehensive evaluation for frontend development skills', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert sample questions
INSERT INTO questions (id, interview_id, type, title, description, order_index, time_limit, settings) VALUES 
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'multiple_choice', 'What is React?', 'Select the best description of React', 1, 120, '{}'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'coding', 'Implement a Todo Component', 'Create a React component for a todo list', 2, 1800, '{"language": "javascript", "template": "// Your code here"}'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'video', 'Introduce Yourself', 'Record a 2-minute video introducing yourself', 3, 180, '{"max_duration": 120}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample options for multiple choice
INSERT INTO question_options (question_id, option_text, is_correct, order_index) VALUES 
('550e8400-e29b-41d4-a716-446655440003', 'A JavaScript library for building user interfaces', true, 1),
('550e8400-e29b-41d4-a716-446655440003', 'A database management system', false, 2),
('550e8400-e29b-41d4-a716-446655440003', 'A CSS framework', false, 3),
('550e8400-e29b-41d4-a716-446655440003', 'A server-side language', false, 4)
ON CONFLICT DO NOTHING;
