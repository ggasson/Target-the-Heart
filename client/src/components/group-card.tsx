import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface GroupCardProps {
  group: any;
  isMember: boolean;
  onJoinRequest?: () => void;
  onManageGroup?: () => void;
}

export default function GroupCard({ group, isMember, onJoinRequest, onManageGroup }: GroupCardProps) {
  const { user } = useAuth();
  const getStatusColor = (isPublic: boolean) => {
    return isPublic 
      ? "bg-accent/10 text-accent"
      : "bg-orange-100 text-orange-600";
  };

  const getStatusText = (isPublic: boolean) => {
    return isPublic ? "Open" : "Private";
  };

  const isAdmin = user?.id === group.adminId;

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isMember ? "bg-primary/10" : "bg-secondary/10"
            }`}>
              <i className={`${
                isMember ? "fas fa-church text-primary" : "fas fa-users text-secondary"
              }`}></i>
            </div>
            <div>
              <h4 className="font-medium text-foreground" data-testid={`text-group-name-${group.id}`}>
                {group.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {/* Member count would need to be fetched separately */}
                Group
              </p>
            </div>
          </div>
          <Badge 
            className={`text-xs px-2 py-1 font-medium ${getStatusColor(group.isPublic)}`}
            data-testid={`badge-group-status-${group.id}`}
          >
            {isMember ? "Active" : getStatusText(group.isPublic)}
          </Badge>
        </div>

        {group.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {group.description}
          </p>
        )}

        {group.meetingDay && group.meetingTime && (
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <i className="fas fa-calendar-alt mr-2"></i>
            <span data-testid={`text-group-schedule-${group.id}`}>
              Every {group.meetingDay}, {group.meetingTime}
            </span>
          </div>
        )}

        {group.meetingLocation && (
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <i className="fas fa-map-marker-alt mr-2"></i>
            <span data-testid={`text-group-location-${group.id}`}>
              {group.meetingLocation}
            </span>
          </div>
        )}

        {group.location && !isMember && (
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <i className="fas fa-map-marker-alt mr-2"></i>
            <span data-testid={`text-group-distance-${group.id}`}>
              {group.location}
            </span>
          </div>
        )}

        <div className="flex space-x-2">
          {isMember ? (
            <>
              <Button 
                className="flex-1"
                data-testid={`button-group-chat-${group.id}`}
              >
                <i className="fas fa-comments mr-2"></i>
                Chat
              </Button>
              {isAdmin ? (
                <Button 
                  variant="outline"
                  onClick={onManageGroup}
                  className="flex-1"
                  data-testid={`button-manage-group-${group.id}`}
                >
                  <i className="fas fa-cog mr-2"></i>
                  Manage
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  className="flex-1"
                  data-testid={`button-group-details-${group.id}`}
                >
                  <i className="fas fa-info-circle mr-2"></i>
                  Details
                </Button>
              )}
            </>
          ) : (
            <Button 
              onClick={onJoinRequest}
              className="w-full"
              data-testid={`button-request-join-${group.id}`}
            >
              Request to Join
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
