"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useUser } from "../../../../context/UserContext";
import { categories, subcategories } from "../../data/categoriesData";
import Image from "next/image";
import { FaPlus, FaTrash, FaVideo } from "react-icons/fa";

const deliveryOptions = [
  { value: "fast", label: "Fast Delivery" },
  { value: "self", label: "Self Delivery" },
];

const conditions = ["Brand New", "Used", "Refurbished"];

const availableColors = [
  "Red",
  "Yellow",
  "Green",
  "Blue",
  "Purple",
  "Orange",
  "Black",
  "White",
  "Pink",
  "Gray",
  "Brown",
  "Dark Blue",
];

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;
  const user = useUser();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  // Seller info
  const [sellerName, setSellerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [iban, setIban] = useState("");
  const [saveSellerInfo, setSaveSellerInfo] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // Product info
  const [title, setTitle] = useState("");
  const [brandModel, setBrandModel] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [returnEligibility, setReturnEligibility] = useState(false);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState("");

  // Images & video
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [images, setImages] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  // Color images
  const [colorImages, setColorImages] = useState({});
  const maxColors = 12;

  useEffect(() => {
    if (!productId || !user) return;

    const fetchData = async () => {
      try {
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
          alert("Product not found.");
          router.push("/myproducts/" + user.uid);
          return;
        }
        const data = productSnap.data();

        // Prefill product info
        setTitle(data.productName || "");
        setBrandModel(data.brandModel || "");
        setPrice(data.price?.toString() || "");
        setQuantity(data.quantity?.toString() || "");
        setDescription(data.description || "");
        setSelectedCategory(data.category || "");
        setSelectedSubcategory(data.subcategory || "");
        setSelectedCondition(data.condition || "");
        setReturnEligibility(data.returnEligibility || false);
        setSelectedDeliveryOption(data.deliveryOption || "");
        setTags(data.tags?.join(", ") || "");

        // Prefill images
        if (data.imageUrls && data.imageUrls.length > 0) {
          setExistingImageUrls(data.imageUrls);
        }

        // Prefill video
        if (data.videoUrl) {
          setVideoUrl(data.videoUrl);
        }

        // Prefill color images
        if (data.colorImages) {
          const newColorImages = {};
          for (const [color, urls] of Object.entries(data.colorImages)) {
            newColorImages[color] = urls.map((u) => ({ file: null, url: u }));
          }
          setColorImages(newColorImages);
        }

        // Fetch seller info
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().sellerInfo) {
          const info = userSnap.data().sellerInfo;
          setSellerName(info.name || "");
          setPhone(info.phone || "");
          setEmail(info.email || "");
          setIban(info.iban || "");
          setIsFirstTimeUser(false);
        } else {
          setIsFirstTimeUser(true);
        }
      } catch (error) {
        console.error("Error loading product data:", error);
        alert("Failed to load product data.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [productId, router, user]);

  function handleAddImages(e) {
    const files = Array.from(e.target.files);
    if (existingImageUrls.length + images.length + files.length > 10) {
      alert("Maximum 10 images allowed.");
      return;
    }
    const oversized = files.some((file) => file.size > 25 * 1024 * 1024);
    if (oversized) {
      alert("Each image must be less than 25MB.");
      return;
    }
    setImages((prev) => [...prev, ...files]);
  }

  function handleRemoveExistingImage(index) {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRemoveNewImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddVideo(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (videoUrl || videoFile) {
      alert("Maximum 1 video allowed.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      alert("Video must be less than 25MB.");
      return;
    }
    setVideoFile(file);
  }

  function handleRemoveVideo() {
    setVideoUrl(null);
    setVideoFile(null);
  }

  function handleAddColorSet(color) {
    if (Object.keys(colorImages).length >= maxColors) {
      alert(`Maximum ${maxColors} color sets allowed.`);
      return;
    }
    const colorKey = color.toLowerCase();
    if (colorImages[colorKey]) {
      alert("Color already selected.");
      return;
    }
    setColorImages({ ...colorImages, [colorKey]: [] });
  }

  function handleAddColorImages(color, files) {
    const current = colorImages[color] || [];
    if (current.length + files.length > 10) {
      alert("Maximum 10 images per color.");
      return;
    }
    const oversized = files.some((file) => file.size > 25 * 1024 * 1024);
    if (oversized) {
      alert("Each image must be less than 25MB.");
      return;
    }
    const newEntries = files.map((f) => ({ file: f, url: null }));
    setColorImages({
      ...colorImages,
      [color]: [...current, ...newEntries],
    });
  }

  function handleRemoveColorImage(color, index) {
    setColorImages({
      ...colorImages,
      [color]: colorImages[color].filter((_, i) => i !== index),
    });
  }

  function handleRemoveColorSet(color) {
    const updated = { ...colorImages };
    delete updated[color];
    setColorImages(updated);
  }

  const renderedSubcategories = selectedCategory
    ? subcategories[selectedCategory] || []
    : [];

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <p>Loading product data...</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        productName: title.trim(),
        brandModel: brandModel.trim(),
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        description: description.trim(),
        category: selectedCategory,
        subcategory: selectedSubcategory,
        condition: selectedCondition,
        returnEligibility,
        deliveryOption: selectedDeliveryOption,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
      });
      alert("Product updated successfully!");
      router.push(`/myproducts/${user.uid}`);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Edit Product</h1>

        {/* Seller Info Section */}
        <div className="bg-[var(--secondary-background)] p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Seller Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Seller Name"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]"
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]"
            />
            <input
              type="text"
              placeholder="IBAN"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]"
            />
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <input
              type="checkbox"
              checked={saveSellerInfo}
              onChange={(e) => setSaveSellerInfo(e.target.checked)}
              id="saveSellerInfo"
            />
            <label htmlFor="saveSellerInfo" className="text-sm">
              Save this information for future listings
            </label>
          </div>
        </div>

        {/* Delivery Options */}
        <div className="bg-[var(--secondary-background)] p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Delivery Options</h2>
          <div className="flex flex-col space-y-2">
            {deliveryOptions.map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="deliveryOption"
                  value={opt.value}
                  checked={selectedDeliveryOption === opt.value}
                  onChange={() => setSelectedDeliveryOption(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-[var(--secondary-background)] p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Product Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Product Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]"
            />
            <input
              type="text"
              placeholder="Brand/Model"
              value={brandModel}
              onChange={(e) => setBrandModel(e.target.value)}
              className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]"
            />
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-medium">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory("");
                }}
                className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.key}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Subcategory</label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]"
                disabled={!selectedCategory}
              >
                <option value="">Select subcategory</option>
                {(subcategories[selectedCategory] || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Condition</label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]"
              >
                <option value="">Select condition</option>
                {conditions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 flex items-center space-x-2">
            <input
              type="checkbox"
              checked={returnEligibility}
              onChange={(e) => setReturnEligibility(e.target.checked)}
            />
            <span>Return Eligibility</span>
          </div>

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded w-full h-24 mb-4 bg-[var(--background)] text-[var(--foreground)]"
          ></textarea>
        </div>

        {/* Images (show existing and new) */}
        <div className="bg-[var(--secondary-background)] p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Images</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Existing Images */}
            {existingImageUrls.map((url, i) => (
              <div
                key={"exist-" + i}
                className="relative w-24 h-24 border rounded overflow-hidden"
              >
                <Image
                  src={url}
                  alt="Existing product image"
                  fill
                  style={{ objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(i)}
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
                >
                  <FaTrash />
                </button>
              </div>
            ))}

            {/* New Images */}
            {images.map((img, i) => (
              <div
                key={"new-" + i}
                className="relative w-24 h-24 border rounded overflow-hidden"
              >
                <Image
                  src={URL.createObjectURL(img)}
                  alt="New product image"
                  fill
                  style={{ objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(i)}
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
                >
                  <FaTrash />
                </button>
              </div>
            ))}

            {/* Add More Images Button */}
            {existingImageUrls.length + images.length < 10 && (
              <label className="w-24 h-24 border-dashed border-2 border-gray-400 flex flex-col items-center justify-center text-gray-400 cursor-pointer">
                <FaPlus />
                <input
                  type="file"
                  multiple
                  onChange={handleAddImages}
                  className="hidden"
                  accept="image/*"
                />
              </label>
            )}
          </div>
        </div>

        {/* Video (existing or new) */}
        <div className="bg-[var(--secondary-background)] p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Optional Video</h2>
          {videoUrl ? (
            <div className="relative w-48 h-24 bg-gray-200 flex items-center justify-center">
              <FaVideo className="text-2xl" />
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
              >
                <FaTrash />
              </button>
            </div>
          ) : videoFile ? (
            <div className="relative w-48 h-24 bg-gray-200 flex items-center justify-center">
              <FaVideo className="text-2xl" />
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
              >
                <FaTrash />
              </button>
            </div>
          ) : (
            <label className="inline-flex items-center space-x-2 cursor-pointer border-dashed border-2 border-gray-400 p-4 rounded text-[var(--foreground)]">
              <FaPlus />
              <span>Add Video</span>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleAddVideo}
              />
            </label>
          )}
        </div>

        {/* Color-Specific Images */}
        <div className="bg-[var(--secondary-background)] p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Color Variations (Optional)
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableColors.map((clr) => {
              const colorKey = clr.toLowerCase();
              const isSelected = Boolean(colorImages[colorKey]);
              return (
                <button
                  key={clr}
                  type="button"
                  onClick={() => !isSelected && handleAddColorSet(clr)}
                  className={`px-3 py-1 rounded-full border ${
                    isSelected
                      ? "bg-gray-400 text-white border-gray-400 cursor-not-allowed"
                      : "bg-[var(--background)] text-[var(--foreground)] border-gray-300 hover:bg-gray-200"
                  }`}
                  disabled={isSelected}
                  title={isSelected ? "Color already added" : `Add ${clr}`}
                >
                  {clr}
                </button>
              );
            })}
          </div>

          {Object.keys(colorImages).map((color) => (
            <div key={color} className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold capitalize">{color}</h3>
                <button
                  type="button"
                  onClick={() => handleRemoveColorSet(color)}
                  className="text-red-600"
                >
                  Remove
                </button>
              </div>
              <div className="flex flex-wrap gap-4 mb-2">
                {colorImages[color].map((entry, i) => (
                  <div
                    key={i}
                    className="relative w-24 h-24 border rounded overflow-hidden"
                  >
                    {entry.url ? (
                      <Image
                        src={entry.url}
                        alt={`${color} variation`}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Image
                        src={URL.createObjectURL(entry.file)}
                        alt={`${color} variation`}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveColorImage(color, i)}
                      className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                {colorImages[color].length < 10 && (
                  <label className="w-24 h-24 border-dashed border-2 border-gray-400 flex flex-col items-center justify-center text-gray-400 cursor-pointer">
                    <FaPlus />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleAddColorImages(color, Array.from(e.target.files))
                      }
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tags and Keywords */}
        <div className="bg-[var(--secondary-background)] p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Tags / Keywords (Optional)
          </h2>
          <input
            type="text"
            placeholder="Separate tags with commas"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            maxLength={45}
            className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
