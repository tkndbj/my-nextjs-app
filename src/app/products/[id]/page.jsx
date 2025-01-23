// pages/products/[id]/page.js

"use client";

import { useParams, useRouter } from "next/navigation";
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

// Detail components
import ProductDetailTracker from "../../components/ProductDetail/ProductDetailTracker";
import ProductDetailDelivery from "../../components/ProductDetail/ProductDetailDelivery";
import ProductDetailSellerInfo from "../../components/ProductDetail/ProductDetailSellerInfo";
import ProductDetailReviews from "../../components/ProductDetail/ProductDetailReviews";
import ProductDetailDetails from "../../components/ProductDetail/ProductDetailDetails";
import RelatedProducts from "../../components/ProductDetail/RelatedProducts";

// Sidebar
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

  // Fetch product
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProduct({ id: docSnap.id, ...data });
        setSelectedImage(data.imageUrls?.[0] || "https://via.placeholder.com/600x400");
      } else {
        // If no doc, go home
        router.push("/");
      }
    };
    fetchProduct();
  }, [id, router]);

  // Favorites & Cart states
  useEffect(() => {
    if (user && product) {
      const favRef = doc(db, "users", user.uid, "favorites", product.id);
      const cartRef = doc(db, "users", user.uid, "cart", product.id);

      const unsubFav = onSnapshot(favRef, (docSnap) => {
        setIsFavorite(docSnap.exists());
      });
      const unsubCart = onSnapshot(cartRef, (docSnap) => {
        setIsInCart(docSnap.exists());
      });

      return () => {
        unsubFav();
        unsubCart();
      };
    } else {
      setIsFavorite(false);
      setIsInCart(false);
    }
  }, [user, product]);

  // Toggle favorites
  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please log in to manage favorites.");
      return;
    }
    const favRef = doc(db, "users", user.uid, "favorites", product.id);
    const prodRef = doc(db, "products", product.id);

    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        await updateDoc(prodRef, { favoritesCount: increment(-1) });
      } else {
        await setDoc(favRef, { productId: product.id, addedAt: new Date() });
        await updateDoc(prodRef, { favoritesCount: increment(1) });
      }
    } catch (err) {
      console.error("Error updating favorites:", err);
      alert("Error updating favorites. Please try again.");
    }
  };

  // Toggle cart
  const toggleCart = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please log in to manage your cart.");
      return;
    }
    const cartRef = doc(db, "users", user.uid, "cart", product.id);
    const prodRef = doc(db, "products", product.id);

    try {
      if (isInCart) {
        await deleteDoc(cartRef);
        await updateDoc(prodRef, { cartCount: increment(-1) });
      } else {
        await setDoc(cartRef, { productId: product.id, addedAt: new Date() });
        await updateDoc(prodRef, { cartCount: increment(1) });
      }
    } catch (err) {
      console.error("Error updating cart:", err);
      alert("Error updating cart. Please try again.");
    }
  };

  // Buy now
  const toggleBuyNow = () => {
    if (!user) {
      alert("Please log in to purchase.");
      return;
    }
    router.push(`/productpayment/${product.id}`);
  };

  // Price formatting
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val);
  };

  // If loading
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  const rating = product.averageRating || 0.0;

  // Color function
  const colorNameToColor = (name) => {
    switch (name?.toLowerCase()) {
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
    <div className="w-full min-h-screen overflow-x-hidden bg-background flex">
      {/* Hide sidebar on mobile => prevents wide layout */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="pt-16 sm:pt-20 px-2 sm:px-6 max-w-7xl mx-auto w-full">
          <div className="w-full flex flex-col lg:flex-row gap-6">
            {/* Left Col: Images */}
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
                {product.imageUrls?.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 sm:w-24 sm:h-24 relative rounded-lg overflow-hidden cursor-pointer border ${
                      selectedImage === img
                        ? "border-accent"
                        : "border-secondaryBackground"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.productName}-${i}`}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                ))}
              </div>

              {/* Product Details Desktop */}
              <div className="mt-8 hidden lg:block">
                <ProductDetailDetails product={product} />
              </div>
            </div>

            {/* Right Col: Info & Actions */}
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
                  <span className="relative w-6 h-6">
                    <FaShoppingCart
                      className={`text-lg transition-opacity duration-300 ${
                        isInCart ? "opacity-0" : "opacity-100"
                      }`}
                    />
                    <FaCheck
                      className={`text-lg transition-opacity duration-300 absolute top-0 left-0 ${
                        isInCart ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </span>
                  {isInCart ? "In Cart" : "Add to Cart"}
                </button>

                {/* Favorite */}
                <button
                  onClick={toggleFavorite}
                  className="p-2 rounded-full bg-secondaryBackground shadow-md hover:bg-secondaryBackground-hover transition-colors"
                  aria-label={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  {isFavorite ? (
                    <FaHeart className="text-red-500" />
                  ) : (
                    <FaRegHeart className="text-gray-700" />
                  )}
                </button>
              </div>

              {/* Product Details Mobile */}
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
