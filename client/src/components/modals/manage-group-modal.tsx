import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Group } from "@shared/schema";

interface ManageGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
}

export default function ManageGroupModal({ open, onOpenChange, group }: ManageGroupModalProps) {
  const [activeTab, setActiveTab] = useState("settings");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDay, setMeetingDay] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [requireApprovalToJoin, setRequireApprovalToJoin] = useState(true);
  const [requireApprovalToPost, setRequireApprovalToPost] = useState(false);
  const [allowMembersToInvite, setAllowMembersToInvite] = useState(false);
  const [maxMembers, setMaxMembers] = useState("50");
  const [groupRules, setGroupRules] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load group data when modal opens
  useEffect(() => {
    if (group && open) {
      setName(group.name || "");
      setDescription(group.description || "");
      setMeetingDay(group.meetingDay || "");
      setMeetingTime(group.meetingTime || "");
      setMeetingLocation(group.meetingLocation || "");
      setIsPublic(group.isPublic ?? true);
      setRequireApprovalToJoin(group.requireApprovalToJoin ?? true);
      setRequireApprovalToPost(group.requireApprovalToPost ?? false);
      setAllowMembersToInvite(group.allowMembersToInvite ?? false);
      setMaxMembers(group.maxMembers || "50");
      setGroupRules(group.groupRules || "");
    }
  }, [group, open]);

  // Fetch group members
  const { data: members = [] } = useQuery({
    queryKey: ["/api/groups", group?.id, "members"],
    enabled: !!group?.id && open,
  });

  // Fetch pending membership requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["/api/memberships/pending"],
    enabled: open,
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      await apiRequest("PUT", `/api/groups/${group?.id}`, groupData);
    },
    onSuccess: () => {
      toast({
        title: "Group updated!",
        description: "Your group settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/my"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const approveMembershipMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      await apiRequest("POST", `/api/memberships/${membershipId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Member approved",
        description: "The new member has been approved and added to the group.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/memberships/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "members"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMembershipMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      await apiRequest("POST", `/api/memberships/${membershipId}/reject`);
    },
    onSuccess: () => {
      toast({
        title: "Request rejected",
        description: "The membership request has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/memberships/pending"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateGroup = () => {
    if (!group || !name.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in the group name and description.",
        variant: "destructive",
      });
      return;
    }

    const groupData = {
      name: name.trim(),
      description: description.trim(),
      meetingDay: meetingDay || null,
      meetingTime: meetingTime || null,
      meetingLocation: meetingLocation.trim() || null,
      isPublic,
      requireApprovalToJoin,
      requireApprovalToPost,
      allowMembersToInvite,
      maxMembers,
      groupRules: groupRules.trim() || null,
    };

    updateGroupMutation.mutate(groupData);
  };

  const handleClose = () => {
    setActiveTab("settings");
    onOpenChange(false);
  };

  const weekDays = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  const tabs = [
    { id: "settings", label: "Settings", icon: "fas fa-cog" },
    { id: "members", label: "Members", icon: "fas fa-users" },
    { id: "requests", label: "Requests", icon: "fas fa-user-plus", badge: pendingRequests.length },
  ];

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage {group.name}</DialogTitle>
        </DialogHeader>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-muted rounded-lg p-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 relative"
              data-testid={`tab-${tab.id}`}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <Badge className="ml-2 bg-destructive text-destructive-foreground">
                  {tab.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground mb-4">Group Settings</h3>
            
            <div>
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-edit-group-name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
                data-testid="textarea-edit-group-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-meetingDay">Meeting Day</Label>
                <Select value={meetingDay} onValueChange={setMeetingDay}>
                  <SelectTrigger data-testid="select-edit-meeting-day">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekDays.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-meetingTime">Meeting Time</Label>
                <Input
                  id="edit-meetingTime"
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  data-testid="input-edit-meeting-time"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-meetingLocation">Meeting Location</Label>
              <Input
                id="edit-meetingLocation"
                type="text"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="Church, home address, or meeting place"
                data-testid="input-edit-meeting-location"
              />
            </div>

            {/* Moderation Settings */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium text-foreground">Moderation Settings</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Public Group</Label>
                  <p className="text-xs text-muted-foreground">Anyone can discover and request to join</p>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  data-testid="switch-edit-is-public"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Require Approval to Join</Label>
                  <p className="text-xs text-muted-foreground">Admin must approve new members</p>
                </div>
                <Switch
                  checked={requireApprovalToJoin}
                  onCheckedChange={setRequireApprovalToJoin}
                  data-testid="switch-edit-require-approval-join"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Moderate Messages</Label>
                  <p className="text-xs text-muted-foreground">Admin must approve messages before posting</p>
                </div>
                <Switch
                  checked={requireApprovalToPost}
                  onCheckedChange={setRequireApprovalToPost}
                  data-testid="switch-edit-require-approval-post"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Members Can Invite</Label>
                  <p className="text-xs text-muted-foreground">Allow members to invite others</p>
                </div>
                <Switch
                  checked={allowMembersToInvite}
                  onCheckedChange={setAllowMembersToInvite}
                  data-testid="switch-edit-allow-invites"
                />
              </div>

              <div>
                <Label htmlFor="edit-maxMembers">Maximum Members</Label>
                <Select value={maxMembers} onValueChange={setMaxMembers}>
                  <SelectTrigger data-testid="select-edit-max-members">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 members</SelectItem>
                    <SelectItem value="25">25 members</SelectItem>
                    <SelectItem value="50">50 members</SelectItem>
                    <SelectItem value="100">100 members</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-groupRules">Group Rules</Label>
              <Textarea
                id="edit-groupRules"
                value={groupRules}
                onChange={(e) => setGroupRules(e.target.value)}
                placeholder="Enter any specific rules or guidelines for your group..."
                rows={3}
                className="resize-none"
                data-testid="textarea-edit-group-rules"
              />
            </div>

            <Button 
              onClick={handleUpdateGroup}
              disabled={updateGroupMutation.isPending}
              className="w-full"
              data-testid="button-update-group"
            >
              {updateGroupMutation.isPending ? "Updating..." : "Update Group"}
            </Button>
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground mb-4">Group Members</h3>
            
            {members.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No members yet.</p>
            ) : (
              <div className="space-y-3">
                {members.map((member: any) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {member.user.firstName?.[0]}{member.user.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {member.user.firstName} {member.user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {member.role || "member"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground mb-4">Join Requests</h3>
            
            {pendingRequests.filter((req: any) => req.group?.id === group.id).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests
                  .filter((req: any) => req.group?.id === group.id)
                  .map((request: any) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-secondary">
                                {request.user.firstName?.[0]}{request.user.lastName?.[0]}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {request.user.firstName} {request.user.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground mb-2">
                                {request.user.email}
                              </p>
                              {request.message && (
                                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                  "{request.message}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => approveMembershipMutation.mutate(request.id)}
                            disabled={approveMembershipMutation.isPending}
                            data-testid={`button-approve-${request.id}`}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMembershipMutation.mutate(request.id)}
                            disabled={rejectMembershipMutation.isPending}
                            data-testid={`button-reject-${request.id}`}
                          >
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}