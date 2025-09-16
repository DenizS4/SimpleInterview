"use server"

import { sql } from "@/lib/db"

export async function getInterviewForPreviewAction(interviewId: string) {
  try {
    console.log("=== PREVIEW ACTION: Loading interview ===", interviewId)

    const interview = await sql`
      SELECT * FROM interviews WHERE id = ${interviewId}
    `

    if (interview.length === 0) {
      return { error: "Interview not found" }
    }

    console.log("Interview found:", interview[0].title)

    // Get questions with their options using a proper JOIN
    const questionsWithOptions = await sql`
      SELECT 
        q.id,
        q.interview_id,
        q.type,
        q.title,
        q.description,
        q.order_index,
        q.required,
        q.time_limit,
        q.settings,
        q.created_at,
        COALESCE(
          json_agg(
            CASE 
              WHEN qo.id IS NOT NULL THEN
                json_build_object(
                  'id', qo.id,
                  'option_text', qo.option_text,
                  'is_correct', qo.is_correct,
                  'order_index', qo.order_index
                )
              ELSE NULL
            END
            ORDER BY qo.order_index
          ) FILTER (WHERE qo.id IS NOT NULL),
          '[]'::json
        ) as options
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id
      WHERE q.interview_id = ${interviewId}
      GROUP BY q.id, q.interview_id, q.type, q.title, q.description, q.order_index, q.required, q.time_limit, q.settings, q.created_at
      ORDER BY q.order_index
    `

    console.log(`Found ${questionsWithOptions.length} questions for interview ${interviewId}`)

    // Process and log each question
    const processedQuestions = questionsWithOptions.map((q) => {
      const options = Array.isArray(q.options) ? q.options : []
      console.log(`Question: ${q.title} (${q.type}) - ${options.length} options`)

      // Handle both multiple-choice and multiple_choice
      if ((q.type === "multiple_choice" || q.type === "multiple-choice") && options.length > 0) {
        console.log(
          `Options for "${q.title}":`,
          options.map((opt) => opt.option_text),
        )
      } else if (q.type === "multiple_choice" || q.type === "multiple-choice") {
        console.log(`⚠️ Multiple choice question "${q.title}" has no options!`)
      }

      return {
        id: q.id,
        interview_id: q.interview_id,
        type: q.type,
        title: q.title,
        description: q.description,
        order_index: q.order_index,
        required: q.required,
        time_limit: q.time_limit,
        settings: q.settings,
        created_at: q.created_at,
        options: options,
      }
    })

    return {
      success: true,
      interview: interview[0],
      questions: processedQuestions,
    }
  } catch (error) {
    console.error("Failed to get interview for preview:", error)
    return { error: "Failed to load interview" }
  }
}

export async function debugQuestionOptionsAction(questionId: string) {
  try {
    console.log("=== DEBUG: Checking question options ===", questionId)

    // Check if question exists
    const question = await sql`
      SELECT * FROM questions WHERE id = ${questionId}
    `
    console.log("Question found:", question.length > 0 ? question[0] : "NOT FOUND")

    // Check options for this question
    const options = await sql`
      SELECT * FROM question_options WHERE question_id = ${questionId} ORDER BY order_index
    `
    console.log(`Found ${options.length} options for question ${questionId}:`)
    options.forEach((opt, index) => {
      console.log(`  ${index + 1}. "${opt.option_text}" (correct: ${opt.is_correct})`)
    })

    // Check all multiple choice questions and their option counts
    const allMCQuestions = await sql`
      SELECT 
        q.id,
        q.title,
        q.interview_id,
        q.type,
        COUNT(qo.id) as option_count
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id
      WHERE q.type IN ('multiple_choice', 'multiple-choice')
      GROUP BY q.id, q.title, q.interview_id, q.type
      ORDER BY q.created_at DESC
    `
    console.log("All multiple choice questions:")
    allMCQuestions.forEach((q) => {
      console.log(`  - "${q.title}" (${q.id}) [${q.type}]: ${q.option_count} options`)
    })

    return {
      success: true,
      question: question[0],
      options: options,
      allMCQuestions: allMCQuestions,
    }
  } catch (error) {
    console.error("Debug failed:", error)
    return { error: "Debug failed" }
  }
}

export async function startInterviewSessionAction(interviewId: string, candidateData?: any) {
  try {
    // Create a session for the interview
    const session = await sql`
      INSERT INTO interview_sessions (interview_id, access_token, status)
      VALUES (${interviewId}, ${`preview-${Date.now()}`}, 'in_progress')
      RETURNING *
    `

    return {
      success: true,
      session: session[0],
    }
  } catch (error) {
    console.error("Failed to start interview session:", error)
    return { error: "Failed to start session" }
  }
}
