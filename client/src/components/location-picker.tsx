import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface LocationPickerProps {
  onLocationChange: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  initialLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  label?: string;
}

export default function LocationPicker({
  onLocationChange,
  initialLocation,
  label = "Group Location"
}: LocationPickerProps) {
  const { toast } = useToast();
  const [location, setLocation] = useState({
    latitude: initialLocation?.latitude || null as number | null,
    longitude: initialLocation?.longitude || null as number | null,
    address: initialLocation?.address || "",
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState(initialLocation?.address || "");

  useEffect(() => {
    if (location.latitude && location.longitude && location.address) {
      onLocationChange({
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      });
    }
  }, [location, onLocationChange]);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
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
        description: "Location request is taking too long. Try again or check browser permissions.",
        variant: "destructive",
      });
    }, 20000); // 20 seconds fallback

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(fallbackTimeout);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          // Use reverse geocoding to get address
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw&types=address`
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            
            setLocation({
              latitude: lat,
              longitude: lng,
              address: address,
            });
            setManualAddress(address);
            
            toast({
              title: "Location Found",
              description: "GPS location captured successfully",
            });
          } else {
            // Fallback to coordinates if geocoding fails
            const address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setLocation({
              latitude: lat,
              longitude: lng,
              address: address,
            });
            setManualAddress(address);
            
            toast({
              title: "Location Found",
              description: "GPS coordinates captured (address lookup unavailable)",
            });
          }
        } catch (error) {
          // Fallback to coordinates
          const address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setLocation({
            latitude: lat,
            longitude: lng,
            address: address,
          });
          setManualAddress(address);
          
          toast({
            title: "Location Found",
            description: "GPS coordinates captured",
          });
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        clearTimeout(fallbackTimeout);
        let message = "Could not get your location";
        let extendedMessage = "";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied";
            extendedMessage = "Please enable location permissions in your browser settings and try again.";
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

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;
    
    try {
      setIsGettingLocation(true);
      
      // Try to geocode the address using a public API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const feature = data.features[0];
        
        if (feature) {
          const [lng, lat] = feature.center;
          
          setLocation({
            latitude: lat,
            longitude: lng,
            address: feature.place_name,
          });
          
          toast({
            title: "Address Found",
            description: "Location coordinates found for this address",
          });
        } else {
          toast({
            title: "Address Not Found",
            description: "Could not find coordinates for this address",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Address Lookup Failed",
          description: "Could not verify this address",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Address Lookup Error",
        description: "Error looking up address coordinates",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setManualAddress(value);
    
    // If manually typing, update the location with just the address
    setLocation(prev => ({
      ...prev,
      address: value,
    }));
  };

  const handleAddressKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      geocodeAddress(manualAddress);
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="location">{label}</Label>
      
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* GPS Button */}
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center space-x-2"
              data-testid="button-get-gps-location"
            >
              <i className={`fas ${isGettingLocation ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'}`}></i>
              <span>{isGettingLocation ? 'Getting Location...' : 'Use My GPS Location'}</span>
            </Button>
            
            {location.latitude && location.longitude && (
              <div className="text-sm text-muted-foreground">
                <i className="fas fa-check-circle text-green-500 mr-1"></i>
                Location set
              </div>
            )}
          </div>
          
          {/* Manual Address Input */}
          <div className="space-y-2">
            <Label htmlFor="manual-address" className="text-sm">Or enter address manually:</Label>
            <div className="flex space-x-2">
              <Input
                id="manual-address"
                value={manualAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                onKeyPress={handleAddressKeyPress}
                placeholder="Enter group meeting address..."
                className="flex-1"
                data-testid="input-manual-address"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => geocodeAddress(manualAddress)}
                disabled={isGettingLocation || !manualAddress.trim()}
                data-testid="button-lookup-address"
              >
                <i className="fas fa-search"></i>
              </Button>
            </div>
          </div>
          
          {/* Location Display */}
          {location.latitude && location.longitude && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div>
                  <strong>Address:</strong> {location.address}
                </div>
                <div className="text-muted-foreground">
                  <strong>Coordinates:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </div>
              </div>
            </div>
          )}
          
          {/* Helpful Text */}
          <div className="text-xs text-muted-foreground">
            <i className="fas fa-info-circle mr-1"></i>
            Location helps other members find your group and see nearby prayer communities.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}