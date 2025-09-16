"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { ArrowLeft, Eye, Clock, FileText, Video, Code, Upload } from "lucide-react"
import { getInterviewForPreviewAction, debugQuestionOptionsAction } from "@/app/actions/preview-actions"

interface Question {
  id: string
  type: string
  title: string
  description: string
  time_limit?: number
  order_index: number
  options?: Array<{
    id: string
    option_text: string
    order_index: number
  }>
}

interface Interview {
  id: string
  title: string
  description: string
  instructions: string
  thank_you_message: string
  status: string
}

export default function PreviewInterview({ params }: { params: { id: string } }) {
  const [interview, setInterview] = useState<Interview | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInterview()
  }, [params.id])

  const loadInterview = async () => {
    try {
      console.log("Loading interview for preview:", params.id)
      const result = await getInterviewForPreviewAction(params.id)
      if (result.success) {
        console.log("Interview loaded:", result.interview)
        console.log("Questions loaded:", result.questions)
        setInterview(result.interview)
        setQuestions(result.questions || [])

        // Debug the first multiple choice question
        const mcQuestion = result.questions?.find((q) => q.type === "multiple_choice" || q.type === "multiple-choice")
        if (mcQuestion) {
          console.log("Found multiple choice question:", mcQuestion)
          const debugResult = await debugQuestionOptionsAction(mcQuestion.id)
          console.log("Debug result:", debugResult)
        }
      } else {
        console.error("Failed to load interview:", result.error)
      }
    } catch (error) {
      console.error("Failed to load interview:", error)
    }
    setLoading(false)
  }

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case "multiple_choice":
      case "multiple-choice":
        return <FileText className="h-5 w-5" />
      case "text":
        return <FileText className="h-5 w-5" />
      case "coding":
        return <Code className="h-5 w-5" />
      case "video":
        return <Video className="h-5 w-5" />
      case "file_upload":
        return <Upload className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple_choice":
      case "multiple-choice":
        return "Multiple Choice"
      case "text":
        return "Text Response"
      case "coding":
        return "Coding Challenge"
      case "video":
        return "Video Recording"
      case "file_upload":
        return "File Upload"
      default:
        return type
    }
  }

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case "multiple_choice":
      case "multiple-choice":
        return "bg-blue-100 text-blue-800"
      case "text":
        return "bg-green-100 text-green-800"
      case "coding":
        return "bg-purple-100 text-purple-800"
      case "video":
        return "bg-red-100 text-red-800"
      case "file_upload":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading interview preview...</p>
        </div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Interview not found</p>
          <Link href="/admin/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-600" />
              <div>
                <h1 className="text-2xl font-bold">Preview Mode</h1>
                <p className="text-gray-600">{interview.title}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Interview Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{interview.title}</span>
              <Badge variant={interview.status === "active" ? "default" : "secondary"}>{interview.status}</Badge>
            </CardTitle>
            <CardDescription>{interview.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Interview Instructions</h3>
                <p className="text-sm text-gray-600">
                  {interview.instructions || "No specific instructions provided."}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Completion Message</h3>
                <p className="text-sm text-gray-600">
                  {interview.thank_you_message || "Thank you for completing the interview!"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Questions Overview ({questions.length} total)</CardTitle>
            <CardDescription>Navigate through the interview questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    index === currentQuestionIndex ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {getQuestionIcon(question.type)}
                        <span className="font-medium">Q{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{question.title}</h3>
                        {question.description && <p className="text-sm text-gray-600 mt-1">{question.description}</p>}
                        {(question.type === "multiple_choice" || question.type === "multiple-choice") && (
                          <p className="text-xs text-gray-500 mt-1">
                            Options: {question.options?.length || 0}
                            {question.options?.length === 0 && " (⚠️ No options found)"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getQuestionTypeColor(question.type)}>
                        {getQuestionTypeLabel(question.type)}
                      </Badge>
                      {question.time_limit && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(question.time_limit)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Question Preview */}
        {currentQuestion && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h2>
                {currentQuestion.time_limit && (
                  <div className="flex items-center gap-2 text-lg font-mono">
                    <Clock className="h-5 w-5" />
                    <span>{formatTime(currentQuestion.time_limit)} limit</span>
                  </div>
                )}
              </div>
              <Progress value={progress} className="h-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={getQuestionTypeColor(currentQuestion.type)}>
                    {getQuestionTypeLabel(currentQuestion.type)}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">{currentQuestion.title}</h3>
                  {currentQuestion.description && <p className="text-gray-600 mb-4">{currentQuestion.description}</p>}
                </div>

                {/* Question Type Specific Preview */}
                {(currentQuestion.type === "multiple_choice" || currentQuestion.type === "multiple-choice") && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Answer Options:</h4>
                    {currentQuestion.options && currentQuestion.options.length > 0 ? (
                      currentQuestion.options.map((option, index) => (
                        <div key={option.id} className="flex items-center space-x-3">
                          <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                          <span>{option.option_text}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 font-medium">⚠️ No options found for this question</p>
                        <p className="text-red-600 text-sm mt-1">Question ID: {currentQuestion.id}</p>
                        <p className="text-red-600 text-sm">Question Type: {currentQuestion.type}</p>
                        <p className="text-red-600 text-sm">
                          Please run the SQL script to add options or edit this question.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {currentQuestion.type === "text" && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Text Response Area:</h4>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[120px]">
                      <p className="text-gray-500 italic">Candidates will type their response here...</p>
                    </div>
                  </div>
                )}

                {currentQuestion.type === "coding" && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Code Editor:</h4>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-900 text-green-400 font-mono min-h-[200px]">
                      <p>// Candidates will write their code here...</p>
                      <p>function solution() {`{`}</p>
                      <p>&nbsp;&nbsp;// Your implementation</p>
                      <p>{`}`}</p>
                    </div>
                  </div>
                )}

                {currentQuestion.type === "video" && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Video Recording:</h4>
                    <div className="border border-gray-300 rounded-lg p-8 bg-gray-100 text-center">
                      <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Candidates will record their video response here</p>
                    </div>
                  </div>
                )}

                {currentQuestion.type === "file_upload" && (
                  <div className="space-y-3">
                    <h4 className="font-medium">File Upload:</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Candidates will upload their files here</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {questions.length > 0 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous Question
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next Question
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
