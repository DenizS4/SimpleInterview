"use server"

import { put } from "@vercel/blob"

export async function uploadVideoAction(formData: FormData) {
  try {
    const video = formData.get("video") as File
    const sessionId = formData.get("sessionId") as string
    const questionId = formData.get("questionId") as string

    if (!video || !sessionId || !questionId) {
      return {
        success: false,
        error: "Missing required fields",
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `interviews/${sessionId}/${questionId}/video-${timestamp}.webm`

    // Upload to Vercel Blob
    const blob = await put(filename, video, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("Video uploaded successfully:", blob.url)

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      size: video.size,
    }
  } catch (error) {
    console.error("Video upload failed:", error)
    return {
      success: false,
      error: "Video upload failed",
    }
  }
}

export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const sessionId = formData.get("sessionId") as string
    const questionId = formData.get("questionId") as string

    if (!file || !sessionId || !questionId) {
      return {
        success: false,
        error: "Missing required fields",
      }
    }

    // Generate unique filename with original extension
    const timestamp = Date.now()
    const originalName = file.name
    const extension = originalName.split(".").pop() || "bin"
    const filename = `interviews/${sessionId}/${questionId}/file-${timestamp}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("File uploaded successfully:", blob.url)

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      originalName: originalName,
    }
  } catch (error) {
    console.error("File upload failed:", error)
    return {
      success: false,
      error: "File upload failed",
    }
  }
}
