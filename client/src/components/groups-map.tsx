import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Group } from "@shared/schema";

interface GroupsMapProps {
  onGroupSelect?: (group: Group) => void;
  selectedGroupId?: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

function GroupsMapContent({ onGroupSelect, selectedGroupId }: GroupsMapProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Center of US
  const [mapZoom, setMapZoom] = useState(4);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [hasAttemptedLocation, setHasAttemptedLocation] = useState(false);

  // Fetch all public groups with location data
  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups/public"],
  });

  // Filter groups that have location data
  const groupsWithLocation = groups.filter(group => 
    group.latitude && group.longitude && 
    Number(group.latitude) !== 0 && Number(group.longitude) !== 0
  );

  // Load user location from profile or automatically get current location
  useEffect(() => {
    if ((user as any)?.latitude && (user as any)?.longitude) {
      const location = {
        latitude: Number((user as any).latitude),
        longitude: Number((user as any).longitude),
      };
      setUserLocation(location);
      setMapCenter({
        lat: location.latitude,
        lng: location.longitude,
      });
      setMapZoom(10);
      setHasAttemptedLocation(true);
    } else if (!hasAttemptedLocation && !isGettingLocation) {
      // Automatically get current location when map loads for the first time
      getCurrentLocation();
    }
  }, [user, hasAttemptedLocation, isGettingLocation]);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setHasAttemptedLocation(true); // Mark that we've attempted to get location
    
    // Check HTTPS requirement
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      toast({
        title: "HTTPS Required",
        description: "GPS location requires a secure connection. Please use HTTPS.",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }
    
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Available",
        description: "Your device doesn't support GPS location",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    // Manual timeout fallback to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      setIsGettingLocation(false);
      toast({
        title: "GPS Timeout",
        description: "Location request is taking too long. Try refreshing the page and checking browser permissions.",
        variant: "destructive",
      });
    }, 20000); // 20 seconds fallback

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(fallbackTimeout);
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        
        setUserLocation(location);
        setMapCenter({
          lat: location.latitude,
          lng: location.longitude,
        });
        setMapZoom(12);
        
        // Save location to user profile
        apiRequest("POST", "/api/auth/location", {
          latitude: location.latitude,
          longitude: location.longitude,
          location: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
        }).catch(error => {
          console.error("Failed to save location:", error);
        });
        
        toast({
          title: "Location Found",
          description: "Map centered on your location",
        });
        
        setIsGettingLocation(false);
      },
      (error) => {
        clearTimeout(fallbackTimeout);
        let message = "Could not get your location";
        let extendedMessage = "";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied";
            extendedMessage = "Please enable location permissions in your browser settings and refresh the page.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable";
            extendedMessage = "GPS signal may be weak or unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out";
            extendedMessage = "Try again or check your internet connection.";
            break;
        }
        
        toast({
          title: "GPS Error",
          description: `${message}. ${extendedMessage}`,
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

  const centerOnGroup = useCallback((group: Group) => {
    if (group.latitude && group.longitude) {
      setMapCenter({
        lat: Number(group.latitude),
        lng: Number(group.longitude),
      });
      setMapZoom(14);
      onGroupSelect?.(group);
      setSelectedGroup(group);
    }
  }, [onGroupSelect]);

  const handleMarkerClick = useCallback((group: Group) => {
    setSelectedGroup(group);
    onGroupSelect?.(group);
  }, [onGroupSelect]);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedGroup(null);
  }, []);

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
          {isGettingLocation ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-location-crosshairs"></i>
          )}
          <span>{isGettingLocation ? 'Finding...' : 'Center on Me'}</span>
        </Button>
      </div>

      {/* Google Map */}
      <Card className="relative">
        <CardContent className="p-0">
          <div className="h-96 rounded-lg overflow-hidden" data-testid="groups-map-container">
            <Map
              center={mapCenter}
              zoom={mapZoom}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              disableDefaultUI={false}
              clickableIcons={false}
            >
              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                    scale: 10,
                  }}
                  title="Your Location"
                />
              )}

              {/* Group Markers */}
              {groupsWithLocation.map((group) => (
                <Marker
                  key={group.id}
                  position={{ lat: Number(group.latitude), lng: Number(group.longitude) }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: 'hsl(var(--primary))',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                    scale: 12,
                  }}
                  title={group.name}
                  onClick={() => handleMarkerClick(group)}
                />
              ))}

              {/* Info Window for Selected Group */}
              {selectedGroup && (
                <InfoWindow
                  position={{ lat: Number(selectedGroup.latitude), lng: Number(selectedGroup.longitude) }}
                  onCloseClick={handleInfoWindowClose}
                >
                  <div className="p-2 max-w-xs">
                    <h4 className="font-medium text-foreground mb-1">{selectedGroup.name}</h4>
                    {selectedGroup.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {selectedGroup.description}
                      </p>
                    )}
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {selectedGroup.meetingDay && selectedGroup.meetingTime && (
                        <div className="flex items-center">
                          <i className="fas fa-calendar mr-1"></i>
                          {selectedGroup.meetingDay} {selectedGroup.meetingTime}
                        </div>
                      )}
                      
                      {selectedGroup.meetingLocation && (
                        <div className="flex items-center">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          {selectedGroup.meetingLocation}
                        </div>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
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
                      {'distance' in group && typeof group.distance === 'number' && (
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

export default function GroupsMap({ onGroupSelect, selectedGroupId }: GroupsMapProps) {
  // Get Google Maps API key from environment
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-muted-foreground mb-4"></i>
          <p className="text-muted-foreground">Google Maps API key not configured</p>
          <p className="text-sm text-muted-foreground">
            Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <GroupsMapContent onGroupSelect={onGroupSelect} selectedGroupId={selectedGroupId} />
    </APIProvider>
  );
}