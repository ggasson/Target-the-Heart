import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import JoinRequestModal from "@/components/modals/join-request-modal";
import CreateGroupModal from "@/components/modals/create-group-modal";
import ManageGroupModal from "@/components/modals/manage-group-modal";
import GroupCard from "@/components/group-card";
import GroupsMap from "@/components/groups-map";
import type { Group } from "@shared/schema";

export default function Groups() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedAudience, setSelectedAudience] = useState<string>("all");
  const [selectedPurpose, setSelectedPurpose] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [groupToManage, setGroupToManage] = useState<Group | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: myGroups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups/my"],
  });

  const { data: availableGroups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const { data: myPendingRequests = [] } = useQuery({
    queryKey: ["/api/memberships/my-requests"],
    enabled: !!user,
  });

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get user location from profile or request it
  useEffect(() => {
    if ((user as any)?.latitude && (user as any)?.longitude) {
      setUserLocation({
        lat: Number((user as any).latitude),
        lng: Number((user as any).longitude)
      });
    }
  }, [user]);

  // Filter and search groups
  const filteredGroups = useMemo(() => {
    let filtered = [...availableGroups];

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query)
      );
    }

    // Apply audience filter
    if (selectedAudience !== "all") {
      filtered = filtered.filter(group => group.audience === selectedAudience);
    }

    // Apply purpose filter
    if (selectedPurpose !== "all") {
      filtered = filtered.filter(group => group.purpose === selectedPurpose);
    }

    // Apply main filters
    switch (selectedFilter) {
      case "nearby":
        if (userLocation) {
          filtered = filtered.filter(group => {
            if (!group.latitude || !group.longitude) return false;
            const distance = calculateDistance(
              userLocation.lat, userLocation.lng,
              Number(group.latitude), Number(group.longitude)
            );
            return distance <= 25; // Within 25 miles
          }).sort((a, b) => {
            if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 0;
            const distanceA = calculateDistance(
              userLocation.lat, userLocation.lng,
              Number(a.latitude), Number(a.longitude)
            );
            const distanceB = calculateDistance(
              userLocation.lat, userLocation.lng,
              Number(b.latitude), Number(b.longitude)
            );
            return distanceA - distanceB;
          });
        }
        break;
      case "open":
        filtered = filtered.filter(group => group.isPublic === true);
        break;
      case "requests":
        // Show groups where user has pending join requests
        filtered = (myPendingRequests as any[]).map((req: any) => req.group);
        // Apply text search to pending request groups
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(group => 
            group.name.toLowerCase().includes(query) ||
            group.description?.toLowerCase().includes(query)
          );
        }
        // Apply audience/purpose filters even for requests
        if (selectedAudience !== "all") {
          filtered = filtered.filter(group => group.audience === selectedAudience);
        }
        if (selectedPurpose !== "all") {
          filtered = filtered.filter(group => group.purpose === selectedPurpose);
        }
        return filtered; // Return early since we don't need other filter logic
        break;
    }

    return filtered;
  }, [availableGroups, searchQuery, selectedFilter, selectedAudience, selectedPurpose, userLocation, myPendingRequests]);

  const joinRequestMutation = useMutation({
    mutationFn: async ({ groupId, message, birthday, shareBirthday }: { 
      groupId: string; 
      message: string; 
      birthday?: string; 
      shareBirthday?: boolean; 
    }) => {
      await apiRequest("POST", `/api/groups/${groupId}/join`, { 
        message, 
        birthday, 
        shareBirthday 
      });
    },
    onSuccess: () => {
      toast({
        title: "Request sent!",
        description: "Your join request has been sent to the group administrator.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/memberships/my-requests"] });
      // Invalidate user auth cache since join may update user birthday
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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

  const handleJoinSubmit = (data: { message: string; birthday?: string; shareBirthday?: boolean }) => {
    if (selectedGroup) {
      joinRequestMutation.mutate({
        groupId: selectedGroup.id,
        message: data.message,
        birthday: data.birthday,
        shareBirthday: data.shareBirthday,
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

      {/* Advanced Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Select value={selectedAudience} onValueChange={setSelectedAudience}>
            <SelectTrigger className="w-full" data-testid="select-filter-audience">
              <SelectValue placeholder="Filter by audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Audiences</SelectItem>
              <SelectItem value="men_only">Men Only</SelectItem>
              <SelectItem value="women_only">Women Only</SelectItem>
              <SelectItem value="coed">Everyone (Co-ed)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
            <SelectTrigger className="w-full" data-testid="select-filter-purpose">
              <SelectValue placeholder="Filter by purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Purposes</SelectItem>
              <SelectItem value="prayer">Prayer & Worship</SelectItem>
              <SelectItem value="bible_study">Bible Study</SelectItem>
              <SelectItem value="fellowship">Fellowship</SelectItem>
              <SelectItem value="youth">Youth</SelectItem>
              <SelectItem value="marriage_couples">Marriage & Couples</SelectItem>
              <SelectItem value="recovery_healing">Recovery & Healing</SelectItem>
              <SelectItem value="outreach_service">Outreach & Service</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(selectedAudience !== "all" || selectedPurpose !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedAudience("all");
              setSelectedPurpose("all");
            }}
            className="whitespace-nowrap"
            data-testid="button-clear-filters"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">
          {viewMode === "list" ? "Prayer Groups" : "Groups Map"}
        </h3>
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-md"
            data-testid="button-view-list"
          >
            <i className="fas fa-list mr-2"></i>
            List
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("map")}
            className="rounded-md"
            data-testid="button-view-map"
          >
            <i className="fas fa-map mr-2"></i>
            Map
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "list" ? (
        <>
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
            
{filteredGroups.filter((group) => !myGroups.some((myGroup) => myGroup.id === group.id)).length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground">
                    {selectedFilter === "nearby" && !userLocation
                      ? "Location needed to find nearby groups"
                      : "No groups found matching your criteria."
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFilter === "nearby" && !userLocation
                      ? "Enable location access or update your profile location to discover groups near you."
                      : "Try adjusting your filters or be the first to create a prayer group in your area."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredGroups
                .filter((group) => !myGroups.some((myGroup) => myGroup.id === group.id))
                .map((group) => {
                  // Calculate distance for display
                  let distance: number | undefined;
                  if (userLocation && group.latitude && group.longitude) {
                    distance = calculateDistance(
                      userLocation.lat, userLocation.lng,
                      Number(group.latitude), Number(group.longitude)
                    );
                  }
                  
                  return (
                    <GroupCard 
                      key={group.id} 
                      group={{...group, distance}} 
                      isMember={false}
                      onJoinRequest={() => handleJoinRequest(group)}
                    />
                  );
                })
            )}
          </div>
        </>
      ) : (
        /* Map View */
        <GroupsMap
          onGroupSelect={(group) => setSelectedGroup(group)}
          selectedGroupId={selectedGroup?.id}
        />
      )}

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
