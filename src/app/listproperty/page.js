"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../context/UserContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";

// Import from react-google-maps/api
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

// A map container style (width/height). Adjust as you wish:
const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

/**
 * Interactive Location Modal with Google Map + Draggable Marker
 */
function LocationModal({ onClose, onSave, initialLocation }) {
  // Load the Google Maps script
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  // Default to either the initialLocation or some fallback
  const [markerPosition, setMarkerPosition] = useState(
    initialLocation || { lat: 35.2, lng: 33.3 } // Example center (Cyprus area)
  );

  // When the user drags the marker
  const handleMarkerDragEnd = (e) => {
    setMarkerPosition({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    });
  };

  // Clicking on map sets a new marker
  const handleMapClick = (e) => {
    setMarkerPosition({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    });
  };

  // Called when user hits "Save"
  const handleSaveLocation = () => {
    onSave(markerPosition);
  };

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-white">
        <p>Loading Google Maps...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2">
      <div className="bg-card-background p-4 rounded-md w-full max-w-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-red-500 rounded-full w-8 h-8 flex items-center justify-center"
        >
          X
        </button>

        <h2 className="text-xl text-foreground font-bold mb-2">
          Pin Property Location
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Drag the marker or click on the map to set your property’s location.
        </p>

        {/* Map */}
        <div className="w-full h-[400px] mb-4">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={markerPosition}
            zoom={10}
            onClick={handleMapClick}
          >
            <Marker
              position={markerPosition}
              draggable
              onDragEnd={handleMarkerDragEnd}
            />
          </GoogleMap>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:opacity-90"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveLocation}
            className="px-4 py-2 bg-jade-green text-white rounded-md hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListPropertyPage() {
  const router = useRouter();
  const user = useUser();

  // ---------------
  // A) We store *two separate states* for Residential vs Land
  // so they won't interfere with each other.
  // ---------------
  const [residentialData, setResidentialData] = useState({
    propertyName: "",
    price: "",
    houseSize: "",
    landSize: "",
    bedrooms: "",
    bathrooms: "",
    garages: "",
    description: "",
    hasPool: false,
    hasBBQ: false,
    hasOutdoorShower: false,
    hasOutdoorLighting: false,
    hasTerrace: false,
    hasGym: false,
    hasTelevision: false,
    hasBeyazEsya: false,
  });

  const [landData, setLandData] = useState({
    propertyName: "",
    price: "",
    landSize: "",
    description: "",
  });

  const [propertyType, setPropertyType] = useState("Residential"); // "Residential" or "Land"

  // Common fields used by both
  const [saleType, setSaleType] = useState("Satılık");
  const [region, setRegion] = useState("Gazi Mağusa");
  const [currency, setCurrency] = useState("TL");

  // The pinned location (lat/lng). For clarity, a single location for both types.
  const [location, setLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // For images (shared for both types)
  const [propertyImages, setPropertyImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Regions/Currency/Sale Types
  const regionsList = [
    "Gazi Mağusa",
    "İskele",
    "Lefkoşa",
    "Girne",
    "Tatlısu",
    "Güzelyurt",
    "Lefke",
    "Karpaz",
  ];
  const currenciesList = ["TL", "EUR", "STG", "USD"];
  const saleTypesList = ["Satılık", "Kiralık"];

  // B) Switch property type -> keep data separate
  function switchToResidential() {
    setPropertyType("Residential");
  }
  function switchToLand() {
    setPropertyType("Land");
  }

  // Helper: upload images
  async function handleImageUpload(files) {
    const uploadedUrls = [];
    for (let file of files) {
      const storageRef = ref(
        storage,
        `property_files/${Date.now()}-${file.name}`
      );
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      uploadedUrls.push(downloadURL);
    }
    return uploadedUrls;
  }

  // SUBMIT
  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
      alert("Please log in first.");
      return;
    }

    // Choose which data set to use
    const formData =
      propertyType === "Residential" ? residentialData : landData;

    if (!formData.propertyName.trim()) {
      alert("Please provide a property name.");
      return;
    }
    if (!formData.price.trim()) {
      alert("Please provide a price.");
      return;
    }
    if (propertyImages.length === 0) {
      alert("Please upload at least one property image.");
      return;
    }

    try {
      setIsUploading(true);

      const uploadedURLs = await handleImageUpload(propertyImages);

      // Build extras if Residential
      let extras = null;
      if (propertyType === "Residential") {
        extras = {
          hasPool: residentialData.hasPool,
          hasBBQ: residentialData.hasBBQ,
          hasOutdoorShower: residentialData.hasOutdoorShower,
          hasOutdoorLighting: residentialData.hasOutdoorLighting,
          hasTerrace: residentialData.hasTerrace,
          hasGym: residentialData.hasGym,
          hasTelevision: residentialData.hasTelevision,
          hasBeyazEsya: residentialData.hasBeyazEsya,
        };
      }

      // Build Firestore doc
      const data = {
        propertyType,
        saleType,
        region,
        currency,
        createdAt: serverTimestamp(),
        userId: user.uid,
        fileUrls: uploadedURLs,
        isBoosted: false,
        favorites: 0,
        views: 0,
        propertyName: formData.propertyName.trim(),
        price: parseFloat(formData.price.trim()),
        description: formData.description.trim() || "",
      };

      if (propertyType === "Residential") {
        data.houseSize = residentialData.houseSize
          ? parseFloat(residentialData.houseSize)
          : null;
        data.landSize = residentialData.landSize
          ? parseFloat(residentialData.landSize)
          : null;
        data.bedrooms = residentialData.bedrooms
          ? parseInt(residentialData.bedrooms)
          : null;
        data.bathrooms = residentialData.bathrooms
          ? parseInt(residentialData.bathrooms)
          : null;
        data.garages = residentialData.garages
          ? parseInt(residentialData.garages)
          : null;
        data.extras = extras;
      } else {
        data.landSize = landData.landSize
          ? parseFloat(landData.landSize)
          : null;
      }

      // If pinned location
      if (location) {
        data.location = {
          latitude: location.lat,
          longitude: location.lng,
        };
      }

      // Save to Firestore
      await addDoc(collection(db, "properties"), data);

      alert("Property listed successfully!");
      router.push("/properties");
    } catch (err) {
      console.error("Error listing property:", err);
      alert("Error listing property, please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  // Handle file selection
  function handleFileChange(e) {
    const filesArray = Array.from(e.target.files);
    // Filter out duplicates by comparing file name & size
    const uniqueFiles = filesArray.filter(
      (newFile) =>
        !propertyImages.some(
          (existing) =>
            existing.name === newFile.name && existing.size === newFile.size
        )
    );
    setPropertyImages((prev) => [...prev, ...uniqueFiles]);
  }
  function removeImage(index) {
    setPropertyImages((prev) => prev.filter((_, i) => i !== index));
  }

  // Checkboxes for extras
  function ExtrasCheckbox({ label, value, onChange }) {
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          className="form-checkbox h-5 w-5 text-jade-green"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="text-sm">{label}</span>
      </label>
    );
  }

  // ---------------
  // RENDER
  // ---------------
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-8 px-4">
      {/* MAP MODAL */}
      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          // Pass existing location if we have it (so user sees the marker)
          initialLocation={location || { lat: 35.2, lng: 33.3 }}
          onSave={(coords) => {
            setLocation(coords);
            setShowLocationModal(false);
          }}
        />
      )}

      <h1 className="text-2xl font-bold mb-6">List a Property</h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-card-background rounded-lg p-6 shadow-md space-y-4"
      >
        {/* TABS: Residential / Land */}
        <div className="flex items-center justify-around gap-4">
          <button
            type="button"
            onClick={switchToResidential}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              propertyType === "Residential"
                ? "bg-jade-green text-white"
                : "bg-secondaryBackground text-foreground"
            }`}
          >
            Residential
          </button>
          <button
            type="button"
            onClick={switchToLand}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              propertyType === "Land"
                ? "bg-jade-green text-white"
                : "bg-secondaryBackground text-foreground"
            }`}
          >
            Land
          </button>
        </div>

        {/* Common fields (saleType, region, currency) */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Sale Type</label>
            <select
              value={saleType}
              onChange={(e) => setSaleType(e.target.value)}
              className="w-full rounded p-2 border border-input-border bg-input-background"
            >
              {saleTypesList.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded p-2 border border-input-border bg-input-background"
            >
              {regionsList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded p-2 border border-input-border bg-input-background"
            >
              {currenciesList.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* IF propertyType===Residential -> display fields from residentialData */}
        {propertyType === "Residential" && (
          <>
            {/* Property Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Property Name
              </label>
              <input
                type="text"
                placeholder="Enter property name"
                value={residentialData.propertyName}
                onChange={(e) =>
                  setResidentialData((prev) => ({
                    ...prev,
                    propertyName: e.target.value,
                  }))
                }
                className="w-full rounded p-2 border border-input-border bg-input-background text-foreground"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                placeholder="0"
                value={residentialData.price}
                onChange={(e) =>
                  setResidentialData((prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
                className="w-full rounded p-2 border border-input-border bg-input-background text-foreground"
              />
            </div>

            {/* House Size / Land Size */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  House Size (m²)
                </label>
                <input
                  type="number"
                  placeholder="120"
                  value={residentialData.houseSize}
                  onChange={(e) =>
                    setResidentialData((prev) => ({
                      ...prev,
                      houseSize: e.target.value,
                    }))
                  }
                  className="w-full rounded p-2 border border-input-border bg-input-background text-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Land Size (m²) (optional)
                </label>
                <input
                  type="number"
                  placeholder="300"
                  value={residentialData.landSize}
                  onChange={(e) =>
                    setResidentialData((prev) => ({
                      ...prev,
                      landSize: e.target.value,
                    }))
                  }
                  className="w-full rounded p-2 border border-input-border bg-input-background text-foreground"
                />
              </div>
            </div>

            {/* Bedrooms / Bathrooms / Garages */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Bedrooms
                </label>
                <input
                  type="number"
                  placeholder="3"
                  value={residentialData.bedrooms}
                  onChange={(e) =>
                    setResidentialData((prev) => ({
                      ...prev,
                      bedrooms: e.target.value,
                    }))
                  }
                  className="w-full rounded p-2 border border-input-border bg-input-background text-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  placeholder="2"
                  value={residentialData.bathrooms}
                  onChange={(e) =>
                    setResidentialData((prev) => ({
                      ...prev,
                      bathrooms: e.target.value,
                    }))
                  }
                  className="w-full rounded p-2 border border-input-border bg-input-background text-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Garages
                </label>
                <input
                  type="number"
                  placeholder="1"
                  value={residentialData.garages}
                  onChange={(e) =>
                    setResidentialData((prev) => ({
                      ...prev,
                      garages: e.target.value,
                    }))
                  }
                  className="w-full rounded p-2 border border-input-border bg-input-background text-foreground"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                placeholder="Enter a brief description..."
                value={residentialData.description}
                onChange={(e) =>
                  setResidentialData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows="3"
                className="w-full rounded p-2 border border-input-border bg-input-background text-foreground"
              />
            </div>

            {/* Extras */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Extras & Amenities
              </label>
              <div className="grid grid-cols-2 gap-2">
                <ExtrasCheckbox
                  label="Pool"
                  value={residentialData.hasPool}
                  onChange={(val) =>
                    setResidentialData((prev) => ({ ...prev, hasPool: val }))
                  }
                />
                <ExtrasCheckbox
                  label="BBQ"
                  value={residentialData.hasBBQ}
                  onChange={(val) =>
                    setResidentialData((prev) => ({ ...prev, hasBBQ: val }))
                  }
                />
                <ExtrasCheckbox
                  label="Outdoor Shower"
                  value={residentialData.hasOutdoorShower}
                  onChange={(val) =>
                    setResidentialData((prev) => ({
                      ...prev,
                      hasOutdoorShower: val,
                    }))
                  }
                />
                <ExtrasCheckbox
                  label="Outdoor Lighting"
                  value={residentialData.hasOutdoorLighting}
                  onChange={(val) =>
                    setResidentialData((prev) => ({
                      ...prev,
                      hasOutdoorLighting: val,
                    }))
                  }
                />
                <ExtrasCheckbox
                  label="Terrace"
                  value={residentialData.hasTerrace}
                  onChange={(val) =>
                    setResidentialData((prev) => ({
                      ...prev,
                      hasTerrace: val,
                    }))
                  }
                />
                <ExtrasCheckbox
                  label="Gym"
                  value={residentialData.hasGym}
                  onChange={(val) =>
                    setResidentialData((prev) => ({ ...prev, hasGym: val }))
                  }
                />
                <ExtrasCheckbox
                  label="Television"
                  value={residentialData.hasTelevision}
                  onChange={(val) =>
                    setResidentialData((prev) => ({
                      ...prev,
                      hasTelevision: val,
                    }))
                  }
                />
                <ExtrasCheckbox
                  label="Beyaz Eşya"
                  value={residentialData.hasBeyazEsya}
                  onChange={(val) =>
                    setResidentialData((prev) => ({
                      ...prev,
                      hasBeyazEsya: val,
                    }))
                  }
                />
              </div>
            </div>
          </>
        )}

        {/* IF propertyType===Land -> display fields from landData */}
        {propertyType === "Land" && (
          <>
            {/* Property Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Property Name
              </label>
              <input
                type="text"
                placeholder="Enter property name"
                value={landData.propertyName}
                onChange={(e) =>
                  setLandData((prev) => ({
                    ...prev,
                    propertyName: e.target.value,
                  }))
                }
                className="w-full rounded p-2 border border-input-border bg-input-background text-foreground"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                placeholder="0"
                value={landData.price}
                onChange={(e) =>
                  setLandData((prev) => ({ ...prev, price: e.target.value }))
                }
                className="w-full rounded p-2 border border-input-border bg-input-background text-foreground"
              />
            </div>

            {/* Land Size */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Land Size (m²)
              </label>
              <input
                type="number"
                placeholder="300"
                value={landData.landSize}
                onChange={(e) =>
                  setLandData((prev) => ({ ...prev, landSize: e.target.value }))
                }
                className="w-full rounded p-2 border border-input-border bg-input-background text-foreground"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                placeholder="Enter a brief description..."
                value={landData.description}
                onChange={(e) =>
                  setLandData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows="3"
                className="w-full rounded p-2 border border-input-border bg-input-background text-foreground"
              />
            </div>
          </>
        )}

        {/* LOCATION */}
        <div>
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="mt-3 bg-accent text-white px-3 py-2 rounded hover:bg-accent/90"
          >
            Pin Location on Map
          </button>
          {location && (
            <p className="text-sm mt-2">
              Selected Location: {location.lat.toFixed(5)},{" "}
              {location.lng.toFixed(5)}
            </p>
          )}
        </div>

        {/* IMAGES */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Upload Property Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full"
          />
          {propertyImages.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-2">
              {propertyImages.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-20 h-20 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUBMIT */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isUploading}
            className="bg-jade-green text-white px-6 py-2 rounded-lg font-medium hover:opacity-90"
          >
            {isUploading ? "Listing..." : "List Property"}
          </button>
        </div>
      </form>
    </div>
  );
}
