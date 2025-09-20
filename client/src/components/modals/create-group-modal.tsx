import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LocationPickerGoogle from "@/components/location-picker-google";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateGroupModal({ open, onOpenChange }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDay, setMeetingDay] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [groupLocation, setGroupLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [requireApprovalToJoin, setRequireApprovalToJoin] = useState(true);
  const [requireApprovalToPost, setRequireApprovalToPost] = useState(false);
  const [allowMembersToInvite, setAllowMembersToInvite] = useState(false);
  const [maxMembers, setMaxMembers] = useState("50");
  const [groupRules, setGroupRules] = useState("");
  const [isRecurringMeeting, setIsRecurringMeeting] = useState(true);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      await apiRequest("POST", "/api/groups", groupData);
    },
    onSuccess: () => {
      toast({
        title: "Group created!",
        description: "Your prayer group has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in the group name and description.",
        variant: "destructive",
      });
      return;
    }

    if (groupLocation?.latitude == null || groupLocation?.longitude == null) {
      toast({
        title: "Location Required",
        description: "Please set a location for your group so others can find you.",
        variant: "destructive",
      });
      return;
    }

    const groupData = {
      name: name.trim(),
      description: description.trim(),
      meetingDay: meetingDay || null,
      meetingTime: meetingTime || null,
      meetingLocation: meetingLocation.trim() || groupLocation?.address || null,
      latitude: groupLocation?.latitude?.toString() || null,
      longitude: groupLocation?.longitude?.toString() || null,
      isPublic,
      requireApprovalToJoin,
      requireApprovalToPost,
      allowMembersToInvite,
      maxMembers,
      groupRules: groupRules.trim() || null,
      isRecurringMeeting,
    };

    createGroupMutation.mutate(groupData);
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setMeetingDay("");
    setMeetingTime("");
    setMeetingLocation("");
    setGroupLocation(null);
    setIsPublic(true);
    setRequireApprovalToJoin(true);
    setRequireApprovalToPost(false);
    setAllowMembersToInvite(false);
    setMaxMembers("50");
    setGroupRules("");
    setIsRecurringMeeting(true);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Prayer Group</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div>
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              data-testid="input-group-name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your prayer group's purpose and focus..."
              rows={3}
              className="resize-none"
              data-testid="textarea-group-description"
            />
          </div>

          {/* Meeting Schedule */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label htmlFor="isRecurringMeeting" className="text-sm font-medium">Meeting Type</Label>
              <p className="text-xs text-muted-foreground">
                {isRecurringMeeting 
                  ? "Ongoing group that meets regularly"
                  : "One-time event that will end after the meeting"
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="isRecurringMeeting" className="text-sm">
                {isRecurringMeeting ? "Recurring" : "One-time"}
              </Label>
              <Switch
                id="isRecurringMeeting"
                checked={isRecurringMeeting}
                onCheckedChange={setIsRecurringMeeting}
                data-testid="switch-recurring-meeting"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="meetingDay">Meeting Day</Label>
              <Select value={meetingDay} onValueChange={setMeetingDay}>
                <SelectTrigger data-testid="select-meeting-day">
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
              <Label htmlFor="meetingTime">Meeting Time</Label>
              <Input
                id="meetingTime"
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                data-testid="input-meeting-time"
              />
            </div>
          </div>

          {/* Location */}
          <LocationPickerGoogle
            onLocationChange={setGroupLocation}
            label="Group Location (helps others find you)"
            required={true}
          />
          
          <div>
            <Label htmlFor="meetingLocation">Additional Meeting Details (Optional)</Label>
            <Input
              id="meetingLocation"
              type="text"
              value={meetingLocation}
              onChange={(e) => setMeetingLocation(e.target.value)}
              placeholder="e.g., Room 201, Main Sanctuary, or specific instructions"
              data-testid="input-meeting-location"
            />
          </div>

          {/* Group Settings */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium text-foreground">Group Settings</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isPublic" className="text-sm">Public Group</Label>
                <p className="text-xs text-muted-foreground">Anyone can discover and request to join</p>
              </div>
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                data-testid="switch-is-public"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireApproval" className="text-sm">Require Approval to Join</Label>
                <p className="text-xs text-muted-foreground">Admin must approve new members</p>
              </div>
              <Switch
                id="requireApproval"
                checked={requireApprovalToJoin}
                onCheckedChange={setRequireApprovalToJoin}
                data-testid="switch-require-approval-join"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requirePostApproval" className="text-sm">Moderate Messages</Label>
                <p className="text-xs text-muted-foreground">Admin must approve messages before posting</p>
              </div>
              <Switch
                id="requirePostApproval"
                checked={requireApprovalToPost}
                onCheckedChange={setRequireApprovalToPost}
                data-testid="switch-require-approval-post"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowInvites" className="text-sm">Members Can Invite</Label>
                <p className="text-xs text-muted-foreground">Allow members to invite others</p>
              </div>
              <Switch
                id="allowInvites"
                checked={allowMembersToInvite}
                onCheckedChange={setAllowMembersToInvite}
                data-testid="switch-allow-invites"
              />
            </div>

            <div>
              <Label htmlFor="maxMembers">Maximum Members</Label>
              <Select value={maxMembers} onValueChange={setMaxMembers}>
                <SelectTrigger data-testid="select-max-members">
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

          {/* Group Rules */}
          <div>
            <Label htmlFor="groupRules">Group Rules (Optional)</Label>
            <Textarea
              id="groupRules"
              value={groupRules}
              onChange={(e) => setGroupRules(e.target.value)}
              placeholder="Enter any specific rules or guidelines for your group..."
              rows={3}
              className="resize-none"
              data-testid="textarea-group-rules"
            />
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
              data-testid="button-cancel-create-group"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createGroupMutation.isPending}
              className="flex-1"
              data-testid="button-create-group"
            >
              {createGroupMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}