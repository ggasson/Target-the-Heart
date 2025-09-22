import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function MeetingDetailPage() {
  const { meetingId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [rsvpNotes, setRsvpNotes] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        guestCount: 0,
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

  // Delete meeting mutation
  const deleteMeetingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/meetings/${meetingId}`);
    },
    onSuccess: () => {
      toast({
        title: "Meeting Cancelled",
        description: "The meeting has been cancelled successfully.",
      });
      // Navigate back to meetings page
      setLocation('/meetings');
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to cancel meeting",
        variant: "destructive",
      });
    },
  });

  const handleDeleteMeeting = () => {
    if (showDeleteConfirm) {
      deleteMeetingMutation.mutate();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
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

  // Check if user can delete meeting (created by them or they're group admin)
  const canDeleteMeeting = user && meeting && (
    meeting.createdBy === user.sub || 
    meeting.group?.adminId === user.sub
  );

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

  const exportToCalendar = () => {
    if (!meeting) return;
    
    const startDate = new Date(meeting.meetingDate);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const event = {
      title: meeting.title,
      description: meeting.description || '',
      location: meeting.venue ? `${meeting.venue}${meeting.venueAddress ? `, ${meeting.venueAddress}` : ''}` : '',
      start: formatDate(startDate),
      end: formatDate(endDate),
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Target The Heart//Calendar//EN
BEGIN:VEVENT
UID:${meeting.id}@targettheheart.app
DTSTART:${event.start}
DTEND:${event.end}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Calendar Event Downloaded",
      description: "The event has been saved as an .ics file",
    });
  };

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
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCalendar}
                  data-testid="button-add-to-calendar"
                >
                  <i className="fas fa-calendar-plus mr-2"></i>
                  Add to Calendar
                </Button>
                {canDeleteMeeting && meeting.status === "scheduled" && (
                  <>
                    {!showDeleteConfirm ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteMeeting}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        data-testid="button-cancel-meeting"
                      >
                        <i className="fas fa-times mr-2"></i>
                        Cancel Meeting
                      </Button>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteMeeting}
                          disabled={deleteMeetingMutation.isPending}
                          data-testid="button-confirm-cancel"
                        >
                          {deleteMeetingMutation.isPending ? (
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                          ) : (
                            <i className="fas fa-check mr-2"></i>
                          )}
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelDelete}
                          disabled={deleteMeetingMutation.isPending}
                          data-testid="button-cancel-delete"
                        >
                          <i className="fas fa-times mr-2"></i>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </>
                )}
                <Badge variant={meeting.status === "scheduled" ? "default" : "secondary"}>
                  {meeting.status}
                </Badge>
              </div>
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