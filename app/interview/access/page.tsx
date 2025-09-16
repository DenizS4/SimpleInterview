"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { validateTokenAction } from "@/app/actions/session-actions"
import { AlertCircle } from "lucide-react"

export default function InterviewAccessPage() {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validating, setValidating] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Auto-fill token from URL parameter
    const urlToken = searchParams.get("token")
    if (urlToken) {
      setToken(urlToken)
      // Auto-validate if token is in URL
      handleValidateToken(urlToken)
    }
  }, [searchParams])

  const handleValidateToken = async (tokenToValidate?: string) => {
    const targetToken = tokenToValidate || token
    if (!targetToken.trim()) {
      setError("Please enter an access token")
      return
    }

    setValidating(true)
    setError("")

    try {
      console.log("[CLIENT] Validating token:", targetToken)
      const result = await validateTokenAction(targetToken)

      if (result.success && result.session) {
        console.log("[CLIENT] Token validated successfully:", result.session)

        // Store session data in localStorage
        localStorage.setItem("sessionData", JSON.stringify(result.session))
        localStorage.setItem("sessionId", result.session.id)
        localStorage.setItem("interviewId", result.session.interview_id)
        localStorage.setItem("interviewToken", targetToken)

        // Redirect to setup page
        router.push("/interview/setup")
      } else {
        setError(result.error || "Invalid access token")
      }
    } catch (error) {
      console.error("[CLIENT] Error validating token:", error)
      setError("Failed to validate token. Please try again.")
    }

    setValidating(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Interview Access</CardTitle>
          <p className="text-gray-600">Enter your access token to begin the interview</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              Access Token
            </label>
            <Input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your access token"
              className="w-full"
              disabled={validating}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={() => handleValidateToken()} disabled={validating || !token.trim()} className="w-full">
            {validating ? "Validating..." : "Continue to Interview"}
          </Button>

          <div className="text-center text-sm text-gray-500">
            <p>Don't have an access token?</p>
            <p>Contact your interviewer for access.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
