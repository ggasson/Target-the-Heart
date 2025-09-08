import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import JoinRequestModal from "@/components/modals/join-request-modal";
import CreateGroupModal from "@/components/modals/create-group-modal";
import ManageGroupModal from "@/components/modals/manage-group-modal";
import GroupCard from "@/components/group-card";
import type { Group } from "@shared/schema";

export default function Groups() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [groupToManage, setGroupToManage] = useState<Group | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myGroups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups/my"],
  });

  const { data: availableGroups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const joinRequestMutation = useMutation({
    mutationFn: async ({ groupId, message }: { groupId: string; message: string }) => {
      await apiRequest("POST", `/api/groups/${groupId}/join`, { message });
    },
    onSuccess: () => {
      toast({
        title: "Request sent!",
        description: "Your join request has been sent to the group administrator.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setShowJoinModal(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleJoinRequest = (group: any) => {
    setSelectedGroup(group);
    setShowJoinModal(true);
  };

  const handleJoinSubmit = (message: string) => {
    if (selectedGroup) {
      joinRequestMutation.mutate({
        groupId: selectedGroup.id,
        message,
      });
    }
  };

  const handleManageGroup = (group: Group) => {
    setGroupToManage(group);
    setShowManageModal(true);
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "nearby", label: "Near Me" },
    { id: "open", label: "Open Groups" },
    { id: "requests", label: "My Requests" },
  ];

  return (
    <div className="px-6 py-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Prayer Groups</h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          size="icon"
          className="rounded-full"
          data-testid="button-create-group"
        >
          <i className="fas fa-plus"></i>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Input
          type="text"
          placeholder="Search groups by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-4 py-4 h-auto"
          data-testid="input-search-groups"
        />
        <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
      </div>

      {/* Filter Options */}
      <div className="flex space-x-3 mb-6 overflow-x-auto">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={selectedFilter === filter.id ? "default" : "secondary"}
            size="sm"
            onClick={() => setSelectedFilter(filter.id)}
            className="whitespace-nowrap"
            data-testid={`button-filter-${filter.id}`}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* My Groups */}
      {myGroups.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-4">My Groups</h3>
          {myGroups.map((group) => (
            <GroupCard 
              key={group.id} 
              group={group} 
              isMember={true} 
              onManageGroup={() => handleManageGroup(group)}
            />
          ))}
        </div>
      )}

      {/* Discover New Groups */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Discover New Groups</h3>
        
        {availableGroups.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">No groups found.</p>
              <p className="text-sm text-muted-foreground">Be the first to create a prayer group in your area.</p>
            </CardContent>
          </Card>
        ) : (
          availableGroups
            .filter((group) => !myGroups.some((myGroup) => myGroup.id === group.id))
            .map((group) => (
              <GroupCard 
                key={group.id} 
                group={group} 
                isMember={false}
                onJoinRequest={() => handleJoinRequest(group)}
              />
            ))
        )}
      </div>

      <JoinRequestModal
        open={showJoinModal}
        onOpenChange={setShowJoinModal}
        group={selectedGroup}
        onSubmit={handleJoinSubmit}
        isLoading={joinRequestMutation.isPending}
      />

      <CreateGroupModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />

      <ManageGroupModal
        open={showManageModal}
        onOpenChange={setShowManageModal}
        group={groupToManage}
      />
    </div>
  );
}
