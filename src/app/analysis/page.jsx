"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "../../../lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

// ============ Some small UI sub-components ============

function StatCard({ title, value, valueColor = "#00A86B" }) {
  return (
    <div className="border rounded-md p-4 bg-secondaryBackground text-foreground mb-4 shadow-sm">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-xl" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  );
}

function ProductStatCard({ title, product, value, accentColor = "#FF7F50" }) {
  if (!product) return null;
  return (
    <div className="border rounded-md p-4 bg-secondaryBackground text-foreground mb-4 shadow-sm flex gap-4">
      <div className="min-w-[50px] min-h-[50px]">
        {product.imageUrls?.length > 0 ? (
          <img
            src={product.imageUrls[0]}
            alt="Product"
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-300 text-gray-600 flex items-center justify-center rounded">
            <span className="text-sm">No img</span>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-lg">{title}</h4>
          <p className="text-sm text-gray-400">{product?.productName}</p>
          <p className="text-sm text-gray-400">
            Price: {product?.price} {product?.currency}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end justify-center">
        <p className="text-base font-semibold" style={{ color: accentColor }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function MostSoldProductCard({
  product,
  soldQuantity,
  accentColor = "#FF7F50",
}) {
  if (!product) return null;
  return (
    <div className="border rounded-md p-4 bg-secondaryBackground text-foreground mb-4 shadow-sm flex gap-4">
      <div className="min-w-[50px] min-h-[50px]">
        {product.imageUrls?.length > 0 ? (
          <img
            src={product.imageUrls[0]}
            alt="Product"
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-300 text-gray-600 flex items-center justify-center rounded">
            <span className="text-sm">No img</span>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-lg">Most Sold Product</h4>
          <p className="text-sm text-gray-400">{product?.productName}</p>
          <p className="text-sm text-gray-400">
            Price: {product?.price} {product?.currency}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end justify-center">
        <p className="text-base font-semibold" style={{ color: accentColor }}>
          {soldQuantity} sold
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Rating: {product?.averageRating?.toFixed(1) || "--"} ★
        </p>
        <p className="text-xs text-gray-500">
          ({product?.reviewCount || 0} reviews)
        </p>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const router = useRouter();

  // Identify current user
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  // If no user, you could redirect or show a message
  useEffect(() => {
    if (!userId) {
      router.push("/login"); // Or show an unauthorized message
    }
  }, [userId, router]);

  // ============ States ============

  // We’ll store user’s products, user’s transactions, etc.
  const [userProducts, setUserProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Date range
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState(new Date());

  const [loading, setLoading] = useState(false);

  // Stats
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [earningsOverTime, setEarningsOverTime] = useState({}); // { dateKey: sumEarnings }
  const [currency, setCurrency] = useState("TRY");

  // Product-based stats
  const [mostSoldProduct, setMostSoldProduct] = useState(null);
  const [mostSoldQuantity, setMostSoldQuantity] = useState(0);

  const [mostClickedProduct, setMostClickedProduct] = useState(null);
  const [mostFavoritedProduct, setMostFavoritedProduct] = useState(null);
  const [mostAddedToCartProduct, setMostAddedToCartProduct] = useState(null);
  const [highestRatedProduct, setHighestRatedProduct] = useState(null);

  // ============ Effect: Fetch data ============

  useEffect(() => {
    if (!userId) return;
    fetchAllStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ============ Methods ============

  async function fetchAllStats() {
    try {
      setLoading(true);

      // 1) fetch all user’s products
      const productsRef = collection(db, "products");
      const qProd = query(productsRef, where("userId", "==", userId));
      const prodSnap = await getDocs(qProd);
      let loadedProducts = prodSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 2) fetch all user’s transactions
      const transRef = collection(db, "users", userId, "transactions");
      // We might fetch them all and then filter by role
      const transSnap = await getDocs(transRef);
      let loadedTransactions = transSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUserProducts(loadedProducts);
      setTransactions(loadedTransactions);

      // 3) Derive currency
      let derivedCurrency = "TRY";
      // Try to find any transaction with a currency field
      const firstTransWithCurrency = loadedTransactions.find(
        (tx) => tx.currency
      );
      if (firstTransWithCurrency) {
        derivedCurrency = firstTransWithCurrency.currency;
      } else {
        // or from userProducts
        const firstProdWithCurrency = loadedProducts.find((p) => p.currency);
        if (firstProdWithCurrency) {
          derivedCurrency = firstProdWithCurrency.currency;
        }
      }
      setCurrency(derivedCurrency);

      // 4) Compute stats
      computeStats(loadedProducts, loadedTransactions, derivedCurrency);
    } catch (err) {
      console.error("Error fetching analysis data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Recompute stats (like when date changes)
  async function handleDateChange() {
    // We only recalc the "earningsOverTime" or "totalEarnings" that fall within the chosen date range.
    computeStats(userProducts, transactions, currency);
  }

  function computeStats(loadedProducts, loadedTransactions, usedCurrency) {
    // 1) total earnings (from transactions with role === "seller" & quantity > 0)
    let total = 0;
    const sellerTransactions = loadedTransactions.filter(
      (tx) => tx.role === "seller" && tx.quantity > 0
    );
    sellerTransactions.forEach((tx) => {
      // If we want to consider only transactions within [startDate, endDate]:
      const txDate = tx.timestamp?.toDate?.();
      if (!txDate) return;

      if (txDate >= startDate && txDate <= endDate) {
        total += (tx.price || 0) * (tx.quantity || 0);
      }
    });
    setTotalEarnings(total);

    // 2) earningsOverTime => { dateKey: totalEarningsForThatDate }
    let eot = {};
    sellerTransactions.forEach((tx) => {
      const txDate = tx.timestamp?.toDate?.();
      if (!txDate) return;
      // Within selected date range
      if (txDate >= startDate && txDate <= endDate) {
        const dateKey = new Date(
          txDate.getFullYear(),
          txDate.getMonth(),
          txDate.getDate()
        ).getTime(); // or store as number
        const sum = (tx.price || 0) * (tx.quantity || 0);
        if (!eot[dateKey]) {
          eot[dateKey] = 0;
        }
        eot[dateKey] += sum;
      }
    });
    // Then we fill missing days if needed (optional).
    // For simplicity, we skip that in this snippet:
    setEarningsOverTime(eot);

    // 3) most sold product
    let productSalesCount = {};
    sellerTransactions.forEach((tx) => {
      const txDate = tx.timestamp?.toDate?.();
      if (!txDate) return;
      if (txDate < startDate || txDate > endDate) return; // outside range
      const productId = tx.productId;
      const quantity = tx.quantity;
      if (!productSalesCount[productId]) {
        productSalesCount[productId] = 0;
      }
      productSalesCount[productId] += quantity;
    });
    if (Object.keys(productSalesCount).length === 0) {
      setMostSoldProduct(null);
      setMostSoldQuantity(0);
    } else {
      const sorted = Object.entries(productSalesCount).sort(
        (a, b) => b[1] - a[1]
      );
      const [topProductId, topQuantity] = sorted[0];
      const topProduct = loadedProducts.find((p) => p.id === topProductId);
      setMostSoldProduct(topProduct || null);
      setMostSoldQuantity(topQuantity);
    }

    // 4) compute mostClickedProduct, mostFavoritedProduct, etc.
    if (!loadedProducts.length) {
      setMostClickedProduct(null);
      setMostFavoritedProduct(null);
      setMostAddedToCartProduct(null);
      setHighestRatedProduct(null);
    } else {
      // mostClicked
      const mc = [...loadedProducts].sort((a, b) => {
        return (b.clickCount || 0) - (a.clickCount || 0);
      })[0];
      setMostClickedProduct(mc);

      // mostFavorited
      const mf = [...loadedProducts].sort((a, b) => {
        return (b.favoritesCount || 0) - (a.favoritesCount || 0);
      })[0];
      setMostFavoritedProduct(mf);

      // mostAddedToCart
      const mac = [...loadedProducts].sort((a, b) => {
        return (b.cartCount || 0) - (a.cartCount || 0);
      })[0];
      setMostAddedToCartProduct(mac);

      // highestRated
      const hr = [...loadedProducts].sort((a, b) => {
        return (b.averageRating || 0) - (a.averageRating || 0);
      })[0];
      setHighestRatedProduct(hr);
    }
  }

  // Prepare data for the line chart from `earningsOverTime`
  const chartLabels = Object.keys(earningsOverTime)
    .map((key) => parseInt(key))
    .sort((a, b) => a - b);

  const chartDataValues = chartLabels.map(
    (timestamp) => earningsOverTime[timestamp]
  );

  const data = {
    labels: chartLabels.map((ts) => {
      const d = new Date(ts);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
    datasets: [
      {
        fill: true,
        label: "Earnings",
        data: chartDataValues,
        borderColor: "#4f46e5", // e.g. Indigo
        backgroundColor: "rgba(79, 70, 229, 0.2)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "var(--foreground)", // adapt to dark/light
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "var(--foreground)",
        },
      },
      y: {
        ticks: {
          color: "var(--foreground)",
        },
      },
    },
  };

  return (
    <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />

      <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* If loading */}
        {loading && (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* If not authorized */}
        {!userId ? (
          <div className="flex justify-center items-center h-full">
            <p>You are not authorized to view this page.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Sales Statistics</h1>

              {/* Premium icon, date range pickers, etc. */}
              <div className="flex gap-2">{/* ... */}</div>
            </div>

            {/* If no transactions, show a message */}
            {transactions.length === 0 ? (
              <div className="mt-10 text-center">
                <p>No data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1) Total Earnings */}
                <StatCard
                  title="Total Earnings"
                  value={`${totalEarnings.toFixed(2)} ${currency}`}
                  valueColor="#00A86B"
                />

                {/* 2) Earnings Chart */}
                <div className="border rounded-md p-4 bg-secondaryBackground text-foreground shadow-sm">
                  <h2 className="mb-2 font-semibold">Earnings Over Time</h2>
                  <div className="w-full h-64">
                    {chartLabels.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-500">
                          No earnings data available.
                        </p>
                      </div>
                    ) : (
                      <Line data={data} options={options} />
                    )}
                  </div>
                </div>

                {/* 3) Most Sold Product */}
                <MostSoldProductCard
                  product={mostSoldProduct}
                  soldQuantity={mostSoldQuantity}
                />

                {/* 4) Most Clicked Product */}
                <ProductStatCard
                  title="Most Clicked Product"
                  product={mostClickedProduct}
                  value={mostClickedProduct?.clickCount?.toString() || "0"}
                />

                {/* 5) Most Favorited Product */}
                <ProductStatCard
                  title="Most Favorited Product"
                  product={mostFavoritedProduct}
                  value={
                    mostFavoritedProduct?.favoritesCount?.toString() || "0"
                  }
                />

                {/* 6) Most Added to Cart */}
                <ProductStatCard
                  title="Most Added to Cart Product"
                  product={mostAddedToCartProduct}
                  value={mostAddedToCartProduct?.cartCount?.toString() || "0"}
                />

                {/* 7) Highest Rated Product */}
                <ProductStatCard
                  title="Highest Rated Product"
                  product={highestRatedProduct}
                  value={
                    highestRatedProduct
                      ? `${highestRatedProduct.averageRating?.toFixed(1)} ★`
                      : "0 ★"
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
