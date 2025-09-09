import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import PrayerModal from "@/components/modals/prayer-modal";
import PrayerCard from "@/components/prayer-card";

export default function Prayers() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myGroups = [] } = useQuery({
    queryKey: ["/api/groups/my"],
  });

  const { data: allPrayers = [] } = useQuery<any[]>({
    queryKey: ["/api/prayers/my"],
  });

  const prayerResponseMutation = useMutation({
    mutationFn: async ({ prayerId, action }: { prayerId: string; action: 'add' | 'remove' }) => {
      if (action === 'add') {
        await apiRequest("POST", `/api/prayers/${prayerId}/pray`);
      } else {
        await apiRequest("DELETE", `/api/prayers/${prayerId}/pray`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/my"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update prayer response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePrayerResponse = (prayerId: string, action: 'add' | 'remove') => {
    prayerResponseMutation.mutate({ prayerId, action });
  };

  const markAnsweredMutation = useMutation({
    mutationFn: async (prayerId: string) => {
      await apiRequest("PUT", `/api/prayers/${prayerId}/status`, { status: "answered" });
    },
    onSuccess: () => {
      toast({
        title: "Prayer Marked as Answered",
        description: "Praise God! Your prayer has been marked as answered.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/my"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark prayer as answered. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePrayerMutation = useMutation({
    mutationFn: async (prayerId: string) => {
      await apiRequest("DELETE", `/api/prayers/${prayerId}`);
    },
    onSuccess: () => {
      toast({
        title: "Prayer Deleted",
        description: "Your prayer has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/my"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete prayer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMarkAnswered = (prayerId: string) => {
    markAnsweredMutation.mutate(prayerId);
  };

  const handleDeletePrayer = (prayerId: string) => {
    if (window.confirm("Are you sure you want to delete this prayer? This action cannot be undone.")) {
      deletePrayerMutation.mutate(prayerId);
    }
  };

  const filteredPrayers = allPrayers.filter((prayer) => {
    switch (selectedTab) {
      case "my":
        return prayer.authorId === user?.id;
      case "answered":
        return prayer.status === "answered";
      default:
        return true;
    }
  });

  const tabs = [
    { id: "all", label: "All Prayers" },
    { id: "my", label: "My Prayers" },
    { id: "answered", label: "Answered" },
  ];

  return (
    <div className="px-6 py-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Prayer Requests</h2>
        <Button
          onClick={() => setShowPrayerModal(true)}
          size="icon"
          className="rounded-full"
          data-testid="button-add-prayer"
        >
          <i className="fas fa-plus"></i>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-muted rounded-lg p-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={selectedTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTab(tab.id)}
            className="flex-1"
            data-testid={`button-tab-${tab.id}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Prayer Requests List */}
      <div className="space-y-4">
        {filteredPrayers.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-praying-hands text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">No prayer requests found.</p>
            <p className="text-sm text-muted-foreground">
              {selectedTab === "my" 
                ? "Share your first prayer request with your groups."
                : "Join groups to see prayer requests from your community."
              }
            </p>
          </div>
        ) : (
          filteredPrayers.map((prayer) => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              currentUserId={user?.id}
              onPrayerResponse={handlePrayerResponse}
              onMarkAnswered={handleMarkAnswered}
              onDeletePrayer={handleDeletePrayer}
            />
          ))
        )}
      </div>

      <PrayerModal 
        open={showPrayerModal} 
        onOpenChange={setShowPrayerModal}
      />
    </div>
  );
}
