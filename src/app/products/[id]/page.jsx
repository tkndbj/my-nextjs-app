// pages/products/[id]/page.js

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "../../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/legacy/image";
import Header from "../../components/Header";

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
import RelatedProducts from "../../components/ProductDetail/RelatedProducts";

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
      setSelectedImage(data.imageUrls?.[0] || "https://via.placeholder.com/600x400");
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
    <div className="w-full min-h-screen overflow-x-hidden bg-background">
      <Header />

      <main className="pt-16 sm:pt-20 px-2 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Main Content Container */}
        <div className="flex flex-col gap-4">
          {/* Main Image */}
          <div className="w-full h-64 sm:h-96 relative rounded-lg overflow-hidden shadow-md bg-secondaryBackground">
            <Image
              src={selectedImage}
              alt={product.productName}
              layout="fill"
              objectFit="cover"
            />
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto bg-background p-2 rounded-lg">
            {product.imageUrls?.map((img, i) => (
              <div
                key={i}
                onClick={() => setSelectedImage(img)}
                className={`w-16 h-16 sm:w-24 sm:h-24 relative rounded-lg overflow-hidden cursor-pointer border ${
                  selectedImage === img ? "border-accent" : "border-secondaryBackground"
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

          {/* Product Name */}
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">
            {product.productName}
          </h1>

          {/* Price + Star Rating */}
          <div className="flex items-center gap-4">
            <p className="text-lg sm:text-2xl font-semibold text-foreground">
              {formatCurrency(product.price)}
            </p>
            <InlineStarRating rating={rating} />
          </div>

          {/* Product Tracker (above seller info) */}
          <div className="mt-4">
            <ProductDetailTracker productId={product.id} />
          </div>

          {/* Seller Info */}
          <div className="mt-4">
            <ProductDetailSellerInfo sellerId={product.userId} />
          </div>

          {/* Product Details */}
          <div className="mt-4">
            <ProductDetailDetails product={product} />
          </div>

          {/* Delivery */}
          <div className="mt-4">
            <ProductDetailDelivery deliveryOption={product.deliveryOption} />
          </div>

          {/* Reviews */}
          <div className="mt-4">
            <ProductDetailReviews productId={product.id} />
          </div>
        </div>

        {/* Related Products at the bottom
        <div className="mt-6">
          <RelatedProducts currentProduct={product} />
        </div> */}
      </main>
    </div>
  );
}
