import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface GroupCardProps {
  group: any;
  isMember: boolean;
  onJoinRequest?: () => void;
  onManageGroup?: () => void;
  onChatGroup?: () => void;
}

export default function GroupCard({ group, isMember, onJoinRequest, onManageGroup, onChatGroup }: GroupCardProps) {
  const { user } = useAuth();
  const getStatusColor = (isPublic: boolean) => {
    return isPublic 
      ? "bg-accent/10 text-accent"
      : "bg-orange-100 text-orange-600";
  };

  const getStatusText = (isPublic: boolean) => {
    return isPublic ? "Open" : "Private";
  };

  const getAudienceDisplay = (audience: string) => {
    switch (audience) {
      case "men_only": return "Men Only";
      case "women_only": return "Women Only";  
      case "coed": return "Everyone";
      default: return "Everyone";
    }
  };

  const getPurposeDisplay = (purpose: string) => {
    switch (purpose) {
      case "prayer": return "Prayer & Worship";
      case "bible_study": return "Bible Study";
      case "fellowship": return "Fellowship";
      case "youth": return "Youth";
      case "marriage_couples": return "Marriage & Couples";
      case "recovery_healing": return "Recovery & Healing";
      case "outreach_service": return "Outreach & Service";
      case "other": return "Other";
      default: return "Prayer & Worship";
    }
  };

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case "men_only": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200";
      case "women_only": return "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200";
      case "coed": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
      default: return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
    }
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case "prayer": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200";
      case "bible_study": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200";
      case "fellowship": return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200";
      case "youth": return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200";
      case "marriage_couples": return "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200";
      case "recovery_healing": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200";
      case "outreach_service": return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200";
      default: return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200";
    }
  };

  const isAdmin = (user as any)?.id === group.adminId;

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

        {/* Group Characteristics Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {group.audience && (
            <Badge 
              className={`text-xs ${getAudienceColor(group.audience)}`}
              data-testid={`badge-group-audience-${group.id}`}
            >
              {getAudienceDisplay(group.audience)}
            </Badge>
          )}
          {group.purpose && (
            <Badge 
              className={`text-xs ${getPurposeColor(group.purpose)}`}
              data-testid={`badge-group-purpose-${group.id}`}
            >
              {getPurposeDisplay(group.purpose)}
            </Badge>
          )}
        </div>

        {group.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {group.description}
          </p>
        )}

        {group.purposeTagline && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-3 italic" data-testid={`text-group-tagline-${group.id}`}>
            "{group.purposeTagline}"
          </p>
        )}

        {group.meetingDay && group.meetingTime && (
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <i className="fas fa-calendar-alt mr-2"></i>
            <span data-testid={`text-group-schedule-${group.id}`}>
              <span className="font-medium">Default Schedule:</span> Every {group.meetingDay}, {group.meetingTime}
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
            <span data-testid={`text-group-location-${group.id}`}>
              {group.location}
              {group.distance && (
                <span className="ml-2 text-accent">
                  ({group.distance.toFixed(1)} miles away)
                </span>
              )}
            </span>
          </div>
        )}

        <div className="flex space-x-2">
          {isMember ? (
            <>
              <Button 
                className="flex-1"
                onClick={onChatGroup}
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
