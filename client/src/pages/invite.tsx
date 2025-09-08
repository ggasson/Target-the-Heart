import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

export default function InvitePage() {
  const { token } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [hasJoined, setHasJoined] = useState(false);

  // Fetch invitation details
  const { data: invitation, isLoading, error } = useQuery<any>({
    queryKey: ["/api/invitations", token],
    enabled: !!token && !!user,
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/invitations/${token}/accept`, {});
      return response;
    },
    onSuccess: (data) => {
      setHasJoined(true);
      toast({
        title: "Welcome to the group!",
        description: "You have successfully joined the prayer group.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to join group";
      toast({
        title: "Unable to join group",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Handle login redirect
  if (authLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
              <p className="text-muted-foreground">Please wait while we verify your account.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-2xl text-primary"></i>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Join Prayer Group</h2>
              <p className="text-muted-foreground mb-6">
                You need to sign in to join this prayer group.
              </p>
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="w-full"
                data-testid="button-login"
              >
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Loading Invitation...</h2>
              <p className="text-muted-foreground">Please wait while we load the group details.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl text-destructive"></i>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Invalid Invitation</h2>
              <p className="text-muted-foreground mb-6">
                This invitation link is either invalid, expired, or has reached its usage limit.
              </p>
              <Button 
                onClick={() => window.location.href = "/"}
                variant="outline"
                className="w-full"
                data-testid="button-go-home"
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasJoined) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-2xl text-green-600"></i>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Welcome!</h2>
              <p className="text-muted-foreground mb-6">
                You have successfully joined <strong>{invitation?.group?.name}</strong>.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = "/groups"}
                  className="w-full"
                  data-testid="button-view-groups"
                >
                  View My Groups
                </Button>
                <Button 
                  onClick={() => window.location.href = "/"}
                  variant="outline"
                  className="w-full"
                  data-testid="button-go-home-success"
                >
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-2xl text-primary"></i>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Join Prayer Group
              </h2>
              <p className="text-muted-foreground">
                You've been invited to join a prayer community
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-lg">
                    {invitation?.group?.name}
                  </h3>
                  <Badge variant={invitation?.group?.isPublic ? "default" : "secondary"}>
                    {invitation?.group?.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                
                {invitation?.group?.description && (
                  <p className="text-muted-foreground mb-3 text-sm">
                    {invitation.group.description}
                  </p>
                )}

                {invitation?.group?.meetingDay && invitation?.group?.meetingTime && (
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <i className="fas fa-calendar-alt mr-2"></i>
                    <span>Every {invitation.group.meetingDay}, {invitation.group.meetingTime}</span>
                  </div>
                )}

                {invitation?.group?.meetingLocation && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    <span>{invitation.group.meetingLocation}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-muted-foreground">
                <p>
                  You are about to join this prayer group
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => acceptInvitationMutation.mutate()}
                disabled={acceptInvitationMutation.isPending}
                className="w-full"
                data-testid="button-accept-invitation"
              >
                {acceptInvitationMutation.isPending ? "Joining..." : "Join This Group"}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = "/"}
                className="w-full"
                data-testid="button-decline-invitation"
              >
                Maybe Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}