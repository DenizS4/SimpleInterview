"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { getInterviewForEditAction, updateInterviewAction } from "@/app/actions/interview-actions"
import { useRouter } from "next/navigation"

interface Question {
  id: string
  type: "multiple-choice" | "text" | "coding" | "video" | "file-upload"
  title: string
  description: string
  required: boolean
  timeLimit?: number
  options?: Array<{
    id: string
    option_text: string
    is_correct: boolean
    order_index: number
  }>
  settings: Record<string, any>
}

interface Interview {
  id: string
  title: string
  description: string
  status: string
  instructions: string
  thank_you_message: string
}

export default function EditInterview({ params }: { params: { id: string } }) {
  const [interview, setInterview] = useState<Interview | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadInterview()
  }, [params.id])

  const loadInterview = async () => {
    try {
      const result = await getInterviewForEditAction(params.id)
      if (result.success) {
        setInterview(result.interview)
        setQuestions(result.questions || [])
      }
    } catch (error) {
      console.error("Failed to load interview:", error)
    }
    setLoading(false)
  }

  const addQuestion = (type: Question["type"]) => {
    const newQuestion: Question = {
      id: `new-${Date.now()}`,
      type,
      title: "",
      description: "",
      required: true,
      settings: {},
    }

    if (type === "multiple-choice") {
      newQuestion.options = [
        { id: `opt-1-${Date.now()}`, option_text: "Option 1", is_correct: false, order_index: 1 },
        { id: `opt-2-${Date.now()}`, option_text: "Option 2", is_correct: false, order_index: 2 },
      ]
    }

    setQuestions([...questions, newQuestion])
    setShowAddQuestion(false)
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleSave = async () => {
    if (!interview) return

    setSaving(true)
    try {
      const result = await updateInterviewAction({
        id: params.id,
        title: interview.title,
        description: interview.description,
        instructions: interview.instructions,
        thank_you_message: interview.thank_you_message,
        status: interview.status,
        questions: questions,
      })

      if (result.success) {
        router.push("/admin/dashboard")
      }
    } catch (error) {
      console.error("Save failed:", error)
    }
    setSaving(false)
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple-choice":
        return "Multiple Choice"
      case "text":
        return "Text Response"
      case "coding":
        return "Coding Challenge"
      case "video":
        return "Video Recording"
      case "file-upload":
        return "File Upload"
      default:
        return type
    }
  }

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case "multiple-choice":
        return "bg-blue-100 text-blue-800"
      case "text":
        return "bg-green-100 text-green-800"
      case "coding":
        return "bg-purple-100 text-purple-800"
      case "video":
        return "bg-red-100 text-red-800"
      case "file-upload":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading interview...</p>
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
            <h1 className="text-2xl font-bold">Edit Interview</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Interview Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Interview Details</CardTitle>
            <CardDescription>Update the basic information for your interview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Interview Title</Label>
                <Input
                  id="title"
                  value={interview.title}
                  onChange={(e) => setInterview({ ...interview, title: e.target.value })}
                  placeholder="e.g., Frontend Developer Assessment"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={interview.status}
                  onValueChange={(value) => setInterview({ ...interview, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={interview.description || ""}
                onChange={(e) => setInterview({ ...interview, description: e.target.value })}
                placeholder="Describe what this interview assesses..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions for Candidates</Label>
              <Textarea
                id="instructions"
                value={interview.instructions || ""}
                onChange={(e) => setInterview({ ...interview, instructions: e.target.value })}
                placeholder="Instructions that candidates will see before starting..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thank_you">Thank You Message</Label>
              <Textarea
                id="thank_you"
                value={interview.thank_you_message || ""}
                onChange={(e) => setInterview({ ...interview, thank_you_message: e.target.value })}
                placeholder="Message shown after interview completion..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Questions ({questions.length})</CardTitle>
                <CardDescription>Manage the questions for this interview</CardDescription>
              </div>
              <Button onClick={() => setShowAddQuestion(!showAddQuestion)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Question Types */}
            {showAddQuestion && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-3">Choose Question Type:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {["multiple-choice", "text", "coding", "video", "file-upload"].map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      onClick={() => addQuestion(type as Question["type"])}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <span className="font-medium">{getQuestionTypeLabel(type)}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Question {index + 1}</span>
                      <Badge className={getQuestionTypeColor(question.type)}>
                        {getQuestionTypeLabel(question.type)}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeQuestion(question.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Title</Label>
                      <Input
                        value={question.title}
                        onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                        placeholder="Enter your question..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Textarea
                        value={question.description}
                        onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                        placeholder="Additional context or instructions..."
                        rows={2}
                      />
                    </div>

                    {question.type === "multiple-choice" && question.options && (
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {question.options.map((option, optIndex) => (
                          <div key={option.id} className="flex gap-2 items-center">
                            <Input
                              value={option.option_text}
                              onChange={(e) => {
                                const newOptions = [...question.options!]
                                newOptions[optIndex] = { ...option, option_text: e.target.value }
                                updateQuestion(question.id, { options: newOptions })
                              }}
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            <label className="flex items-center gap-1">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={option.is_correct}
                                onChange={() => {
                                  const newOptions = question.options!.map((opt, i) => ({
                                    ...opt,
                                    is_correct: i === optIndex,
                                  }))
                                  updateQuestion(question.id, { options: newOptions })
                                }}
                              />
                              <span className="text-sm">Correct</span>
                            </label>
                            {question.options!.length > 2 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newOptions = question.options!.filter((_, i) => i !== optIndex)
                                  updateQuestion(question.id, { options: newOptions })
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newOptions = [
                              ...question.options!,
                              {
                                id: `opt-${Date.now()}`,
                                option_text: `Option ${question.options!.length + 1}`,
                                is_correct: false,
                                order_index: question.options!.length + 1,
                              },
                            ]
                            updateQuestion(question.id, { options: newOptions })
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <div className="space-y-2">
                        <Label>Time Limit (minutes)</Label>
                        <Select
                          value={question.timeLimit ? Math.floor(question.timeLimit / 60).toString() : "0"}
                          onValueChange={(value) =>
                            updateQuestion(question.id, {
                              timeLimit: value === "0" ? undefined : Number.parseInt(value) * 60,
                            })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="No limit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No limit</SelectItem>
                            <SelectItem value="1">1 min</SelectItem>
                            <SelectItem value="2">2 min</SelectItem>
                            <SelectItem value="5">5 min</SelectItem>
                            <SelectItem value="10">10 min</SelectItem>
                            <SelectItem value="15">15 min</SelectItem>
                            <SelectItem value="30">30 min</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No questions added yet. Click "Add Question" to get started.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Actions */}
        <div className="flex gap-4">
          <Button className="flex-1" onClick={handleSave} disabled={saving || !interview.title}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
