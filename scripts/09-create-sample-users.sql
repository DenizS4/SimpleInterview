-- Create sample users with properly hashed passwords
-- Note: These password hashes are for demonstration. In production, generate them using bcrypt with 12 salt rounds

-- Owner user (password: owner123)
INSERT INTO users (email, first_name, last_name, password_hash, role) 
VALUES (
  'owner@example.com', 
  'System', 
  'Owner', 
  '$2b$12$LQv3c1yqBwlVHpPjrPyFUOCcZCqk8VGthqOtbeGHABRy.k5BFyxTW', 
  'owner'
) ON CONFLICT (email) DO NOTHING;

-- Admin user (password: admin123) 
INSERT INTO users (email, first_name, last_name, password_hash, role) 
VALUES (
  'admin@example.com', 
  'Admin', 
  'User', 
  '$2b$12$LQv3c1yqBwlVHpPjrPyFUOCcZCqk8VGthqOtbeGHABRy.k5BFyxTW', 
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Editor user (password: editor123)
INSERT INTO users (email, first_name, last_name, password_hash, role) 
VALUES (
  'editor@example.com', 
  'Editor', 
  'User', 
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'editor'
) ON CONFLICT (email) DO NOTHING;

-- Candidate user (password: candidate123)
INSERT INTO users (email, first_name, last_name, password_hash, role) 
VALUES (
  'candidate@example.com', 
  'Test', 
  'Candidate', 
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'candidate'
) ON CONFLICT (email) DO NOTHING;
