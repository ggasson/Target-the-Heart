import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PrayerModal from "@/components/modals/prayer-modal";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Group, PrayerRequest } from "@shared/schema";

interface HomeProps {
  onTabChange?: (tab: string) => void;
}

interface QuickRSVPProps {
  meetingId: string;
  currentRsvp?: any;
}

function QuickRSVP({ meetingId, currentRsvp }: QuickRSVPProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentRsvp?.status || '');
  const [guestCount, setGuestCount] = useState(currentRsvp?.guestCount || '0');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const rsvpMutation = useMutation({
    mutationFn: async (data: { status: string; guestCount: string }) => {
      return apiRequest(`/api/meetings/${meetingId}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({
          status: data.status,
          guestCount: data.guestCount,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/next"] });
      toast({
        title: "RSVP Updated",
        description: "Your response has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update RSVP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRSVP = (status: string) => {
    setSelectedStatus(status);
    rsvpMutation.mutate({ status, guestCount });
  };

  const handleGuestCountChange = (count: string) => {
    setGuestCount(count);
    if (selectedStatus) {
      rsvpMutation.mutate({ status: selectedStatus, guestCount: count });
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-white/90">Quick RSVP:</div>
      
      {/* RSVP Status Buttons */}
      <div className="flex space-x-2">
        <Button
          variant={selectedStatus === 'attending' ? 'default' : 'outline'}
          size="sm"
          className={`text-xs ${selectedStatus === 'attending' ? 'bg-green-500 hover:bg-green-600' : 'bg-white/20 hover:bg-white/30 text-white border-white/30'}`}
          onClick={() => handleRSVP('attending')}
          disabled={rsvpMutation.isPending}
          data-testid="button-rsvp-attending"
        >
          <i className="fas fa-check-circle mr-1"></i>
          Attending
        </Button>
        
        <Button
          variant={selectedStatus === 'maybe' ? 'default' : 'outline'}
          size="sm"
          className={`text-xs ${selectedStatus === 'maybe' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-white/20 hover:bg-white/30 text-white border-white/30'}`}
          onClick={() => handleRSVP('maybe')}
          disabled={rsvpMutation.isPending}
          data-testid="button-rsvp-maybe"
        >
          <i className="fas fa-question-circle mr-1"></i>
          Maybe
        </Button>
        
        <Button
          variant={selectedStatus === 'not_attending' ? 'default' : 'outline'}
          size="sm"
          className={`text-xs ${selectedStatus === 'not_attending' ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30 text-white border-white/30'}`}
          onClick={() => handleRSVP('not_attending')}
          disabled={rsvpMutation.isPending}
          data-testid="button-rsvp-not-attending"
        >
          <i className="fas fa-times-circle mr-1"></i>
          Not Attending
        </Button>
      </div>

      {/* Guest Count Section */}
      {(selectedStatus === 'attending' || selectedStatus === 'maybe') && (
        <div className="flex items-center space-x-3">
          <span className="text-sm text-white/90">Bringing guests:</span>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => handleGuestCountChange(Math.max(0, parseInt(guestCount) - 1).toString())}
              disabled={parseInt(guestCount) <= 0 || rsvpMutation.isPending}
              data-testid="button-guest-decrease"
            >
              -
            </Button>
            <span className="text-sm min-w-[2rem] text-center text-white" data-testid="text-guest-count">
              {guestCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => handleGuestCountChange((parseInt(guestCount) + 1).toString())}
              disabled={parseInt(guestCount) >= 10 || rsvpMutation.isPending}
              data-testid="button-guest-increase"
            >
              +
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home({ onTabChange }: HomeProps) {
  const { user } = useAuth();
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  
  const { data: myGroups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups/my"],
  });

  const { data: recentPrayers = [] } = useQuery<(PrayerRequest & { group: Group; responses: any[] })[]>({
    queryKey: ["/api/prayers/my"],
  });

  // Get next upcoming meeting with RSVP data
  const { data: nextMeeting } = useQuery<any>({
    queryKey: ["/api/meetings/next"],
    enabled: !!user,
  });

  // Get unread notifications count
  const { data: unreadNotifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications/unread"],
    enabled: !!user,
  });

  return (
    <div className="px-6 py-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onTabChange?.("groups")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-primary" data-testid="text-my-groups-count">
                {myGroups.length}
              </span>
              <i className="fas fa-users text-primary"></i>
            </div>
            <p className="text-sm text-muted-foreground">My Groups</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onTabChange?.("prayers")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-accent" data-testid="text-active-prayers-count">
                {recentPrayers.filter(p => p.status === 'active').length}
              </span>
              <i className="fas fa-praying-hands text-accent"></i>
            </div>
            <p className="text-sm text-muted-foreground">Active Prayers</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Meeting */}
      {nextMeeting && (
        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Next Meeting</h3>
            <span className="text-sm bg-white/20 px-2 py-1 rounded-full" data-testid="text-group-name">
              {nextMeeting.group?.name}
            </span>
          </div>
          
          {nextMeeting.title && (
            <div className="mb-3">
              <h4 className="font-medium" data-testid="text-meeting-title">{nextMeeting.title}</h4>
            </div>
          )}
          
          <div className="flex items-center space-x-3 mb-3">
            <i className="fas fa-calendar-alt"></i>
            <span data-testid="text-next-meeting-time">
              {new Date(nextMeeting.meetingDate).toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          
          {nextMeeting.venue && (
            <div className="flex items-center space-x-3 mb-4">
              <i className="fas fa-map-marker-alt"></i>
              <span data-testid="text-next-meeting-location">
                {nextMeeting.venue}
              </span>
            </div>
          )}

          {/* RSVP Counts */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2" data-testid="rsvp-attending">
              <i className="fas fa-check-circle text-green-300"></i>
              <span className="text-sm">{nextMeeting.rsvpCounts?.attending || 0}</span>
            </div>
            <div className="flex items-center space-x-2" data-testid="rsvp-not-attending">
              <i className="fas fa-times-circle text-red-300"></i>
              <span className="text-sm">{nextMeeting.rsvpCounts?.notAttending || 0}</span>
            </div>
            <div className="flex items-center space-x-2" data-testid="rsvp-maybe">
              <i className="fas fa-question-circle text-yellow-300"></i>
              <span className="text-sm">{nextMeeting.rsvpCounts?.maybe || 0}</span>
            </div>
            <div className="flex items-center space-x-2" data-testid="rsvp-no-response">
              <i className="fas fa-clock text-gray-300"></i>
              <span className="text-sm">{nextMeeting.rsvpCounts?.notResponded || 0}</span>
            </div>
          </div>

          {/* Quick RSVP Section */}
          <QuickRSVP meetingId={nextMeeting.id} currentRsvp={nextMeeting.userRsvp} />

          <Button 
            variant="secondary" 
            className="bg-white/20 hover:bg-white/30 text-white border-0 mt-3"
            onClick={() => window.location.href = `/meeting/${nextMeeting.id}`}
            data-testid="button-view-meeting-details"
          >
            View Meeting Details
          </Button>
        </div>
      )}

      {/* Recent Prayer Requests */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Prayer Requests</h3>
          <Button 
            variant="link" 
            className="text-primary text-sm p-0 h-auto"
            onClick={() => onTabChange?.("prayers")}
            data-testid="link-view-all-prayers"
          >
            View All
          </Button>
        </div>
        
        {recentPrayers.slice(0, 3).map((prayer) => (
          <Card key={prayer.id} className="mb-3">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-praying-hands text-primary text-sm"></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-foreground" data-testid={`text-prayer-title-${prayer.id}`}>
                      {prayer.title}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {new Date(prayer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {prayer.description}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>{prayer.group?.name}</span>
                    <span className="mx-2">•</span>
                    <span data-testid={`text-prayer-responses-${prayer.id}`}>
                      {prayer.responses?.length || 0} prayers
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {recentPrayers.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <i className="fas fa-praying-hands text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">No prayer requests yet.</p>
              <p className="text-sm text-muted-foreground">Share your first prayer request with your groups.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={() => onTabChange?.("groups")}
          className="bg-primary text-primary-foreground p-4 h-auto flex flex-col items-center space-y-2"
          data-testid="button-find-groups"
        >
          <i className="fas fa-search"></i>
          <span>Find Groups</span>
        </Button>
        <Button 
          onClick={() => setShowPrayerModal(true)}
          className="bg-accent text-accent-foreground p-4 h-auto flex flex-col items-center space-y-2"
          data-testid="button-add-prayer"
        >
          <i className="fas fa-plus"></i>
          <span>Add Prayer</span>
        </Button>
      </div>

      <PrayerModal 
        open={showPrayerModal} 
        onOpenChange={setShowPrayerModal}
      />
    </div>
  );
}
