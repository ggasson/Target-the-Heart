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
      console.log('🚀 ============================================');
      console.log('📸 FRONTEND: STARTING PHOTO UPLOAD PROCESS');
      console.log('🚀 ============================================');
      console.log('📸 Timestamp:', new Date().toISOString());
      console.log('📸 File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        lastModifiedDate: new Date(file.lastModified).toISOString()
      });
      
      console.log('📦 Creating FormData object...');
      const formData = new FormData();
      formData.append('photo', file);
      
      // Debug FormData creation
      console.log('📦 FormData created successfully');
      console.log('📦 FormData has photo:', formData.has('photo'));
      console.log('📦 FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`📦   ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }
      
      console.log('🔐 Getting authentication token...');
      // Get the auth token properly
      const token = await getToken();
      if (!token) {
        console.error('❌ No authentication token available');
        throw new Error('Authentication required');
      }
      console.log('✅ Authentication token obtained (length:', token.length, ')');
      console.log('🔍 Token preview:', token.substring(0, 20) + '...');
      
      console.log('🌐 =========================================');
      console.log('🌐 MAKING HTTP REQUEST TO SERVER');
      console.log('🌐 =========================================');
      console.log('🌐 URL: /api/users/me/photo');
      console.log('🌐 Method: POST');
      console.log('🌐 Headers: Authorization Bearer token');
      console.log('🌐 Body: FormData with photo file');
      
      // Use fetch directly for file uploads (FormData needs special handling)
      const response = await fetch('/api/users/me/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for multipart/form-data
        },
        body: formData,
      });
      
      console.log('📡 =========================================');
      console.log('📡 SERVER RESPONSE RECEIVED');
      console.log('📡 =========================================');
      console.log('📡 Response status:', response.status);
      console.log('📡 Response status text:', response.statusText);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:');
      response.headers.forEach((value, key) => {
        console.log(`📡   ${key}: ${value}`);
      });
      
      if (!response.ok) {
        console.error('❌ =====================================');
        console.error('❌ UPLOAD FAILED - SERVER ERROR');
        console.error('❌ =====================================');
        console.error('❌ Status:', response.status);
        console.error('❌ Status text:', response.statusText);
        
        let errorText;
        try {
          errorText = await response.text();
          console.error('❌ Error response body:', errorText);
          
          // Try to parse as JSON for more details
          try {
            const errorJson = JSON.parse(errorText);
            console.error('❌ Parsed error JSON:', errorJson);
          } catch (parseError) {
            console.error('❌ Error response is not JSON');
          }
        } catch (textError) {
          console.error('❌ Could not read error response:', textError);
          errorText = 'Unknown server error';
        }
        
        throw new Error(errorText || 'Failed to upload photo');
      }
      
      console.log('✅ =========================================');
      console.log('✅ UPLOAD SUCCESSFUL - PARSING RESPONSE');
      console.log('✅ =========================================');
      
      let result;
      try {
        result = await response.json();
        console.log('✅ Response parsed successfully:', {
          message: result.message,
          hasImageUrl: !!result.imageUrl,
          imageUrlLength: result.imageUrl?.length,
          debug: result.debug
        });
        console.log('✅ Full result object keys:', Object.keys(result));
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        throw new Error('Server returned invalid JSON response');
      }
      
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
    console.log('🎬 ==========================================');
    console.log('🎬 FRONTEND: FILE INPUT CHANGE EVENT');
    console.log('🎬 ==========================================');
    console.log('🎬 Event timestamp:', new Date().toISOString());
    console.log('🎬 Event target:', event.target);
    console.log('🎬 Files length:', event.target.files?.length);
    console.log('🎬 FileList object:', event.target.files);
    
    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ No file selected from input');
      console.log('❌ files array:', event.target.files);
      console.log('❌ files[0]:', event.target.files?.[0]);
      return;
    }

    console.log('✅ File successfully selected from input');
    console.log('✅ File object:', file);
    console.log('✅ File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      lastModifiedDate: new Date(file.lastModified).toISOString(),
      webkitRelativePath: (file as any).webkitRelativePath || 'N/A'
    });

    console.log('🔍 Starting file validation...');
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    console.log('🔍 File type:', file.type);
    console.log('🔍 Allowed types:', allowedTypes);
    console.log('🔍 Type check result:', allowedTypes.includes(file.type));
    
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type detected:', file.type);
      toast({
        title: "Invalid File Type",
        description: "Please select a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }
    console.log('✅ File type validation passed');

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    console.log('🔍 File size:', file.size, 'bytes');
    console.log('🔍 Max size:', maxSize, 'bytes');
    console.log('🔍 Size check result:', file.size <= maxSize);
    
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size, 'bytes (max:', maxSize, ')');
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }
    console.log('✅ File size validation passed');

    console.log('🚀 All validations passed, initiating upload process');
    console.log('🚀 Setting upload state to true...');
    setIsUploadingPhoto(true);
    
    try {
      console.log('🚀 Calling uploadPhotoMutation.mutateAsync...');
      const result = await uploadPhotoMutation.mutateAsync(file);
      console.log('✅ Upload completed successfully:', result);
    } catch (error) {
      console.error('❌ =====================================');
      console.error('❌ UPLOAD PROCESS FAILED');
      console.error('❌ =====================================');
      console.error('❌ Error object:', error);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    } finally {
      console.log('🔄 Cleanup: Setting upload state to false');
      setIsUploadingPhoto(false);
      
      // Reset file input
      if (fileInputRef.current) {
        console.log('🔄 Cleanup: Clearing file input value');
        fileInputRef.current.value = '';
      } else {
        console.log('❌ Cleanup: File input ref is null');
      }
      
      console.log('✅ Cleanup completed');
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
            {(() => {
              const profileImageUrl = (user as any)?.profileImageUrl;
              const firstName = (user as any)?.firstName || '';
              const lastName = (user as any)?.lastName || '';
              
              // Generate initials for avatar
              const getInitials = () => {
                const firstInitial = firstName.charAt(0).toUpperCase();
                const lastInitial = lastName.charAt(0).toUpperCase();
                return firstInitial + lastInitial || firstName.charAt(0).toUpperCase() || 'U';
              };
              
              // Generate a consistent color based on user name
              const getAvatarColor = () => {
                const name = firstName + lastName;
                const colors = [
                  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
                  'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
                ];
                const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
                return colors[index];
              };
              
              // For Google users, show a nice initials avatar since Google images can't be loaded cross-origin
              const isGooglePhoto = profileImageUrl && profileImageUrl.includes('googleusercontent.com');
              
              if (isGooglePhoto || !profileImageUrl) {
                // Show initials avatar for Google users or users without profile images
                return (
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-white font-semibold text-lg ${getAvatarColor()}`}>
                    {getInitials()}
                  </div>
                );
              } else {
                // For custom uploaded images (email users), try to load the image
                return (
                  <img 
                    src={profileImageUrl} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                    data-testid="img-profile-avatar"
                    onError={() => {
                      // If custom image fails, fall back to initials
                      const target = event?.target as HTMLImageElement;
                      if (target) {
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full rounded-full flex items-center justify-center text-white font-semibold text-lg ${getAvatarColor()}">${getInitials()}</div>`;
                        }
                      }
                    }}
                  />
                );
              }
            })()}
            
            {/* Photo Upload Button - only show for users without Google profile photos */}
            {(() => {
              const profileImageUrl = (user as any)?.profileImageUrl;
              const isGooglePhoto = profileImageUrl && profileImageUrl.includes('googleusercontent.com');
              
              // Only show upload button for users without Google photos (i.e., email-only registrations)
              if (!isGooglePhoto) {
                return (
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
                );
              }
              return null;
            })()}
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
