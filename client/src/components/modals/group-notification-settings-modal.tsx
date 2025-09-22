import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Bell, Clock, VolumeX } from "lucide-react";

interface GroupNotificationSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

interface GroupNotificationPreferences {
  prayerNotifications: boolean;
  meetingNotifications: boolean;
  groupActivityNotifications: boolean;
  chatNotifications: boolean;
  notificationFrequency: 'real_time' | 'daily_digest' | 'weekly_summary';
  mutedUntil?: string;
}

export default function GroupNotificationSettingsModal({ 
  open, 
  onOpenChange, 
  groupId, 
  groupName 
}: GroupNotificationSettingsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for group-specific preferences
  const [preferences, setPreferences] = useState<GroupNotificationPreferences>({
    prayerNotifications: true,
    meetingNotifications: true,
    groupActivityNotifications: true,
    chatNotifications: true,
    notificationFrequency: 'real_time',
  });

  // Load group preferences when modal opens
  useEffect(() => {
    if (open && user) {
      loadGroupPreferences();
    }
  }, [open, user, groupId]);

  const loadGroupPreferences = async () => {
    try {
      const response = await apiRequest('GET', `/api/user/group-preferences/${groupId}`) as unknown as GroupNotificationPreferences;
      if (response) {
        setPreferences(response);
      }
    } catch (error) {
      // If no preferences exist, use defaults
      console.log('No group preferences found, using defaults');
    }
  };

  // Save group preferences mutation
  const saveGroupPreferencesMutation = useMutation({
    mutationFn: async (newPreferences: GroupNotificationPreferences) => {
      return apiRequest('PUT', `/api/user/group-preferences/${groupId}`, newPreferences);
    },
    onSuccess: () => {
      toast({
        title: "Group Settings Saved",
        description: `Notification preferences for ${groupName} have been updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save group preferences",
        variant: "destructive",
      });
    },
  });

  const handleSavePreferences = () => {
    saveGroupPreferencesMutation.mutate(preferences);
  };

  const updatePreference = (key: keyof GroupNotificationPreferences, value: boolean | string | undefined) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleMuteGroup = (hours: number) => {
    const mutedUntil = new Date();
    mutedUntil.setHours(mutedUntil.getHours() + hours);
    
    updatePreference('mutedUntil', mutedUntil.toISOString());
    
    toast({
      title: "Group Muted",
      description: `Notifications for ${groupName} will be muted for ${hours} hours.`,
    });
  };

  const handleUnmuteGroup = () => {
    updatePreference('mutedUntil', undefined);
    
    toast({
      title: "Group Unmuted",
      description: `Notifications for ${groupName} have been restored.`,
    });
  };

  const isMuted = preferences.mutedUntil && new Date(preferences.mutedUntil) > new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notification Settings</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Customize notifications for "{groupName}"
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group-specific notification toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Types</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="group-prayer-notifications">Prayer Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new prayer requests in this group
                    </p>
                  </div>
                  <Switch
                    id="group-prayer-notifications"
                    checked={preferences.prayerNotifications}
                    onCheckedChange={(checked) => updatePreference('prayerNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="group-meeting-notifications">Meetings & RSVPs</Label>
                    <p className="text-sm text-muted-foreground">
                      Reminders for meetings and RSVP requests
                    </p>
                  </div>
                  <Switch
                    id="group-meeting-notifications"
                    checked={preferences.meetingNotifications}
                    onCheckedChange={(checked) => updatePreference('meetingNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="group-activity-notifications">Group Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      New members, announcements, and group updates
                    </p>
                  </div>
                  <Switch
                    id="group-activity-notifications"
                    checked={preferences.groupActivityNotifications}
                    onCheckedChange={(checked) => updatePreference('groupActivityNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="group-chat-notifications">Chat Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for new messages in group chat
                    </p>
                  </div>
                  <Switch
                    id="group-chat-notifications"
                    checked={preferences.chatNotifications}
                    onCheckedChange={(checked) => updatePreference('chatNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Notification Frequency</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="group-notification-frequency">Frequency</Label>
                <Select
                  value={preferences.notificationFrequency}
                  onValueChange={(value: 'real_time' | 'daily_digest' | 'weekly_summary') => 
                    updatePreference('notificationFrequency', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real_time">Real-time</SelectItem>
                    <SelectItem value="daily_digest">Daily Digest</SelectItem>
                    <SelectItem value="weekly_summary">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  How often you receive notifications for this group
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mute controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <VolumeX className="w-5 h-5" />
                <span>Mute Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isMuted ? (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This group is muted until {new Date(preferences.mutedUntil!).toLocaleString()}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleUnmuteGroup}
                    className="w-full"
                  >
                    <VolumeX className="w-4 h-4 mr-2" />
                    Unmute Group
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Temporarily mute notifications for this group
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMuteGroup(1)}
                    >
                      1 Hour
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMuteGroup(24)}
                    >
                      24 Hours
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMuteGroup(72)}
                    >
                      3 Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMuteGroup(168)}
                    >
                      1 Week
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePreferences}
              disabled={saveGroupPreferencesMutation.isPending}
            >
              {saveGroupPreferencesMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
