// TypeScript types for the database schema
export interface User {
  id: string
  email: string
  password_hash?: string
  role: "admin" | "candidate"
  first_name?: string
  last_name?: string
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  domain?: string
  settings: Record<string, any>
  created_at: string
}

export interface Interview {
  id: string
  title: string
  description?: string
  organization_id: string
  created_by: string
  status: "draft" | "active" | "paused" | "completed"
  settings: Record<string, any>
  instructions?: string
  thank_you_message?: string
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  interview_id: string
  type: "multiple_choice" | "text" | "coding" | "video" | "file_upload"
  title: string
  description?: string
  order_index: number
  required: boolean
  time_limit?: number
  settings: Record<string, any>
  created_at: string
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
  candidate_email?: string
  candidate_name?: string
  access_token: string
  status: "pending" | "in_progress" | "completed" | "abandoned"
  started_at?: string
  completed_at?: string
  ip_address?: string
  user_agent?: string
  browser_info?: Record<string, any>
  created_at: string
}

export interface Response {
  id: string
  session_id: string
  question_id: string
  response_data: Record<string, any>
  time_spent?: number
  started_at?: string
  submitted_at?: string
  created_at: string
}

export interface UploadedFile {
  id: string
  response_id: string
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  storage_path: string
  storage_provider: "vercel_blob" | "s3" | "supabase"
  upload_status: "pending" | "completed" | "failed"
  created_at: string
}

export interface TrackingEvent {
  id: string
  session_id: string
  question_id: string
  event_type: "keystroke" | "mouse_move" | "focus_change" | "paste" | "copy" | "tab_change"
  event_data: Record<string, any>
  timestamp: string
}

// Response data structures for different question types
export interface MultipleChoiceResponse {
  selected_option_id: string
  selected_option_text: string
}

export interface TextResponse {
  text: string
  word_count: number
  character_count: number
  keystroke_log?: Array<{
    timestamp: number
    key: string
    action: "keydown" | "keyup"
    text_length: number
  }>
}

export interface CodingResponse {
  code: string
  language: string
  execution_result?: string
  test_results?: Array<{
    test_name: string
    passed: boolean
    output: string
  }>
}

export interface VideoResponse {
  file_id: string
  duration: number
  file_size: number
  thumbnail_url?: string
}

export interface FileUploadResponse {
  file_id: string
  file_name: string
  file_size: number
  mime_type: string
}
