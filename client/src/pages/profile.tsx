import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProfileProps {
  onBack?: () => void;
}

export default function Profile({ onBack }: ProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const handleSignOut = () => {
    window.location.href = "/api/logout";
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    toast({
      title: "Edit Profile",
      description: "Profile editing feature coming soon!",
    });
  };

  const handleNotifications = () => {
    toast({
      title: "Notifications",
      description: "Notification settings coming soon!",
    });
  };

  const handlePrivacySecurity = () => {
    toast({
      title: "Privacy & Security",
      description: "Privacy and security settings coming soon!",
    });
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
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
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
          </div>
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
    </div>
  );
}
