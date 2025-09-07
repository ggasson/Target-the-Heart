import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const { user } = useAuth();

  const handleSignOut = () => {
    window.location.href = "/api/logout";
  };

  const profileMenuItems = [
    {
      icon: "fas fa-user",
      label: "Edit Profile",
      action: () => console.log("Edit profile"),
    },
    {
      icon: "fas fa-bell",
      label: "Notifications",
      action: () => console.log("Notifications"),
    },
    {
      icon: "fas fa-lock",
      label: "Privacy & Security",
      action: () => console.log("Privacy & Security"),
    },
  ];

  const supportMenuItems = [
    {
      icon: "fas fa-question-circle",
      label: "Help Center",
      action: () => console.log("Help Center"),
    },
    {
      icon: "fas fa-envelope",
      label: "Contact Us",
      action: () => console.log("Contact Us"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="gradient-bg px-6 py-8 pb-16">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
                data-testid="img-profile-avatar"
              />
            ) : (
              <i className="fas fa-user text-3xl text-white"></i>
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-1" data-testid="text-user-name">
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.email?.split('@')[0] || 'User'
            }
          </h2>
          <p className="text-white/80" data-testid="text-user-email">
            {user?.email}
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
              {supportMenuItems.map((item, index) => (
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
              ))}
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
