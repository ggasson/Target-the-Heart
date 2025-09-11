import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Group } from "@shared/schema";
import L from "leaflet";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Fetch all public groups with location data
  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups/public"],
  });

  // Filter groups that have location data
  const groupsWithLocation = groups.filter(group => 
    group.latitude && group.longitude && 
    Number(group.latitude) !== 0 && Number(group.longitude) !== 0
  );

  // Initialize the map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(
        [mapViewCenter.lat, mapViewCenter.lng],
        zoomLevel
      );

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map view when center or zoom changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([mapViewCenter.lat, mapViewCenter.lng], zoomLevel);
    }
  }, [mapViewCenter, zoomLevel]);

  // Load user location from profile
  useEffect(() => {
    if ((user as any)?.latitude && (user as any)?.longitude) {
      const location = {
        latitude: Number((user as any).latitude),
        longitude: Number((user as any).longitude),
      };
      setUserLocation(location);
      setMapViewCenter({
        lat: location.latitude,
        lng: location.longitude,
      });
      setZoomLevel(10);
    }
  }, [user]);

  // Update user marker when location changes
  useEffect(() => {
    if (mapInstanceRef.current && userLocation) {
      // Remove existing user marker
      if (userMarkerRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
      }

      // Create blue user location icon
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: '<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      // Add user marker
      userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup('Your Location');
    }
  }, [userLocation]);

  // Update group markers when groups data changes
  useEffect(() => {
    if (mapInstanceRef.current && groupsWithLocation.length > 0) {
      // Clear existing markers
      Object.values(markersRef.current).forEach(marker => {
        mapInstanceRef.current!.removeLayer(marker);
      });
      markersRef.current = {};

      // Add markers for each group
      groupsWithLocation.forEach(group => {
        if (group.latitude && group.longitude) {
          // Create custom icon for prayer groups
          const groupIcon = L.divIcon({
            className: 'custom-group-marker',
            html: `<div style="width: 24px; height: 24px; background: hsl(var(--primary)); border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">⛪</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          // Create popup content safely using DOM elements
          const popupContainer = document.createElement('div');
          popupContainer.style.minWidth = '200px';
          
          const title = document.createElement('h3');
          title.style.cssText = 'margin: 0 0 8px 0; font-weight: bold;';
          title.textContent = group.name;
          popupContainer.appendChild(title);
          
          if (group.description) {
            const description = document.createElement('p');
            description.style.cssText = 'margin: 0 0 8px 0; font-size: 14px; color: #666;';
            description.textContent = group.description;
            popupContainer.appendChild(description);
          }
          
          if (group.meetingDay && group.meetingTime) {
            const meetingTime = document.createElement('p');
            meetingTime.style.cssText = 'margin: 0 0 4px 0; font-size: 12px;';
            const meetingBold = document.createElement('strong');
            meetingBold.textContent = `📅 ${group.meetingDay} ${group.meetingTime}`;
            meetingTime.appendChild(meetingBold);
            popupContainer.appendChild(meetingTime);
          }
          
          if (group.meetingLocation) {
            const location = document.createElement('p');
            location.style.cssText = 'margin: 0; font-size: 12px;';
            const locationBold = document.createElement('strong');
            locationBold.textContent = `📍 ${group.meetingLocation}`;
            location.appendChild(locationBold);
            popupContainer.appendChild(location);
          }

          const marker = L.marker([Number(group.latitude), Number(group.longitude)], {
            icon: groupIcon,
          })
            .addTo(mapInstanceRef.current!)
            .bindPopup(popupContainer);

          // Add click event to select group
          marker.on('click', () => {
            onGroupSelect?.(group);
          });

          markersRef.current[group.id] = marker;
        }
      });
    }
  }, [groupsWithLocation, onGroupSelect]);

  // Highlight selected group
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([groupId, marker]) => {
      if (groupId === selectedGroupId) {
        marker.openPopup();
      }
    });
  }, [selectedGroupId]);

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
      
      // Open the popup for this group
      const marker = markersRef.current[group.id];
      if (marker) {
        marker.openPopup();
      }
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

      {/* Interactive OpenStreetMap */}
      <Card className="relative">
        <CardContent className="p-0">
          <div 
            ref={mapRef}
            className="h-96 rounded-lg overflow-hidden"
            data-testid="groups-map-container"
          />
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