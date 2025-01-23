"use client";

import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { useParams, useRouter } from "next/navigation";
import styles from "./Profile.module.css";
import { db, storage, auth } from "../../../../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { jsPDF } from "jspdf";
import Sidebar from "../../components/Sidebar";

// ---------- Helper Functions ---------- //
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate();
  return date.toLocaleString();
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// ---------- Modal Component ---------- //
const Modal = ({ isOpen, onClose, receipt }) => {
  if (!isOpen || !receipt) return null;

  const handleDownloadPDF = () => {
    const docu = new jsPDF();
    docu.setFontSize(16);
    docu.text("Receipt Details", 20, 20);

    docu.setFontSize(12);
    let yOffset = 30;

    for (const [key, value] of Object.entries(receipt)) {
      if (typeof value === "object" && value !== null) {
        docu.text(`${capitalizeFirstLetter(key)}:`, 20, yOffset);
        yOffset += 10;
        for (const [subKey, subValue] of Object.entries(value)) {
          docu.text(
            `${capitalizeFirstLetter(subKey)}: ${subValue}`,
            30,
            yOffset
          );
          yOffset += 10;
        }
      } else {
        docu.text(`${capitalizeFirstLetter(key)}: ${value}`, 20, yOffset);
        yOffset += 10;
      }
      if (yOffset > 280) {
        docu.addPage();
        yOffset = 20;
      }
    }
    docu.save(`receipt_${receipt.id}.pdf`);
  };

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <button className={styles.downloadButton} onClick={handleDownloadPDF}>
          Download Receipt as PDF
        </button>
        <h2>Receipt Details</h2>
        <div className={styles.receiptDetails}>
          <p>
            <strong>Product Name:</strong> {receipt.productName || "N/A"}
          </p>
          <p>
            <strong>Address Line 1:</strong> {receipt.addressLine1 || "N/A"}
          </p>
          <p>
            <strong>Address Line 2:</strong> {receipt.addressLine2 || "N/A"}
          </p>
          <p>
            <strong>City:</strong> {receipt.city || "N/A"}
          </p>
          <p>
            <strong>Country:</strong> {receipt.country || "N/A"}
          </p>
          <p>
            <strong>Currency:</strong> {receipt.currency || "N/A"}
          </p>
          <p>
            <strong>Payment Method:</strong> {receipt.paymentMethod || "N/A"}
          </p>
          <p>
            <strong>Price:</strong> {receipt.currency || "N/A"}{" "}
            {receipt.price || "N/A"}
          </p>
          <p>
            <strong>State:</strong> {receipt.state || "N/A"}
          </p>
          <p>
            <strong>Date:</strong> {formatDate(receipt.timestamp)}
          </p>
          {receipt.location && (
            <p>
              <strong>Location:</strong> Latitude: {receipt.location.latitude},
              Longitude: {receipt.location.longitude}
            </p>
          )}
          <p>
            <strong>Description:</strong> {receipt.description || "N/A"}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ---------- Main Profile Component ---------- //
const Profile = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [userData, setUserData] = useState(null);
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [sellerInfo, setSellerInfo] = useState({
    name: "",
    email: "",
    iban: "",
    phone: "",
  });

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "",
    location: null,
    phoneNumber: "",
  });

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    cardHolderName: "",
    cardNumber: "",
    expiryDate: "",
  });

  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [activeTab, setActiveTab] = useState("General");
  const [receipts, setReceipts] = useState([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [activeSubTab, setActiveSubTab] = useState("Sold Products");
  const [soldTransactions, setSoldTransactions] = useState([]);
  const [boughtTransactions, setBoughtTransactions] = useState([]);
  const [loadingSold, setLoadingSold] = useState(false);
  const [loadingBought, setLoadingBought] = useState(false);

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const authenticatedUser = auth.currentUser;
  const authenticatedUserId = authenticatedUser ? authenticatedUser.uid : null;
  const isOwnProfile = authenticatedUserId === id;

  // ---------- Fetching Data ---------- //
  useEffect(() => {
    if (!id) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          console.log("No such user!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchAddresses = async () => {
      try {
        const addrRef = collection(db, "users", id, "addresses");
        const addrSnap = await getDocs(addrRef);
        const addrs = addrSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAddresses(addrs);
      } catch (error) {
        console.error("Error fetching addresses:", error);
      }
    };

    fetchAddresses();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchPaymentMethods = async () => {
      try {
        const pmRef = collection(db, "users", id, "paymentMethods");
        const pmSnap = await getDocs(pmRef);
        const methods = pmSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPaymentMethods(methods);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    };

    fetchPaymentMethods();
  }, [id]);

  useEffect(() => {
    const fetchReceipts = async () => {
      if (activeTab !== "Receipts" || !id) return;
      setLoadingReceipts(true);
      try {
        const receiptsCol = collection(db, "users", id, "receipts");
        const receiptsSnapshot = await getDocs(receiptsCol);
        const receiptsList = receiptsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReceipts(receiptsList);
      } catch (error) {
        console.error("Error fetching receipts:", error);
      } finally {
        setLoadingReceipts(false);
      }
    };

    fetchReceipts();
  }, [activeTab, id]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!id) return;

      const transactionsRef = collection(db, "users", id, "transactions");

      if (activeSubTab === "Sold Products") {
        setLoadingSold(true);
        try {
          const soldQueryInstance = query(
            transactionsRef,
            where("role", "==", "seller")
          );
          const soldSnapshot = await getDocs(soldQueryInstance);
          const soldList = soldSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const enrichedSoldList = await Promise.all(
            soldList.map(async (transaction) => {
              const buyerDoc = await getDoc(
                doc(db, "users", transaction.buyerId)
              );
              const buyerName = buyerDoc.exists()
                ? buyerDoc.data().displayName
                : "N/A";

              const productDoc = await getDoc(
                doc(db, "products", transaction.productId)
              );
              const productImage = productDoc.exists()
                ? productDoc.data().imageUrl ||
                  (productDoc.data().imageUrls &&
                    productDoc.data().imageUrls[0])
                : "";

              return {
                ...transaction,
                buyerName,
                productImage,
              };
            })
          );

          setSoldTransactions(enrichedSoldList);
        } catch (error) {
          console.error("Error fetching sold transactions:", error);
        } finally {
          setLoadingSold(false);
        }
      }

      if (activeSubTab === "Bought Products") {
        setLoadingBought(true);
        try {
          const boughtQueryInstance = query(
            transactionsRef,
            where("role", "==", "buyer")
          );
          const boughtSnapshot = await getDocs(boughtQueryInstance);
          const boughtList = boughtSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const enrichedBoughtList = await Promise.all(
            boughtList.map(async (transaction) => {
              const sellerDoc = await getDoc(
                doc(db, "users", transaction.sellerId)
              );
              const sellerName = sellerDoc.exists()
                ? sellerDoc.data().displayName
                : "N/A";

              const productDoc = await getDoc(
                doc(db, "products", transaction.productId)
              );
              const productImage = productDoc.exists()
                ? productDoc.data().imageUrl ||
                  (productDoc.data().imageUrls &&
                    productDoc.data().imageUrls[0])
                : "";

              return {
                ...transaction,
                sellerName,
                productImage,
              };
            })
          );

          setBoughtTransactions(enrichedBoughtList);
        } catch (error) {
          console.error("Error fetching bought transactions:", error);
        } finally {
          setLoadingBought(false);
        }
      }
    };

    fetchTransactions();
  }, [activeSubTab, id]);

  // ---------- Handlers ---------- //
  const handleSellerSave = async () => {
    try {
      await setDoc(doc(db, "users", id), { sellerInfo }, { merge: true });
      setUserData({ ...userData, sellerInfo });
      setShowSellerForm(false);
    } catch (error) {
      console.error("Error saving seller info:", error);
    }
  };

  const handleAddressSave = async () => {
    if (!id) return;
    try {
      await addDoc(collection(db, "users", id, "addresses"), {
        addressLine1: newAddress.addressLine1,
        addressLine2: newAddress.addressLine2,
        city: newAddress.city,
        country: newAddress.country,
        phoneNumber: newAddress.phoneNumber,
        location: newAddress.location || null,
      });

      // Refresh addresses
      const addrRef = collection(db, "users", id, "addresses");
      const addrSnap = await getDocs(addrRef);
      const addrs = addrSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAddresses(addrs);

      // Reset form
      setShowAddressForm(false);
      setNewAddress({
        addressLine1: "",
        addressLine2: "",
        city: "",
        country: "",
        location: null,
        phoneNumber: "",
      });
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  const handlePaymentSave = async () => {
    if (!id) return;
    try {
      await addDoc(collection(db, "users", id, "paymentMethods"), {
        cardHolderName: newPaymentMethod.cardHolderName,
        cardNumber: newPaymentMethod.cardNumber,
        expiryDate: newPaymentMethod.expiryDate,
      });

      // Refresh payment methods
      const pmRef = collection(db, "users", id, "paymentMethods");
      const pmSnap = await getDocs(pmRef);
      const methods = pmSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPaymentMethods(methods);

      // Reset form
      setShowPaymentForm(false);
      setNewPaymentMethod({
        cardHolderName: "",
        cardNumber: "",
        expiryDate: "",
      });
    } catch (error) {
      console.error("Error saving payment method:", error);
    }
  };

  const handleAddPhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!authenticatedUserId) {
      console.error("User is not authenticated.");
      return;
    }

    setUploading(true);
    try {
      const fileRef = storageRef(
        storage,
        `profileImages/${authenticatedUserId}`
      );
      await uploadBytes(fileRef, file);

      const downloadURL = await getDownloadURL(fileRef);
      await setDoc(
        doc(db, "users", authenticatedUserId),
        { profileImage: downloadURL },
        { merge: true }
      );

      setUserData({ ...userData, profileImage: downloadURL });
    } catch (error) {
      console.error("Error uploading profile image:", error);
    } finally {
      setUploading(false);
    }
  };

  // --- "User Profile" button next to user's name --- //
  const handleUserProfileClick = () => {
    router.push(`/userprofile/${id}`);
  };

  if (!userData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  const canUpgrade = userData.subscriptionPlan !== "Level 4";
  const canCancel = userData.subscriptionPlan !== "Level 1";

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        {/* --------- HEADER / PROFILE INFO --------- */}
        <div className={styles.profileHeader}>
          <div className={styles.userPhotoSection}>
            {userData.profileImage ? (
              <img
                src={userData.profileImage}
                alt="Profile"
                className={styles.profileImage}
              />
            ) : (
              isOwnProfile && (
                <div
                  className={styles.addPhotoContainer}
                  onClick={handleAddPhotoClick}
                  title="Add Profile Photo"
                >
                  <span className={styles.plusIcon}>+</span>
                  <p>Add Photo</p>
                </div>
              )
            )}
            {isOwnProfile && (
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
            )}
            {uploading && (
              <div className={styles.uploadingOverlay}>
                <div className={styles.uploadingSpinner}></div>
                <p>Uploading...</p>
              </div>
            )}
          </div>

          <div className={styles.userSummary}>
            <div className={styles.userHeading}>
              <h2 className={styles.userName}>{userData.displayName}</h2>
              {isOwnProfile && (
                <button
                  className={styles.userProfileButton}
                  onClick={handleUserProfileClick}
                >
                  User Profile
                </button>
              )}
            </div>
            <p className={styles.userDetail}>Email: {userData.email}</p>
            <p className={styles.userDetail}>Phone: {userData.phone}</p>
          </div>
        </div>

        {/* --------- TABS --------- */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "General" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("General")}
          >
            General
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "Receipts" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("Receipts")}
          >
            Receipts
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "Transactions" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("Transactions")}
          >
            Transactions
          </button>
        </div>

        {/* --------- TAB CONTENT --------- */}
        <div className={styles.tabContent}>
          {/* --------- GENERAL TAB --------- */}
          {activeTab === "General" && (
            <div className={styles.cardsWrapper}>
              {/* Subscription Card */}
              <div className={styles.card}>
                <h3>Subscription Plan</h3>
                <p>
                  <strong>Plan:</strong> {userData.subscriptionPlan || "N/A"}
                </p>
                <p>
                  <strong>Auto Renew:</strong>{" "}
                  {userData.subscriptionAutoRenew ? "Enabled" : "Disabled"}
                </p>
                <p>
                  <strong>Cancel at Period End:</strong>{" "}
                  {userData.subscriptionCancelAtPeriodEnd ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Start Date:</strong>{" "}
                  {formatDate(userData.subscriptionStartDate)}
                </p>
                <div className={styles.buttonGroup}>
                  {canUpgrade && (
                    <button
                      className={`${styles.button} ${styles.upgradeButton}`}
                    >
                      Upgrade
                    </button>
                  )}
                  {canCancel && (
                    <button
                      className={`${styles.button} ${styles.cancelSubscriptionButton}`}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Seller Card */}
              <div className={styles.card}>
                <h3>Seller Info</h3>
                {userData.sellerInfo ? (
                  <div className={styles.infoDisplay}>
                    <p>
                      <strong>Name:</strong> {userData.sellerInfo.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {userData.sellerInfo.email}
                    </p>
                    <p>
                      <strong>IBAN:</strong> {userData.sellerInfo.iban}
                    </p>
                    <p>
                      <strong>Phone:</strong> {userData.sellerInfo.phone}
                    </p>
                  </div>
                ) : showSellerForm ? (
                  <div className={styles.formContainer}>
                    <input
                      type="text"
                      placeholder="Name"
                      value={sellerInfo.name}
                      onChange={(e) =>
                        setSellerInfo({ ...sellerInfo, name: e.target.value })
                      }
                      className={styles.inputField}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={sellerInfo.email}
                      onChange={(e) =>
                        setSellerInfo({ ...sellerInfo, email: e.target.value })
                      }
                      className={styles.inputField}
                    />
                    <input
                      type="text"
                      placeholder="IBAN"
                      value={sellerInfo.iban}
                      onChange={(e) =>
                        setSellerInfo({ ...sellerInfo, iban: e.target.value })
                      }
                      className={styles.inputField}
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={sellerInfo.phone}
                      onChange={(e) =>
                        setSellerInfo({ ...sellerInfo, phone: e.target.value })
                      }
                      className={styles.inputField}
                    />
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={handleSellerSave}
                        className={`${styles.button} ${styles.saveButton}`}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowSellerForm(false)}
                        className={`${styles.button} ${styles.cancelButton}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={styles.addButton}
                    onClick={() => setShowSellerForm(true)}
                  >
                    <span className={styles.plusIcon}>+</span>
                    <p>Add Seller Info</p>
                  </div>
                )}
              </div>

              {/* Addresses Card */}
              <div className={styles.card}>
                <h3>Addresses</h3>
                {addresses && addresses.length > 0 ? (
                  <div className={styles.infoDisplay}>
                    {addresses.map((address) => (
                      <div key={address.id} className={styles.listItem}>
                        <p>
                          <strong>Address:</strong> {address.addressLine1},{" "}
                          {address.addressLine2 || "N/A"}
                        </p>
                        <p>
                          <strong>City/Country:</strong> {address.city},{" "}
                          {address.country}
                        </p>
                        <p>
                          <strong>Phone:</strong> {address.phoneNumber}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : showAddressForm ? (
                  <div className={styles.formContainer}>
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      value={newAddress.addressLine1}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          addressLine1: e.target.value,
                        })
                      }
                      className={styles.inputField}
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2"
                      value={newAddress.addressLine2}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          addressLine2: e.target.value,
                        })
                      }
                      className={styles.inputField}
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                      className={styles.inputField}
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={newAddress.country}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          country: e.target.value,
                        })
                      }
                      className={styles.inputField}
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={newAddress.phoneNumber}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          phoneNumber: e.target.value,
                        })
                      }
                      className={styles.inputField}
                    />
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={handleAddressSave}
                        className={`${styles.button} ${styles.saveButton}`}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className={`${styles.button} ${styles.cancelButton}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={styles.addButton}
                    onClick={() => setShowAddressForm(true)}
                  >
                    <span className={styles.plusIcon}>+</span>
                    <p>Add Address</p>
                  </div>
                )}
              </div>

              {/* Payment Methods Card */}
              <div className={styles.card}>
                <h3>Payment Methods</h3>
                {paymentMethods && paymentMethods.length > 0 ? (
                  <div className={styles.infoDisplay}>
                    {paymentMethods.map((method) => (
                      <div key={method.id} className={styles.listItem}>
                        <p>
                          <strong>Card Holder:</strong>{" "}
                          {method.cardHolderName || "N/A"}
                        </p>
                        <p>
                          <strong>Card Number:</strong>{" "}
                          {method.cardNumber || "N/A"}
                        </p>
                        <p>
                          <strong>Expiry Date:</strong>{" "}
                          {method.expiryDate || "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : showPaymentForm ? (
                  <div className={styles.formContainer}>
                    <input
                      type="text"
                      placeholder="Card Holder Name"
                      value={newPaymentMethod.cardHolderName}
                      onChange={(e) =>
                        setNewPaymentMethod({
                          ...newPaymentMethod,
                          cardHolderName: e.target.value,
                        })
                      }
                      className={styles.inputField}
                    />
                    <input
                      type="text"
                      placeholder="Card Number"
                      value={newPaymentMethod.cardNumber}
                      onChange={(e) =>
                        setNewPaymentMethod({
                          ...newPaymentMethod,
                          cardNumber: e.target.value,
                        })
                      }
                      className={styles.inputField}
                    />
                    <input
                      type="text"
                      placeholder="Expiry Date (MM/YY)"
                      value={newPaymentMethod.expiryDate}
                      onChange={(e) =>
                        setNewPaymentMethod({
                          ...newPaymentMethod,
                          expiryDate: e.target.value,
                        })
                      }
                      className={styles.inputField}
                    />
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={handlePaymentSave}
                        className={`${styles.button} ${styles.saveButton}`}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowPaymentForm(false)}
                        className={`${styles.button} ${styles.cancelButton}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={styles.addButton}
                    onClick={() => setShowPaymentForm(true)}
                  >
                    <span className={styles.plusIcon}>+</span>
                    <p>Add Payment Method</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --------- RECEIPTS TAB --------- */}
          {activeTab === "Receipts" && (
            <div className={styles.sectionWrapper}>
              <h3>All Receipts</h3>
              {loadingReceipts ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                </div>
              ) : receipts.length > 0 ? (
                <div className={styles.receiptsList}>
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className={styles.receiptItem}
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        setIsModalOpen(true);
                      }}
                    >
                      <p>
                        <strong>Product:</strong> {receipt.productName || "N/A"}
                      </p>
                      <p>
                        <strong>Date:</strong> {formatDate(receipt.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No receipts available.</p>
              )}
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                receipt={selectedReceipt}
              />
            </div>
          )}

          {/* --------- TRANSACTIONS TAB --------- */}
          {activeTab === "Transactions" && (
            <div className={styles.sectionWrapper}>
              <h3>Transactions</h3>
              <div className={styles.subTabsContainer}>
                <button
                  className={`${styles.subTabButton} ${
                    activeSubTab === "Sold Products" ? styles.activeSubTab : ""
                  }`}
                  onClick={() => setActiveSubTab("Sold Products")}
                >
                  Sold Products
                </button>
                <button
                  className={`${styles.subTabButton} ${
                    activeSubTab === "Bought Products"
                      ? styles.activeSubTab
                      : ""
                  }`}
                  onClick={() => setActiveSubTab("Bought Products")}
                >
                  Bought Products
                </button>
              </div>
              <div className={styles.subTabContent}>
                {activeSubTab === "Sold Products" && (
                  <>
                    {loadingSold ? (
                      <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                      </div>
                    ) : soldTransactions.length > 0 ? (
                      <div className={styles.transactionsList}>
                        {soldTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className={styles.transactionItem}
                          >
                            {transaction.productImage && (
                              <img
                                src={transaction.productImage}
                                alt={transaction.productName}
                                className={styles.productImage}
                              />
                            )}
                            <div className={styles.transactionDetails}>
                              <p>
                                <strong>Product:</strong>{" "}
                                {transaction.productName || "N/A"}
                              </p>
                              <p>
                                <strong>Buyer:</strong> {transaction.buyerName}
                              </p>
                              <p>
                                <strong>Price:</strong> {transaction.currency}{" "}
                                {transaction.price}
                              </p>
                              <p>
                                <strong>Quantity:</strong>{" "}
                                {transaction.quantity}
                              </p>
                              <p>
                                <strong>Shipment Status:</strong>{" "}
                                {transaction.shipmentStatus}
                              </p>
                              <p>
                                <strong>Date:</strong>{" "}
                                {formatDate(transaction.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No sold products found.</p>
                    )}
                  </>
                )}
                {activeSubTab === "Bought Products" && (
                  <>
                    {loadingBought ? (
                      <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                      </div>
                    ) : boughtTransactions.length > 0 ? (
                      <div className={styles.transactionsList}>
                        {boughtTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className={styles.transactionItem}
                          >
                            {transaction.productImage && (
                              <img
                                src={transaction.productImage}
                                alt={transaction.productName}
                                className={styles.productImage}
                              />
                            )}
                            <div className={styles.transactionDetails}>
                              <p>
                                <strong>Product:</strong>{" "}
                                {transaction.productName || "N/A"}
                              </p>
                              <p>
                                <strong>Seller:</strong>{" "}
                                {transaction.sellerName}
                              </p>
                              <p>
                                <strong>Price:</strong> {transaction.currency}{" "}
                                {transaction.price}
                              </p>
                              <p>
                                <strong>Quantity:</strong>{" "}
                                {transaction.quantity}
                              </p>
                              <p>
                                <strong>Shipment Status:</strong>{" "}
                                {transaction.shipmentStatus}
                              </p>
                              <p>
                                <strong>Date:</strong>{" "}
                                {formatDate(transaction.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No bought products found.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
