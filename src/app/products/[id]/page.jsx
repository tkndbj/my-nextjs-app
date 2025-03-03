"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "../../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/legacy/image";

// Temporary inline star rating
function InlineStarRating({ rating }) {
  const rounded = Math.round(rating * 2) / 2;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rounded >= i) {
      stars.push("★");
    } else if (rounded + 0.5 === i) {
      stars.push("☆"); // half star placeholder
    } else {
      stars.push("☆");
    }
  }
  return (
    <span className="text-yellow-500">
      {stars.join("")}
      <span className="text-gray-400 text-sm"> ({rating.toFixed(1)})</span>
    </span>
  );
}

// Additional detail components:
import ProductDetailTracker from "../../components/ProductDetail/ProductDetailTracker";
import ProductDetailSellerInfo from "../../components/ProductDetail/ProductDetailSellerInfo";
import ProductDetailDetails from "../../components/ProductDetail/ProductDetailDetails";
import ProductDetailDelivery from "../../components/ProductDetail/ProductDetailDelivery";
import ProductDetailReviews from "../../components/ProductDetail/ProductDetailReviews";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");

  // Fetch product
  useEffect(() => {
    if (!id) return;
    async function fetchProduct() {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        router.push("/");
        return;
      }
      const data = docSnap.data();
      setProduct({ id: docSnap.id, ...data });
      setSelectedImage(
        data.imageUrls?.[0] || "https://via.placeholder.com/600x400"
      );
    }
    fetchProduct();
  }, [id, router]);

  // Show loading if no product
  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  // Format price
  const formatCurrency = (val) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val);

  const rating = product.averageRating || 0.0;

  return (
    <div className="w-full min-h-screen bg-background">
      <main className="pt-16 sm:pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Product Images */}
          <section className="flex flex-col gap-4">
            {/* Back Button Above the Image */}
            <div>
              <button
                onClick={() => router.back()}
                className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
                aria-label="Go Back"
              >
                <svg
                  className="h-6 w-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>
            {/* Main Image */}
            <div className="w-full h-[400px] sm:h-[700px] relative rounded-lg overflow-hidden shadow-lg bg-secondaryBackground">
              <Image
                src={selectedImage}
                alt={product.productName}
                layout="fill"
                objectFit="cover"
              />
            </div>
            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto py-2">
              {product.imageUrls?.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 relative rounded-lg overflow-hidden cursor-pointer border transition-transform transform hover:scale-105 ${
                    selectedImage === img
                      ? "border-accent"
                      : "border-secondaryBackground"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${i}`}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              ))}
            </div>
          </section>
          {/* Right Column: Product Details */}
          <section className="flex flex-col gap-6">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">
              {product.productName}
            </h1>
            <div className="flex items-center gap-6">
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(product.price)}
              </p>
              <InlineStarRating rating={rating} />
            </div>
            <ProductDetailTracker productId={product.id} />
            <ProductDetailSellerInfo sellerId={product.userId} />
            <ProductDetailDetails product={product} />
            <ProductDetailDelivery deliveryOption={product.deliveryOption} />
            <ProductDetailReviews productId={product.id} />
          </section>
        </div>
      </main>
    </div>
  );
}
