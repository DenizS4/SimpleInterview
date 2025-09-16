"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Eye,
  Edit,
  Share,
  BarChart3,
  Users,
  FileText,
  Clock,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
} from "lucide-react"
import { getInterviewsAction, deleteInterviewAction } from "@/app/actions/interview-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Interview {
  id: string
  title: string
  description: string
  questions: number
  responses: number
  status: "active" | "draft" | "completed"
  createdAt: string
  lastModified: string
  created_at: string
  updated_at: string
}

type SortOption = "date-desc" | "date-asc" | "responses-desc" | "responses-asc" | "title-asc" | "title-desc"

export default function AdminDashboard() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("date-desc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const loadInterviews = async () => {
      // Check authentication
      const isAuth = localStorage.getItem("adminAuth")
      if (!isAuth) {
        router.push("/admin/login")
        return
      }

      // Load real data
      const result = await getInterviewsAction()
      if (result.success) {
        const processedInterviews = result.interviews.map((interview: any) => ({
          id: interview.id,
          title: interview.title,
          description: interview.description || "",
          questions: Number.parseInt(interview.question_count) || 0,
          responses: Number.parseInt(interview.response_count) || 0,
          status: interview.status,
          createdAt: new Date(interview.created_at).toLocaleDateString(),
          lastModified: new Date(interview.updated_at).toLocaleDateString(),
          created_at: interview.created_at,
          updated_at: interview.updated_at,
        }))
        setInterviews(processedInterviews)
      }
    }

    loadInterviews()
  }, [router])

  // Apply filtering, searching, and sorting
  useEffect(() => {
    let filtered = [...interviews]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (interview) =>
          interview.title.toLowerCase().includes(query) ||
          interview.description.toLowerCase().includes(query) ||
          interview.status.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((interview) => interview.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "date-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "responses-desc":
          return b.responses - a.responses
        case "responses-asc":
          return a.responses - b.responses
        case "title-asc":
          return a.title.localeCompare(b.title)
        case "title-desc":
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

    setFilteredInterviews(filtered)
  }, [interviews, sortBy, statusFilter, searchQuery])

  const handleDeleteInterview = async (interviewId: string, interviewTitle: string) => {
    setDeletingId(interviewId)

    try {
      const result = await deleteInterviewAction(interviewId)

      if (result.success) {
        // Remove the interview from the local state
        setInterviews((prev) => prev.filter((interview) => interview.id !== interviewId))
        setDeleteDialogOpen(null)
        console.log(`✅ Interview "${interviewTitle}" deleted successfully`)
      } else {
        console.error("Failed to delete interview:", result.error)
        alert(`Failed to delete interview: ${result.error}`)
      }
    } catch (error) {
      console.error("Error deleting interview:", error)
      alert("An error occurred while deleting the interview")
    } finally {
      setDeletingId(null)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return <ArrowUpDown className="h-4 w-4" />

    if (option.includes("desc")) {
      return <ArrowDown className="h-4 w-4" />
    } else {
      return <ArrowUp className="h-4 w-4" />
    }
  }

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case "date-desc":
        return "Newest First"
      case "date-asc":
        return "Oldest First"
      case "responses-desc":
        return "Most Responses"
      case "responses-asc":
        return "Least Responses"
      case "title-asc":
        return "Title A-Z"
      case "title-desc":
        return "Title Z-A"
      default:
        return "Sort"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex gap-2">
              <Link href="/admin/users">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/interview/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Interview
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("adminAuth")
                  router.push("/")
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                  <p className="text-2xl font-bold">{interviews.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Interviews</p>
                  <p className="text-2xl font-bold">{interviews.filter((i) => i.status === "active").length}</p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold">{interviews.reduce((sum, i) => sum + i.responses, 0)}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Filtered Results</p>
                  <p className="text-2xl font-bold">{filteredInterviews.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interviews List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Your Interviews</CardTitle>
                  <CardDescription>Manage and track your interview assessments</CardDescription>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search interviews by title, description, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Filtering and Sorting Controls */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Filter by Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Sort by</label>
                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">
                        <div className="flex items-center gap-2">
                          <ArrowDown className="h-4 w-4" />
                          Newest First
                        </div>
                      </SelectItem>
                      <SelectItem value="date-asc">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-4 w-4" />
                          Oldest First
                        </div>
                      </SelectItem>
                      <SelectItem value="responses-desc">
                        <div className="flex items-center gap-2">
                          <ArrowDown className="h-4 w-4" />
                          Most Responses
                        </div>
                      </SelectItem>
                      <SelectItem value="responses-asc">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-4 w-4" />
                          Least Responses
                        </div>
                      </SelectItem>
                      <SelectItem value="title-asc">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-4 w-4" />
                          Title A-Z
                        </div>
                      </SelectItem>
                      <SelectItem value="title-desc">
                        <div className="flex items-center gap-2">
                          <ArrowDown className="h-4 w-4" />
                          Title Z-A
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Filters Display */}
                {(searchQuery || statusFilter !== "all") && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Active Filters</label>
                    <div className="flex gap-2 items-center">
                      {searchQuery && (
                        <Badge variant="secondary" className="text-xs">
                          Search: "{searchQuery}"
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSearch}
                            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {statusFilter !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Status: {statusFilter}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStatusFilter("all")}
                            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredInterviews.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
                <p className="text-gray-500 mb-4">
                  {interviews.length === 0
                    ? "Get started by creating your first interview."
                    : searchQuery
                      ? `No interviews match "${searchQuery}". Try adjusting your search or filters.`
                      : "Try adjusting your filters to see more results."}
                </p>
                {interviews.length === 0 && (
                  <Link href="/admin/interview/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Interview
                    </Button>
                  </Link>
                )}
                {(searchQuery || statusFilter !== "all") && interviews.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setStatusFilter("all")
                    }}
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInterviews.map((interview) => (
                  <div key={interview.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{interview.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{interview.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{interview.questions} questions</span>
                          <span>{interview.responses} responses</span>
                          <span>Created {interview.createdAt}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(interview.status)}>{interview.status}</Badge>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Link href={`/admin/interview/${interview.id}/analytics`}>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                      </Link>
                      <Link href={`/admin/interview/${interview.id}/edit`}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/admin/interview/${interview.id}/share`}>
                        <Button size="sm" variant="outline">
                          <Share className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </Link>
                      <Link href={`/interview/${interview.id}/preview`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </Link>

                      <Dialog
                        open={deleteDialogOpen === interview.id}
                        onOpenChange={(open) => setDeleteDialogOpen(open ? interview.id : null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                            disabled={deletingId === interview.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deletingId === interview.id ? "Deleting..." : "Delete"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Interview</DialogTitle>
                            <DialogDescription asChild>
                              <div className="text-sm text-muted-foreground">
                                Are you sure you want to delete "{interview.title}"? This action cannot be undone and
                                will permanently delete:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                  <li>The interview and all its questions</li>
                                  <li>All question options and settings</li>
                                  <li>All candidate responses and sessions</li>
                                  <li>All uploaded files and tracking data</li>
                                </ul>
                              </div>
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(null)}>
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleDeleteInterview(interview.id, interview.title)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deletingId === interview.id}
                            >
                              {deletingId === interview.id ? "Deleting..." : "Delete Interview"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
