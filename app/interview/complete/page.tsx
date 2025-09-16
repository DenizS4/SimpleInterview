"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, Home } from "lucide-react"
import Link from "next/link"

export default function InterviewComplete() {
  useEffect(() => {
    // Clear session data
    localStorage.removeItem("interviewToken")
    localStorage.removeItem("interviewAuth")
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Interview Completed!</CardTitle>
          <CardDescription>
            Thank you for taking the time to complete this interview. Your responses have been successfully submitted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <Mail className="h-4 w-4 inline mr-2" />
              You will receive a confirmation email shortly with next steps.
            </p>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              Your interview ID: <span className="font-mono">INT-{Date.now().toString().slice(-6)}</span>
            </p>
            <p className="mt-2">If you have any questions, please contact the hiring team.</p>
          </div>

          <Link href="/">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
