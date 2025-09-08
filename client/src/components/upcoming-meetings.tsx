import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Meeting, MeetingRsvp } from "@shared/schema";

interface UpcomingMeetingsProps {
  groupId: string;
}

export default function UpcomingMeetings({ groupId }: UpcomingMeetingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch upcoming meetings
  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: [`/api/groups/${groupId}/meetings/upcoming`],
  });

  // Fetch user's RSVPs for each meeting
  const { data: userRsvps = {} } = useQuery<{ [key: string]: MeetingRsvp | null }>({
    queryKey: [`/api/meetings/rsvps`, groupId, user?.id],
    queryFn: async () => {
      if (!meetings.length) return {};
      
      const rsvpPromises = meetings.map(async (meeting) => {
        try {
          const rsvp = await apiRequest(`/api/meetings/${meeting.id}/rsvp/my`);
          return { [meeting.id]: rsvp };
        } catch (error) {
          return { [meeting.id]: null };
        }
      });
      
      const results = await Promise.all(rsvpPromises);
      return results.reduce((acc, item) => ({ ...acc, ...item }), {});
    },
    enabled: !!meetings.length && !!user?.id,
  });

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async ({ meetingId, status }: { meetingId: string; status: 'attending' | 'not_attending' | 'maybe' }) => {
      return apiRequest(`/api/meetings/${meetingId}/rsvp`, "POST", { status });
    },
    onSuccess: () => {
      toast({
        title: "RSVP Updated",
        description: "Your response has been saved",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/rsvps`, groupId, user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update RSVP",
        variant: "destructive",
      });
    },
  });

  const handleRsvp = (meetingId: string, status: 'attending' | 'not_attending' | 'maybe') => {
    rsvpMutation.mutate({ meetingId, status });
  };

  const getRsvpVariant = (status: string) => {
    switch (status) {
      case 'attending': return 'default';
      case 'not_attending': return 'destructive';
      case 'maybe': return 'secondary';
      default: return 'outline';
    }
  };

  if (meetings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <i className="fas fa-calendar text-4xl text-muted-foreground mb-4"></i>
          <p className="text-muted-foreground">No upcoming meetings scheduled</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground mb-4">Upcoming Meetings</h3>
      
      {meetings.map((meeting) => {
        const meetingDate = new Date(meeting.meetingDate);
        const userRsvp = userRsvps[meeting.id];
        const isToday = meetingDate.toDateString() === new Date().toDateString();
        const daysUntil = Math.ceil((meetingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <Card key={meeting.id} className={isToday ? "border-primary" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-foreground">{meeting.title}</h4>
                    {isToday && (
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        Today!
                      </Badge>
                    )}
                    {daysUntil === 1 && (
                      <Badge variant="outline">
                        Tomorrow
                      </Badge>
                    )}
                  </div>
                  
                  {meeting.topic && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <i className="fas fa-tag mr-1"></i>
                      Topic: {meeting.topic}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                    <span>
                      <i className="fas fa-calendar mr-1"></i>
                      {meetingDate.toLocaleDateString()}
                    </span>
                    <span>
                      <i className="fas fa-clock mr-1"></i>
                      {meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {meeting.venue && (
                    <p className="text-sm text-muted-foreground mb-3">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      {meeting.venue}
                      {meeting.venueAddress && (
                        <span className="block ml-4 text-xs">{meeting.venueAddress}</span>
                      )}
                    </p>
                  )}
                  
                  {meeting.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {meeting.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Will you attend this meeting?
                  </div>
                  
                  {userRsvp && (
                    <Badge variant={getRsvpVariant(userRsvp.status)} className="mb-2">
                      {userRsvp.status === 'attending' && 'Going'}
                      {userRsvp.status === 'not_attending' && 'Not Going'}
                      {userRsvp.status === 'maybe' && 'Maybe'}
                    </Badge>
                  )}
                </div>
                
                <div className="flex space-x-2 mt-2">
                  <Button
                    size="sm"
                    variant={userRsvp?.status === 'attending' ? 'default' : 'outline'}
                    onClick={() => handleRsvp(meeting.id, 'attending')}
                    disabled={rsvpMutation.isPending}
                    className="flex-1"
                    data-testid={`button-rsvp-attending-${meeting.id}`}
                  >
                    <i className="fas fa-check mr-1"></i>
                    Going
                  </Button>
                  <Button
                    size="sm"
                    variant={userRsvp?.status === 'maybe' ? 'secondary' : 'outline'}
                    onClick={() => handleRsvp(meeting.id, 'maybe')}
                    disabled={rsvpMutation.isPending}
                    className="flex-1"
                    data-testid={`button-rsvp-maybe-${meeting.id}`}
                  >
                    <i className="fas fa-question mr-1"></i>
                    Maybe
                  </Button>
                  <Button
                    size="sm"
                    variant={userRsvp?.status === 'not_attending' ? 'destructive' : 'outline'}
                    onClick={() => handleRsvp(meeting.id, 'not_attending')}
                    disabled={rsvpMutation.isPending}
                    className="flex-1"
                    data-testid={`button-rsvp-not-attending-${meeting.id}`}
                  >
                    <i className="fas fa-times mr-1"></i>
                    Can't Go
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}