"use server"

import { getInterviewsByOrganization, initializeDatabase, sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getInterviewsAction() {
  try {
    console.log("🔍 Getting all interviews...")

    const interviews = await getInterviewsByOrganization("550e8400-e29b-41d4-a716-446655440000")

    console.log(`✅ Found ${interviews.length} interviews`)

    return {
      success: true,
      interviews: interviews,
    }
  } catch (error) {
    console.error("❌ Failed to get interviews:", error)
    return {
      success: false,
      error: "Failed to get interviews",
    }
  }
}

export async function createInterviewAction(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const instructions = formData.get("instructions") as string
  const thankYouMessage = formData.get("thank_you_message") as string

  if (!title) {
    return { error: "Title is required" }
  }

  try {
    // Initialize database first
    await initializeDatabase()

    // Create interview with all fields
    const interview = await sql`
      INSERT INTO interviews (title, description, instructions, thank_you_message, organization_id, created_by, status)
      VALUES (${title}, ${description}, ${instructions}, ${thankYouMessage}, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'draft')
      RETURNING *
    `

    revalidatePath("/admin/dashboard")
    return { success: true, interview: interview[0] }
  } catch (error) {
    console.error("Failed to create interview:", error)
    return { error: "Failed to create interview" }
  }
}

export async function getInterviewAction(id: string) {
  try {
    console.log("🔍 Getting interview:", id)

    const [interview] = await sql`
      SELECT * FROM interviews WHERE id = ${id}
    `

    if (!interview) {
      return {
        success: false,
        error: "Interview not found",
      }
    }

    const questions = await sql`
      SELECT q.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', qo.id,
                   'option_text', qo.option_text,
                   'is_correct', qo.is_correct,
                   'order_index', qo.order_index
                 ) ORDER BY qo.order_index
               ) FILTER (WHERE qo.id IS NOT NULL), 
               '[]'
             ) as options
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id
      WHERE q.interview_id = ${id}
      GROUP BY q.id, q.title, q.type, q.description, q.order_index, q.required, q.time_limit, q.settings, q.created_at
      ORDER BY q.order_index
    `

    // Process questions to ensure proper data types
    const processedQuestions = questions.map((q) => ({
      ...q,
      timeLimit: q.time_limit,
      options: q.options === "[]" ? [] : q.options,
    }))

    console.log(`✅ Found interview with ${questions.length} questions`)

    return {
      success: true,
      interview: {
        ...interview,
        questions: processedQuestions,
      },
    }
  } catch (error) {
    console.error("❌ Failed to get interview:", error)
    return {
      success: false,
      error: "Failed to get interview",
    }
  }
}

export async function updateInterviewAction(
  id: string,
  data: {
    title: string
    description: string
    instructions: string
    thank_you_message: string
    timeLimit?: number
    status: string
    questions: any[]
  },
) {
  try {
    console.log("���� Updating interview:", id)

    // Update the interview
    await sql`
      UPDATE interviews 
      SET title = ${data.title},
          description = ${data.description},
          instructions = ${data.instructions},
          thank_you_message = ${data.thank_you_message},
          status = ${data.status},
          updated_at = NOW()
      WHERE id = ${id}
    `

    // Delete existing questions and options
    await sql`DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE interview_id = ${id})`
    await sql`DELETE FROM questions WHERE interview_id = ${id}`

    // Create new questions
    for (let i = 0; i < data.questions.length; i++) {
      const question = data.questions[i]

      const newQuestion = await sql`
        INSERT INTO questions (interview_id, type, title, description, order_index, time_limit, settings)
        VALUES (${data.id}, ${question.type}, ${question.title}, ${question.description || ""}, ${i + 1}, ${question.timeLimit}, ${JSON.stringify(question.settings || {})})
        RETURNING *
      `

      // Add options for multiple choice questions
      if (question.type === "multiple-choice" && question.options) {
        for (let j = 0; j < question.options.length; j++) {
          const option = question.options[j]
          await sql`
            INSERT INTO question_options (question_id, option_text, is_correct, order_index)
            VALUES (${newQuestion[0].id}, ${option.option_text}, ${option.is_correct}, ${j + 1})
          `
        }
      }
    }

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update interview:", error)
    return { error: "Failed to update interview" }
  }
}

export async function deleteInterviewAction(interviewId: string) {
  try {
    console.log(`🗑️ Starting deletion of interview: ${interviewId}`)

    // Initialize database first
    await initializeDatabase()

    // Delete in proper order to respect foreign key constraints

    // 1. Delete uploaded files first
    console.log("🗑️ Deleting uploaded files...")
    await sql`
      DELETE FROM uploaded_files 
      WHERE response_id IN (
        SELECT r.id FROM responses r
        JOIN interview_sessions s ON r.session_id = s.id
        WHERE s.interview_id = ${interviewId}
      )
    `

    // 2. Delete tracking events
    console.log("🗑️ Deleting tracking events...")
    await sql`
      DELETE FROM tracking_events 
      WHERE session_id IN (
        SELECT id FROM interview_sessions 
        WHERE interview_id = ${interviewId}
      )
    `

    // 3. Delete responses
    console.log("🗑️ Deleting responses...")
    await sql`
      DELETE FROM responses 
      WHERE session_id IN (
        SELECT id FROM interview_sessions 
        WHERE interview_id = ${interviewId}
      )
    `

    // 4. Delete interview sessions
    console.log("🗑️ Deleting interview sessions...")
    await sql`
      DELETE FROM interview_sessions 
      WHERE interview_id = ${interviewId}
    `

    // 5. Delete question options
    console.log("🗑️ Deleting question options...")
    await sql`
      DELETE FROM question_options 
      WHERE question_id IN (
        SELECT id FROM questions 
        WHERE interview_id = ${interviewId}
      )
    `

    // 6. Delete questions
    console.log("🗑️ Deleting questions...")
    await sql`
      DELETE FROM questions 
      WHERE interview_id = ${interviewId}
    `

    // 7. Finally delete the interview
    console.log("🗑️ Deleting interview...")
    const result = await sql`
      DELETE FROM interviews 
      WHERE id = ${interviewId}
      RETURNING *
    `

    if (result.length === 0) {
      return { error: "Interview not found" }
    }

    console.log(`✅ Successfully deleted interview: ${interviewId}`)
    revalidatePath("/admin/dashboard")
    return { success: true, message: "Interview deleted successfully" }
  } catch (error) {
    console.error("Failed to delete interview:", error)
    return { error: "Failed to delete interview" }
  }
}

export async function getInterviewForEditAction(interviewId: string) {
  try {
    const interview = await sql`
      SELECT * FROM interviews WHERE id = ${interviewId}
    `

    if (interview.length === 0) {
      return { error: "Interview not found" }
    }

    const questions = await sql`
      SELECT q.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', qo.id,
                   'option_text', qo.option_text,
                   'is_correct', qo.is_correct,
                   'order_index', qo.order_index
                 ) ORDER BY qo.order_index
               ) FILTER (WHERE qo.id IS NOT NULL), 
               '[]'
             ) as options
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id
      WHERE q.interview_id = ${interviewId}
      GROUP BY q.id, q.title, q.type, q.description, q.order_index, q.required, q.time_limit, q.settings, q.created_at
      ORDER BY q.order_index
    `

    // Process questions to ensure proper data types
    const processedQuestions = questions.map((q) => ({
      ...q,
      timeLimit: q.time_limit,
      options: q.options === "[]" ? [] : q.options,
    }))

    return {
      success: true,
      interview: interview[0],
      questions: processedQuestions,
    }
  } catch (error) {
    console.error("Failed to get interview for edit:", error)
    return { error: "Failed to load interview" }
  }
}

export async function saveQuestionsAction(interviewId: string, questions: any[]) {
  try {
    console.log("=== SAVING QUESTIONS ===")
    console.log("Interview ID:", interviewId)
    console.log("Questions to save:", JSON.stringify(questions, null, 2))

    // Create new questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      console.log(`Processing question ${i + 1}:`, question.title, question.type)

      const newQuestion = await sql`
        INSERT INTO questions (interview_id, type, title, description, order_index, time_limit, settings)
        VALUES (${interviewId}, ${question.type}, ${question.title}, ${question.description || ""}, ${i + 1}, ${question.timeLimit}, ${JSON.stringify(question.settings || {})})
        RETURNING *
      `

      console.log("Created question:", newQuestion[0].id)

      // Add options for multiple choice questions
      if (question.type === "multiple-choice" && question.options && question.options.length > 0) {
        console.log(`Adding ${question.options.length} options for question ${newQuestion[0].id}`)

        for (let j = 0; j < question.options.length; j++) {
          const option = question.options[j]
          console.log(`Option ${j + 1}:`, option)

          // Handle both string and object formats
          const optionText = typeof option === "string" ? option : option.option_text
          const isCorrect = typeof option === "string" ? false : option.is_correct || false

          console.log(`Inserting option: "${optionText}", correct: ${isCorrect}`)

          await sql`
            INSERT INTO question_options (question_id, option_text, is_correct, order_index)
            VALUES (${newQuestion[0].id}, ${optionText}, ${isCorrect}, ${j + 1})
          `
        }

        // Verify options were saved
        const savedOptions = await sql`
          SELECT * FROM question_options WHERE question_id = ${newQuestion[0].id} ORDER BY order_index
        `
        console.log(`Verified: ${savedOptions.length} options saved for question ${newQuestion[0].id}`)
      } else if (question.type === "multiple-choice") {
        console.log(`WARNING: Multiple choice question "${question.title}" has no options!`)
      }
    }

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to save questions:", error)
    return { error: "Failed to save questions" }
  }
}

// New action to add options to existing multiple choice questions
export async function addOptionsToQuestionAction(
  questionId: string,
  options: Array<{
    option_text: string
    is_correct: boolean
  }>,
) {
  try {
    console.log(`Adding options to question ${questionId}:`, options)

    // First, clear existing options
    await sql`DELETE FROM question_options WHERE question_id = ${questionId}`

    // Add new options
    for (let i = 0; i < options.length; i++) {
      const option = options[i]
      await sql`
        INSERT INTO question_options (question_id, option_text, is_correct, order_index)
        VALUES (${questionId}, ${option.option_text}, ${option.is_correct}, ${i + 1})
      `
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to add options:", error)
    return { error: "Failed to add options" }
  }
}
