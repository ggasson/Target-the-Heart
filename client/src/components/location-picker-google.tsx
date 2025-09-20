import { useState, useEffect, useMemo } from "react";
import { APIProvider, Map, Marker, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface LocationPickerGoogleProps {
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
  required?: boolean;
}

function GeocodingComponent({ onLocationChange, initialLocation, required = false }: {
  onLocationChange: (location: { latitude: number; longitude: number; address: string }) => void;
  initialLocation?: { latitude?: number; longitude?: number; address?: string };
  required?: boolean;
}) {
  const { toast } = useToast();
  const [location, setLocation] = useState({
    latitude: initialLocation?.latitude || null as number | null,
    longitude: initialLocation?.longitude || null as number | null,
    address: initialLocation?.address || "",
  });
  const [manualAddress, setManualAddress] = useState(initialLocation?.address || "");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const geocodingLib = useMapsLibrary('geocoding');
  const placesLib = useMapsLibrary('places');
  
  const geocoder = useMemo(
    () => geocodingLib && new geocodingLib.Geocoder(),
    [geocodingLib]
  );

  const placesService = useMemo(() => {
    if (placesLib) {
      const div = document.createElement('div');
      return new placesLib.PlacesService(div);
    }
    return null;
  }, [placesLib]);

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
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (geocoder) {
          try {
            const response = await geocoder.geocode({ 
              location: { lat, lng }
            });
            
            if (response.results[0]) {
              const address = response.results[0].formatted_address;
              
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
            }
          } catch (error) {
            console.error('Reverse geocoding failed:', error);
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
        }
        
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

  const geocodeAddress = async (address: string) => {
    if (!address.trim() || !geocoder) return;
    
    try {
      setIsGettingLocation(true);
      
      const response = await geocoder.geocode({ address });
      
      if (response.results[0]) {
        const result = response.results[0];
        const lat = result.geometry.location.lat();
        const lng = result.geometry.location.lng();
        
        setLocation({
          latitude: lat,
          longitude: lng,
          address: result.formatted_address,
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
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Address Lookup Error",
        description: "Error looking up address coordinates",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const searchAddresses = async (input: string) => {
    if (!input.trim() || input.length < 3 || !geocoder) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await geocoder.geocode({ 
        address: input,
        componentRestrictions: { country: 'US' }
      });
      
      setAddressSuggestions(response.results.slice(0, 5));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search error:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setManualAddress(value);
    
    // Debounce search
    const timeout = setTimeout(() => searchAddresses(value), 300);
    return () => clearTimeout(timeout);
  };

  const selectSuggestion = (result: any) => {
    const lat = result.geometry.location.lat();
    const lng = result.geometry.location.lng();
    
    setLocation({
      latitude: lat,
      longitude: lng,
      address: result.formatted_address,
    });
    setManualAddress(result.formatted_address);
    setShowSuggestions(false);
  };

  const handleMapClick = async (event: any) => {
    const lat = event.detail.latLng.lat;
    const lng = event.detail.latLng.lng;
    
    if (geocoder) {
      try {
        const response = await geocoder.geocode({ 
          location: { lat, lng }
        });
        
        if (response.results[0]) {
          const address = response.results[0].formatted_address;
          setLocation({
            latitude: lat,
            longitude: lng,
            address: address,
          });
          setManualAddress(address);
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
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
      
      {/* Address Input with Autocomplete */}
      <div className="space-y-2 relative">
        <Label htmlFor="manual-address" className="text-sm">
          Search for address: {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Input
              id="manual-address"
              value={manualAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => manualAddress.length >= 3 && setShowSuggestions(true)}
              placeholder="Enter group meeting address..."
              className="flex-1"
              data-testid="input-manual-address"
            />
            
            {/* Address Suggestions */}
            {showSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute z-50 w-full bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                {addressSuggestions.map((result, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-muted cursor-pointer text-sm border-b last:border-b-0"
                    onClick={() => selectSuggestion(result)}
                  >
                    {result.formatted_address}
                  </div>
                ))}
              </div>
            )}
          </div>
          
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
      
      {/* Map */}
      {location.latitude && location.longitude && (
        <div className="h-64 rounded-lg overflow-hidden border">
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={{ lat: location.latitude, lng: location.longitude }}
            defaultZoom={15}
            onClick={handleMapClick}
            mapId="group-location-map"
          >
            <Marker
              position={{ lat: location.latitude, lng: location.longitude }}
            />
          </Map>
        </div>
      )}
      
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
        {required 
          ? "Location is required to help other members find your group and see nearby prayer communities."
          : "Location helps other members find your group and see nearby prayer communities."
        }
      </div>
    </div>
  );
}

export default function LocationPickerGoogle({
  onLocationChange,
  initialLocation,
  label = "Group Location",
  required = false
}: LocationPickerGoogleProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return (
      <div className="space-y-4">
        <Label>{label}</Label>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              <i className="fas fa-exclamation-triangle mr-1 text-yellow-500"></i>
              Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      <Card>
        <CardContent className="p-4">
          <APIProvider apiKey={apiKey}>
            <GeocodingComponent 
              onLocationChange={onLocationChange}
              initialLocation={initialLocation}
              required={required}
            />
          </APIProvider>
        </CardContent>
      </Card>
    </div>
  );
}