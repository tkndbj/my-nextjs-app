// pages/products/[id]/page.js

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "../../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/legacy/image";
import Header from "../../components/Header";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");

  // Fetch product by ID
  useEffect(() => {
    if (!id) return;

    async function fetchProduct() {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // If product doesn't exist, redirect home
        router.push("/");
        return;
      }

      // Otherwise, set product data
      const data = docSnap.data();
      setProduct({ id: docSnap.id, ...data });

      // Default main image
      setSelectedImage(data.imageUrls?.[0] || "https://via.placeholder.com/600x400");
    }

    fetchProduct();
  }, [id, router]);

  // If loading
  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    // Container with no sidebar, only header & images
    <div className="w-full min-h-screen overflow-x-hidden bg-background">
      <Header />

      <main className="pt-16 sm:pt-20 px-2 sm:px-6 max-w-7xl mx-auto w-full">
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
        </div>
      </main>
    </div>
  );
}
