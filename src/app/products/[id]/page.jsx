// pages/products/[id]/page.js

"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "../../../../lib/firebase";
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import Image from "next/legacy/image";
import Header from "../../components/Header";
import { FaHeart, FaRegHeart, FaShoppingCart, FaCheck } from "react-icons/fa";
import { useUser } from "../../../../context/UserContext";
import StarRating from "../../components/StarRating";
import ProductDetailTracker from "../../components/ProductDetail/ProductDetailTracker";
import ProductDetailDelivery from "../../components/ProductDetail/ProductDetailDelivery";
import ProductDetailSellerInfo from "../../components/ProductDetail/ProductDetailSellerInfo";
import ProductDetailReviews from "../../components/ProductDetail/ProductDetailReviews";
import RelatedProducts from "../../components/ProductDetail/RelatedProducts";
import ProductDetailDetails from "../../components/ProductDetail/ProductDetailDetails";
import Sidebar from "../../components/Sidebar";

export default function ProductDetailPage() {
  const params = useParams();
  const { id } = params;

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const user = useUser();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProduct({ id: docSnap.id, ...data });
        setSelectedImage(data.imageUrls?.[0] || "https://via.placeholder.com/600x400");
      } else {
        // No such document => redirect to home
        router.push("/");
      }
    }
    fetchProduct();
  }, [id, router]);

  useEffect(() => {
    if (user && product) {
      const favDocRef = doc(db, "users", user.uid, "favorites", product.id);
      const cartDocRef = doc(db, "users", user.uid, "cart", product.id);

      const unsubscribeFav = onSnapshot(favDocRef, (docSnap) => {
        setIsFavorite(docSnap.exists());
      });

      const unsubscribeCart = onSnapshot(cartDocRef, (docSnap) => {
        setIsInCart(docSnap.exists());
      });

      return () => {
        unsubscribeFav();
        unsubscribeCart();
      };
    } else {
      setIsFavorite(false);
      setIsInCart(false);
    }
  }, [user, product]);

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please log in to manage your favorites.");
      return;
    }

    const favDocRef = doc(db, "users", user.uid, "favorites", product.id);
    const productRef = doc(db, "products", product.id);

    try {
      if (isFavorite) {
        // Remove from favorites
        await deleteDoc(favDocRef);
        await updateDoc(productRef, { favoritesCount: increment(-1) });
      } else {
        // Add to favorites
        await setDoc(favDocRef, { productId: product.id, addedAt: new Date() });
        await updateDoc(productRef, { favoritesCount: increment(1) });
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      alert("An error occurred while updating favorites. Please try again.");
    }
  };

  const toggleCart = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please log in to manage your cart.");
      return;
    }

    const cartDocRef = doc(db, "users", user.uid, "cart", product.id);
    const productRef = doc(db, "products", product.id);

    try {
      if (isInCart) {
        // Remove from cart
        await deleteDoc(cartDocRef);
        await updateDoc(productRef, { cartCount: increment(-1) });
      } else {
        // Add to cart
        await setDoc(cartDocRef, { productId: product.id, addedAt: new Date() });
        await updateDoc(productRef, { cartCount: increment(1) });
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      alert("An error occurred while updating the cart. Please try again.");
    }
  };

  const toggleBuyNow = () => {
    if (!user) {
      alert("Please log in to proceed with the purchase.");
      return;
    }
    router.push(`/productpayment/${product.id}`);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(value);
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  const rating = product.averageRating || 0.0;

  const colorNameToColor = (colorName) => {
    switch (colorName.toLowerCase()) {
      case "red":
        return "red";
      case "yellow":
        return "yellow";
      case "green":
        return "green";
      case "blue":
        return "blue";
      case "purple":
        return "purple";
      case "orange":
        return "orange";
      case "black":
        return "black";
      case "white":
        return "white";
      case "pink":
        return "pink";
      case "gray":
      case "grey":
        return "gray";
      case "brown":
        return "brown";
      case "dark blue":
        return "indigo";
      default:
        return "gray";
    }
  };

  return (
    // 1) Use a full-width, overflow-x-hidden wrapper to prevent horizontal scroll
    <div className="w-full min-h-screen overflow-x-hidden bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="pt-16 sm:pt-20 px-2 sm:px-6 max-w-7xl mx-auto w-full">
          {/* 2) Container for product content, 
                using flex-col for mobile, row for lg */}
          <div className="w-full flex flex-col lg:flex-row gap-6">
            {/* Left Column: images */}
            <div className="flex flex-col lg:w-1/2 gap-4">
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
                {product.imageUrls.map((img, index) => (
                  <div
                    key={index}
                    className={`w-16 h-16 sm:w-24 sm:h-24 relative rounded-lg overflow-hidden cursor-pointer border ${
                      selectedImage === img
                        ? "border-accent"
                        : "border-secondaryBackground"
                    }`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <Image
                      src={img}
                      alt={`${product.productName} ${index + 1}`}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                ))}
              </div>

              {/* Product Details (desktop) */}
              <div className="mt-8 hidden lg:block">
                <ProductDetailDetails product={product} />
              </div>
            </div>

            {/* Right Column: details & actions */}
            <div className="lg:w-1/2 flex flex-col gap-4 bg-background p-4 rounded-lg shadow-md">
              <h1 className="text-xl sm:text-3xl font-bold text-foreground">
                {product.productName}
              </h1>

              <div className="flex items-center space-x-2">
                <StarRating rating={rating} />
                <span className="text-gray-400 text-xs sm:text-sm">
                  ({rating.toFixed(1)})
                </span>
              </div>

              <p className="text-lg sm:text-2xl font-semibold text-foreground">
                {formatCurrency(product.price)}
              </p>

              <p className="text-sm sm:text-base text-gray-400">
                {product.description || "No description available."}
              </p>

              {/* Color Options */}
              {product.colorImages && (
                <div className="flex items-center gap-2 mt-2">
                  {Object.keys(product.colorImages).map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition"
                      style={{ backgroundColor: colorNameToColor(color) }}
                      onClick={() => {
                        const imgs = product.colorImages[color];
                        if (imgs?.length) {
                          setSelectedImage(imgs[0]);
                        }
                      }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 mt-4">
                {/* Buy Now */}
                <button
                  onClick={toggleBuyNow}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-full hover:bg-accent-hover transition"
                  aria-label="Buy It Now"
                >
                  Buy It Now
                </button>

                {/* Cart */}
                <button
                  onClick={toggleCart}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
                    isInCart
                      ? "border-accent bg-accent text-background hover:bg-accent-hover hover:border-accent-hover"
                      : "border-secondaryBackground text-foreground hover:bg-secondaryBackground hover:text-background"
                  } transition`}
                  aria-label={isInCart ? "Remove from cart" : "Add to cart"}
                >
                  <span className="icon-wrapper relative w-6 h-6">
                    <FaShoppingCart
                      className={`text-lg transition-opacity duration-300 ${
                        isInCart ? "opacity-0" : "opacity-100"
                      }`}
                    />
                    <FaCheck
                      className={`text-lg transition-opacity duration-300 ${
                        isInCart ? "opacity-100" : "opacity-0"
                      } absolute top-0 left-0`}
                    />
                  </span>
                  {isInCart ? "In Cart" : "Add to Cart"}
                </button>

                {/* Favorite */}
                <button
                  onClick={toggleFavorite}
                  className="p-2 rounded-full bg-secondaryBackground shadow-md hover:bg-secondaryBackground-hover transition-colors"
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {isFavorite ? (
                    <FaHeart className="text-red-500" />
                  ) : (
                    <FaRegHeart className="text-gray-700" />
                  )}
                </button>
              </div>

              {/* Product Details (mobile) */}
              <div className="mt-8 lg:hidden">
                <ProductDetailDetails product={product} />
              </div>

              {/* Trackers */}
              <ProductDetailTracker productId={product.id} />

              {/* Delivery Options */}
              <ProductDetailDelivery deliveryOption={product.deliveryOption} />

              {/* Seller Info */}
              <ProductDetailSellerInfo sellerId={product.userId} />

              {/* Reviews */}
              <ProductDetailReviews productId={product.id} />
            </div>
          </div>
        </main>

        {/* Related Products */}
        <div className="w-full flex justify-center">
          <RelatedProducts currentProduct={product} />
        </div>
      </div>
    </div>
  );
}
