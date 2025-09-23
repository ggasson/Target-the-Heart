import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { signOutUser } from "@/lib/firebase";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import AccountSettingsModal from "@/components/modals/account-settings-modal";

interface ProfileProps {
  onBack?: () => void;
}

// Profile update schema - only include fields users can update
const profileUpdateSchema = insertUserSchema.pick({
  firstName: true,
  lastName: true,
  birthday: true,
}).extend({
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  birthday: z.string().optional().transform((val) => val || null),
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

// Helper function to normalize birthday for date input
const normalizeBirthdayForInput = (birthday: any): string => {
  if (!birthday) return "";
  if (typeof birthday === 'string') {
    // Handle ISO date string (e.g., "2025-09-18T00:00:00.000Z") or already formatted date
    return birthday.includes('T') ? birthday.split('T')[0] : birthday;
  }
  // Handle Date object
  return new Date(birthday).toISOString().split('T')[0];
};

export default function Profile({ onBack }: ProfileProps) {
  const { user, refreshUserData, getToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  const form = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: (user as any)?.firstName || "",
      lastName: (user as any)?.lastName || "",
      birthday: normalizeBirthdayForInput((user as any)?.birthday),
    },
  });

  // Update form when user data changes (e.g., after birthday is set during group join)
  useEffect(() => {
    if (user) {
      const currentFormData = {
        firstName: (user as any)?.firstName || "",
        lastName: (user as any)?.lastName || "",
        birthday: normalizeBirthdayForInput((user as any)?.birthday),
      };
      
      // Only reset if there are actual changes to prevent unnecessary re-renders
      const currentValues = form.getValues();
      if (currentValues.firstName !== currentFormData.firstName ||
          currentValues.lastName !== currentFormData.lastName ||
          currentValues.birthday !== currentFormData.birthday) {
        form.reset(currentFormData);
      }
    }
  }, [user, form]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      // Firebase will automatically update the auth state and redirect to landing page
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileUpdateData) => {
      // Send the birthday value as-is (including null for empty dates)
      const payload = {
        ...profileData,
        birthday: profileData.birthday || null, // Convert empty string to null
      };
      await apiRequest("PATCH", "/api/users/me", payload);
    },
    onSuccess: async () => {
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });
      await refreshUserData(); // Refresh user data from API
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('📸 Frontend: Starting photo upload', file.name, file.type, file.size);
      
      const formData = new FormData();
      formData.append('photo', file);
      
      console.log('📸 Frontend: FormData created, sending to API');
      
      // Get the auth token properly
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Use fetch directly for file uploads (FormData needs special handling)
      const response = await fetch('/api/users/me/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for multipart/form-data
        },
        body: formData,
      });
      
      console.log('📸 Frontend: Response received', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('📸 Frontend: Upload failed', errorText);
        throw new Error(errorText || 'Failed to upload photo');
      }
      
      const result = await response.json();
      console.log('📸 Frontend: Upload successful', result);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      refreshUserData(); // Refresh user data to update UI
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  const handleEditProfile = () => {
    // Always reset form with latest user data when opening edit dialog
    const latestFormData = {
      firstName: (user as any)?.firstName || "",
      lastName: (user as any)?.lastName || "",
      birthday: normalizeBirthdayForInput((user as any)?.birthday),
    };
    
    form.reset(latestFormData);
    setIsEditing(true);
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 Frontend: File input changed');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('📸 Frontend: No file selected');
      return;
    }

    console.log('📸 Frontend: File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('📸 Frontend: Invalid file type:', file.type);
      toast({
        title: "Invalid File Type",
        description: "Please select a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log('📸 Frontend: File too large:', file.size);
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    console.log('📸 Frontend: File validation passed, starting upload');
    setIsUploadingPhoto(true);
    try {
      await uploadPhotoMutation.mutateAsync(file);
      console.log('📸 Frontend: Upload completed successfully');
    } catch (error) {
      console.error('📸 Frontend: Upload failed:', error);
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = (data: ProfileUpdateData) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.reset();
  };

  const handleNotifications = () => {
    setShowAccountSettings(true);
  };

  const handlePrivacySecurity = () => {
    setShowAccountSettings(true);
  };

  const handleHelpCenter = () => {
    toast({
      title: "Help Center",
      description: "Help documentation and tutorials coming soon! For immediate assistance, please use Contact Us.",
    });
  };

  const handleContactUs = () => {
    const email = 'support@targettheheart.com';
    const subject = 'Target The Heart - Support Request';
    const body = 'Hello, I need help with...';
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const profileMenuItems = [
    {
      icon: "fas fa-user",
      label: "Edit Profile",
      action: handleEditProfile,
    },
    {
      icon: "fas fa-bell",
      label: "Notifications",
      action: handleNotifications,
    },
    {
      icon: "fas fa-lock",
      label: "Privacy & Security",
      action: handlePrivacySecurity,
    },
  ];

  const supportMenuItems = [
    {
      icon: "fas fa-question-circle",
      label: "Help Center",
      action: handleHelpCenter,
    },
    {
      icon: "fas fa-envelope",
      label: "Contact Us",
      action: handleContactUs,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between px-6 py-4 bg-card shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center space-x-2"
          data-testid="button-back"
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back</span>
        </Button>
        <h1 className="font-semibold">Profile</h1>
        <div className="w-16"></div> {/* Spacer for center alignment */}
      </div>

      {/* Profile Header */}
      <div className="gradient-bg px-6 py-8 pb-16">
        <div className="text-center">
          <div className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {(user as any)?.profileImageUrl ? (
              <img 
                src={(user as any).profileImageUrl} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
                data-testid="img-profile-avatar"
              />
            ) : (
              <i className="fas fa-user text-3xl text-white"></i>
            )}
            
            {/* Photo Upload Button */}
            <button
              onClick={handlePhotoUpload}
              disabled={isUploadingPhoto}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              data-testid="button-upload-photo"
            >
              {isUploadingPhoto ? (
                <i className="fas fa-spinner fa-spin text-white text-sm"></i>
              ) : (
                <i className="fas fa-camera text-white text-sm"></i>
              )}
            </button>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-photo-upload"
          />
          <h2 className="text-xl font-bold text-white mb-1" data-testid="text-user-name">
            {(user as any)?.firstName && (user as any)?.lastName 
              ? `${(user as any).firstName} ${(user as any).lastName}`
              : (user as any)?.email?.split('@')[0] || 'User'
            }
          </h2>
          <p className="text-white/80" data-testid="text-user-email">
            {(user as any)?.email}
          </p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 -mt-8 relative z-10">
        {/* Account Settings */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Account Settings</h3>
            <div className="space-y-1">
              {profileMenuItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={item.action}
                  className="w-full justify-between p-3 h-auto"
                  data-testid={`button-${item.label.toLowerCase().replace(/\s+/g, '-').replace('&', 'and')}`}
                >
                  <div className="flex items-center space-x-3">
                    <i className={`${item.icon} text-muted-foreground`}></i>
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <div className="space-y-1">
              {supportMenuItems.map((item, index) => {
                if (item.label === "Contact Us") {
                  const email = 'support@targettheheart.com';
                  const subject = 'Target The Heart - Support Request';
                  const body = 'Hello, I need help with...';
                  return (
                    <a
                      key={index}
                      href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
                      className="flex items-center justify-between w-full p-3 h-auto bg-transparent hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-left"
                      data-testid={`button-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="flex items-center space-x-3">
                        <i className={`${item.icon} text-muted-foreground`}></i>
                        <span className="text-foreground">{item.label}</span>
                      </div>
                      <i className="fas fa-chevron-right text-muted-foreground"></i>
                    </a>
                  );
                } else {
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={item.action}
                      className="w-full justify-between p-3 h-auto"
                      data-testid={`button-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="flex items-center space-x-3">
                        <i className={`${item.icon} text-muted-foreground`}></i>
                        <span className="text-foreground">{item.label}</span>
                      </div>
                      <i className="fas fa-chevron-right text-muted-foreground"></i>
                    </Button>
                  );
                }
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button 
          onClick={handleSignOut}
          variant="destructive"
          className="w-full font-semibold py-4 h-auto"
          data-testid="button-sign-out"
        >
          Sign Out
        </Button>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveProfile)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your first name" 
                        data-testid="input-first-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your last name" 
                        data-testid="input-last-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birthday</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        max={new Date().toISOString().split('T')[0]}
                        data-testid="input-profile-birthday"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Your birthday will only be visible to groups where you choose to share it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleCancelEdit}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Account Settings Modal */}
      <AccountSettingsModal 
        open={showAccountSettings} 
        onOpenChange={setShowAccountSettings} 
      />
    </div>
  );
}
