"use server"

import {
  getQuestionsByInterview,
  getSessionByToken,
  updateSessionStatus,
  saveResponse,
  saveTrackingEvent,
  createInterviewSession,
} from "@/lib/db"
import { generateUUID, generateAccessToken } from "@/lib/utils"

export async function validateTokenAction(token: string) {
  try {
    console.log("[SERVER] Validating token:", token)

    let session = await getSessionByToken(token)

    // If no session exists for this token, create one (for demo purposes)
    if (!session && (token === "DEMO123" || token === "TEST456")) {
      console.log("[SERVER] Creating demo session for token:", token)
      const newSession = await createInterviewSession({
        interviewId: "550e8400-e29b-41d4-a716-446655440002", // Demo interview
        accessToken: token,
        candidateEmail: "demo@example.com",
        candidateName: "Demo User",
      })
      session = newSession
    }

    if (!session) {
      console.log("[SERVER] No session found for token:", token)
      return {
        success: false,
        error: "Invalid access token",
      }
    }

    if (session.status === "completed") {
      return {
        success: false,
        error: "This interview has already been completed",
      }
    }

    console.log("[SERVER] Session found:", {
      id: session.id,
      interview_id: session.interview_id,
      status: session.status,
      interview_title: session.interview_title,
    })

    return {
      success: true,
      session: {
        id: session.id,
        interview_id: session.interview_id,
        interview_title: session.interview_title,
        interview_description: session.interview_description,
        instructions: session.instructions,
        thank_you_message: session.thank_you_message,
        status: session.status,
        candidate_email: session.candidate_email,
        candidate_name: session.candidate_name,
        access_token: session.access_token,
      },
    }
  } catch (error) {
    console.error("[SERVER] Error validating token:", error)
    return {
      success: false,
      error: "Failed to validate token",
    }
  }
}

export async function getInterviewQuestionsAction(interviewId: string) {
  try {
    console.log("[SERVER] Fetching questions for interview:", interviewId)

    const questions = await getQuestionsByInterview(interviewId)

    console.log(
      `[SERVER] Found ${questions.length} questions:`,
      questions.map((q: any) => ({
        id: q.id,
        title: q.title,
        type: q.type,
        optionsCount: q.options?.length || 0,
      })),
    )

    // Log detailed info for each question
    questions.forEach((q: any) => {
      console.log(`[SERVER] Question: ${q.title} (${q.type}) - Options: ${q.options?.length || 0}`)
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt: any, idx: number) => {
          console.log(`[SERVER]   Option ${idx + 1}: ${opt.option_text}`)
        })
      }
    })

    console.log(`[SERVER] Returning ${questions.length} questions with full option details`)

    return {
      success: true,
      questions: questions,
    }
  } catch (error) {
    console.error("[SERVER] Error fetching questions:", error)
    return {
      success: false,
      error: "Failed to fetch questions",
      questions: [],
    }
  }
}

export async function getInterviewQuestionsFromTokenAction(token: string) {
  try {
    console.log("[SERVER] Getting questions from token:", token)

    // First validate the token and get session
    const session = await getSessionByToken(token)
    if (!session) {
      return {
        success: false,
        error: "Invalid session token",
      }
    }

    console.log("[SERVER] Session found, fetching questions for interview:", session.interview_id)

    // Get questions for the interview
    const questions = await getQuestionsByInterview(session.interview_id)

    console.log(`[SERVER] Found ${questions.length} questions for interview ${session.interview_id}`)

    // Log detailed info for each question
    questions.forEach((q: any) => {
      console.log(`[SERVER] Question: ${q.title} (${q.type}) - Options: ${q.options?.length || 0}`)
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt: any, idx: number) => {
          console.log(`[SERVER]   Option ${idx + 1}: ${opt.option_text}`)
        })
      }
    })

    return {
      success: true,
      questions: questions,
      session: {
        id: session.id,
        interview_id: session.interview_id,
        interview_title: session.interview_title,
        interview_description: session.interview_description,
        instructions: session.instructions,
        thank_you_message: session.thank_you_message,
        status: session.status,
      },
    }
  } catch (error) {
    console.error("[SERVER] Error getting questions from token:", error)
    return {
      success: false,
      error: "Failed to load questions",
    }
  }
}

export async function startInterviewAction(sessionId: string) {
  try {
    console.log("[SERVER] Starting interview for session:", sessionId)

    await updateSessionStatus(sessionId, "in_progress")

    console.log("[SERVER] Interview started successfully")

    return {
      success: true,
    }
  } catch (error) {
    console.error("[SERVER] Error starting interview:", error)
    return {
      success: false,
      error: "Failed to start interview",
    }
  }
}

export async function submitResponseAction(data: {
  sessionId: string
  questionId: string
  responseData: any
  timeSpent?: number
  questionType: string
}) {
  try {
    console.log("[SERVER] Saving response for question:", data.questionId, "type:", data.questionType)
    console.log("[SERVER] Response data:", data.responseData)
    console.log("[SERVER] Time spent:", data.timeSpent)

    const response = await saveResponse({
      sessionId: data.sessionId,
      questionId: data.questionId,
      responseData: data.responseData,
      timeSpent: data.timeSpent || 0,
      questionType: data.questionType,
    })

    console.log("[SERVER] Response saved successfully with ID:", response.id)

    return {
      success: true,
      responseId: response.id,
    }
  } catch (error) {
    console.error("[SERVER] Error saving response:", error)
    return {
      success: false,
      error: "Failed to save response",
    }
  }
}

export async function trackEventAction(data: {
  sessionId: string
  questionId: string
  eventType: string
  eventData: any
}) {
  try {
    console.log("[SERVER] Saving tracking event:", data.eventType, "for question:", data.questionId)

    await saveTrackingEvent(data)

    return {
      success: true,
    }
  } catch (error) {
    console.error("[SERVER] Error saving tracking event:", error)
    return {
      success: false,
      error: "Failed to save tracking event",
    }
  }
}

export async function completeInterviewAction(sessionId: string) {
  try {
    console.log("[SERVER] Completing interview for session:", sessionId)

    await updateSessionStatus(sessionId, "completed")

    console.log("[SERVER] Interview completed successfully")

    return {
      success: true,
    }
  } catch (error) {
    console.error("[SERVER] Error completing interview:", error)
    return {
      success: false,
      error: "Failed to complete interview",
    }
  }
}

export async function createDemoSessionAction() {
  try {
    const sessionId = generateUUID()
    const accessToken = generateAccessToken()

    const session = await createInterviewSession({
      interviewId: "550e8400-e29b-41d4-a716-446655440002",
      accessToken,
      candidateEmail: "demo@example.com",
      candidateName: "Demo User",
    })

    return { success: true, session }
  } catch (error) {
    console.error("Failed to create demo session:", error)
    return { success: false, error: "Failed to create demo session" }
  }
}
