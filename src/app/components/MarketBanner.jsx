// src/components/MarketBanner.jsx

"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Slider from "react-slick";
import Image from "next/image"; // Updated import
import Link from "next/link"; // For clickable banners
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function MarketBanner() {
  const [banners, setBanners] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const bannersRef = collection(db, "market_banners");
    const unsubscribe = onSnapshot(
      bannersRef,
      (snapshot) => {
        const bannersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBanners(bannersData);
      },
      (error) => {
        console.error("Error fetching market banners:", error);
        setError("Failed to load banners.");
      }
    );

    return () => unsubscribe();
  }, []);

  if (error) {
    return (
      <div className="my-6 flex justify-center items-center h-40 sm:h-56 md:h-72">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="my-6 flex justify-center items-center h-40 sm:h-56 md:h-72">
        <div className="loader">Loading...</div>{" "}
        {/* Implement a loader as needed */}
      </div>
    );
  }

  // Slider settings
  const settings = {
    dots: false, // Remove dots
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 3000, // 3 seconds
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false, // Hide arrows if not needed
    pauseOnHover: true, // Pause autoplay on hover
    adaptiveHeight: true, // Adjust height based on content
    accessibility: true, // Enable accessibility features
  };

  return (
    <div className="my-6 overflow-hidden">
      <Slider {...settings}>
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className="relative w-full h-40 sm:h-56 md:h-72 overflow-hidden"
          >
            {banner.link ? (
              <Link href={banner.link} passHref>
                <div
                  role="link"
                  aria-label={`Navigate to ${banner.title || "Market Banner"}`}
                  className="cursor-pointer"
                >
                  {banner.imageUrl ? (
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title || "Market Banner"}
                      layout="responsive"
                      width={1600} // Adjust based on your design
                      height={400} // Adjust based on your design
                      sizes="(max-width: 640px) 100vw, 
                             (max-width: 768px) 100vw, 
                             (max-width: 1024px) 100vw, 
                             100vw"
                      className="object-cover rounded-lg"
                      priority={index === 0} // Only the first image has priority
                      loading={index === 0 ? "eager" : "lazy"} // Conditional loading
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-lg">
                      <span className="text-gray-500">No Image Available</span>
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div>
                {banner.imageUrl ? (
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title || "Market Banner"}
                    layout="responsive"
                    width={1600} // Adjust based on your design
                    height={400} // Adjust based on your design
                    sizes="(max-width: 640px) 100vw, 
                           (max-width: 768px) 100vw, 
                           (max-width: 1024px) 100vw, 
                           100vw"
                    className="object-cover rounded-lg"
                    priority={index === 0} // Only the first image has priority
                    loading={index === 0 ? "eager" : "lazy"} // Conditional loading
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">No Image Available</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </Slider>
    </div>
  );
}
