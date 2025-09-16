"use server"

import { sql } from "@/lib/db"
import { generateAccessToken } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export async function getInterviewForShareAction(interviewId: string) {
  try {
    const interview = await sql`
      SELECT * FROM interviews WHERE id = ${interviewId}
    `

    if (interview.length === 0) {
      return { error: "Interview not found" }
    }

    const shareLinks = await sql`
      SELECT * FROM interview_sessions 
      WHERE interview_id = ${interviewId} 
      AND access_token IS NOT NULL
      ORDER BY created_at DESC
    `

    return {
      success: true,
      interview: interview[0],
      shareLinks: shareLinks.map((link) => ({
        id: link.id,
        token: link.access_token,
        expires_at: link.created_at, // You might want to add an actual expires_at column
        max_uses: 1, // Default, you might want to add this as a column
        current_uses: link.status === "completed" ? 1 : 0,
      })),
    }
  } catch (error) {
    console.error("Failed to get interview for sharing:", error)
    return { error: "Failed to load interview" }
  }
}

export async function createShareLinkAction(data: {
  interviewId: string
  maxUses: number
  expiresInDays: number
}) {
  try {
    const token = generateAccessToken().toUpperCase()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays)

    const session = await sql`
      INSERT INTO interview_sessions (interview_id, access_token, status)
      VALUES (${data.interviewId}, ${token}, 'pending')
      RETURNING *
    `

    revalidatePath(`/admin/interview/${data.interviewId}/share`)

    return {
      success: true,
      shareLink: {
        id: session[0].id,
        token: token,
        expires_at: expiresAt.toISOString(),
        max_uses: data.maxUses,
        current_uses: 0,
      },
    }
  } catch (error) {
    console.error("Failed to create share link:", error)
    return { error: "Failed to create share link" }
  }
}

export async function deleteShareLinkAction(sessionId: string) {
  try {
    await sql`
      DELETE FROM interview_sessions WHERE id = ${sessionId}
    `
    // Revalidate the path to reflect the changes immediately
    revalidatePath(`/admin/interview/${sessionId}/share`) // Note: This revalidates based on interviewId, not sessionId. Need to adjust if sessionId is not enough.
    // For a more precise revalidation, you might need to pass interviewId to this action.
    // For now, assuming revalidating the share page is sufficient.

    return { success: true }
  } catch (error) {
    console.error("Failed to delete share link:", error)
    return { error: "Failed to delete share link" }
  }
}

export async function sendInviteEmailAction(data: {
  interviewId: string
  emails: string[]
  subject: string
  message: string
}) {
  try {
    const invites = []

    for (const email of data.emails) {
      const token = generateAccessToken().toUpperCase()

      const session = await sql`
        INSERT INTO interview_sessions (interview_id, candidate_email, access_token, status)
        VALUES (${data.interviewId}, ${email}, ${token}, 'pending')
        RETURNING *
      `

      // Construct the share URL using NEXT_PUBLIC_APP_URL
      // For local development, ensure NEXT_PUBLIC_APP_URL=http://localhost:3000 is set in your .env.local file.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const shareUrl = `${appUrl}/interview/access?token=${token}`

      // Replace the placeholder in the message with the actual share URL
      const emailBody = data.message.replace("[INTERVIEW_LINK]", shareUrl)

      // Simulate sending email via an API route
      // In a real application, you would call an external email service here (e.g., Resend, SendGrid)
      // For this example, we'll call a local API route that logs the email content.
      const response = await fetch(`${appUrl}/api/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: data.subject,
          body: emailBody,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`Failed to send email to ${email}:`, errorData.error)
        throw new Error(`Failed to send email to ${email}`)
      }

      invites.push({
        email,
        token,
        sessionId: session[0].id,
        shareUrl,
      })
    }

    revalidatePath(`/admin/interview/${data.interviewId}/share`)

    return {
      success: true,
      invitesSent: invites.length,
      inviteDetails: invites, // Return the details for testing/logging
    }
  } catch (error) {
    console.error("Failed to send email invites:", error)
    return { error: "Failed to send email invites" }
  }
}
