"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Mic, AlertCircle, CheckCircle } from "lucide-react"

export default function InterviewSetupPage() {
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [micPermission, setMicPermission] = useState<boolean | null>(null)
  const [rulesAccepted, setRulesAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get session data from localStorage
    const storedSessionData = localStorage.getItem("sessionData")
    if (storedSessionData) {
      setSessionData(JSON.parse(storedSessionData))
    } else {
      // Redirect back to access if no session data
      router.push("/interview/access")
    }
  }, [router])

  useEffect(() => {
    checkPermissions()
    return () => {
      // Cleanup stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const checkPermissions = async () => {
    try {
      // Check camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setCameraPermission(true)
      setMicPermission(true)
    } catch (error) {
      console.error("Permission denied:", error)
      setCameraPermission(false)
      setMicPermission(false)
    }
  }

  const handleStartInterview = async () => {
    if (!cameraPermission || !micPermission || !rulesAccepted) {
      return
    }

    setLoading(true)

    try {
      // Stop the preview stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Get session and interview data
      const sessionId = localStorage.getItem("sessionId")
      const interviewId = localStorage.getItem("interviewId")

      console.log("[CLIENT] Starting interview with session:", sessionId, "interview:", interviewId)

      // Redirect to questions page
      router.push(`/interview/questions?session=${sessionId}&interview=${interviewId}`)
    } catch (error) {
      console.error("[CLIENT] Error starting interview:", error)
      setLoading(false)
    }
  }

  const canProceed = cameraPermission && micPermission && rulesAccepted

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Interview Setup</CardTitle>
            {sessionData && <p className="text-gray-600">{sessionData.interview_title}</p>}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Camera Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Test
              </h3>
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-2">
                {cameraPermission === true ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700">Camera is working</span>
                  </>
                ) : cameraPermission === false ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">Camera permission denied</span>
                  </>
                ) : (
                  <span className="text-gray-600">Checking camera...</span>
                )}
              </div>
            </div>

            {/* Microphone Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Microphone Test
              </h3>
              <div className="flex items-center gap-2">
                {micPermission === true ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700">Microphone is working</span>
                  </>
                ) : micPermission === false ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">Microphone permission denied</span>
                  </>
                ) : (
                  <span className="text-gray-600">Checking microphone...</span>
                )}
              </div>
            </div>

            {/* Instructions */}
            {sessionData?.instructions && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Instructions</h3>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800">{sessionData.instructions}</p>
                </div>
              </div>
            )}

            {/* Rules and Agreement */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Interview Rules</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Ensure you are in a quiet, well-lit environment</p>
                <p>• Do not navigate away from this page during the interview</p>
                <p>• Answer all questions honestly and to the best of your ability</p>
                <p>• You may be recorded during video questions</p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rules"
                  checked={rulesAccepted}
                  onCheckedChange={(checked) => setRulesAccepted(checked as boolean)}
                />
                <label htmlFor="rules" className="text-sm font-medium">
                  I understand and agree to the interview rules
                </label>
              </div>
            </div>

            {/* Permissions Alert */}
            {(!cameraPermission || !micPermission) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please allow camera and microphone access to continue with the interview. You may need to refresh the
                  page and grant permissions.
                </AlertDescription>
              </Alert>
            )}

            {/* Start Button */}
            <Button onClick={handleStartInterview} disabled={!canProceed || loading} className="w-full" size="lg">
              {loading ? "Starting Interview..." : "Start Interview"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
