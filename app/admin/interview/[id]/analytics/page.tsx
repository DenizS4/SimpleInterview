"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  ArrowLeft,
  Users,
  Clock,
  Eye,
  TrendingUp,
  Download,
  CheckCircle,
  XCircle,
  Play,
  VideoIcon,
  File,
  ExternalLink,
} from "lucide-react"
import {
  getInterviewAnalyticsAction,
  getSessionDetailsAction,
  exportSessionsAction,
} from "@/app/actions/analytics-actions"

interface AnalyticsData {
  interview: {
    id: string
    title: string
    description: string
    total_sessions: number
    completed_sessions: number
    average_completion_time: number
    abandonment_rate: number
  }
  questions: Array<{
    id: string
    title: string
    type: string
    order_index: number
    total_responses: number
    average_time_spent: number
    completion_rate: number
    response_distribution: Record<string, number>
  }>
  sessions: Array<{
    id: string
    candidate_email: string
    candidate_name: string
    status: string
    started_at: string
    completed_at: string
    total_time: number
    responses_count: number
  }>
  keystroke_analytics: Array<{
    question_id: string
    question_title: string
    total_keystrokes: number
    average_typing_speed: number
    paste_events: number
    backspace_ratio: number
    focus_changes: number
  }>
}

export default function InterviewAnalytics({ params }: { params: { id: string } }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionDetails, setSessionDetails] = useState<any>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [params.id])

  const loadAnalytics = async () => {
    try {
      const result = await getInterviewAnalyticsAction(params.id)
      if (result.success) {
        setAnalytics(result.data)
      }
    } catch (error) {
      console.error("Failed to load analytics:", error)
    }
    setLoading(false)
  }

  const loadSessionDetails = async (sessionId: string) => {
    try {
      console.log("🔍 Loading session details for:", sessionId)
      const result = await getSessionDetailsAction(sessionId)
      console.log("📊 Session details result:", result)
      if (result.success) {
        console.log("✅ Setting session details:", result.data)
        setSessionDetails(result.data)
      }
    } catch (error) {
      console.error("❌ Failed to load session details:", error)
    }
  }

  const handleExportSessions = async () => {
    setExporting(true)
    try {
      const result = await exportSessionsAction(params.id)
      if (result.success && result.csvData) {
        // Create and download CSV file
        const blob = new Blob([result.csvData], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = result.filename || `interview-sessions-${params.id}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error("Export failed:", result.error)
      }
    } catch (error) {
      console.error("Export error:", error)
    }
    setExporting(false)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.round((seconds % 60) * 100) / 100 // Round to 2 decimal places

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs.toFixed(2)}s`
    }
    return `${minutes}m ${secs.toFixed(2)}s`
  }

  const formatNumber = (num: number) => {
    return Math.round(num * 100) / 100 // Round to 2 decimal places
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "abandoned":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleVideoDownload = (videoUrl: string, filename: string) => {
    const a = document.createElement("a")
    a.href = videoUrl
    a.download = filename
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleFileDownload = (fileUrl: string, filename: string) => {
    const a = document.createElement("a")
    a.href = fileUrl
    a.download = filename
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>No analytics data available</p>
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
            <div>
              <h1 className="text-2xl font-bold">{analytics.interview.title}</h1>
              <p className="text-gray-600">Interview Analytics</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold">{analytics.interview.total_sessions}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold">
                    {analytics.interview.total_sessions > 0
                      ? formatNumber(
                          (analytics.interview.completed_sessions / analytics.interview.total_sessions) * 100,
                        )
                      : 0}
                    %
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                  <p className="text-2xl font-bold">{formatDuration(analytics.interview.average_completion_time)}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Abandonment</p>
                  <p className="text-2xl font-bold">{formatNumber(analytics.interview.abandonment_rate)}%</p>
                </div>
                <Eye className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="questions">Question Analytics</TabsTrigger>
            <TabsTrigger value="sessions">Session Details</TabsTrigger>
            <TabsTrigger value="keystroke">Keystroke Analysis</TabsTrigger>
            <TabsTrigger value="responses">Response Patterns</TabsTrigger>
          </TabsList>

          {/* Question Analytics */}
          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle>Question Performance</CardTitle>
                <CardDescription>Detailed analytics for each question</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analytics.questions.map((question) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            Q{question.order_index}: {question.title}
                          </h3>
                          <Badge variant="outline" className="mt-1">
                            {question.type.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{question.total_responses} responses</p>
                          <p className="text-sm text-gray-600">{formatNumber(question.completion_rate)}% completion</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                          <Progress value={question.completion_rate} className="mt-1" />
                          <p className="text-xs text-gray-500 mt-1">{formatNumber(question.completion_rate)}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg. Time Spent</p>
                          <p className="text-lg font-semibold">{formatDuration(question.average_time_spent)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Response Distribution</p>
                          <div className="text-xs text-gray-600 mt-1">
                            {Object.entries(question.response_distribution).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span>{key}:</span>
                                <span>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Session Details */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Interview Sessions</CardTitle>
                    <CardDescription>Individual session performance and details</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportSessions} disabled={exporting}>
                    <Download className="h-4 w-4 mr-2" />
                    {exporting ? "Exporting..." : "Export CSV"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.sessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {session.candidate_name || session.candidate_email || "Anonymous"}
                            </h3>
                            <Badge className={getStatusColor(session.status)}>{session.status}</Badge>
                          </div>
                          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Started:</span>{" "}
                              {new Date(session.started_at).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> {formatDuration(session.total_time)}
                            </div>
                            <div>
                              <span className="font-medium">Responses:</span> {session.responses_count}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => loadSessionDetails(session.id)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keystroke Analysis */}
          <TabsContent value="keystroke">
            <Card>
              <CardHeader>
                <CardTitle>Keystroke & Interaction Analysis</CardTitle>
                <CardDescription>Detailed typing patterns and user behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analytics.keystroke_analytics.map((data) => (
                    <div key={data.question_id} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">{data.question_title}</h3>

                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{data.total_keystrokes}</p>
                          <p className="text-sm text-gray-600">Total Keystrokes</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{formatNumber(data.average_typing_speed)}</p>
                          <p className="text-sm text-gray-600">Avg WPM</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{data.paste_events}</p>
                          <p className="text-sm text-gray-600">Paste Events</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-2xl font-bold text-red-600">{formatNumber(data.backspace_ratio)}%</p>
                          <p className="text-sm text-gray-600">Backspace Ratio</p>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">Focus Changes:</span> {data.focus_changes} times
                          <span className="ml-4 font-medium">Behavior Score:</span>{" "}
                          <Badge variant={data.paste_events > 5 ? "destructive" : "default"}>
                            {data.paste_events > 5 ? "Suspicious" : "Normal"}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Response Patterns */}
          <TabsContent value="responses">
            <Card>
              <CardHeader>
                <CardTitle>Response Patterns & Insights</CardTitle>
                <CardDescription>Analysis of response quality and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analytics.questions.map((question) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">
                        Q{question.order_index}: {question.title}
                      </h3>

                      {(question.type === "multiple-choice" || question.type === "multiple_choice") && (
                        <div>
                          <h4 className="font-medium mb-2">Answer Distribution:</h4>
                          <div className="space-y-2">
                            {Object.entries(question.response_distribution).map(([option, count]) => {
                              const percentage =
                                question.total_responses > 0 ? (count / question.total_responses) * 100 : 0
                              return (
                                <div key={option} className="flex items-center gap-3">
                                  <span className="w-32 text-sm">{option}</span>
                                  <Progress value={percentage} className="flex-1" />
                                  <span className="text-sm font-medium w-16">
                                    {count} ({formatNumber(percentage)}%)
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {question.type === "text" && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Response Length Distribution:</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Short (0-50 words):</span>
                                <span>{question.response_distribution.short || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Medium (51-150 words):</span>
                                <span>{question.response_distribution.medium || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Long (150+ words):</span>
                                <span>{question.response_distribution.long || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Quality Indicators:</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Avg. Response Time:</span>
                                <span>{formatDuration(question.average_time_spent)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Completion Rate:</span>
                                <span>{formatNumber(question.completion_rate)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {question.type === "coding" && (
                        <div>
                          <h4 className="font-medium mb-2">Code Quality Metrics:</h4>
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Avg. Lines:</span>{" "}
                              {formatNumber(question.response_distribution.avg_lines || 0)}
                            </div>
                            <div>
                              <span className="font-medium">Syntax Errors:</span>{" "}
                              {formatNumber(question.response_distribution.syntax_errors || 0)}%
                            </div>
                            <div>
                              <span className="font-medium">Completion:</span> {formatNumber(question.completion_rate)}%
                            </div>
                          </div>
                        </div>
                      )}

                      {question.type === "video" && (
                        <div>
                          <h4 className="font-medium mb-2">Video Response Distribution:</h4>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span>Recorded Videos:</span>
                              <span>{question.response_distribution.recorded || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>No Recording:</span>
                              <span>{question.response_distribution.no_recording || 0}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {(question.type === "file-upload" || question.type === "file_upload") && (
                        <div>
                          <h4 className="font-medium mb-2">File Upload Distribution:</h4>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span>Files Uploaded:</span>
                              <span>{question.response_distribution.uploaded || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>No File:</span>
                              <span>{question.response_distribution.no_file || 0}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Session Details Modal */}
      {sessionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto m-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Session Details</CardTitle>
                <Button variant="outline" onClick={() => setSessionDetails(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Candidate Information</h3>
                    <p>Email: {sessionDetails.session.candidate_email}</p>
                    <p>Name: {sessionDetails.session.candidate_name || "Not provided"}</p>
                    <p>Status: {sessionDetails.session.status}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Session Timing</h3>
                    <p>Started: {new Date(sessionDetails.session.started_at).toLocaleString()}</p>
                    <p>Duration: {formatDuration(sessionDetails.session.total_time)}</p>
                    <p>Responses: {sessionDetails.responses.length}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Question Responses</h3>
                  <div className="space-y-4">
                    {sessionDetails.responses.map((response: any) => {
                      console.log("🎯 Rendering response:", response)
                      console.log("🔍 Multiple choice details:", response.multiple_choice_details)

                      return (
                        <div key={response.id} className="border rounded-lg p-4">
                          <h4 className="font-medium">{response.question_title}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Time spent: {formatDuration(response.time_spent || 0)}
                          </p>
                          <div className="bg-gray-50 p-3 rounded">
                            {(response.question_type === "multiple-choice" ||
                              response.question_type === "multiple_choice") &&
                              response.multiple_choice_details && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Selected:</span>
                                    <span>{response.multiple_choice_details.selected_option_text}</span>
                                    {response.multiple_choice_details.is_correct ? (
                                      <Badge variant="default" className="bg-green-100 text-green-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Correct
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Incorrect
                                      </Badge>
                                    )}
                                  </div>
                                  {!response.multiple_choice_details.is_correct && (
                                    <div className="text-sm text-gray-600">
                                      <span className="font-medium">Correct answer:</span>{" "}
                                      {response.multiple_choice_details.correct_answer}
                                    </div>
                                  )}
                                </div>
                              )}
                            {(response.question_type === "multiple-choice" ||
                              response.question_type === "multiple_choice") &&
                              !response.multiple_choice_details && (
                                <div className="text-red-600 text-sm">
                                  ⚠️ Multiple choice details not available - check console logs
                                </div>
                              )}
                            {response.question_type === "text" && <p>{response.response_data.text}</p>}
                            {response.question_type === "coding" && (
                              <div className="space-y-2">
                                <div className="text-sm text-gray-600">Language: {response.response_data.language}</div>
                                <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                                  {response.response_data.code}
                                </pre>
                              </div>
                            )}
                            {response.question_type === "video" && (
                              <div className="space-y-3">
                                {response.response_data.file_url ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <VideoIcon className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm font-medium">Video Response</span>
                                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                                        Recorded
                                      </Badge>
                                    </div>
                                    <video
                                      src={response.response_data.file_url}
                                      controls
                                      className="w-full max-w-md h-48 bg-black rounded"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(response.response_data.file_url, "_blank")}
                                      >
                                        <Play className="h-3 w-3 mr-1" />
                                        Watch
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleVideoDownload(
                                            response.response_data.file_url,
                                            `video-response-${response.id}.webm`,
                                          )
                                        }
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        Download
                                      </Button>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      File size:{" "}
                                      {response.response_data.file_size
                                        ? formatFileSize(response.response_data.file_size)
                                        : "Unknown"}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <VideoIcon className="h-4 w-4" />
                                    <span className="text-sm">No video recorded</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {(response.question_type === "file-upload" || response.question_type === "file_upload") && (
                              <div className="space-y-3">
                                {response.response_data.file_url ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <File className="h-4 w-4 text-green-600" />
                                      <span className="text-sm font-medium">File Upload</span>
                                      <Badge variant="default" className="bg-green-100 text-green-800">
                                        Uploaded
                                      </Badge>
                                    </div>
                                    <div className="bg-white border rounded p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <File className="h-5 w-5 text-gray-600" />
                                          <div>
                                            <p className="text-sm font-medium">
                                              {response.response_data.file_name || "Uploaded File"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {response.response_data.file_size
                                                ? formatFileSize(response.response_data.file_size)
                                                : "Unknown size"}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(response.response_data.file_url, "_blank")}
                                          >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            View
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleFileDownload(
                                                response.response_data.file_url,
                                                response.response_data.file_name || `file-response-${response.id}`,
                                              )
                                            }
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            Download
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <File className="h-4 w-4" />
                                    <span className="text-sm">No file uploaded</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
