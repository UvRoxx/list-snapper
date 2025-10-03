import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

interface AddressComponents {
  fullName?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface GoogleAddressInputProps {
  onAddressSelect: (address: AddressComponents) => void;
  initialAddress?: AddressComponents;
}

const libraries: ("places")[] = ["places"];

export function GoogleAddressInput({ onAddressSelect, initialAddress }: GoogleAddressInputProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [address, setAddress] = useState(initialAddress?.address || "");
  const [city, setCity] = useState(initialAddress?.city || "");
  const [state, setState] = useState(initialAddress?.state || "");
  const [zipCode, setZipCode] = useState(initialAddress?.zipCode || "");
  const [country, setCountry] = useState(initialAddress?.country || "USA");
  const [fullName, setFullName] = useState(initialAddress?.fullName || "");

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      
      if (place.address_components) {
        let streetNumber = "";
        let route = "";
        let locality = "";
        let administrativeArea = "";
        let postalCode = "";
        let countryName = "";

        place.address_components.forEach((component) => {
          const types = component.types;
          
          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          }
          if (types.includes("route")) {
            route = component.long_name;
          }
          if (types.includes("locality")) {
            locality = component.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            administrativeArea = component.short_name;
          }
          if (types.includes("postal_code")) {
            postalCode = component.long_name;
          }
          if (types.includes("country")) {
            countryName = component.long_name;
          }
        });

        const fullAddress = `${streetNumber} ${route}`.trim();
        
        setAddress(fullAddress);
        setCity(locality);
        setState(administrativeArea);
        setZipCode(postalCode);
        setCountry(countryName || "USA");

        // Notify parent component
        onAddressSelect({
          fullName,
          address: fullAddress,
          city: locality,
          state: administrativeArea,
          zipCode: postalCode,
          country: countryName || "USA",
        });
      }
    }
  };

  useEffect(() => {
    // Update parent when any field changes
    onAddressSelect({
      fullName,
      address,
      city,
      state,
      zipCode,
      country,
    });
  }, [fullName, address, city, state, zipCode, country]);

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-yellow-600">
          Google Maps failed to load. Please enter address manually.
        </p>
        <ManualAddressForm
          fullName={fullName}
          address={address}
          city={city}
          state={state}
          zipCode={zipCode}
          country={country}
          onFullNameChange={setFullName}
          onAddressChange={setAddress}
          onCityChange={setCity}
          onStateChange={setState}
          onZipCodeChange={setZipCode}
          onCountryChange={setCountry}
        />
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading address form...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          data-testid="input-full-name"
          required
        />
      </div>

      <div>
        <Label htmlFor="address">Street Address *</Label>
        {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
          <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
              types: ["address"],
              componentRestrictions: { country: ["us", "ca"] },
            }}
          >
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Start typing your address..."
              data-testid="input-address"
              required
            />
          </Autocomplete>
        ) : (
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St"
            data-testid="input-address"
            required
          />
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Start typing and select from suggestions for auto-fill
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="New York"
            data-testid="input-city"
            required
          />
        </div>
        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="NY"
            data-testid="input-state"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="zipCode">ZIP Code *</Label>
          <Input
            id="zipCode"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="10001"
            data-testid="input-zip"
            required
          />
        </div>
        <div>
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="USA"
            data-testid="input-country"
            required
          />
        </div>
      </div>
    </div>
  );
}

function ManualAddressForm({
  fullName,
  address,
  city,
  state,
  zipCode,
  country,
  onFullNameChange,
  onAddressChange,
  onCityChange,
  onStateChange,
  onZipCodeChange,
  onCountryChange,
}: {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  onFullNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onZipCodeChange: (value: string) => void;
  onCountryChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          placeholder="John Doe"
          data-testid="input-full-name"
        />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="123 Main St"
          data-testid="input-address"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="New York"
            data-testid="input-city"
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            placeholder="NY"
            data-testid="input-state"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            value={zipCode}
            onChange={(e) => onZipCodeChange(e.target.value)}
            placeholder="10001"
            data-testid="input-zip"
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            placeholder="USA"
            data-testid="input-country"
          />
        </div>
      </div>
    </div>
  );
}

