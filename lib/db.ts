import { neon } from "@neondatabase/serverless"

export const sql = neon(
  process.env.DATABASE_URL ||
    "",
)

export interface Interview {
  id: string
  title: string
  description: string
  organization_id: string
  created_by: string
  status: string
  settings: any
  instructions: string
  thank_you_message: string
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  interview_id: string
  type: string
  title: string
  description: string
  order_index: number
  required: boolean
  time_limit: number
  settings: any
  created_at: string
  options?: QuestionOption[]
}

export interface QuestionOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  order_index: number
}

export interface InterviewSession {
  id: string
  interview_id: string
  access_token: string
  candidate_email: string
  candidate_name: string
  status: string
  started_at?: string
  completed_at?: string
  created_at: string
  interview_title?: string
  interview_description?: string
  instructions?: string
  thank_you_message?: string
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Check if tables exist, if not create them
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'interviews'
      );
    `

    if (!tablesExist[0].exists) {
      console.log("Creating database tables...")

      // Create tables (this would normally be done via migration)
      await sql`
        CREATE TABLE IF NOT EXISTS organizations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          domain VARCHAR(255),
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `

      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          role VARCHAR(20) DEFAULT 'candidate',
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `

      await sql`
        CREATE TABLE IF NOT EXISTS interviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          created_by UUID REFERENCES users(id),
          status VARCHAR(20) DEFAULT 'draft',
          settings JSONB DEFAULT '{}',
          instructions TEXT,
          thank_you_message TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `

      await sql`
        CREATE TABLE IF NOT EXISTS questions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          order_index INTEGER NOT NULL,
          required BOOLEAN DEFAULT true,
          time_limit INTEGER,
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `

      await sql`
        CREATE TABLE IF NOT EXISTS question_options (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
          option_text TEXT NOT NULL,
          is_correct BOOLEAN DEFAULT false,
          order_index INTEGER NOT NULL,
          UNIQUE(question_id, order_index)
        );
      `

      await sql`
        CREATE TABLE IF NOT EXISTS interview_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
          candidate_email VARCHAR(255),
          candidate_name VARCHAR(255),
          access_token VARCHAR(255) UNIQUE,
          status VARCHAR(20) DEFAULT 'pending',
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          ip_address INET,
          user_agent TEXT,
          browser_info JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `

      await sql`
        CREATE TABLE IF NOT EXISTS responses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
          question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
          response_data JSONB NOT NULL,
          time_spent INTEGER,
          started_at TIMESTAMP DEFAULT NOW(),
          submitted_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `

      await sql`
        CREATE TABLE IF NOT EXISTS uploaded_files (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
          filename VARCHAR(255) NOT NULL,
          original_filename VARCHAR(255),
          file_size BIGINT,
          mime_type VARCHAR(100),
          storage_path TEXT NOT NULL,
          storage_provider VARCHAR(50) DEFAULT 'vercel_blob',
          upload_status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `

      await sql`
        CREATE TABLE IF NOT EXISTS tracking_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
          question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
          event_type VARCHAR(50) NOT NULL,
          event_data JSONB NOT NULL,
          timestamp TIMESTAMP DEFAULT NOW()
        );
      `

      // Insert sample data
      await sql`
        INSERT INTO organizations (id, name, domain) VALUES 
        ('550e8400-e29b-41d4-a716-446655440000', 'Demo Company', 'demo.com')
        ON CONFLICT (id) DO NOTHING;
      `

      await sql`
        INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES 
        ('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', '$2b$12$u5tqW5I1hbdPo2Cj7ETQuO4tDgAijMCQZmDEQw2pEozlnnVx3f7e2', 'admin', 'Admin', 'User'),
        ('550e8400-e29b-41d4-a716-446655440009', 'candidate@example.com', '$2b$12$u5tqW5I1hbdPo2Cj7ETQuO4tDgAijMCQZmDEQw2pEozlnnVx3f7e2', 'candidate', 'Demo', 'Candidate')
        ON CONFLICT (email) DO NOTHING;
      `

      await sql`
        INSERT INTO interviews (id, title, description, organization_id, created_by, status) VALUES 
        ('550e8400-e29b-41d4-a716-446655440002', 'Frontend Developer Assessment', 'Comprehensive evaluation for frontend development skills', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'active'),
        ('550e8400-e29b-41d4-a716-446655440006', 'Backend Developer Interview', 'Server-side development and API design assessment', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'draft'),
        ('550e8400-e29b-41d4-a716-446655440007', 'UX Designer Portfolio Review', 'Design thinking and portfolio presentation', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'active')
        ON CONFLICT (id) DO NOTHING;
      `

      await sql`
        INSERT INTO questions (id, interview_id, type, title, description, order_index, time_limit, settings) VALUES 
        ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'multiple_choice', 'What is React?', 'Select the best description of React', 1, 120, '{}'),
        ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'coding', 'Implement a Todo Component', 'Create a React component for a todo list', 2, 1800, '{"language": "javascript", "template": "// Your code here"}'),
        ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'video', 'Introduce Yourself', 'Record a 2-minute video introducing yourself', 3, 180, '{"max_duration": 120}'),
        ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'multiple_choice', 'Which of the following is a React Hook?', 'Select the correct React Hook from the options below', 4, 90, '{}')
        ON CONFLICT (id) DO NOTHING;
      `

      // Clear any existing options first to avoid conflicts
      await sql`DELETE FROM question_options WHERE question_id IN ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440014')`

      // Insert sample options with proper UUIDs
      await sql`
        INSERT INTO question_options (id, question_id, option_text, is_correct, order_index) VALUES 
        ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440003', 'A JavaScript library for building user interfaces', true, 1),
        ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'A database management system', false, 2),
        ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'A CSS framework', false, 3),
        ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'A server-side language', false, 4),
        ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014', 'useState', true, 1),
        ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440014', 'componentDidMount', false, 2),
        ('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440014', 'render', false, 3),
        ('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440014', 'constructor', false, 4);
      `

      // Create a demo session for testing
      await sql`
        INSERT INTO interview_sessions (id, interview_id, access_token, status) VALUES 
        ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', 'DEMO123', 'pending')
        ON CONFLICT (id) DO NOTHING;
      `

      console.log("Database initialized successfully!")
    } else {
      // If tables exist, let's make sure we have the sample options
      const optionsExist = await sql`
        SELECT COUNT(*) as count FROM question_options WHERE question_id = '550e8400-e29b-41d4-a716-446655440003'
      `

      if (Number.parseInt(optionsExist[0].count) === 0) {
        console.log("Adding missing sample question options...")

        // Clear any existing options first
        await sql`DELETE FROM question_options WHERE question_id IN ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440014')`

        // Insert sample options with proper UUIDs
        await sql`
          INSERT INTO question_options (id, question_id, option_text, is_correct, order_index) VALUES 
          ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440003', 'A JavaScript library for building user interfaces', true, 1),
          ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'A database management system', false, 2),
          ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'A CSS framework', false, 3),
          ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'A server-side language', false, 4),
          ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014', 'useState', true, 1),
          ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440014', 'componentDidMount', false, 2),
          ('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440014', 'render', false, 3),
          ('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440014', 'constructor', false, 4)
          ON CONFLICT (id) DO NOTHING;
        `

        // Also ensure the second multiple choice question exists
        await sql`
          INSERT INTO questions (id, interview_id, type, title, description, order_index, time_limit, settings) VALUES 
          ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'multiple_choice', 'Which of the following is a React Hook?', 'Select the correct React Hook from the options below', 4, 90, '{}')
          ON CONFLICT (id) DO NOTHING;
        `

        console.log("Sample question options added successfully!")
      }
    }
  } catch (error) {
    console.error("Database initialization failed:", error)
    throw error
  }
}

// Database helper functions
export async function createInterview(data: {
  title: string
  description: string
  organizationId: string
  createdBy: string
}) {
  const result = await sql`
    INSERT INTO interviews (title, description, organization_id, created_by, status)
    VALUES (${data.title}, ${data.description}, ${data.organizationId}, ${data.createdBy}, 'draft')
    RETURNING *
  `
  return result[0]
}

export async function getInterviewsByOrganization(organizationId: string) {
  // Initialize database first
  await initializeDatabase()

  return await sql`
    SELECT 
      i.*,
      COUNT(DISTINCT q.id) as question_count,
      COUNT(DISTINCT s.id) as response_count
    FROM interviews i
    LEFT JOIN questions q ON i.id = q.interview_id
    LEFT JOIN interview_sessions s ON i.id = s.interview_id AND s.status = 'completed'
    WHERE i.organization_id = ${organizationId}
    GROUP BY i.id
    ORDER BY i.created_at DESC
  `
}

export async function createQuestion(data: {
  interviewId: string
  type: string
  title: string
  description: string
  orderIndex: number
  timeLimit?: number
  settings: any
}) {
  const result = await sql`
    INSERT INTO questions (interview_id, type, title, description, order_index, time_limit, settings)
    VALUES (${data.interviewId}, ${data.type}, ${data.title}, ${data.description}, ${data.orderIndex}, ${data.timeLimit}, ${JSON.stringify(data.settings)})
    RETURNING *
  `
  return result[0]
}

export async function getQuestionsByInterview(interviewId: string) {
  // Initialize database to ensure sample data exists
  await initializeDatabase()

  console.log(`[SERVER] Fetching questions for interview: ${interviewId}`)

  // First get all questions for the interview
  const questions = await sql`
    SELECT q.*
    FROM questions q
    WHERE q.interview_id = ${interviewId}
    ORDER BY q.order_index
  `

  console.log(
    `[SERVER] Found ${questions.length} questions:`,
    questions.map((q) => ({ id: q.id, title: q.title, type: q.type })),
  )

  // Then get options for each question in a single query to avoid N+1 problem
  const allOptions = await sql`
    SELECT qo.*, q.id as question_id
    FROM question_options qo
    JOIN questions q ON qo.question_id = q.id
    WHERE q.interview_id = ${interviewId}
    ORDER BY qo.order_index
  `

  console.log(`[SERVER] Found ${allOptions.length} total options across all questions`)

  // Group options by question_id
  const optionsByQuestionId = allOptions.reduce((acc, option) => {
    if (!acc[option.question_id]) {
      acc[option.question_id] = []
    }
    acc[option.question_id].push({
      id: option.id,
      option_text: option.option_text,
      is_correct: option.is_correct,
      order_index: option.order_index,
    })
    return acc
  }, {})

  // Combine questions with their options
  const questionsWithOptions = questions.map((question) => {
    const options = optionsByQuestionId[question.id] || []
    console.log(`[SERVER] Question ${question.id} (${question.title}) has ${options.length} options`)

    return {
      ...question,
      options: options,
    }
  })

  console.log(`[SERVER] Returning ${questionsWithOptions.length} questions with options`)

  // Log detailed info for debugging
  questionsWithOptions.forEach((q) => {
    console.log(`[SERVER] Question: ${q.title} (${q.type}) - Options: ${q.options?.length || 0}`)
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, idx) => {
        console.log(`[SERVER]   Option ${idx + 1}: ${opt.option_text}`)
      })
    }
  })

  console.log(`[SERVER] Returning ${questionsWithOptions.length} questions with full option details`)

  return questionsWithOptions
}

export async function createInterviewSession(data: {
  interviewId: string
  candidateEmail?: string
  candidateName?: string
  accessToken: string
}) {
  const result = await sql`
    INSERT INTO interview_sessions (interview_id, candidate_email, candidate_name, access_token, status)
    VALUES (${data.interviewId}, ${data.candidateEmail}, ${data.candidateName}, ${data.accessToken}, 'pending')
    RETURNING *
  `
  return result[0]
}

export async function getSessionByToken(token: string) {
  await initializeDatabase()

  const result = await sql`
    SELECT s.*, i.title as interview_title, i.description as interview_description,
           i.instructions, i.thank_you_message
    FROM interview_sessions s
    JOIN interviews i ON s.interview_id = i.id
    WHERE s.access_token = ${token}
  `
  return result[0]
}

export async function getSessionById(sessionId: string) {
  const result = await sql`
    SELECT s.*, i.title as interview_title, i.description as interview_description,
           i.instructions, i.thank_you_message
    FROM interview_sessions s
    JOIN interviews i ON s.interview_id = i.id
    WHERE s.id = ${sessionId}
  `
  return result[0]
}

export async function getInterviewById(id: string) {
  const result = await sql`
    SELECT * FROM interviews WHERE id = ${id}
  `
  return result[0] || null
}

export async function updateSessionStatus(sessionId: string, status: string) {
  console.log(`[SERVER] Updating session ${sessionId} status to ${status}`)

  if (status === "in_progress") {
    const result = await sql`
      UPDATE interview_sessions 
      SET status = ${status}, started_at = NOW()
      WHERE id = ${sessionId}
      RETURNING *
    `
    console.log(`[SERVER] Session updated to in_progress:`, result[0])
  } else if (status === "completed") {
    const result = await sql`
      UPDATE interview_sessions 
      SET status = ${status}, completed_at = NOW()
      WHERE id = ${sessionId}
      RETURNING *
    `
    console.log(`[SERVER] Session updated to completed:`, result[0])
  } else {
    const result = await sql`
      UPDATE interview_sessions 
      SET status = ${status}
      WHERE id = ${sessionId}
      RETURNING *
    `
    console.log(`[SERVER] Session updated to ${status}:`, result[0])
  }
}

export async function saveResponse(data: {
  sessionId: string
  questionId: string
  responseData: any
  timeSpent?: number
  questionType: string // Added questionType
}) {
  console.log(`[SERVER] Saving response for session ${data.sessionId}, question ${data.questionId}`)
  console.log(`[SERVER] Response data:`, data.responseData)
  console.log(`[SERVER] Time spent:`, data.timeSpent)

  const result = await sql`
    INSERT INTO responses (session_id, question_id, response_data, time_spent, started_at, submitted_at)
    VALUES (${data.sessionId}, ${data.questionId}, ${JSON.stringify(data.responseData)}, ${data.timeSpent || 0}, NOW(), NOW())
    RETURNING *
  `

  console.log(`[SERVER] Response saved with ID:`, result[0].id)

  // Handle file uploads specifically for video and file_upload responses
  if (
    (data.questionType === "video" || data.questionType === "file_upload" || data.questionType === "file-upload") &&
    data.responseData.file_url
  ) {
    await sql`
      INSERT INTO uploaded_files (response_id, filename, original_filename, file_size, mime_type, storage_path, storage_provider, upload_status)
      VALUES (
        ${result[0].id},
        ${data.responseData.file_name || "uploaded_file"},
        ${data.responseData.file_name || "uploaded_file"},
        ${data.responseData.file_size || 0},
        ${data.responseData.mime_type || "application/octet-stream"},
        ${data.responseData.file_url},
        'vercel_blob',
        'completed'
      )
    `
  }
  return result[0]
}

export async function saveTrackingEvent(data: {
  sessionId: string
  questionId: string
  eventType: string
  eventData: any
}) {
  await sql`
    INSERT INTO tracking_events (session_id, question_id, event_type, event_data)
    VALUES (${data.sessionId}, ${data.questionId}, ${data.eventType}, ${JSON.stringify(data.eventData)})
  `
}

// Additional functions needed for analytics
export async function getSessionsByInterview(interviewId: string) {
  const result = await sql`
    SELECT * FROM interview_sessions 
    WHERE interview_id = ${interviewId}
    ORDER BY created_at DESC
  `
  return result
}

export async function getResponsesByInterview(interviewId: string) {
  const result = await sql`
    SELECT r.*, q.title as question_title, q.type as question_type
    FROM responses r
    JOIN questions q ON r.question_id = q.id
    WHERE q.interview_id = ${interviewId}
    ORDER BY r.created_at DESC
  `
  return result
}

export async function getTrackingEventsByInterview(interviewId: string) {
  const result = await sql`
    SELECT te.*, q.title as question_title
    FROM tracking_events te
    JOIN questions q ON te.question_id = q.id
    WHERE q.interview_id = ${interviewId}
    ORDER BY te.timestamp DESC
  `
  return result
}

export async function getResponsesBySession(sessionId: string) {
  const result = await sql`
    SELECT 
      r.*, 
      q.title as question_title, 
      q.type as question_type,
      CASE 
        WHEN q.type IN ('multiple-choice', 'multiple_choice') AND r.response_data->>'selected_option_id' IS NOT NULL
        THEN (
          SELECT json_build_object(
            'selected_option_text', COALESCE(r.response_data->>'selected_option_text', qo.option_text),
            'selected_option_id', r.response_data->>'selected_option_id',
            'is_correct', qo.is_correct,
            'correct_answer', (
              SELECT qo2.option_text 
              FROM question_options qo2 
              WHERE qo2.question_id = q.id AND qo2.is_correct = true 
              LIMIT 1
            )
          )
          FROM question_options qo 
          WHERE qo.id = (r.response_data->>'selected_option_id')::uuid
          LIMIT 1
        )
        ELSE NULL
      END as multiple_choice_details
    FROM responses r
    JOIN questions q ON r.question_id = q.id
    WHERE r.session_id = ${sessionId}
    ORDER BY q.order_index
  `
  return result
}
