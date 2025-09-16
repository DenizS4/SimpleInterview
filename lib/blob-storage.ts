import { put, del } from "@vercel/blob"

export async function uploadFile(file: File, path: string) {
  try {
    const blob = await put(path, file, {
      access: "public",
    })

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      type: file.type,
    }
  } catch (error) {
    console.error("Upload failed:", error)
    throw new Error("File upload failed")
  }
}

export async function deleteFile(url: string) {
  try {
    await del(url)
  } catch (error) {
    console.error("Delete failed:", error)
    throw new Error("File deletion failed")
  }
}

export function generateFilePath(sessionId: string, questionId: string, filename: string) {
  const timestamp = Date.now()
  const extension = filename.split(".").pop()
  return `interviews/${sessionId}/${questionId}/${timestamp}.${extension}`
}
