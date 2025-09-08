import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PrayerModal from "@/components/modals/prayer-modal";
import { useAuth } from "@/hooks/useAuth";
import type { Group, PrayerRequest } from "@shared/schema";

interface HomeProps {
  onTabChange?: (tab: string) => void;
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

  const nextMeeting = myGroups.length > 0 ? myGroups[0] : null;

  return (
    <div className="px-6 py-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
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
        <Card>
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
          <h3 className="font-semibold mb-2">Next Meeting</h3>
          <div className="flex items-center space-x-3 mb-3">
            <i className="fas fa-calendar-alt"></i>
            <span data-testid="text-next-meeting-time">
              {nextMeeting.meetingDay}, {nextMeeting.meetingTime}
            </span>
          </div>
          <div className="flex items-center space-x-3 mb-4">
            <i className="fas fa-map-marker-alt"></i>
            <span data-testid="text-next-meeting-location">
              {nextMeeting.meetingLocation || 'Location TBD'}
            </span>
          </div>
          <Button 
            variant="secondary" 
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            data-testid="button-view-meeting-details"
          >
            View Details
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
