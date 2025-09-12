import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import MeetingModal from "@/components/modals/meeting-modal";
import type { Group, Meeting, GroupInvitation } from "@shared/schema";

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
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
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
  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["/api/groups", group?.id, "members"],
    enabled: !!group?.id && open,
  });

  // Fetch pending membership requests
  const { data: pendingRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/memberships/pending"],
    enabled: open,
  });

  // Fetch group invitations
  const { data: invitations = [] } = useQuery<(GroupInvitation & { createdBy: any })[]>({
    queryKey: ["/api/groups", group?.id, "invitations"],
    enabled: !!group?.id && open,
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

  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/groups/${group?.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Group deleted",
        description: "Your group has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/my"] });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
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

  const createInvitationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/groups/${group?.id}/invitations`, {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Invitation created!",
        description: "Your group invitation link has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "invitations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invitation.",
        variant: "destructive",
      });
    },
  });

  const deactivateInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await apiRequest("DELETE", `/api/invitations/${invitationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation deactivated",
        description: "The invitation link has been deactivated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "invitations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate invitation.",
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

  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      return apiRequest("DELETE", `/api/meetings/${meetingId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${group?.id}/meetings`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meeting",
        variant: "destructive",
      });
    },
  });

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingModal(true);
  };

  const handleCreateMeeting = () => {
    setSelectedMeeting(null);
    setShowMeetingModal(true);
  };

  const handleDeleteMeeting = (meetingId: string) => {
    if (confirm("Are you sure you want to delete this meeting?")) {
      deleteMeetingMutation.mutate(meetingId);
    }
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

  // Fetch group meetings
  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: [`/api/groups/${group?.id}/meetings`],
    enabled: !!group?.id && open,
  });

  const tabs = [
    { id: "settings", label: "Settings", icon: "fas fa-cog" },
    { id: "meetings", label: "Meetings", icon: "fas fa-calendar" },
    { id: "members", label: "Members", icon: "fas fa-users" },
    { id: "requests", label: "Requests", icon: "fas fa-user-plus", badge: pendingRequests.length },
    { id: "invitations", label: "Invitations", icon: "fas fa-share" },
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

            <div className="space-y-3">
              <Button 
                onClick={handleUpdateGroup}
                disabled={updateGroupMutation.isPending}
                className="w-full"
                data-testid="button-update-group"
              >
                {updateGroupMutation.isPending ? "Updating..." : "Update Group"}
              </Button>
              
              <div className="border-t pt-4">
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                  <h4 className="font-medium text-destructive mb-2 flex items-center">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Danger Zone
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Permanently delete this group. This action cannot be undone and will remove all group data including members, prayer requests, and chat history.
                  </p>
                  
                  <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive"
                        disabled={deleteGroupMutation.isPending}
                        data-testid="button-delete-group"
                      >
                        <i className="fas fa-trash mr-2"></i>
                        {deleteGroupMutation.isPending ? "Deleting..." : "Delete Group"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the group <strong>"{group?.name}"</strong> and remove all associated data including:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>All group members</li>
                            <li>Prayer requests and responses</li>
                            <li>Chat message history</li>
                            <li>Scheduled meetings</li>
                            <li>Group invitations</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteGroupMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-testid="button-confirm-delete"
                        >
                          Yes, delete group
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "meetings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Group Meetings</h3>
              <Button
                onClick={handleCreateMeeting}
                size="sm"
                data-testid="button-create-meeting"
              >
                <i className="fas fa-plus mr-2"></i>
                New Meeting
              </Button>
            </div>
            
            {meetings.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-calendar text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground mb-4">No meetings scheduled yet.</p>
                <Button
                  onClick={handleCreateMeeting}
                  variant="outline"
                  data-testid="button-create-first-meeting"
                >
                  Schedule Your First Meeting
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.map((meeting: Meeting) => {
                  const meetingDate = new Date(meeting.meetingDate);
                  const isUpcoming = meetingDate > new Date();
                  
                  return (
                    <Card key={meeting.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-foreground">{meeting.title}</h4>
                              <Badge 
                                variant={meeting.status === "scheduled" ? "default" : meeting.status === "cancelled" ? "destructive" : "secondary"}
                              >
                                {meeting.status}
                              </Badge>
                              {isUpcoming && (
                                <Badge variant="outline" className="text-xs">
                                  Upcoming
                                </Badge>
                              )}
                            </div>
                            
                            {meeting.topic && (
                              <p className="text-sm text-muted-foreground mb-2">
                                <i className="fas fa-tag mr-1"></i>
                                Topic: {meeting.topic}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
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
                              <p className="text-sm text-muted-foreground mb-2">
                                <i className="fas fa-map-marker-alt mr-1"></i>
                                {meeting.venue}
                              </p>
                            )}
                            
                            {meeting.description && (
                              <p className="text-sm text-muted-foreground">
                                {meeting.description}
                              </p>
                            )}
                            
                            {meeting.isRecurring && (
                              <Badge variant="outline" className="mt-2">
                                <i className="fas fa-repeat mr-1"></i>
                                Recurring {meeting.recurringPattern}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditMeeting(meeting)}
                              data-testid={`button-edit-meeting-${meeting.id}`}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              disabled={deleteMeetingMutation.isPending}
                              data-testid={`button-delete-meeting-${meeting.id}`}
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
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

        {activeTab === "invitations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Group Invitations</h3>
              <Button
                onClick={() => createInvitationMutation.mutate()}
                disabled={createInvitationMutation.isPending}
                data-testid="button-create-invitation"
              >
                {createInvitationMutation.isPending ? "Creating..." : "Create Invitation Link"}
              </Button>
            </div>
            
            {invitations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-share text-2xl text-muted-foreground"></i>
                </div>
                <p className="text-muted-foreground mb-2">No invitation links yet</p>
                <p className="text-sm text-muted-foreground">Create an invitation link to share your group with others</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation: any) => (
                  <Card key={invitation.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                              <i className="fas fa-link text-accent"></i>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                Invitation Link
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Created by {invitation.createdBy.firstName} {invitation.createdBy.lastName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={invitation.isActive ? "default" : "secondary"}>
                              {invitation.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deactivateInvitationMutation.mutate(invitation.id)}
                              disabled={deactivateInvitationMutation.isPending}
                              data-testid={`button-deactivate-${invitation.id}`}
                            >
                              Deactivate
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground">Invitation Link:</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const inviteUrl = `${window.location.origin}/invite/${invitation.token}`;
                                navigator.clipboard.writeText(inviteUrl);
                                toast({
                                  title: "Link copied!",
                                  description: "The invitation link has been copied to your clipboard.",
                                });
                              }}
                              data-testid={`button-copy-${invitation.id}`}
                            >
                              <i className="fas fa-copy mr-2"></i>
                              Copy
                            </Button>
                          </div>
                          <p className="text-sm font-mono bg-card p-2 rounded border break-all">
                            {window.location.origin}/invite/{invitation.token}
                          </p>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const inviteUrl = `${window.location.origin}/invite/${invitation.token}`;
                              const message = `Join our prayer group "${group.name}" - ${inviteUrl}`;
                              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                              window.open(whatsappUrl, '_blank');
                            }}
                            className="flex-1"
                            data-testid={`button-whatsapp-${invitation.id}`}
                          >
                            <i className="fab fa-whatsapp mr-2 text-green-500"></i>
                            Share on WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const inviteUrl = `${window.location.origin}/invite/${invitation.token}`;
                              const message = `Join our prayer group "${group.name}" - ${inviteUrl}`;
                              if (navigator.share) {
                                navigator.share({
                                  title: `Join ${group.name}`,
                                  text: message,
                                  url: inviteUrl,
                                });
                              } else {
                                navigator.clipboard.writeText(message);
                                toast({
                                  title: "Message copied!",
                                  description: "The invitation message has been copied to your clipboard.",
                                });
                              }
                            }}
                            className="flex-1"
                            data-testid={`button-share-${invitation.id}`}
                          >
                            <i className="fas fa-share-alt mr-2"></i>
                            Share
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <span>Used: {invitation.currentUses}/{invitation.maxUses === "unlimited" ? "∞" : invitation.maxUses}</span>
                          <span>
                            Created: {new Date(invitation.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
      
      <MeetingModal
        open={showMeetingModal}
        onOpenChange={setShowMeetingModal}
        groupId={group.id}
        meeting={selectedMeeting}
      />
    </Dialog>
  );
}