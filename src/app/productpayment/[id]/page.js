"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth, functions } from "../../../../lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { onAuthStateChanged } from "firebase/auth";

import {
  FaChevronUp,
  FaChevronDown,
  FaMapMarkerAlt,
  FaCreditCard,
  FaPlay,
  FaBoxOpen,
} from "react-icons/fa";

import MapPicker from "../../components/MapPicker"; // Adjust path as needed
import styles from "./Productpayment.module.css";

export default function ProductPaymentPage() {
  const { id: productId } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);

  // State for PlayPoints
  const [playPoints, setPlayPoints] = useState(0);
  const [usePlayPoints, setUsePlayPoints] = useState(false);

  // Saved Payment Methods
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);

  // Payment Form
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [savePaymentDetails, setSavePaymentDetails] = useState(false);

  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Address Form
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [saveAddress, setSaveAddress] = useState(false);

  // Panels
  const [isAddressExpanded, setIsAddressExpanded] = useState(true);
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(true);
  const [isPlayPointExpanded, setIsPlayPointExpanded] = useState(true);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false); // new state for map selection

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!productId) return;
    const fetchProduct = async () => {
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        setProduct({ id: productSnap.id, ...productSnap.data() });
      } else {
        router.push("/");
      }
    };
    fetchProduct();
  }, [productId, router]);

  useEffect(() => {
    if (!user) return;

    const fetchPlayPoints = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setPlayPoints(data.playPoints || 0);
      }
    };

    const fetchSavedPaymentMethods = async () => {
      const pmRef = collection(db, "users", user.uid, "paymentMethods");
      const pmSnap = await getDocs(pmRef);
      const methods = pmSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSavedPaymentMethods(methods);
    };

    const fetchSavedAddresses = async () => {
      const addrRef = collection(db, "users", user.uid, "addresses");
      const addrSnap = await getDocs(addrRef);
      const addrs = addrSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSavedAddresses(addrs);
    };

    fetchPlayPoints();
    fetchSavedPaymentMethods();
    fetchSavedAddresses();
  }, [user]);

  const onPaymentMethodSelected = (methodId) => {
    setSelectedPaymentMethodId(methodId);
    if (methodId) {
      setUsePlayPoints(false);
      const method = savedPaymentMethods.find((m) => m.id === methodId);
      if (method) {
        setCardNumber(method.cardNumber);
        setExpiryDate(method.expiryDate);
        setCardHolderName(method.cardHolderName);
        setCvv("");
      }
    } else {
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
      setCardHolderName("");
    }
  };

  const onAddressSelected = (addrId) => {
    setSelectedAddressId(addrId);
    if (addrId) {
      const addr = savedAddresses.find((a) => a.id === addrId);
      if (addr) {
        setAddressLine1(addr.addressLine1);
        setAddressLine2(addr.addressLine2 || "");
        setCity(addr.city);
        setPhoneNumber(addr.phoneNumber);
        setCountry(addr.country);
        if (addr.location) {
          setLatitude(addr.location.latitude);
          setLongitude(addr.location.longitude);
        } else {
          setLatitude(null);
          setLongitude(null);
        }
      }
    } else {
      setAddressLine1("");
      setAddressLine2("");
      setCity("");
      setPhoneNumber("");
      setCountry("");
      setLatitude(null);
      setLongitude(null);
    }
  };

  const confirmPayment = async () => {
    if (!user) {
      alert("Please login to continue");
      return;
    }

    if (
      !addressLine1 ||
      !city ||
      !phoneNumber ||
      !country ||
      latitude == null ||
      longitude == null
    ) {
      alert("Please fill all required address fields and pin a location.");
      return;
    }

    if (!usePlayPoints) {
      if (!cardNumber || !expiryDate || !cardHolderName) {
        alert("Please fill all required payment fields.");
        return;
      }
      if (selectedPaymentMethodId && !cvv) {
        alert("Please enter CVV for the saved payment method.");
        return;
      }
    }

    setIsProcessingPayment(true);

    try {
      const processPurchase = httpsCallable(functions, "processPurchase");
      const payload = {
        productId,
        address: {
          addressLine1,
          addressLine2,
          city,
          phoneNumber,
          country,
          location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          },
        },
        paymentMethod: usePlayPoints ? "PlayPoints" : "Card",
        usePlayPoints,
        savePaymentDetails,
        saveAddress,
        savedPaymentMethodId: selectedPaymentMethodId || null,
        paymentMethodDetails:
          !usePlayPoints && !selectedPaymentMethodId
            ? { cardNumber, expiryDate, cvv, cardHolderName }
            : null,
      };

      const response = await processPurchase(payload);
      if (response.data?.success) {
        alert("Purchase successful!");
      } else {
        alert("Purchase failed. Please try again.");
      }
    } catch (e) {
      console.error("Error processing payment:", e);
      alert("An error occurred while processing payment.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleLocationSelect = ({ latitude, longitude }) => {
    setLatitude(latitude);
    setLongitude(longitude);
    setIsSelectingLocation(false);
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground">Loading product information...</p>
      </div>
    );
  }

  return (
    <div
      className={`p-4 max-w-3xl mx-auto transition-colors ${styles.productContainer}`}
    >
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        Complete Your Purchase
      </h1>

      {/* Product Details */}
      <div className={styles.productCard}>
        <h2 className={styles.accordionTitle}>
          <FaBoxOpen className="text-accent" />
          Product Details
        </h2>

        {product.imageUrls && product.imageUrls.length > 0 && (
          <div className={styles.productImageContainer}>
            <img
              src={product.imageUrls[0]}
              alt={product.productName}
              className={styles.productImage}
            />
          </div>
        )}

        <div className="mt-4">
          <div className={styles.productName}>{product.productName}</div>
          {product.brandModel && (
            <div className={styles.productBrand}>{product.brandModel}</div>
          )}
          <div className={styles.productPrice}>
            {product.price} {product.currency || "TRY"}
          </div>
          {product.description && (
            <div className={styles.productDescription}>
              {product.description}
            </div>
          )}
        </div>
      </div>

      {/* Address Section */}
      <div className={styles.accordionSection}>
        <div className={styles.accordionHeader}>
          <h2 className={styles.accordionTitle}>
            <FaMapMarkerAlt className="text-accent" />
            Shipping Address
          </h2>
          <button
            onClick={() => setIsAddressExpanded(!isAddressExpanded)}
            className={styles.accordionButton}
          >
            {isAddressExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        <div
          className={`${styles.accordionContent} ${
            isAddressExpanded ? styles.expanded : ""
          }`}
        >
          <div className="space-y-4 mt-2">
            {savedAddresses.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-foreground">
                  Saved Addresses
                </h3>
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <div key={addr.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="savedAddress"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => onAddressSelected(addr.id)}
                        className="form-radio h-5 w-5 text-accent focus:ring-0"
                      />
                      <span className="text-foreground">
                        {addr.addressLine1}, {addr.city}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="savedAddress"
                      value=""
                      checked={selectedAddressId === null}
                      onChange={() => onAddressSelected(null)}
                      className="form-radio h-5 w-5 text-accent focus:ring-0"
                    />
                    <span className="text-foreground">Enter New Address</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-3">
              <input
                type="text"
                placeholder="Address Line 1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-background rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
              />
              <input
                type="text"
                placeholder="Address Line 2 (Optional)"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-background rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
              />
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-background rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-background rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
              />
              <input
                type="text"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-background rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
              />

              {/* Location Pinning */}
              {!isSelectingLocation &&
                (latitude == null || longitude == null) && (
                  <button
                    onClick={() => setIsSelectingLocation(true)}
                    className="px-4 py-2 bg-accent text-white rounded-md hover:bg-blue-500 transition-colors"
                  >
                    Pin Location on Map
                  </button>
                )}

              {isSelectingLocation && (
                <div className="space-y-2">
                  <p className="text-foreground font-semibold">
                    Select your location:
                  </p>
                  <MapPicker onLocationSelect={handleLocationSelect} />
                  <button
                    onClick={() => setIsSelectingLocation(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors mt-2"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {latitude != null &&
                longitude != null &&
                !isSelectingLocation && (
                  <div className="text-foreground space-y-2">
                    <p>
                      <strong>Selected Location:</strong> {latitude.toFixed(4)},{" "}
                      {longitude.toFixed(4)}
                    </p>
                    <button
                      onClick={() => setIsSelectingLocation(true)}
                      className="px-4 py-2 bg-accent text-white rounded-md hover:bg-blue-500 transition-colors"
                    >
                      Re-pin Location
                    </button>
                  </div>
                )}

              {selectedAddressId === null && (
                <label className="flex items-center text-foreground gap-2">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-accent focus:ring-0"
                  />
                  Save Address
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Section */}
      <div className={styles.accordionSection}>
        <div className={styles.accordionHeader}>
          <h2 className={styles.accordionTitle}>
            <FaCreditCard className="text-accent" />
            Payment Details
          </h2>
          <button
            onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
            className={styles.accordionButton}
          >
            {isPaymentExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        <div
          className={`${styles.accordionContent} ${
            isPaymentExpanded ? styles.expanded : ""
          }`}
        >
          <div
            className={`space-y-4 mt-2 ${
              usePlayPoints ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {savedPaymentMethods.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-foreground">
                  Saved Payment Methods
                </h3>
                <div className="space-y-2">
                  {savedPaymentMethods.map((method) => {
                    const cardNum = method.cardNumber;
                    const last4 = cardNum.slice(-4);
                    return (
                      <div key={method.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="savedMethod"
                          value={method.id}
                          checked={selectedPaymentMethodId === method.id}
                          onChange={() => onPaymentMethodSelected(method.id)}
                          className="form-radio h-5 w-5 text-accent focus:ring-0"
                        />
                        <span className="text-foreground">
                          **** **** **** {last4}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="savedMethod"
                      value=""
                      checked={selectedPaymentMethodId === null}
                      onChange={() => onPaymentMethodSelected(null)}
                      className="form-radio h-5 w-5 text-accent focus:ring-0"
                    />
                    <span className="text-foreground">
                      Enter New Payment Method
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="grid gap-3">
              <input
                type="text"
                placeholder="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-background rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 bg-background rounded-md px-4 py-2 w-1/2 focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
                />
                <input
                  type="text"
                  placeholder="CVV"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 bg-background rounded-md px-4 py-2 w-1/2 focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
                />
              </div>
              <input
                type="text"
                placeholder="Card Holder Name"
                value={cardHolderName}
                onChange={(e) => setCardHolderName(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-background rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
              />
              {selectedPaymentMethodId === null && (
                <label className="flex items-center text-foreground gap-2">
                  <input
                    type="checkbox"
                    checked={savePaymentDetails}
                    onChange={(e) => setSavePaymentDetails(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-accent focus:ring-0"
                  />
                  Save Payment Details
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PlayPoints Section */}
      <div className={styles.accordionSection}>
        <div className={styles.accordionHeader}>
          <h2 className={styles.accordionTitle}>
            <FaPlay className="text-accent" />
            Pay with PlayPoints
          </h2>
          <button
            onClick={() => setIsPlayPointExpanded(!isPlayPointExpanded)}
            className={styles.accordionButton}
          >
            {isPlayPointExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        <div
          className={`${styles.accordionContent} ${
            isPlayPointExpanded ? styles.expanded : ""
          }`}
        >
          <div className="space-y-3 mt-2">
            <p className="text-foreground">You have {playPoints} PlayPoints.</p>
            <label className="flex items-center text-foreground gap-2">
              <input
                type="checkbox"
                checked={usePlayPoints}
                onChange={(e) => {
                  setUsePlayPoints(e.target.checked);
                  if (e.target.checked) {
                    onPaymentMethodSelected(null);
                  }
                }}
                className="form-checkbox h-5 w-5 text-accent focus:ring-0"
              />
              Use PlayPoints
            </label>
          </div>
        </div>
      </div>

      {/* Complete Payment Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={confirmPayment}
          disabled={isProcessingPayment}
          className={styles.completePaymentBtn}
        >
          {isProcessingPayment ? "Processing..." : "Complete Payment"}
        </button>
      </div>
    </div>
  );
}
