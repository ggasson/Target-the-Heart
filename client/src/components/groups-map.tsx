import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Group } from "@shared/schema";

interface GroupsMapProps {
  onGroupSelect?: (group: Group) => void;
  selectedGroupId?: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

export default function GroupsMap({ onGroupSelect, selectedGroupId }: GroupsMapProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapViewCenter, setMapViewCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Center of US
  const [zoomLevel, setZoomLevel] = useState(4);
  const mapRef = useRef<HTMLDivElement>(null);

  // Fetch all public groups with location data
  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups/public"],
  });

  // Filter groups that have location data
  const groupsWithLocation = groups.filter(group => 
    group.latitude && group.longitude && 
    Number(group.latitude) !== 0 && Number(group.longitude) !== 0
  );

  useEffect(() => {
    // If user has location in profile, use it
    if ((user as any)?.latitude && (user as any)?.longitude) {
      setUserLocation({
        latitude: Number((user as any).latitude),
        longitude: Number((user as any).longitude),
      });
      setMapViewCenter({
        lat: Number((user as any).latitude),
        lng: Number((user as any).longitude),
      });
      setZoomLevel(10);
    }
  }, [user]);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Available",
        description: "Your device doesn't support GPS location",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        
        setUserLocation(location);
        setMapViewCenter({
          lat: location.latitude,
          lng: location.longitude,
        });
        setZoomLevel(12);
        
        toast({
          title: "Location Found",
          description: "Map centered on your location",
        });
        
        setIsGettingLocation(false);
      },
      (error) => {
        let message = "Could not get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        
        toast({
          title: "GPS Error",
          description: message,
          variant: "destructive",
        });
        
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  };

  const groupsWithDistance = userLocation 
    ? groupsWithLocation.map(group => ({
        ...group,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          Number(group.latitude),
          Number(group.longitude)
        )
      })).sort((a, b) => a.distance - b.distance)
    : groupsWithLocation;

  const centerOnGroup = (group: Group) => {
    if (group.latitude && group.longitude) {
      setMapViewCenter({
        lat: Number(group.latitude),
        lng: Number(group.longitude),
      });
      setZoomLevel(14);
      onGroupSelect?.(group);
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Prayer Groups Map</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="flex items-center space-x-2"
          data-testid="button-center-on-me"
        >
          <i className={`fas ${isGettingLocation ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'}`}></i>
          <span>{isGettingLocation ? 'Finding...' : 'Center on Me'}</span>
        </Button>
      </div>

      {/* Simple Map Visualization */}
      <Card className="relative">
        <CardContent className="p-0">
          <div 
            ref={mapRef}
            className="h-96 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 relative overflow-hidden rounded-lg"
            data-testid="groups-map-container"
          >
            {/* Map Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>

            {/* Center Crosshairs */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground">
              <i className="fas fa-crosshairs text-2xl"></i>
            </div>

            {/* User Location Indicator */}
            {userLocation && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
              </div>
            )}

            {/* Map Legend */}
            <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
              <div className="text-sm font-medium mb-2">Legend</div>
              <div className="space-y-1 text-xs">
                {userLocation && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Your Location</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Prayer Groups</span>
                </div>
              </div>
            </div>

            {/* Map Info */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg">
              <div className="text-xs text-muted-foreground">
                <div>Center: {mapViewCenter.lat.toFixed(4)}, {mapViewCenter.lng.toFixed(4)}</div>
                <div>Zoom: {zoomLevel}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Prayer Groups ({groupsWithLocation.length})</span>
            {userLocation && (
              <Badge variant="outline">
                Sorted by distance
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupsWithLocation.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-map-marker-alt text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">No groups with location data found</p>
              <p className="text-sm text-muted-foreground">Encourage group admins to add location information</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupsWithDistance.map((group) => (
                <div
                  key={group.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedGroupId === group.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => centerOnGroup(group)}
                  data-testid={`group-map-item-${group.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{group.name}</h4>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        {group.meetingDay && group.meetingTime && (
                          <span>
                            <i className="fas fa-calendar mr-1"></i>
                            {group.meetingDay} {group.meetingTime}
                          </span>
                        )}
                        
                        {group.meetingLocation && (
                          <span>
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {group.meetingLocation}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {'distance' in group && (
                        <div className="text-sm font-medium text-primary">
                          {group.distance.toFixed(1)} mi
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          centerOnGroup(group);
                        }}
                        data-testid={`button-view-group-${group.id}`}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}