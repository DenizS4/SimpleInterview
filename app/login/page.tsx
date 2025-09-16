"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { authenticateUser } from "@/app/actions/auth-actions"
import {BarChart3, FileText, Share2} from "lucide-react";

export default function LoginPage() {
  const [adminForm, setAdminForm] = useState({ email: "", password: "" })
  const [candidateForm, setCandidateForm] = useState({ email: "", password: "" })
  const [adminLoading, setAdminLoading] = useState(false)
  const [candidateLoading, setCandidateLoading] = useState(false)
  const [adminError, setAdminError] = useState("")
  const [candidateError, setCandidateError] = useState("")
  const router = useRouter()

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminLoading(true)
    setAdminError("")

    try {
      const result = await authenticateUser(adminForm.email, adminForm.password, "admin")

      if (result.success) {
        localStorage.setItem("adminAuth", "true")
        localStorage.setItem("adminEmail", adminForm.email)
        localStorage.setItem("adminUser", JSON.stringify(result.user))
        router.push("/admin/dashboard")
      } else {
        setAdminError(result.error || "Login failed")
      }
    } catch (error) {
      setAdminError("Login failed. Please try again.")
    }

    setAdminLoading(false)
  }

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCandidateLoading(true)
    setCandidateError("")

    try {
      const result = await authenticateUser(candidateForm.email, candidateForm.password, "candidate")

      if (result.success) {
        localStorage.setItem("candidateAuth", "true")
        localStorage.setItem("candidateEmail", candidateForm.email)
        localStorage.setItem("candidateUser", JSON.stringify(result.user))
        router.push("/interview/access")
      } else {
        setCandidateError(result.error || "Login failed")
      }
    } catch (error) {
      setCandidateError("Login failed. Please try again.")
    }

    setCandidateLoading(false)
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple Interview</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A comprehensive platform for creating, managing, and conducting interviews with advanced analytics, multiple
              question types, and real-time candidate tracking.
            </p>
          </div>

          {/* Features Overview */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Multiple Question Types</h3>
              <p className="text-sm text-gray-600">
                Text responses, coding challenges, video recordings, multiple choice, and file uploads
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-sm text-gray-600">
                Track completion rates, time spent, keystroke patterns, and detailed performance metrics
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <Share2 className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Easy Sharing</h3>
              <p className="text-sm text-gray-600">
                Share via email invitations, direct links, or social platforms with secure access tokens
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>Sign in to your account to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="admin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="admin">Admin Login</TabsTrigger>
                    <TabsTrigger value="candidate">Candidate Login</TabsTrigger>
                  </TabsList>

                  <TabsContent value="admin">
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      {adminError && (
                          <Alert variant="destructive">
                            <AlertDescription>{adminError}</AlertDescription>
                          </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Email</Label>
                        <Input
                            id="admin-email"
                            type="email"
                            placeholder="admin@example.com"
                            value={adminForm.email}
                            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                            required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Password</Label>
                        <Input
                            id="admin-password"
                            type="password"
                            placeholder="admin123"
                            value={adminForm.password}
                            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                            required
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={adminLoading}>
                        {adminLoading ? "Signing in..." : "Sign In as Admin"}
                      </Button>
                      <div className="mt-4 text-sm text-gray-600">
                        <p className="font-medium mb-2">As an admin, you can:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Create and manage interviews</li>
                          <li>• Add multiple question types</li>
                          <li>• View detailed analytics and reports</li>
                          <li>• Share interviews via email or links</li>
                          <li>• Track candidate performance</li>
                          <li>• Manage admin users</li>
                        </ul>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="candidate">
                    <form onSubmit={handleCandidateLogin} className="space-y-4">
                      {candidateError && (
                          <Alert variant="destructive">
                            <AlertDescription>{candidateError}</AlertDescription>
                          </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="candidate-email">Email</Label>
                        <Input
                            id="candidate-email"
                            type="email"
                            placeholder="candidate@example.com"
                            value={candidateForm.email}
                            onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                            required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="candidate-password">Password</Label>
                        <Input
                            id="candidate-password"
                            type="password"
                            value={candidateForm.password}
                            onChange={(e) => setCandidateForm({ ...candidateForm, password: e.target.value })}
                            required
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={candidateLoading}>
                        {candidateLoading ? "Signing in..." : "Sign In as Candidate"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

  )
}
