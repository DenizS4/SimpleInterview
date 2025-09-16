"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { createInterviewAction, saveQuestionsAction } from "@/app/actions/interview-actions"
import { useRouter } from "next/navigation"

interface QuestionOption {
  id: string
  option_text: string
  is_correct: boolean
  order_index: number
}

interface Question {
  id: string
  type: "multiple-choice" | "text" | "coding" | "video" | "file-upload"
  title: string
  description: string
  required: boolean
  timeLimit?: number
  options?: QuestionOption[]
  settings: Record<string, any>
}

export default function CreateInterview() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [thankYouMessage, setThankYouMessage] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const addQuestion = (type: Question["type"]) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: "",
      description: "",
      required: true,
      settings: {},
    }

    if (type === "multiple-choice") {
      newQuestion.options = [
        {
          id: `opt-1-${Date.now()}`,
          option_text: "Option 1",
          is_correct: true, // Make first option correct by default
          order_index: 1,
        },
        {
          id: `opt-2-${Date.now()}`,
          option_text: "Option 2",
          is_correct: false,
          order_index: 2,
        },
        {
          id: `opt-3-${Date.now()}`,
          option_text: "Option 3",
          is_correct: false,
          order_index: 3,
        },
        {
          id: `opt-4-${Date.now()}`,
          option_text: "Option 4",
          is_correct: false,
          order_index: 4,
        },
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

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      console.log("=== CREATING INTERVIEW ===")
      console.log("Title:", title)
      console.log("Questions:", questions)

      // Create interview
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("instructions", instructions)
      formData.append("thank_you_message", thankYouMessage)

      const result = await createInterviewAction(formData)
      console.log("Interview creation result:", result)

      if (result.success && questions.length > 0) {
        console.log("Saving questions with options...")
        // Save questions
        const saveResult = await saveQuestionsAction(result.interview.id, questions)
        console.log("Questions save result:", saveResult)
      }

      if (result.success) {
        router.push("/admin/dashboard")
      }
    } catch (error) {
      console.error("Save failed:", error)
    }
    setSaving(false)
  }

  const handleSaveAndPublish = async () => {
    // Same as draft but update status to 'active'
    await handleSaveDraft()
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
            <h1 className="text-2xl font-bold">Create New Interview</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Interview Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Interview Details</CardTitle>
            <CardDescription>Set up the basic information for your interview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Interview Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Frontend Developer Assessment"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this interview assesses..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions for Candidates</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Instructions that candidates will see before starting..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thank_you">Thank You Message</Label>
              <Textarea
                id="thank_you"
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
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
                <CardDescription>Add different types of questions to assess candidates</CardDescription>
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
                  <Button
                    variant="outline"
                    onClick={() => addQuestion("multiple-choice")}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <span className="font-medium">Multiple Choice</span>
                    <span className="text-xs text-gray-500">A/B/C/D options</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addQuestion("text")}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <span className="font-medium">Text Response</span>
                    <span className="text-xs text-gray-500">Open-ended text</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addQuestion("coding")}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <span className="font-medium">Coding Challenge</span>
                    <span className="text-xs text-gray-500">Code editor with tracking</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addQuestion("video")}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <span className="font-medium">Video Recording</span>
                    <span className="text-xs text-gray-500">Record video response</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addQuestion("file-upload")}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <span className="font-medium">File Upload</span>
                    <span className="text-xs text-gray-500">Upload documents/files</span>
                  </Button>
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
                      {question.type === "multiple-choice" && (
                        <Badge variant="outline">{question.options?.length || 0} options</Badge>
                      )}
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

                    {question.type === "multiple-choice" && (
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {question.options?.map((option, optIndex) => (
                          <div key={option.id} className="flex gap-2 items-center">
                            <Input
                              value={option.option_text}
                              onChange={(e) => {
                                const newOptions = [...(question.options || [])]
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
                            {question.options && question.options.length > 2 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newOptions = question.options?.filter((_, i) => i !== optIndex)
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
                              ...(question.options || []),
                              {
                                id: `opt-${Date.now()}`,
                                option_text: `Option ${(question.options?.length || 0) + 1}`,
                                is_correct: false,
                                order_index: (question.options?.length || 0) + 1,
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
          <Button className="flex-1" onClick={handleSaveDraft} disabled={saving || !title}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={handleSaveAndPublish}
            disabled={saving || !title}
          >
            Save & Publish
          </Button>
        </div>
      </div>
    </div>
  )
}
