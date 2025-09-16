"use client"


import React, {  useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import Link from "next/link"
import { ArrowLeft, Copy, Mail, Share2, LinkIcon, QrCode, Trash2 } from "lucide-react"
import {
  getInterviewForShareAction,
  createShareLinkAction,
  sendInviteEmailAction,
  deleteShareLinkAction,
} from "@/app/actions/share-actions"

interface Interview {
  id: string
  title: string
  description: string
  status: string
}

interface ShareLink {
  id: string
  token: string
  expires_at: string
  max_uses: number
  current_uses: number
}

export default function ShareInterview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [interview, setInterview] = useState<Interview | null>(null)
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [emailList, setEmailList] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadInterview()
  }, [id])

  const loadInterview = async () => {
    try {
      const result = await getInterviewForShareAction(id)
      if (result.success) {
        setInterview(result.interview)
        setShareLinks(result.shareLinks || [])
        setEmailSubject(`Interview Invitation: ${result.interview.title}`)
        setEmailMessage(`You have been invited to participate in an interview assessment: ${result.interview.title}

${result.interview.description}

Please click the link below to access your interview:
[INTERVIEW_LINK]

This interview should take approximately 30-45 minutes to complete.

Best regards,
The Hiring Team`)
      }
    } catch (error) {
      console.error("Failed to load interview:", error)
    }
    setLoading(false)
  }

  const createNewShareLink = async (maxUses = 1, expiresInDays = 7) => {
    try {
      const result = await createShareLinkAction({
        interviewId: id,
        maxUses,
        expiresInDays,
      })
      if (result.success) {
        setShareLinks([...shareLinks, result.shareLink])
      }
    } catch (error) {
      console.error("Failed to create share link:", error)
    }
  }

  const handleDeleteClick = (linkId: string) => {
    setLinkToDelete(linkId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteShareLink = async () => {
    if (!linkToDelete) return

    try {
      await deleteShareLinkAction(linkToDelete)
      setShareLinks(shareLinks.filter((link) => link.id !== linkToDelete))
      setShowDeleteDialog(false)
      setLinkToDelete(null)
    } catch (error) {
      console.error("Failed to delete share link:", error)
      // Optionally show an error message to the user
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const sendEmailInvites = async () => {
    if (!emailList.trim()) return

    setSending(true)
    try {
      const emails = emailList
        .split("\n")
        .map((email) => email.trim())
        .filter((email) => email)
      const result = await sendInviteEmailAction({
        interviewId: id,
        emails,
        subject: emailSubject,
        message: emailMessage,
      })

      if (result.success) {
        setEmailList("")
        // Refresh share links to show new ones created
        loadInterview()
      }
    } catch (error) {
      console.error("Failed to send invites:", error)
    }
    setSending(false)
  }

  const getShareUrl = (token: string) => {
    return `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/interview/access?token=${token}`
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
            <div>
              <h1 className="text-2xl font-bold">Share Interview</h1>
              <p className="text-gray-600">{interview.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="email" className="space-y-6">
          <TabsList>
            <TabsTrigger value="email">Email Invitations</TabsTrigger>
            <TabsTrigger value="links">Share Links</TabsTrigger>
            <TabsTrigger value="social">Social Sharing</TabsTrigger>
          </TabsList>

          {/* Email Invitations */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Send Email Invitations</CardTitle>
                <CardDescription>Send personalized interview invitations via email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emails">Email Addresses (one per line)</Label>
                  <Textarea
                    id="emails"
                    value={emailList}
                    onChange={(e) => setEmailList(e.target.value)}
                    placeholder="candidate1@example.com&#10;candidate2@example.com&#10;candidate3@example.com"
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input id="subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Email Message</Label>
                  <Textarea
                    id="message"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={8}
                  />
                  <p className="text-sm text-gray-500">Use [INTERVIEW_LINK] as a placeholder for the interview link</p>
                </div>

                <Button onClick={sendEmailInvites} disabled={sending || !emailList.trim()} className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  {sending ? "Sending..." : "Send Invitations"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Share Links */}
          <TabsContent value="links">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Share Links</CardTitle>
                  <CardDescription>Generate secure links for interview access</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button onClick={() => createNewShareLink(1, 7)}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Single Use Link
                    </Button>
                    <Button variant="outline" onClick={() => createNewShareLink(10, 30)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Multi-Use Link
                    </Button>
                    <Button variant="outline" onClick={() => createNewShareLink(100, 90)}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Bulk Access Link
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Share Links</CardTitle>
                  <CardDescription>Manage your interview access links</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {shareLinks.map((link) => (
                      <div key={link.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={link.current_uses >= link.max_uses ? "destructive" : "default"}>
                                {link.current_uses}/{link.max_uses} uses
                              </Badge>
                              <Badge variant="outline">Expires: {new Date(link.expires_at).toLocaleDateString()}</Badge>
                            </div>
                            <div className="font-mono text-sm bg-gray-100 p-2 rounded">{getShareUrl(link.token)}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(getShareUrl(link.token))}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteClick(link.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {shareLinks.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No share links created yet. Create one above to get started.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Social Sharing */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Sharing</CardTitle>
                <CardDescription>Share your interview on social platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">LinkedIn</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Share this interview opportunity with your professional network
                    </p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Share on LinkedIn
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Twitter</h3>
                    <p className="text-sm text-gray-600 mb-3">Tweet about this interview opportunity</p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Share on Twitter
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Custom Message</h3>
                    <Textarea placeholder="Craft a custom message for sharing..." rows={3} className="mb-3" />
                    <Button variant="outline" className="w-full bg-transparent">
                      Copy Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this share link? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteShareLink}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
