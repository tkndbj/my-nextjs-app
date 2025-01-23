"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "../../../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useUser } from "../../../context/UserContext";
import { categories, subcategories } from "../data/categoriesData";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { FaPlus, FaTrash, FaVideo } from "react-icons/fa";

// Modified delivery options to Fast Delivery or Self Delivery
const deliveryOptions = [
  { value: "fast", label: "Fast Delivery" },
  { value: "self", label: "Self Delivery" },
];

const conditions = ["Brand New", "Used", "Refurbished"];

// Predefined list of 12 colors
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

export default function ListProductPage() {
  const router = useRouter();
  const user = useUser();

  const [sellerName, setSellerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [iban, setIban] = useState("");
  const [saveSellerInfo, setSaveSellerInfo] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Product info state
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

  // Images and video
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);

  // Color-specific images: {colorName: [File, ...]}
  const [colorImages, setColorImages] = useState({});
  const maxColors = 12;

  useEffect(() => {
    if (user) {
      fetchSellerInfo(user.uid);
    } else {
      // If not logged in, optionally handle redirection
    }
  }, [user]);

  async function fetchSellerInfo(uid) {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().sellerInfo) {
      const data = userSnap.data().sellerInfo;
      setSellerName(data.name || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setIban(data.iban || "");
      setIsFirstTimeUser(false);
    } else {
      setIsFirstTimeUser(true);
    }
  }

  function handleAddImages(e) {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
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

  function handleRemoveImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddVideo(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (video) {
      alert("Maximum 1 video allowed.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert("Video must be less than 25MB.");
      return;
    }

    setVideo(file);
  }

  function handleRemoveVideo() {
    setVideo(null);
  }

  // Handle adding a color set directly from the predefined color list
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

    setColorImages({
      ...colorImages,
      [color]: [...current, ...files],
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

  async function handleContinue() {
    // Basic form validations
    if (!title.trim()) {
      alert("Please enter a product title.");
      return;
    }
    if (!selectedCategory) {
      alert("Please select a category.");
      return;
    }
    if (!selectedSubcategory) {
      alert("Please select a subcategory.");
      return;
    }
    if (!selectedCondition) {
      alert("Please select a condition.");
      return;
    }
    if (!price || isNaN(price)) {
      alert("Please enter a valid price.");
      return;
    }
    if (!quantity || isNaN(quantity)) {
      alert("Please enter a valid quantity.");
      return;
    }
    if (images.length === 0) {
      alert("Please upload at least one image.");
      return;
    }
    if (!selectedDeliveryOption) {
      alert("Please select a delivery option.");
      return;
    }

    setIsLoading(true);

    try {
      // Upload images and video
      const imageUrls = await uploadFiles(
        images,
        `products/${user.uid}/default_images`
      );
      let videoUrl = null;
      if (video) {
        const [vUrl] = await uploadFiles(
          [video],
          `products/${user.uid}/videos`
        );
        videoUrl = vUrl;
      }

      // Upload color images
      const colorImagesUrls = {};
      for (const color of Object.keys(colorImages)) {
        const urls = await uploadFiles(
          colorImages[color],
          `products/${user.uid}/color_images/${color}`
        );
        colorImagesUrls[color] = urls;
      }

      // If user chose to save seller info for future
      if (saveSellerInfo && isFirstTimeUser) {
        await updateDoc(doc(db, "users", user.uid), {
          sellerInfo: {
            name: sellerName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            iban: iban.trim(),
          },
        });
      }

      const productId = uuidv4();
      const productRef = doc(db, "products", productId);

      // Create search index
      const searchIndex = [
        ...new Set(
          title
            .toLowerCase()
            .split(" ")
            .concat(description.toLowerCase().split(" "))
        ),
      ].filter((token) => token);

      const productData = {
        productName: title.trim(),
        brandModel: brandModel.trim(),
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        condition: selectedCondition,
        description: description.trim(),
        category: selectedCategory,
        subcategory: selectedSubcategory,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        returnEligibility,
        deliveryOption: selectedDeliveryOption,
        imageUrls: imageUrls,
        videoUrl: videoUrl || null,
        colorImages: colorImagesUrls,
        userId: user.uid,
        createdAt: serverTimestamp(),
        averageRating: 0.0,
        reviewCount: 0,
        sold: false,
        isFeatured: false,
        isTrending: false,
        isBoosted: false,
        ilanNo: "",
        searchIndex,
      };

      await setDoc(productRef, productData);

      router.push(`/products/${productId}`);
    } catch (error) {
      console.error("Error listing product:", error);
      alert("Failed to list product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadFiles(files, path) {
    const urls = [];
    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      const fileRef = ref(storage, `${path}/${fileName}`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          () => {},
          reject,
          async () => {
            const url = await getDownloadURL(fileRef);
            urls.push(url);
            resolve();
          }
        );
      });
    }
    return urls;
  }

  const renderedSubcategories = selectedCategory
    ? subcategories[selectedCategory] || []
    : [];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">List a Product</h1>

        {/* Seller Info Section */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Seller Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Seller Name"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <input
              type="text"
              placeholder="IBAN"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              className="border p-2 rounded w-full"
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
        <div className="bg-white p-4 rounded shadow mb-6">
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
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Product Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Product Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <input
              type="text"
              placeholder="Brand/Model"
              value={brandModel}
              onChange={(e) => setBrandModel(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="border p-2 rounded w-full"
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
                className="border p-2 rounded w-full"
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
                className="border p-2 rounded w-full"
                disabled={!selectedCategory}
              >
                <option value="">Select subcategory</option>
                {renderedSubcategories.map((sub) => (
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
                className="border p-2 rounded w-full"
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
            className="border p-2 rounded w-full h-24 mb-4"
          ></textarea>
        </div>

        {/* Images */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Images</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative w-24 h-24 border rounded overflow-hidden"
              >
                <Image
                  src={URL.createObjectURL(img)}
                  alt="Product image"
                  fill
                  style={{ objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            {images.length < 10 && (
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

        {/* Video */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Optional Video</h2>
          {video ? (
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
            <label className="inline-flex items-center space-x-2 cursor-pointer border-dashed border-2 border-gray-400 p-4 rounded">
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
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Color Variations (Optional)
          </h2>
          {/* Color selection buttons */}
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
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-200"
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
                {colorImages[color].map((img, i) => (
                  <div
                    key={i}
                    className="relative w-24 h-24 border rounded overflow-hidden"
                  >
                    <Image
                      src={URL.createObjectURL(img)}
                      alt={`${color} variation`}
                      fill
                      style={{ objectFit: "cover" }}
                    />
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
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Tags / Keywords (Optional)
          </h2>
          <input
            type="text"
            placeholder="Separate tags with commas"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            maxLength={45}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleContinue}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
