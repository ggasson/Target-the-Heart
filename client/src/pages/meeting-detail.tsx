import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function MeetingDetailPage() {
  const { meetingId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [rsvpNotes, setRsvpNotes] = useState("");

  // Fetch meeting details
  const { data: meeting, isLoading } = useQuery<any>({
    queryKey: ["/api/meetings", meetingId],
    enabled: !!meetingId,
  });

  // Fetch meeting RSVPs
  const { data: rsvps = [] } = useQuery<any[]>({
    queryKey: ["/api/meetings", meetingId, "rsvps"],
    enabled: !!meetingId,
  });

  // Fetch user's current RSVP
  const { data: userRsvp } = useQuery<any>({
    queryKey: ["/api/meetings", meetingId, "rsvp", "my"],
    enabled: !!meetingId,
  });

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      await apiRequest("POST", `/api/meetings/${meetingId}/rsvp`, {
        status,
        notes: notes || "",
      });
    },
    onSuccess: () => {
      toast({
        title: "RSVP Updated",
        description: "Your response has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId, "rsvp", "my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId, "rsvps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/next"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update RSVP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRsvp = (status: string) => {
    rsvpMutation.mutate({ status, notes: rsvpNotes });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-muted-foreground">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-calendar-times text-4xl text-muted-foreground mb-4"></i>
          <p className="text-muted-foreground">Meeting not found.</p>
          <Button 
            onClick={() => window.history.back()} 
            className="mt-4"
            data-testid="button-go-back"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Calculate RSVP counts
  const rsvpCounts = {
    attending: rsvps.filter(r => r.status === "attending").length,
    notAttending: rsvps.filter(r => r.status === "not_attending").length,
    maybe: rsvps.filter(r => r.status === "maybe").length,
  };

  const getCurrentRsvpStatus = () => {
    if (!userRsvp) return null;
    switch (userRsvp.status) {
      case "attending": return { label: "Attending", color: "bg-green-500", icon: "fas fa-check-circle" };
      case "not_attending": return { label: "Not Attending", color: "bg-red-500", icon: "fas fa-times-circle" };
      case "maybe": return { label: "Maybe", color: "bg-yellow-500", icon: "fas fa-question-circle" };
      default: return null;
    }
  };

  const currentStatus = getCurrentRsvpStatus();

  return (
    <div className="max-w-md mx-auto bg-card shadow-lg min-h-screen">
      {/* Header */}
      <header className="bg-card shadow-sm px-6 py-4 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="mr-3"
          data-testid="button-back"
        >
          <i className="fas fa-arrow-left"></i>
        </Button>
        <h1 className="font-semibold text-foreground">Meeting Details</h1>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Meeting Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span data-testid="text-meeting-title">{meeting.title}</span>
              <Badge variant={meeting.status === "scheduled" ? "default" : "secondary"}>
                {meeting.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {meeting.description && (
              <div>
                <h4 className="font-medium text-foreground mb-2">Description</h4>
                <p className="text-muted-foreground" data-testid="text-meeting-description">
                  {meeting.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3">
                <i className="fas fa-calendar-alt text-primary"></i>
                <div>
                  <p className="font-medium text-foreground">Date & Time</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-meeting-datetime">
                    {new Date(meeting.meetingDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {meeting.venue && (
                <div className="flex items-center space-x-3">
                  <i className="fas fa-map-marker-alt text-primary"></i>
                  <div>
                    <p className="font-medium text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-meeting-venue">
                      {meeting.venue}
                    </p>
                    {meeting.venueAddress && (
                      <p className="text-xs text-muted-foreground" data-testid="text-meeting-address">
                        {meeting.venueAddress}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {meeting.topic && (
                <div className="flex items-center space-x-3">
                  <i className="fas fa-comment text-primary"></i>
                  <div>
                    <p className="font-medium text-foreground">Topic</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-meeting-topic">
                      {meeting.topic}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RSVP Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStatus && (
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${currentStatus.color}`}></div>
                <span className="font-medium">{currentStatus.label}</span>
                {userRsvp?.notes && (
                  <span className="text-sm text-muted-foreground ml-auto">
                    "{userRsvp.notes}"
                  </span>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground">Add a note (optional)</label>
              <Textarea
                value={rsvpNotes}
                onChange={(e) => setRsvpNotes(e.target.value)}
                placeholder="Any additional information..."
                className="mt-2"
                data-testid="input-rsvp-notes"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleRsvp("attending")}
                disabled={rsvpMutation.isPending}
                variant={userRsvp?.status === "attending" ? "default" : "outline"}
                className="flex flex-col items-center p-4 h-auto"
                data-testid="button-rsvp-attending"
              >
                <i className="fas fa-check-circle text-green-500 mb-1"></i>
                <span className="text-xs">Attending</span>
              </Button>
              
              <Button
                onClick={() => handleRsvp("maybe")}
                disabled={rsvpMutation.isPending}
                variant={userRsvp?.status === "maybe" ? "default" : "outline"}
                className="flex flex-col items-center p-4 h-auto"
                data-testid="button-rsvp-maybe"
              >
                <i className="fas fa-question-circle text-yellow-500 mb-1"></i>
                <span className="text-xs">Maybe</span>
              </Button>
              
              <Button
                onClick={() => handleRsvp("not_attending")}
                disabled={rsvpMutation.isPending}
                variant={userRsvp?.status === "not_attending" ? "default" : "outline"}
                className="flex flex-col items-center p-4 h-auto"
                data-testid="button-rsvp-not-attending"
              >
                <i className="fas fa-times-circle text-red-500 mb-1"></i>
                <span className="text-xs">Can't Attend</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RSVP Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Who's Coming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600" data-testid="count-attending">
                  {rsvpCounts.attending}
                </div>
                <p className="text-xs text-muted-foreground">Attending</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600" data-testid="count-maybe">
                  {rsvpCounts.maybe}
                </div>
                <p className="text-xs text-muted-foreground">Maybe</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600" data-testid="count-not-attending">
                  {rsvpCounts.notAttending}
                </div>
                <p className="text-xs text-muted-foreground">Can't Attend</p>
              </div>
            </div>

            {/* List of attendees */}
            {rsvps.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Responses:</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {rsvps.map((rsvp: any) => (
                    <div key={rsvp.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">
                        {rsvp.user?.firstName} {rsvp.user?.lastName}
                      </span>
                      <div className="flex items-center space-x-2">
                        {rsvp.status === "attending" && <i className="fas fa-check-circle text-green-500"></i>}
                        {rsvp.status === "maybe" && <i className="fas fa-question-circle text-yellow-500"></i>}
                        {rsvp.status === "not_attending" && <i className="fas fa-times-circle text-red-500"></i>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}