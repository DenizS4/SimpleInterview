"use server"

import {
  getInterviewById,
  getSessionsByInterview,
  getResponsesByInterview,
  getQuestionsByInterview,
  getTrackingEventsByInterview,
  getSessionById,
  getResponsesBySession,
} from "@/lib/db"

export async function getInterviewAnalyticsAction(interviewId: string) {
  try {
    console.log("[SERVER] Fetching analytics for interview:", interviewId)

    // Get interview details
    const interview = await getInterviewById(interviewId)
    if (!interview) {
      return {
        success: false,
        error: "Interview not found",
      }
    }

    // Get all sessions for this interview
    const sessions = await getSessionsByInterview(interviewId)
    console.log(`[SERVER] Found ${sessions.length} sessions`)

    // Get all responses for this interview
    const responses = await getResponsesByInterview(interviewId)
    console.log(`[SERVER] Found ${responses.length} responses`)

    // Get all questions for this interview
    const questions = await getQuestionsByInterview(interviewId)
    console.log(`[SERVER] Found ${questions.length} questions`)

    // Get tracking events for keystroke analysis
    const trackingEvents = await getTrackingEventsByInterview(interviewId)
    console.log(`[SERVER] Found ${trackingEvents.length} tracking events`)

    // Calculate overview metrics
    const totalSessions = sessions.length
    const completedSessions = sessions.filter((s) => s.status === "completed").length
    const averageDuration =
      completedSessions > 0
        ? sessions
            .filter((s) => s.status === "completed" && s.started_at && s.completed_at)
            .reduce((acc, s) => {
              const duration = new Date(s.completed_at!).getTime() - new Date(s.started_at!).getTime()
              return acc + duration / 1000 // Convert to seconds
            }, 0) / completedSessions
        : 0

    const abandonmentRate = totalSessions > 0 ? ((totalSessions - completedSessions) / totalSessions) * 100 : 0

    // Process questions analytics
    const questionsAnalytics = questions.map((question) => {
      const questionResponses = responses.filter((r) => r.question_id === question.id)
      const totalResponses = questionResponses.length
      const completionRate = totalSessions > 0 ? (totalResponses / totalSessions) * 100 : 0
      const averageTimeSpent =
        totalResponses > 0 ? questionResponses.reduce((acc, r) => acc + (r.time_spent || 0), 0) / totalResponses : 0

      // Calculate response distribution based on question type
      const responseDistribution: Record<string, number> = {}

      if (question.type === "multiple-choice" || question.type === "multiple_choice") {
        // Group by selected options
        questionResponses.forEach((response) => {
          const selectedText = response.response_data?.selected_option_text || "No answer"
          responseDistribution[selectedText] = (responseDistribution[selectedText] || 0) + 1
        })
      } else if (question.type === "text") {
        // Group by response length
        questionResponses.forEach((response) => {
          const text = response.response_data?.text || ""
          const wordCount = text.split(/\s+/).length
          let category = "empty"
          if (wordCount > 0 && wordCount <= 50) category = "short"
          else if (wordCount > 50 && wordCount <= 150) category = "medium"
          else if (wordCount > 150) category = "long"

          responseDistribution[category] = (responseDistribution[category] || 0) + 1
        })
      } else if (question.type === "coding") {
        // Group by language and completion
        questionResponses.forEach((response) => {
          const language = response.response_data?.language || "unknown"
          const hasCode = response.response_data?.code && response.response_data.code.trim().length > 0
          const key = hasCode ? `${language} (completed)` : `${language} (empty)`
          responseDistribution[key] = (responseDistribution[key] || 0) + 1
        })
      } else if (question.type === "video") {
        // Group by video presence
        questionResponses.forEach((response) => {
          const hasVideo = response.response_data?.file_url ? "recorded" : "no_recording"
          responseDistribution[hasVideo] = (responseDistribution[hasVideo] || 0) + 1
        })
      }

      return {
        id: question.id,
        title: question.title,
        type: question.type,
        order_index: question.order_index,
        total_responses: totalResponses,
        average_time_spent: averageTimeSpent,
        completion_rate: completionRate,
        response_distribution: responseDistribution,
      }
    })

    // Process sessions data
    const sessionsData = sessions.map((session) => {
      const sessionResponses = responses.filter((r) => r.session_id === session.id)
      const totalTime =
        session.started_at && session.completed_at
          ? (new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000
          : 0

      return {
        id: session.id,
        candidate_email: session.candidate_email || "Unknown",
        candidate_name: session.candidate_name || "",
        status: session.status,
        started_at: session.started_at || "",
        completed_at: session.completed_at || "",
        total_time: totalTime,
        responses_count: sessionResponses.length,
      }
    })

    // Process keystroke analytics
    const keystrokeAnalytics = questions.map((question) => {
      const questionEvents = trackingEvents.filter((e) => e.question_id === question.id)
      const keystrokeEvents = questionEvents.filter((e) => e.event_type === "keystroke")
      const pasteEvents = questionEvents.filter((e) => e.event_type === "paste")
      const focusEvents = questionEvents.filter((e) => e.event_type === "focus_change")

      // Calculate typing speed (rough estimate)
      const totalKeystrokes = keystrokeEvents.length
      const backspaceEvents = keystrokeEvents.filter(
        (e) => e.event_data?.key === "Backspace" || e.event_data?.key === "Delete",
      ).length
      const backspaceRatio = totalKeystrokes > 0 ? (backspaceEvents / totalKeystrokes) * 100 : 0

      // Rough typing speed calculation (assuming average session time)
      const avgTypingSpeed = totalKeystrokes > 0 ? Math.max(0, (totalKeystrokes - backspaceEvents) / 5) : 0 // Rough WPM

      return {
        question_id: question.id,
        question_title: question.title,
        total_keystrokes: totalKeystrokes,
        average_typing_speed: avgTypingSpeed,
        paste_events: pasteEvents.length,
        backspace_ratio: backspaceRatio,
        focus_changes: focusEvents.length,
      }
    })

    const analyticsData = {
      interview: {
        id: interview.id,
        title: interview.title,
        description: interview.description || "",
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        average_completion_time: averageDuration,
        abandonment_rate: abandonmentRate,
      },
      questions: questionsAnalytics,
      sessions: sessionsData,
      keystroke_analytics: keystrokeAnalytics,
    }

    console.log("[SERVER] Analytics data prepared successfully")

    return {
      success: true,
      data: analyticsData,
    }
  } catch (error) {
    console.error("[SERVER] Error fetching analytics:", error)
    return {
      success: false,
      error: "Failed to fetch analytics",
    }
  }
}

export async function getSessionDetailsAction(sessionId: string) {
  try {
    console.log("[SERVER] Fetching session details for:", sessionId)

    // Get session information
    const session = await getSessionById(sessionId)
    if (!session) {
      return {
        success: false,
        error: "Session not found",
      }
    }

    // Get all responses for this session with question details
    const responses = await getResponsesBySession(sessionId)
    console.log(`[SERVER] Found ${responses.length} responses for session ${sessionId}`)

    // Calculate session duration
    const totalTime =
      session.started_at && session.completed_at
        ? (new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000
        : 0

    const sessionData = {
      session: {
        id: session.id,
        candidate_email: session.candidate_email || "Unknown",
        candidate_name: session.candidate_name || "",
        status: session.status,
        started_at: session.started_at || "",
        completed_at: session.completed_at || "",
        total_time: totalTime,
      },
      responses: responses.map((response) => {
        let processedResponse = {
          id: response.id,
          question_id: response.question_id,
          question_title: response.question_title || "Unknown Question",
          question_type: response.question_type || "unknown",
          response_data: response.response_data,
          time_spent: response.time_spent || 0,
        }

        // Add multiple choice specific details if available
        if (
          (response.question_type === "multiple-choice" || response.question_type === "multiple_choice") &&
          response.multiple_choice_details
        ) {
          processedResponse = {
            ...processedResponse,
            multiple_choice_details: response.multiple_choice_details,
          }
        }

        return processedResponse
      }),
    }

    console.log("[SERVER] Session details prepared successfully")

    return {
      success: true,
      data: sessionData,
    }
  } catch (error) {
    console.error("[SERVER] Error fetching session details:", error)
    return {
      success: false,
      error: "Failed to fetch session details",
    }
  }
}

export async function exportSessionsAction(interviewId: string) {
  try {
    console.log("[SERVER] Exporting sessions for interview:", interviewId)

    // Get interview details
    const interview = await getInterviewById(interviewId)
    if (!interview) {
      return {
        success: false,
        error: "Interview not found",
      }
    }

    // Get all sessions for this interview
    const sessions = await getSessionsByInterview(interviewId)

    // Get all responses for this interview
    const responses = await getResponsesByInterview(interviewId)

    // Prepare CSV data
    const csvHeaders = [
      "Session ID",
      "Candidate Email",
      "Candidate Name",
      "Status",
      "Started At",
      "Completed At",
      "Duration (seconds)",
      "Total Responses",
      "Completion Rate (%)",
    ]

    const csvRows = sessions.map((session) => {
      const sessionResponses = responses.filter((r) => r.session_id === session.id)
      const duration =
        session.started_at && session.completed_at
          ? (new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000
          : 0

      const completionRate = session.status === "completed" ? 100 : 0

      return [
        session.id,
        session.candidate_email || "",
        session.candidate_name || "",
        session.status,
        session.started_at || "",
        session.completed_at || "",
        duration.toString(),
        sessionResponses.length.toString(),
        completionRate.toString(),
      ]
    })

    // Convert to CSV format
    const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.map((field) => `"${field}"`).join(","))].join(
      "\n",
    )

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `${interview.title.replace(/[^a-zA-Z0-9]/g, "_")}_sessions_${timestamp}.csv`

    console.log("[SERVER] CSV export prepared successfully")

    return {
      success: true,
      csvData: csvContent,
      filename: filename,
    }
  } catch (error) {
    console.error("[SERVER] Error exporting sessions:", error)
    return {
      success: false,
      error: "Failed to export sessions",
    }
  }
}
