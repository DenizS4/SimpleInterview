-- Users table (both admins and candidates)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'candidate', -- 'admin' or 'candidate'
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Organizations/Companies (for multi-tenant support)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Admin-Organization relationship
CREATE TABLE IF NOT EXISTS admin_organizations (
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin', -- 'owner', 'admin', 'editor'
    PRIMARY KEY (admin_id, organization_id)
);

-- Interviews/Quizzes
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    settings JSONB DEFAULT '{}', -- time limits, rules, etc.
    instructions TEXT,
    thank_you_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'text', 'coding', 'video', 'file_upload'
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    required BOOLEAN DEFAULT true,
    time_limit INTEGER, -- in seconds
    settings JSONB DEFAULT '{}', -- question-specific settings
    created_at TIMESTAMP DEFAULT NOW()
);

-- Question options (for multiple choice)
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL
);

-- Interview sessions (when someone takes an interview)
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    candidate_email VARCHAR(255),
    candidate_name VARCHAR(255),
    access_token VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'abandoned'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    browser_info JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Responses to questions
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    response_data JSONB NOT NULL, -- flexible storage for different response types
    time_spent INTEGER, -- in seconds
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- File uploads (videos, documents, etc.)
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    storage_path TEXT NOT NULL, -- path in object storage
    storage_provider VARCHAR(50) DEFAULT 'vercel_blob', -- 'vercel_blob', 's3', 'supabase'
    upload_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Real-time tracking data (keystroke, mouse movements, etc.)
CREATE TABLE IF NOT EXISTS tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'keystroke', 'mouse_move', 'focus_change', 'paste', etc.
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Analytics aggregations (for performance)
CREATE TABLE IF NOT EXISTS analytics_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    average_completion_time INTEGER, -- in seconds
    abandonment_rate DECIMAL(5,2),
    question_analytics JSONB, -- per-question stats
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(interview_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interviews_organization ON interviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_questions_interview ON questions(interview_id);
CREATE INDEX IF NOT EXISTS idx_responses_session ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON responses(question_id);
CREATE INDEX IF NOT EXISTS idx_tracking_session ON tracking_events(session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_question ON tracking_events(question_id);
CREATE INDEX IF NOT EXISTS idx_sessions_interview ON interview_sessions(interview_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON interview_sessions(access_token);
