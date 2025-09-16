"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Video, Square, Upload, File } from "lucide-react"
import {
  getInterviewQuestionsAction,
  completeInterviewAction,
  submitResponseAction,
  startInterviewAction,
} from "@/app/actions/session-actions"
import { uploadVideoAction, uploadFileAction } from "@/app/actions/video-actions"

interface Question {
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
  options?: Array<{
    id: string
    option_text: string
    is_correct: boolean
    order_index: number
  }>
}

export default function InterviewQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timerActive, setTimerActive] = useState(false)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)

  // Video recording states
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadQuestions()
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      // Clean up video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (questions.length > 0 && !interviewStarted) {
      startInterview()
    }
  }, [questions, interviewStarted])

  useEffect(() => {
    if (questions.length > 0 && interviewStarted && !timerActive) {
      startQuestionTimer()
    }
  }, [questions, interviewStarted, currentQuestionIndex, timerActive])

  // Initialize camera when video question is loaded
  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex]
    if (currentQuestion?.type === "video") {
      initializeCamera()
    } else {
      // Clean up camera when leaving video question
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [currentQuestionIndex, questions])

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      setError("Unable to access camera. Please check permissions.")
    }
  }

  const startRecording = () => {
    if (!streamRef.current) return

    const recorder = new MediaRecorder(streamRef.current)
    const chunks: Blob[] = []

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" })
      setVideoBlob(blob)
      setRecordedChunks(chunks)

      // Create URL for preview
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
    }

    recorder.start()
    setMediaRecorder(recorder)
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const uploadFile = async (questionId: string) => {
    if (!selectedFile) return null

    setUploadingFile(true)
    try {
      const sessionId = searchParams.get("session") || localStorage.getItem("sessionId")
      if (!sessionId) throw new Error("No session ID")

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("sessionId", sessionId)
      formData.append("questionId", questionId)

      const result = await uploadFileAction(formData)

      if (result.success) {
        setUploadedFileUrl(result.url)
        return {
          file_url: result.url,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
        }
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    } finally {
      setUploadingFile(false)
    }
  }

  const uploadVideo = async (questionId: string) => {
    if (!videoBlob) return null

    setUploadingVideo(true)
    try {
      const sessionId = searchParams.get("session") || localStorage.getItem("sessionId")
      if (!sessionId) throw new Error("No session ID")

      const formData = new FormData()
      formData.append("video", videoBlob, `video-${questionId}-${Date.now()}.webm`)
      formData.append("sessionId", sessionId)
      formData.append("questionId", questionId)

      const result = await uploadVideoAction(formData)

      if (result.success) {
        return {
          file_url: result.url,
          file_size: videoBlob.size,
          duration: 0, // We could calculate this if needed
          mime_type: "video/webm",
        }
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (error) {
      console.error("Error uploading video:", error)
      throw error
    } finally {
      setUploadingVideo(false)
    }
  }

  const loadQuestions = async () => {
    try {
      const interviewId = searchParams.get("interview") || localStorage.getItem("interviewId")

      if (!interviewId) {
        setError("No interview ID found")
        setLoading(false)
        return
      }

      console.log("[CLIENT] Loading questions for interview:", interviewId)
      const result = await getInterviewQuestionsAction(interviewId)

      if (result.success) {
        console.log("[CLIENT] Questions loaded:", result.questions.length)

        result.questions.forEach((q: Question, idx: number) => {
          console.log(`[CLIENT] Question ${idx + 1}: ${q.title} (${q.type})`)
          console.log(`[CLIENT]   Options count: ${q.options?.length || 0}`)
          if (q.options && q.options.length > 0) {
            q.options.forEach((opt, optIdx) => {
              console.log(`[CLIENT]     Option ${optIdx + 1}: ${opt.option_text}`)
            })
          }
        })

        setQuestions(result.questions)
      } else {
        setError("Failed to load questions")
      }
    } catch (err) {
      console.error("[CLIENT] Error loading questions:", err)
      setError("Failed to load questions")
    } finally {
      setLoading(false)
    }
  }

  const startInterview = async () => {
    const sessionId = searchParams.get("session") || localStorage.getItem("sessionId")

    if (!sessionId) {
      setError("No session ID found")
      return
    }

    try {
      console.log("[CLIENT] Starting interview for session:", sessionId)
      const result = await startInterviewAction(sessionId)

      if (result.success) {
        setInterviewStarted(true)
        console.log("[CLIENT] Interview started successfully")
      } else {
        setError("Failed to start interview")
      }
    } catch (error) {
      console.error("[CLIENT] Error starting interview:", error)
      setError("Failed to start interview")
    }
  }

  const startQuestionTimer = () => {
    if (questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex]
      const timeLimit = currentQuestion.time_limit || 300

      console.log("[CLIENT] Starting timer for", timeLimit, "seconds")
      setTimeLeft(timeLimit)
      setTimerActive(true)
      setQuestionStartTime(Date.now())

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            console.log("[CLIENT] Timer expired, moving to next question")
            handleNext()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  const handleNext = async () => {
    // Save current response if exists
    const currentQuestion = questions[currentQuestionIndex]
    const response = responses[currentQuestion.id]
    const sessionId = searchParams.get("session") || localStorage.getItem("sessionId")

    if (sessionId) {
      try {
        // Calculate time spent on this question
        const timeSpent = questionStartTime > 0 ? Math.floor((Date.now() - questionStartTime) / 1000) : 0

        // Prepare response data based on question type
        let responseData = {}

        if (currentQuestion.type === "multiple-choice" || currentQuestion.type === "multiple_choice") {
          if (response?.selectedOption) {
            responseData = {
              selected_option_id: response.selectedOption,
              selected_option_text: response.selectedText || "",
            }
          } else {
            // Save empty response if no option selected
            responseData = {
              selected_option_id: null,
              selected_option_text: "",
            }
          }
        } else if (currentQuestion.type === "text") {
          responseData = {
            text: response?.text || "",
            word_count: response?.text ? response.text.split(/\s+/).length : 0,
            character_count: response?.text ? response.text.length : 0,
          }
        } else if (currentQuestion.type === "coding") {
          responseData = {
            code: response?.code || "",
            language: response?.language || "javascript",
          }
        } else if (currentQuestion.type === "video") {
          if (videoBlob) {
            // Upload video and get URL
            const videoData = await uploadVideo(currentQuestion.id)
            responseData = videoData || {}
          } else {
            responseData = {}
          }
        } else if (currentQuestion.type === "file-upload" || currentQuestion.type === "file_upload") {
          if (selectedFile) {
            // Upload file and get URL
            const fileData = await uploadFile(currentQuestion.id)
            responseData = fileData || {}
          } else {
            responseData = {}
          }
        } else {
          responseData = response || {}
        }

        console.log("[CLIENT] Saving response:", responseData, "Time spent:", timeSpent)

        await submitResponseAction({
          sessionId,
          questionId: currentQuestion.id,
          responseData,
          timeSpent,
          questionType: currentQuestion.type,
        })

        console.log("[CLIENT] Response saved successfully")
      } catch (error) {
        console.error("[CLIENT] Error saving response:", error)
      }
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setTimerActive(false)

    // Reset video states
    setVideoBlob(null)
    setVideoUrl(null)
    setRecordedChunks([])

    // Reset file states
    setSelectedFile(null)
    setUploadedFileUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      // Timer will restart via useEffect
    } else {
      // Complete the interview
      if (sessionId) {
        try {
          await completeInterviewAction(sessionId)
          router.push("/interview/complete")
        } catch (error) {
          console.error("[CLIENT] Error completing interview:", error)
        }
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setTimerActive(false)

      // Reset video states
      setVideoBlob(null)
      setVideoUrl(null)
      setRecordedChunks([])

      // Reset file states
      setSelectedFile(null)
      setUploadedFileUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      setCurrentQuestionIndex(currentQuestionIndex - 1)
      // Timer will restart via useEffect
    }
  }

  const handleResponseChange = (questionId: string, value: any) => {
    console.log("[CLIENT] Response changed for question:", questionId, "value:", value)
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Questions</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/interview/access")}>Back to Access</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Questions Found</h2>
            <p className="text-gray-600">This interview doesn't have any questions yet.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h1>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className={`font-mono ${timeLeft < 60 ? "text-red-600" : "text-gray-700"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <Progress value={progress} className="mt-2" />
        </div>
      </div>

      {/* Question Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-4xl mx-auto">
          <CardContent className="p-8">
            {currentQuestion && (
              <>
                {/* Question Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{currentQuestion.type.replace("_", "-")}</Badge>
                    <Badge variant="outline">{formatTime(currentQuestion.time_limit || 300)} limit</Badge>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{currentQuestion.title}</h2>
                  <p className="text-gray-600">{currentQuestion.description}</p>
                </div>

                {/* Question Content Based on Type */}
                <div className="mb-8">
                  {currentQuestion.type === "multiple-choice" || currentQuestion.type === "multiple_choice" ? (
                    <div className="space-y-3">
                      {currentQuestion.options && currentQuestion.options.length > 0 ? (
                        currentQuestion.options.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                              responses[currentQuestion.id]?.selectedOption === option.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => {
                              console.log("[CLIENT] Option selected:", option.option_text)
                              handleResponseChange(currentQuestion.id, {
                                selectedOption: option.id,
                                selectedText: option.option_text,
                              })
                            }}
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestion.id}`}
                              value={option.id}
                              checked={responses[currentQuestion.id]?.selectedOption === option.id}
                              onChange={() => {}} // Handled by div onClick
                              className="mr-3 h-4 w-4 text-blue-600"
                            />
                            <span className="text-gray-900">{option.option_text}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <p className="text-yellow-800">No options available for this question.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : currentQuestion.type === "text" ? (
                    <div>
                      <textarea
                        className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type your answer here..."
                        value={responses[currentQuestion.id]?.text || ""}
                        onChange={(e) => {
                          handleResponseChange(currentQuestion.id, { text: e.target.value })
                        }}
                      />
                    </div>
                  ) : currentQuestion.type === "coding" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Programming Language</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={responses[currentQuestion.id]?.language || "javascript"}
                          onChange={(e) => {
                            const currentResponse = responses[currentQuestion.id] || {}
                            handleResponseChange(currentQuestion.id, {
                              ...currentResponse,
                              language: e.target.value,
                            })
                          }}
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                          <option value="csharp">C#</option>
                          <option value="go">Go</option>
                          <option value="rust">Rust</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Code</label>
                        <textarea
                          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          placeholder="Write your code here..."
                          value={responses[currentQuestion.id]?.code || ""}
                          onChange={(e) => {
                            const currentResponse = responses[currentQuestion.id] || {}
                            handleResponseChange(currentQuestion.id, {
                              ...currentResponse,
                              code: e.target.value,
                              language: currentResponse.language || "javascript",
                            })
                          }}
                        />
                      </div>
                    </div>
                  ) : currentQuestion.type === "video" ? (
                    <div className="space-y-4">
                      <div className="bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          className="w-full h-96 object-cover"
                          style={{ display: videoUrl ? "none" : "block" }}
                        />
                        {videoUrl && <video src={videoUrl} controls className="w-full h-96 object-cover" />}
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        {!videoBlob && (
                          <>
                            {!isRecording ? (
                              <Button onClick={startRecording} className="flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                Start Recording
                              </Button>
                            ) : (
                              <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                                <Square className="h-4 w-4" />
                                Stop Recording
                              </Button>
                            )}
                          </>
                        )}

                        {videoBlob && (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Video Recorded
                            </Badge>
                            <Button
                              onClick={() => {
                                setVideoBlob(null)
                                setVideoUrl(null)
                                setRecordedChunks([])
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Record Again
                            </Button>
                          </div>
                        )}
                      </div>

                      {uploadingVideo && (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Uploading video...</p>
                        </div>
                      )}
                    </div>
                  ) : currentQuestion.type === "file-upload" || currentQuestion.type === "file_upload" ? (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          accept="*/*"
                        />

                        {!selectedFile && !uploadedFileUrl && (
                          <div>
                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">Choose a file to upload</p>
                            <Button
                              onClick={() => fileInputRef.current?.click()}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <File className="h-4 w-4" />
                              Select File
                            </Button>
                          </div>
                        )}

                        {selectedFile && !uploadedFileUrl && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2">
                              <File className="h-8 w-8 text-blue-600" />
                              <div className="text-left">
                                <p className="font-medium">{selectedFile.name}</p>
                                <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-center">
                              <Button
                                onClick={() => {
                                  setSelectedFile(null)
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = ""
                                  }
                                }}
                                variant="outline"
                                size="sm"
                              >
                                Remove
                              </Button>
                              <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                                Choose Different File
                              </Button>
                            </div>
                          </div>
                        )}

                        {uploadedFileUrl && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2">
                              <File className="h-8 w-8 text-green-600" />
                              <div className="text-left">
                                <p className="font-medium text-green-800">File uploaded successfully</p>
                                <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => {
                                setSelectedFile(null)
                                setUploadedFileUrl(null)
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = ""
                                }
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Upload Different File
                            </Button>
                          </div>
                        )}
                      </div>

                      {uploadingFile && (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Uploading file...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">Question type "{currentQuestion.type}" is not yet supported.</p>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <Button onClick={handleNext} disabled={uploadingVideo || uploadingFile}>
                    {currentQuestionIndex === questions.length - 1 ? (
                      "Complete Interview"
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
