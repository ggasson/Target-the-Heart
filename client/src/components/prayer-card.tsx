import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PrayerCardProps {
  prayer: any;
  currentUserId?: string;
  onPrayerResponse: (prayerId: string, action: 'add' | 'remove') => void;
  onMarkAnswered?: (prayerId: string) => void;
  onDeletePrayer?: (prayerId: string) => void;
}

export default function PrayerCard({ prayer, currentUserId, onPrayerResponse, onMarkAnswered, onDeletePrayer }: PrayerCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "urgent":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-accent/10 text-accent";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "health_healing":
        return "fas fa-heartbeat";
      case "family_relationships":
        return "fas fa-users";
      case "work_career":
        return "fas fa-briefcase";
      case "spiritual_growth":
        return "fas fa-cross";
      case "financial_provision":
        return "fas fa-dollar-sign";
      default:
        return "target-symbol";
    }
  };

  const isAuthor = currentUserId === prayer.authorId;
  const userHasPrayed = prayer.responses?.some((response: any) => response.userId === currentUserId);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
            {getCategoryIcon(prayer.category) === "target-symbol" ? (
              <img src="/target-symbol.png" alt="Target Symbol" className="w-4 h-4" />
            ) : (
              <i className={`${getCategoryIcon(prayer.category)} text-sm text-primary`}></i>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-foreground" data-testid={`text-prayer-title-${prayer.id}`}>
                {prayer.title}
              </h4>
              <span className="text-xs text-muted-foreground">
                {new Date(prayer.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
              {prayer.description}
            </p>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center text-xs text-muted-foreground">
                <span>{prayer.author?.firstName} {prayer.author?.lastName}</span>
                <span className="mx-2">•</span>
                <span>{prayer.group?.name}</span>
              </div>
              <Badge 
                className={`text-xs px-2 py-1 font-medium ${getStatusColor(prayer.status)}`}
                data-testid={`badge-prayer-status-${prayer.id}`}
              >
                {prayer.isUrgent ? "Urgent" : "Active"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-primary">
                  <i className="fas fa-heart text-red-500 text-xs"></i>
                  <span data-testid={`text-prayer-responses-${prayer.id}`} className="text-sm font-medium">
                    {prayer.responses?.length || 0} praying
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Prayer Response Button */}
                <Button
                  size="sm"
                  onClick={() => onPrayerResponse(prayer.id, userHasPrayed ? 'remove' : 'add')}
                  variant={userHasPrayed ? "outline" : "default"}
                  className="px-3 py-1 text-xs font-medium"
                  data-testid={`button-prayer-response-${prayer.id}`}
                >
                  {userHasPrayed ? "Remove Prayer" : "I'm Praying"}
                </Button>
                
                {/* Author Actions */}
                {isAuthor && onDeletePrayer && (
                  <Button
                    size="sm"
                    onClick={() => onDeletePrayer(prayer.id)}
                    variant="outline"
                    className="px-3 py-1 text-xs font-medium border-red-200 text-red-700 hover:bg-red-50"
                    data-testid={`button-delete-prayer-${prayer.id}`}
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
