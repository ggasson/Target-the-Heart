import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { User, Bell, Shield, Eye, EyeOff, Lock, Mail, Clock, MapPin, Download, Settings } from "lucide-react";

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserPreferences {
  // Notification settings
  prayerNotifications: boolean;
  meetingNotifications: boolean;
  groupNotifications: boolean;
  dailyVerseNotifications: boolean;
  birthdayNotifications: boolean;
  
  // Privacy settings
  profileVisibility: 'public' | 'group_members' | 'private';
  showPrayerActivity: boolean;
  showMeetingAttendance: boolean;
  allowGroupInvitations: boolean;
  
  // Security settings
  emailNotifications: boolean;
  
  // Phase 2: Advanced notification settings
  notificationFrequency: 'real_time' | 'daily_digest' | 'weekly_summary';
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  pushNotifications: boolean;
  smsNotifications: boolean;
  
  // Phase 2: Location privacy
  locationSharingEnabled: boolean;
  locationAccuracy: 'exact' | 'approximate' | 'city_only';
  proximityBasedGroups: boolean;
  
  // Phase 2: Data management
  dataRetentionDays: number;
  autoArchivePrayers: boolean;
  archiveAfterDays: number;
}

export default function AccountSettingsModal({ open, onOpenChange }: AccountSettingsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for user preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    prayerNotifications: true,
    meetingNotifications: true,
    groupNotifications: true,
    dailyVerseNotifications: true,
    birthdayNotifications: true,
    profileVisibility: 'group_members',
    showPrayerActivity: true,
    showMeetingAttendance: true,
    allowGroupInvitations: true,
    emailNotifications: true,
    
    // Phase 2: Advanced notification settings
    notificationFrequency: 'real_time',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    pushNotifications: true,
    smsNotifications: false,
    
    // Phase 2: Location privacy
    locationSharingEnabled: true,
    locationAccuracy: 'approximate',
    proximityBasedGroups: true,
    
    // Phase 2: Data management
    dataRetentionDays: 365,
    autoArchivePrayers: false,
    archiveAfterDays: 30,
  });

  // State for password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Load user preferences when modal opens
  useEffect(() => {
    if (open && user) {
      // TODO: Load user preferences from API
      // For now, using default values
    }
  }, [open, user]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: UserPreferences) => {
      return apiRequest('PUT', '/api/user/preferences', newPreferences);
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string }) => {
      return apiRequest('PUT', '/api/user/password', passwordData);
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate(preferences);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/user/export-data', {
        headers: await getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `target-the-heart-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Data Exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAuthHeaders = async () => {
    const headers: Record<string, string> = {};
    if (user) {
      try {
        // This would need to be implemented with Firebase token
        // For now, we'll use a placeholder
        headers['Authorization'] = `Bearer ${user.id}`;
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    }
    return headers;
  };

  const updatePreference = (key: keyof UserPreferences, value: boolean | string | number) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Account Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="prayer-notifications">Prayer Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new prayer requests in your groups
                    </p>
                  </div>
                  <Switch
                    id="prayer-notifications"
                    checked={preferences.prayerNotifications}
                    onCheckedChange={(checked) => updatePreference('prayerNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="meeting-notifications">Meetings & RSVPs</Label>
                    <p className="text-sm text-muted-foreground">
                      Reminders for upcoming meetings and RSVP requests
                    </p>
                  </div>
                  <Switch
                    id="meeting-notifications"
                    checked={preferences.meetingNotifications}
                    onCheckedChange={(checked) => updatePreference('meetingNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="group-notifications">Group Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      New members, invitations, and group announcements
                    </p>
                  </div>
                  <Switch
                    id="group-notifications"
                    checked={preferences.groupNotifications}
                    onCheckedChange={(checked) => updatePreference('groupNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="daily-verse-notifications">Daily Verse</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily Bible verse notifications
                    </p>
                  </div>
                  <Switch
                    id="daily-verse-notifications"
                    checked={preferences.dailyVerseNotifications}
                    onCheckedChange={(checked) => updatePreference('dailyVerseNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="birthday-notifications">Birthday Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about group member birthdays
                    </p>
                  </div>
                  <Switch
                    id="birthday-notifications"
                    checked={preferences.birthdayNotifications}
                    onCheckedChange={(checked) => updatePreference('birthdayNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important updates via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Privacy & Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <Select
                    value={preferences.profileVisibility}
                    onValueChange={(value: 'public' | 'group_members' | 'private') => 
                      updatePreference('profileVisibility', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4" />
                          <span>Public - Everyone can see your profile</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="group_members">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4" />
                          <span>Group Members Only</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center space-x-2">
                          <EyeOff className="w-4 h-4" />
                          <span>Private - Only you can see your profile</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-prayer-activity">Show Prayer Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others see your prayer requests and responses
                    </p>
                  </div>
                  <Switch
                    id="show-prayer-activity"
                    checked={preferences.showPrayerActivity}
                    onCheckedChange={(checked) => updatePreference('showPrayerActivity', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-meeting-attendance">Show Meeting Attendance</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others see your meeting RSVPs and attendance
                    </p>
                  </div>
                  <Switch
                    id="show-meeting-attendance"
                    checked={preferences.showMeetingAttendance}
                    onCheckedChange={(checked) => updatePreference('showMeetingAttendance', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-group-invitations">Allow Group Invitations</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others invite you to join groups
                    </p>
                  </div>
                  <Switch
                    id="allow-group-invitations"
                    checked={preferences.allowGroupInvitations}
                    onCheckedChange={(checked) => updatePreference('allowGroupInvitations', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPasswords ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={!currentPassword || !newPassword || !confirmPassword || changePasswordMutation.isPending}
                  className="w-full"
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Phase 2: Advanced Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Advanced Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="notification-frequency">Notification Frequency</Label>
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
                    How often you receive notifications
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="quiet-hours">Quiet Hours</Label>
                    <p className="text-sm text-muted-foreground">
                      Pause notifications during specific hours
                    </p>
                  </div>
                  <Switch
                    id="quiet-hours"
                    checked={preferences.quietHoursEnabled}
                    onCheckedChange={(checked) => updatePreference('quietHoursEnabled', checked)}
                  />
                </div>

                {preferences.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-3 ml-4">
                    <div>
                      <Label htmlFor="quiet-start">Start Time</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={preferences.quietHoursStart}
                        onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiet-end">End Time</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={preferences.quietHoursEnd}
                        onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your device
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important updates via text message
                    </p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={preferences.smsNotifications}
                    onCheckedChange={(checked) => updatePreference('smsNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phase 2: Location Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Location Privacy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="location-sharing">Location Sharing</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow the app to use your location for group features
                    </p>
                  </div>
                  <Switch
                    id="location-sharing"
                    checked={preferences.locationSharingEnabled}
                    onCheckedChange={(checked) => updatePreference('locationSharingEnabled', checked)}
                  />
                </div>

                {preferences.locationSharingEnabled && (
                  <div>
                    <Label htmlFor="location-accuracy">Location Accuracy</Label>
                    <Select
                      value={preferences.locationAccuracy}
                      onValueChange={(value: 'exact' | 'approximate' | 'city_only') => 
                        updatePreference('locationAccuracy', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exact">Exact Location</SelectItem>
                        <SelectItem value="approximate">Approximate Area</SelectItem>
                        <SelectItem value="city_only">City Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      How precise your location sharing should be
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="proximity-groups">Proximity-Based Groups</Label>
                    <p className="text-sm text-muted-foreground">
                      Suggest groups based on your location
                    </p>
                  </div>
                  <Switch
                    id="proximity-groups"
                    checked={preferences.proximityBasedGroups}
                    onCheckedChange={(checked) => updatePreference('proximityBasedGroups', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phase 2: Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Data Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="data-retention">Data Retention Period</Label>
                  <Select
                    value={preferences.dataRetentionDays.toString()}
                    onValueChange={(value) => updatePreference('dataRetentionDays', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="730">2 years</SelectItem>
                      <SelectItem value="0">Keep forever</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    How long to keep your data before automatic deletion
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-archive">Auto-Archive Prayers</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically archive old prayer requests
                    </p>
                  </div>
                  <Switch
                    id="auto-archive"
                    checked={preferences.autoArchivePrayers}
                    onCheckedChange={(checked) => updatePreference('autoArchivePrayers', checked)}
                  />
                </div>

                {preferences.autoArchivePrayers && (
                  <div>
                    <Label htmlFor="archive-days">Archive After Days</Label>
                    <Select
                      value={preferences.archiveAfterDays.toString()}
                      onValueChange={(value) => updatePreference('archiveAfterDays', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">6 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <div>
                  <Label>Export Your Data</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download a copy of all your data (GDPR compliance)
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export My Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePreferences}
              disabled={savePreferencesMutation.isPending}
            >
              {savePreferencesMutation.isPending ? (
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
