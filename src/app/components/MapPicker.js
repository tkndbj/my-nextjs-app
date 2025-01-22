// src/components/MapPicker.js
"use client";

import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { useState, useCallback } from "react";

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "0.75rem",
  overflow: "hidden",
};

// North Cyprus coordinates
const defaultCenter = { lat: 35.1856, lng: 33.3823 };

export default function MapPicker({ onLocationSelect }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  const [markerPosition, setMarkerPosition] = useState(null);

  const onMapClick = useCallback(
    (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setMarkerPosition({ lat, lng });
      onLocationSelect({ latitude: lat, longitude: lng });
    },
    [onLocationSelect]
  );

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markerPosition || defaultCenter}
      zoom={10}
      onClick={onMapClick}
    >
      {markerPosition && <Marker position={markerPosition} />}
    </GoogleMap>
  );
}
