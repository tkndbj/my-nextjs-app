// src/app/myproducts/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  // We remove startAt, endAt for local filtering approach
} from "firebase/firestore";
import Image from "next/image";
import Sidebar from "../../components/Sidebar";
import Countdown from "../../components/Countdown";
import { FaStar, FaStarHalfAlt, FaRegStar, FaPlus } from "react-icons/fa";

// NEW COMPONENTS
import ProductCard2 from "../../components/ProductCard2";
import PropertyCard2 from "../../components/PropertyCard2";
import SoldProductCard from "../../components/SoldProductCard";
import BoughtProductCard from "../../components/BoughtProductCard";

/** Helper: Format Firestore timestamp -> string */
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate();
  return date.toLocaleString();
};

export default function MyProductsPage() {
  const params = useParams();
  const router = useRouter();

  // Identify user
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  // Route param (the [id] in /myproducts/[id])
  const id = params?.id;

  // Check ownership
  const isOwnPage = userId === id;

  // MAIN tabs: "products", "properties"
  const [activeMainTab, setActiveMainTab] = useState("products");

  // SUB tabs (only for products): "Listed", "Sold", "Bought"
  const subTabs = ["Listed", "Sold", "Bought"];
  const [activeSubTab, setActiveSubTab] = useState("Listed");

  // ---- SEARCH STATES ----
  // For "Listed" products
  const [searchListed, setSearchListed] = useState("");
  // For "Sold" products
  const [searchSold, setSearchSold] = useState("");
  // For "Bought" products
  const [searchBought, setSearchBought] = useState("");
  // For "Properties"
  const [searchProperties, setSearchProperties] = useState("");

  // ============= PRODUCTS data =============
  const [listedProducts, setListedProducts] = useState([]);
  const [loadingListed, setLoadingListed] = useState(false);

  const [soldTransactions, setSoldTransactions] = useState([]);
  const [loadingSold, setLoadingSold] = useState(false);

  const [boughtTransactions, setBoughtTransactions] = useState([]);
  const [loadingBought, setLoadingBought] = useState(false);

  // ============ PROPERTIES data ============
  const [userProperties, setUserProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // -----------------------------
  // HOOK: Fetch Listed Products
  // -----------------------------
  useEffect(() => {
    if (!isOwnPage) return;
    if (!id) return;
    if (activeMainTab !== "products") return;
    if (activeSubTab !== "Listed") return;

    async function fetchListedProducts() {
      setLoadingListed(true);
      try {
        const productsRef = collection(db, "products");
        // First, get all products for this user (ordered by createdAt)
        const qListed = query(
          productsRef,
          where("userId", "==", id),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(qListed);
        let products = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Then local-filter by searchListed
        if (searchListed.trim() !== "") {
          const searchLower = searchListed.trim().toLowerCase();

          products = products.filter((p) => {
            const name = p.productName?.toLowerCase() || "";
            const brand = p.brandModel?.toLowerCase() || "";
            return name.includes(searchLower) || brand.includes(searchLower);
          });
        }

        setListedProducts(products);
      } catch (error) {
        console.error("Error fetching listed products:", error);
      } finally {
        setLoadingListed(false);
      }
    }

    fetchListedProducts();
  }, [id, isOwnPage, activeMainTab, activeSubTab, searchListed]);

  // -----------------------------
  // HOOK: Fetch Sold Products
  // -----------------------------
  useEffect(() => {
    if (!isOwnPage) return;
    if (!id) return;
    if (activeMainTab !== "products") return;
    if (activeSubTab !== "Sold") return;

    async function fetchSoldTransactions() {
      setLoadingSold(true);
      try {
        const transactionsRef = collection(db, "users", id, "transactions");
        // We'll fetch all sold transactions for now
        const qSold = query(
          transactionsRef,
          where("role", "==", "seller"),
          orderBy("timestamp", "desc")
        );

        const snapshot = await getDocs(qSold);
        const transactions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Enrich with productName, brandModel, productImage
        const enriched = [];
        for (const t of transactions) {
          let productData = null;
          if (t.productId) {
            const productDoc = await getDoc(doc(db, "products", t.productId));
            if (productDoc.exists()) {
              productData = productDoc.data();
            }
          }

          enriched.push({
            ...t,
            productImage:
              productData?.imageUrl ||
              (productData?.imageUrls && productData.imageUrls[0]) ||
              "",
            productName: productData?.productName || "",
            brandModel: productData?.brandModel || "",
          });
        }

        // Local-filter by searchSold => check productName/brandModel
        let filtered = enriched;
        if (searchSold.trim() !== "") {
          const searchLower = searchSold.trim().toLowerCase();
          filtered = enriched.filter((t) => {
            const name = t.productName.toLowerCase();
            const brand = t.brandModel.toLowerCase();
            return name.includes(searchLower) || brand.includes(searchLower);
          });
        }

        setSoldTransactions(filtered);
      } catch (error) {
        console.error("Error fetching sold products:", error);
      } finally {
        setLoadingSold(false);
      }
    }

    fetchSoldTransactions();
  }, [id, isOwnPage, activeMainTab, activeSubTab, searchSold]);

  // -----------------------------
  // HOOK: Fetch Bought Products
  // -----------------------------
  useEffect(() => {
    if (!isOwnPage) return;
    if (!id) return;
    if (activeMainTab !== "products") return;
    if (activeSubTab !== "Bought") return;

    async function fetchBoughtTransactions() {
      setLoadingBought(true);
      try {
        const transactionsRef = collection(db, "users", id, "transactions");
        // We'll fetch all "bought" transactions
        const qBought = query(
          transactionsRef,
          where("role", "==", "buyer"),
          orderBy("timestamp", "desc")
        );

        const snapshot = await getDocs(qBought);
        const transactions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Enrich with productName, brandModel, productImage
        const enriched = [];
        for (const t of transactions) {
          let productData = null;
          if (t.productId) {
            const productDoc = await getDoc(doc(db, "products", t.productId));
            if (productDoc.exists()) {
              productData = productDoc.data();
            }
          }
          enriched.push({
            ...t,
            productImage:
              productData?.imageUrl ||
              (productData?.imageUrls && productData.imageUrls[0]) ||
              "",
            productName: productData?.productName || "",
            brandModel: productData?.brandModel || "",
          });
        }

        // Local-filter by searchBought => check productName/brandModel
        let filtered = enriched;
        if (searchBought.trim() !== "") {
          const searchLower = searchBought.trim().toLowerCase();
          filtered = enriched.filter((t) => {
            const name = t.productName.toLowerCase();
            const brand = t.brandModel.toLowerCase();
            return name.includes(searchLower) || brand.includes(searchLower);
          });
        }

        setBoughtTransactions(filtered);
      } catch (error) {
        console.error("Error fetching bought products:", error);
      } finally {
        setLoadingBought(false);
      }
    }

    fetchBoughtTransactions();
  }, [id, isOwnPage, activeMainTab, activeSubTab, searchBought]);

  // -----------------------------
  // HOOK: Fetch User Properties
  // -----------------------------
  useEffect(() => {
    if (!isOwnPage) return;
    if (!id) return;
    if (activeMainTab !== "properties") return;

    async function fetchProperties() {
      setLoadingProperties(true);
      try {
        const propsRef = collection(db, "properties");
        // We can do a similar local filter approach for properties if we want
        const qProps = query(propsRef, where("userId", "==", id));
        const snap = await getDocs(qProps);
        let items = snap.docs.map((ds) => ({
          id: ds.id,
          ...ds.data(),
        }));

        // local filter if searchProperties is not empty
        if (searchProperties.trim() !== "") {
          const searchLower = searchProperties.trim().toLowerCase();
          // Suppose property doc has a "title" or "propertyName" field
          items = items.filter((prop) => {
            const propName = (
              prop.title ||
              prop.propertyName ||
              ""
            ).toLowerCase();
            return propName.includes(searchLower);
          });
        }

        setUserProperties(items);
      } catch (err) {
        console.error("Error fetching user properties:", err);
      } finally {
        setLoadingProperties(false);
      }
    }
    fetchProperties();
  }, [id, isOwnPage, activeMainTab, searchProperties]);

  // ============= ACTIONS for "Listed" products =============
  async function handleRemove(productId) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this product?"
    );
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, "products", productId));
      setListedProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error) {
      console.error("Error removing product:", error);
      alert("Failed to remove product. Please try again.");
    }
  }

  function handleEdit(productId) {
    router.push(`/editproduct/${productId}`);
  }

  function handleBoost(productId, isBoosted) {
    if (isBoosted) {
      alert("Boost is already active for this product.");
      return;
    }
    router.push(`/boost?type=product&id=${productId}`);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex">
      <Sidebar />

      <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto transition-all duration-300">
        {/* Check if unauthorized */}
        {!isOwnPage ? (
          <div className="flex justify-center items-center h-full">
            <p>You are not authorized to view this page.</p>
          </div>
        ) : (
          <>
            {/* MAIN tabs row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveMainTab("products")}
                  className={`px-4 py-2 transition-colors duration-200 font-semibold
                    ${
                      activeMainTab === "products"
                        ? "bg-jade-green text-white"
                        : "bg-secondaryBackground text-foreground hover:bg-secondaryBackground/80"
                    }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setActiveMainTab("properties")}
                  className={`px-4 py-2 transition-colors duration-200 font-semibold
                    ${
                      activeMainTab === "properties"
                        ? "bg-jade-green text-white"
                        : "bg-secondaryBackground text-foreground hover:bg-secondaryBackground/80"
                    }`}
                >
                  Properties
                </button>
              </div>

              {/* "Analysis" button aligned to the right */}
              <button
                onClick={() => router.push("/analysis")}
                className="px-4 py-2 transition-colors duration-200 font-semibold bg-secondaryBackground text-foreground hover:bg-secondaryBackground/80"
              >
                Analysis
              </button>
            </div>

            {/* If "products" is selected => show the sub-tabs */}
            {activeMainTab === "products" && (
              <>
                <div className="flex space-x-2 border-b mb-6 transition-all duration-300">
                  {subTabs.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setActiveSubTab(sub)}
                      className={`px-4 py-2 focus:outline-none transition-all duration-300
                        ${
                          activeSubTab === sub
                            ? "bg-jade-green text-white"
                            : "bg-secondaryBackground text-foreground hover:bg-secondaryBackground/80"
                        }`}
                    >
                      {sub} Products
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* MAIN TAB CONTENT */}
            {activeMainTab === "products" ? (
              <>
                {/* LISTED PRODUCTS */}
                {activeSubTab === "Listed" && (
                  <>
                    {/* Search box for "Listed" */}
                    <div className="mb-4">
                      <input
                        type="text"
                        value={searchListed}
                        onChange={(e) => setSearchListed(e.target.value)}
                        placeholder="Search listed products..."
                        className="w-full px-4 py-2 border rounded"
                      />
                    </div>

                    {loadingListed ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : listedProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {listedProducts.map((product) => (
                          <ProductCard2
                            key={product.id}
                            product={product}
                            onEdit={() => handleEdit(product.id)}
                            onBoost={() =>
                              handleBoost(product.id, product.isBoosted)
                            }
                            onRemove={() => handleRemove(product.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p>No listed products found.</p>
                    )}
                  </>
                )}

                {/* SOLD PRODUCTS */}
                {activeSubTab === "Sold" && (
                  <>
                    {/* Search box for "Sold" */}
                    <div className="mb-4">
                      <input
                        type="text"
                        value={searchSold}
                        onChange={(e) => setSearchSold(e.target.value)}
                        placeholder="Search sold products..."
                        className="w-full px-4 py-2 border rounded"
                      />
                    </div>

                    {loadingSold ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : soldTransactions.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {soldTransactions.map((t) => (
                          <SoldProductCard
                            key={t.id}
                            soldItem={t}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    ) : (
                      <p>No sold products found.</p>
                    )}
                  </>
                )}

                {/* BOUGHT PRODUCTS */}
                {activeSubTab === "Bought" && (
                  <>
                    {/* Search box for "Bought" */}
                    <div className="mb-4">
                      <input
                        type="text"
                        value={searchBought}
                        onChange={(e) => setSearchBought(e.target.value)}
                        placeholder="Search bought products..."
                        className="w-full px-4 py-2 border rounded"
                      />
                    </div>

                    {loadingBought ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : boughtTransactions.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {boughtTransactions.map((t) => (
                          <BoughtProductCard
                            key={t.id}
                            boughtItem={t}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    ) : (
                      <p>No bought products found.</p>
                    )}
                  </>
                )}
              </>
            ) : (
              // PROPERTIES TAB
              <>
                {/* Search box for "Properties" */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchProperties}
                    onChange={(e) => setSearchProperties(e.target.value)}
                    placeholder="Search properties..."
                    className="w-full px-4 py-2 border rounded"
                  />
                </div>

                {loadingProperties ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : userProperties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {userProperties.map((prop) => (
                      <PropertyCard2
                        key={prop.id}
                        property={prop}
                        // If you want to enable remove/edit/boost for properties,
                        // define or reuse similar handlers:
                        // onEdit={() => handleEditProperty(prop.id)}
                        // onBoost={() => handleBoostProperty(prop.id, prop.isBoosted)}
                        // onRemove={() => handleRemoveProperty(prop.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p>No properties found.</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
