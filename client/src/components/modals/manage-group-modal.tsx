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
import { useTodaysBirthdays } from "@/hooks/useTodaysBirthdays";
import { apiRequest } from "@/lib/queryClient";
import { Star, Zap, Plus, Calendar, Clock, MapPin, Tag, Edit, Trash, Repeat } from "lucide-react";
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
  const [audience, setAudience] = useState("coed");
  const [purpose, setPurpose] = useState("prayer");
  const [purposeTagline, setPurposeTagline] = useState("");
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteStep, setDeleteStep] = useState(1);
  
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
      setAudience(group.audience || "coed");
      setPurpose(group.purpose || "prayer");
      setPurposeTagline(group.purposeTagline || "");
    }
  }, [group, open]);

  // Fetch group members
  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["/api/groups", group?.id, "members"],
    enabled: !!group?.id && open,
  });

  // Fetch today's birthdays for this group
  const { data: todaysBirthdays = [] } = useTodaysBirthdays(group?.id, open);

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
        title: "Group permanently deleted",
        description: "The group and all its data have been completely removed.",
      });
      
      // Force removal from cache and refresh all group-related queries immediately
      queryClient.removeQueries({ queryKey: ["/api/groups"] });
      queryClient.removeQueries({ queryKey: ["/api/groups/my"] });
      queryClient.removeQueries({ queryKey: ["/api/groups/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/next"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/my"] });
      
      // Remove specific group data from cache
      queryClient.removeQueries({ queryKey: ["/api/groups", group?.id] });
      queryClient.removeQueries({ queryKey: [`/api/groups/${group?.id}/members`] });
      queryClient.removeQueries({ queryKey: [`/api/groups/${group?.id}/meetings`] });
      queryClient.removeQueries({ queryKey: [`/api/groups/${group?.id}/invitations`] });
      
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Failed to delete group",
        description: "Could not delete the group. Please try again.",
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
      audience,
      purpose,
      purposeTagline: purposeTagline.trim() || null,
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

  const handleCreateMeeting = (prefillWithDefaults = false) => {
    if (prefillWithDefaults && group) {
      // Create a mock meeting object with group defaults for prefilling
      const defaultMeeting = {
        id: '',
        title: `${group.name} Meeting`,
        groupId: group.id,
        meetingDate: new Date().toISOString(),
        venue: group.meetingLocation || '',
        venueAddress: '',
        description: '',
        topic: '',
        maxAttendees: '',
        status: 'scheduled' as const,
        isRecurring: false,
        recurringPattern: 'weekly',
        recurringDayOfWeek: group.meetingDay || 'Friday',
        recurringTime: group.meetingTime || '17:45',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _prefillMode: true, // Special flag to indicate this is for prefilling
      };
      setSelectedMeeting(defaultMeeting as any);
    } else {
      setSelectedMeeting(null);
    }
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
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Manage {group.name}</DialogTitle>
        </DialogHeader>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-muted rounded-lg p-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 px-2 sm:px-3 text-xs sm:text-sm font-medium whitespace-nowrap min-w-fit"
              data-testid={`tab-${tab.id}`}
            >
              <i className={`${tab.icon} mr-1 sm:mr-2 text-xs`}></i>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">
                {tab.label === "Settings" && "Set"}
                {tab.label === "Meetings" && "Meet"}
                {tab.label === "Members" && "Mem"}
                {tab.label === "Requests" && "Req"}
                {tab.label === "Invitations" && "Inv"}
              </span>
              {tab.badge && tab.badge > 0 && (
                <Badge className="ml-1 bg-destructive text-destructive-foreground text-xs">
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

            {/* Group Characteristics */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium text-foreground">Group Characteristics</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-audience">Who Can Join</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger data-testid="select-edit-audience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coed">Everyone (Co-ed)</SelectItem>
                      <SelectItem value="men_only">Men Only</SelectItem>
                      <SelectItem value="women_only">Women Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-purpose">Group Purpose</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger data-testid="select-edit-purpose">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prayer">Prayer & Worship</SelectItem>
                      <SelectItem value="bible_study">Bible Study</SelectItem>
                      <SelectItem value="fellowship">Fellowship</SelectItem>
                      <SelectItem value="youth">Youth Ministry</SelectItem>
                      <SelectItem value="marriage_couples">Marriage & Couples</SelectItem>
                      <SelectItem value="recovery_healing">Recovery & Healing</SelectItem>
                      <SelectItem value="outreach_service">Outreach & Service</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-purposeTagline">Purpose Tagline (Optional)</Label>
                <Input
                  id="edit-purposeTagline"
                  type="text"
                  value={purposeTagline}
                  onChange={(e) => setPurposeTagline(e.target.value)}
                  placeholder="Short description of your group's focus"
                  data-testid="input-edit-purpose-tagline"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Brief description shown to people considering joining
                </p>
              </div>
            </div>

            {/* Default Meeting Schedule */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium text-foreground">Default Meeting Schedule</h4>
              <p className="text-sm text-muted-foreground">
                This information helps people find your group and is used to prefill new meetings. 
                Manage actual meetings in the "Meetings" tab.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-meetingDay">Default Day</Label>
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
                  <Label htmlFor="edit-meetingTime">Default Time</Label>
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
                <Label htmlFor="edit-meetingLocation">Default Location</Label>
                <Input
                  id="edit-meetingLocation"
                  type="text"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="Church, home address, or meeting place"
                  data-testid="input-edit-meeting-location"
                />
              </div>
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
                  
                  <AlertDialog 
                    open={showDeleteConfirmation} 
                    onOpenChange={(open) => {
                      setShowDeleteConfirmation(open);
                      if (!open) {
                        setDeleteStep(1);
                        setDeleteConfirmationText("");
                      }
                    }}
                  >
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
                    <AlertDialogContent className="max-w-md">
                      {deleteStep === 1 && (
                        <>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-destructive flex items-center">
                              <i className="fas fa-exclamation-triangle mr-2"></i>
                              ⚠️ WARNING: Permanent Deletion
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-3">
                              <p className="font-medium text-foreground">
                                You are about to permanently delete the group <strong>"{group?.name}"</strong>
                              </p>
                              
                              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                <p className="font-medium text-destructive mb-2">This will PERMANENTLY delete:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  <li>All group members and their membership history</li>
                                  <li>All prayer requests and prayer responses</li>
                                  <li>Complete chat message history</li>
                                  <li>All scheduled meetings and RSVP data</li>
                                  <li>Group invitations and invitation links</li>
                                  <li>All group settings and configuration</li>
                                </ul>
                              </div>
                              
                              <p className="text-destructive font-medium">
                                ⚠️ This action cannot be undone and all data will be lost forever.
                              </p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid="button-cancel-delete-step1">Cancel</AlertDialogCancel>
                            <Button 
                              onClick={() => setDeleteStep(2)}
                              variant="destructive"
                              data-testid="button-continue-delete"
                            >
                              I understand, continue
                            </Button>
                          </AlertDialogFooter>
                        </>
                      )}
                      
                      {deleteStep === 2 && (
                        <>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-destructive">
                              🔒 Final Confirmation Required
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-4">
                              <p>
                                To confirm deletion, please type the exact group name below:
                              </p>
                              
                              <div className="bg-muted p-3 rounded-lg">
                                <p className="font-mono font-medium text-center">
                                  {group?.name}
                                </p>
                              </div>
                              
                              <div>
                                <Label htmlFor="delete-confirmation">Type group name to confirm:</Label>
                                <Input
                                  id="delete-confirmation"
                                  value={deleteConfirmationText}
                                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                  placeholder="Type the group name exactly..."
                                  className="mt-2"
                                  data-testid="input-delete-confirmation"
                                />
                              </div>
                              
                              <p className="text-sm text-destructive font-medium">
                                ⚠️ Once you click "PERMANENTLY DELETE", the group and all its data will be immediately and irreversibly destroyed.
                              </p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col space-y-2">
                            <div className="flex space-x-2 w-full">
                              <Button 
                                onClick={() => setDeleteStep(1)}
                                variant="outline"
                                className="flex-1"
                                data-testid="button-back-delete"
                              >
                                ← Back
                              </Button>
                              <AlertDialogCancel className="flex-1" data-testid="button-cancel-delete-step2">Cancel</AlertDialogCancel>
                            </div>
                            <AlertDialogAction 
                              onClick={() => deleteGroupMutation.mutate()}
                              disabled={deleteConfirmationText !== group?.name || deleteGroupMutation.isPending}
                              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                              data-testid="button-confirm-final-delete"
                            >
                              {deleteGroupMutation.isPending ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-2"></i>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-trash mr-2"></i>
                                  PERMANENTLY DELETE GROUP
                                </>
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </>
                      )}
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "meetings" && (
          <div className="space-y-4">
            {/* Next Meeting Section */}
            {(() => {
              const upcomingMeetings = meetings
                .filter((meeting: Meeting) => new Date(meeting.meetingDate) > new Date())
                .sort((a: Meeting, b: Meeting) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime());
              
              const nextMeeting = upcomingMeetings[0];
              
              if (nextMeeting) {
                const meetingDate = new Date(nextMeeting.meetingDate);
                const now = new Date();
                
                let timeUntil = "";
                // Use calendar day difference instead of millisecond-based calculation
                const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
                const diffDays = Math.round((meetingDateOnly.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) {
                  timeUntil = "Today";
                } else if (diffDays === 1) {
                  timeUntil = "Tomorrow";
                } else if (diffDays <= 7) {
                  timeUntil = `In ${diffDays} days`;
                } else {
                  const weeks = Math.floor(diffDays / 7);
                  timeUntil = `${weeks} week${weeks > 1 ? 's' : ''} away`;
                }
                
                return (
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800" data-testid="card-next-meeting">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Next Meeting</h3>
                            <Badge 
                              variant="secondary" 
                              className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                              data-testid="text-next-meeting-time"
                            >
                              {timeUntil}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-lg text-foreground" data-testid="text-next-meeting-title">{nextMeeting.title}</h4>
                          {nextMeeting.topic && (
                            <p className="text-sm text-muted-foreground">
                              <i className="fas fa-tag mr-1"></i>
                              {nextMeeting.topic}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                            <span className="flex items-center text-blue-700 dark:text-blue-300">
                              <i className="fas fa-calendar mr-1"></i>
                              {meetingDate.toLocaleDateString()}
                            </span>
                            <span className="flex items-center text-blue-700 dark:text-blue-300">
                              <i className="fas fa-clock mr-1"></i>
                              {meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {nextMeeting.venue && (
                              <span className="flex items-center text-blue-700 dark:text-blue-300">
                                <i className="fas fa-map-marker-alt mr-1"></i>
                                {nextMeeting.venue}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditMeeting(nextMeeting)}
                          className="border-blue-300 hover:bg-blue-50 dark:border-blue-600 dark:hover:bg-blue-900/30 w-full sm:w-auto"
                          data-testid="button-edit-next-meeting"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Manage Meeting
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
            })()}

            {/* Quick Schedule & Actions Section */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleCreateMeeting(true)}
                size="sm"
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-quick-schedule"
              >
                <Zap className="w-4 h-4 mr-2" />
                Quick Schedule
              </Button>
              <Button
                onClick={() => handleCreateMeeting()}
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-none"
                data-testid="button-create-meeting"
              >
                <Plus className="w-4 h-4 mr-2" />
                Custom Meeting
              </Button>
            </div>
            
            {/* All Meetings Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">All Scheduled Meetings</h3>
                <span className="text-sm text-muted-foreground" data-testid="text-meeting-count">
                  {meetings.length} {meetings.length === 1 ? 'meeting' : 'meetings'}
                </span>
              </div>
              
              {meetings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No meetings scheduled yet.</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use Quick Schedule to create a meeting with your default schedule, or Custom Meeting for full control.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      onClick={() => handleCreateMeeting(true)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-quick-schedule-first"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Quick Schedule
                    </Button>
                    <Button
                      onClick={() => handleCreateMeeting()}
                      variant="outline"
                      data-testid="button-create-first-meeting"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Custom Meeting
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting: Meeting) => {
                    const meetingDate = new Date(meeting.meetingDate);
                    const isUpcoming = meetingDate > new Date();
                    const isNextMeeting = meetings
                      .filter((m: Meeting) => new Date(m.meetingDate) > new Date())
                      .sort((a: Meeting, b: Meeting) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime())[0]?.id === meeting.id;
                    
                    // Skip the next meeting since it's shown prominently above
                    if (isNextMeeting) return null;
                    
                    return (
                      <Card key={meeting.id}>
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <h4 className="font-medium text-foreground truncate">{meeting.title}</h4>
                                  <div className="flex gap-1 flex-wrap">
                                    <Badge 
                                      variant={meeting.status === "scheduled" ? "default" : meeting.status === "cancelled" ? "destructive" : "secondary"}
                                      className="text-xs"
                                    >
                                      {meeting.status}
                                    </Badge>
                                    {isUpcoming && (
                                      <Badge variant="outline" className="text-xs">
                                        Upcoming
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {meeting.topic && (
                                  <p className="text-sm text-muted-foreground">
                                    <i className="fas fa-tag mr-1"></i>
                                    Topic: {meeting.topic}
                                  </p>
                                )}
                                
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <i className="fas fa-calendar mr-1"></i>
                                    {meetingDate.toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center">
                                    <i className="fas fa-clock mr-1"></i>
                                    {meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                
                                {meeting.venue && (
                                  <p className="text-sm text-muted-foreground">
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
                                  <Badge variant="outline" className="text-xs">
                                    <i className="fas fa-repeat mr-1"></i>
                                    Recurring {meeting.recurringPattern}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditMeeting(meeting)}
                                  className="flex-1 sm:flex-none"
                                  data-testid={`button-edit-meeting-${meeting.id}`}
                                >
                                  <i className="fas fa-edit mr-1 sm:mr-0"></i>
                                  <span className="sm:hidden">Edit</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteMeeting(meeting.id)}
                                  disabled={deleteMeetingMutation.isPending}
                                  className="flex-1 sm:flex-none"
                                  data-testid={`button-delete-meeting-${meeting.id}`}
                                >
                                  <i className="fas fa-trash mr-1 sm:mr-0"></i>
                                  <span className="sm:hidden">Delete</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground mb-4">Group Members</h3>
            
            {/* Birthday Banner */}
            {todaysBirthdays.length > 0 && (
              <Card 
                className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800"
                data-testid="banner-birthdays-today"
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <p className="font-medium text-foreground">
                        {todaysBirthdays.length === 1 ? "Birthday Today!" : "Birthdays Today!"}
                      </p>
                      <p 
                        className="text-sm text-muted-foreground"
                        data-testid="text-birthday-names"
                      >
                        {todaysBirthdays.slice(0, 3).map((user, index) => {
                          const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                          return (
                            <span key={user.id}>
                              {displayName}
                              {index < Math.min(todaysBirthdays.length, 3) - 1 && ", "}
                            </span>
                          );
                        })}
                        {todaysBirthdays.length > 3 && (
                          <span> and {todaysBirthdays.length - 3} more</span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
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
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-foreground">
                                {`${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || member.user.email}
                              </p>
                              {todaysBirthdays.some(user => user.id === member.user.id) && (
                                <Badge 
                                  variant="secondary" 
                                  className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700"
                                  data-testid={`badge-birthday-${member.user.id}`}
                                >
                                  🎂 Birthday
                                </Badge>
                              )}
                            </div>
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