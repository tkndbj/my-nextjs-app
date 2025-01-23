"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Snackbar,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider, // 1. Import Slider from Material-UI
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PaymentIcon from "@mui/icons-material/Payment";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase"; // Corrected import
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  writeBatch,
  Timestamp,
  increment,
  addDoc, // Ensure addDoc is imported
} from "firebase/firestore"; // Correct import from Firestore
import { useAuthState } from "react-firebase-hooks/auth";
import Image from "next/image"; // 2. Import Image from next/image

const BoostPage = () => {
  const router = useRouter();
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const [itemType, setItemType] = useState(null); // 'property', 'product', or 'shop'
  const [itemId, setItemId] = useState(null);
  const [itemData, setItemData] = useState(null);
  const [boostDuration, setBoostDuration] = useState(1); // Default to 1 day
  const pricePerDayPerItem = 50.0;
  const [totalPrice, setTotalPrice] = useState(50.0);
  const [userItems, setUserItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [accordionExpanded, setAccordionExpanded] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Extract query parameters to determine item type and ID
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");
      const id = params.get("id");
      if (type && id && ["property", "product", "shop"].includes(type)) {
        setItemType(type);
        setItemId(id);
      } else {
        setSnackbar({
          open: true,
          message: "Invalid item type or ID.",
          severity: "error",
        });
        // Optionally, redirect to a safe page
        setTimeout(() => {
          router.push("/my_products"); // Redirect after showing the error
        }, 3000);
      }
    }
  }, [router]);

  // Fetch main item data
  useEffect(() => {
    const fetchItemData = async () => {
      if (!itemType || !itemId) return;

      try {
        const itemRef = doc(db, `${itemType}s`, itemId); // Replaced 'firestore' with 'db'
        const itemSnap = await getDoc(itemRef);
        if (itemSnap.exists()) {
          const data = itemSnap.data();
          // Determine image URL based on item type
          let imageUrl = "";
          if (itemType === "shop") {
            imageUrl = data.coverImageUrl || "";
          } else if (itemType === "property") {
            imageUrl = data.imageUrl || "";
          } else {
            imageUrl =
              data.imageUrls && data.imageUrls.length > 0
                ? data.imageUrls[0]
                : "";
          }
          setItemData({ ...data, imageUrl });
          setTotalPrice(boostDuration * pricePerDayPerItem);
        } else {
          setSnackbar({
            open: true,
            message: "Item not found.",
            severity: "error",
          });
          // Optionally, redirect to a safe page
          setTimeout(() => {
            router.push("/my_products"); // Redirect after showing the error
          }, 3000);
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error: ${error.message}`,
          severity: "error",
        });
      }
    };

    fetchItemData();
  }, [itemType, itemId, boostDuration, router]);

  // Fetch user items for bulk boost
  useEffect(() => {
    const fetchUserItems = async () => {
      if (!user || !itemType) return;

      try {
        const itemsRef = collection(db, `${itemType}s`); // Replaced 'firestore' with 'db'
        let q;
        if (itemType === "shop") {
          q = query(
            itemsRef,
            where("ownerId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
        } else {
          q = query(
            itemsRef,
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
        }

        const querySnapshot = await getDocs(q);
        const items = [];
        const now = new Date();

        querySnapshot.forEach((docSnap) => {
          if (docSnap.id === itemId) return; // Exclude main item
          const data = docSnap.data();
          // Check if item is not currently boosted
          if (data.boostEndTime) {
            const boostEndDate = data.boostEndTime.toDate();
            if (boostEndDate > now) return; // Already boosted
          }
          // Determine image URL based on item type
          let imageUrl = "";
          if (itemType === "shop") {
            imageUrl = data.coverImageUrl || "";
          } else if (itemType === "property") {
            imageUrl = data.imageUrl || "";
          } else {
            imageUrl =
              data.imageUrls && data.imageUrls.length > 0
                ? data.imageUrls[0]
                : "";
          }
          items.push({ ...data, itemId: docSnap.id, imageUrl });
        });

        setUserItems(items);
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error: ${error.message}`,
          severity: "error",
        });
      }
    };

    if (user) {
      fetchUserItems();
    }
  }, [user, itemType, itemId]);

  // Update total price when boost duration or selected items change
  useEffect(() => {
    const itemCount = 1 + selectedItemIds.length;
    setTotalPrice(boostDuration * pricePerDayPerItem * itemCount);
  }, [boostDuration, selectedItemIds]);

  const handleSelectItem = (id) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleBoostDurationChange = (event, newValue) => {
    setBoostDuration(newValue);
  };

  const handleProceedToPayment = async () => {
    if (!user || !itemData) {
      setSnackbar({
        open: true,
        message: "User not authenticated.",
        severity: "error",
      });
      return;
    }

    // Verify ownership
    const ownerIdField = itemType === "shop" ? "ownerId" : "userId";
    if (itemData[ownerIdField] !== user.uid) {
      setSnackbar({
        open: true,
        message: "No permission to boost this item.",
        severity: "error",
      });
      return;
    }

    try {
      const now = new Date();
      const boostEndDate = new Date(
        now.getTime() + boostDuration * 24 * 60 * 60 * 1000
      );

      const batch = writeBatch(db); // Replaced 'firestore' with 'db'

      // Boost main item
      const mainItemRef = doc(db, `${itemType}s`, itemId); // Replaced 'firestore' with 'db'
      batch.update(mainItemRef, {
        boostStartTime: Timestamp.fromDate(now),
        boostEndTime: Timestamp.fromDate(boostEndDate),
        boostDuration: boostDuration,
        isBoosted: true,
      });

      // Boost selected additional items
      selectedItemIds.forEach((id) => {
        const itemRef = doc(db, `${itemType}s`, id); // Replaced 'firestore' with 'db'
        batch.update(itemRef, {
          boostStartTime: Timestamp.fromDate(now),
          boostEndTime: Timestamp.fromDate(boostEndDate),
          boostDuration: boostDuration,
          isBoosted: true,
          boostedImpressionCount: increment(0), // Initialize if not set
          clickCount: increment(0), // Initialize if not set
        });
      });

      await batch.commit();

      // Create notifications
      const allItemIds = [itemId, ...selectedItemIds];
      const totalItemsBoosted = allItemIds.length;
      const message = `Successfully boosted ${totalItemsBoosted} item(s).`;

      const notificationsPromises = allItemIds.map(async (id) => {
        const itemRef = doc(db, `${itemType}s`, id); // Replaced 'firestore' with 'db'
        const itemSnap = await getDoc(itemRef);
        if (itemSnap.exists()) {
          const data = itemSnap.data();
          let itemName = "Unnamed Item";
          if (itemType === "property") {
            itemName = data.propertyName || "Unnamed Property";
          } else if (itemType === "product") {
            itemName = data.productName || "Unnamed Product";
          } else if (itemType === "shop") {
            itemName = data.name || "Unnamed Shop";
          }

          // Ensure ownership
          const ownerId = itemType === "shop" ? data.ownerId : data.userId;
          if (ownerId !== user.uid) return;

          await addDoc(
            collection(db, "users", user.uid, "notifications"), // Replaced 'firestore' with 'db'
            {
              userId: user.uid,
              type: "boosted",
              message: message,
              timestamp: Timestamp.now(),
              isRead: false,
              itemId: id,
              itemType: itemType,
            }
          );
        }
      });

      await Promise.all(notificationsPromises);

      setSnackbar({ open: true, message: message, severity: "success" });

      // Redirect based on item type
      if (itemType === "property") {
        router.push("/my_properties");
      } else if (itemType === "product") {
        router.push("/my_products");
      } else if (itemType === "shop") {
        router.push("/my_shops");
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderItemCard = (data) => {
    return (
      <Card sx={{ display: "flex", marginBottom: 2 }}>
        {data.imageUrl ? (
          <CardMedia
            component="img"
            sx={{ width: 151 }}
            image={data.imageUrl}
            alt={
              data.propertyName || data.productName || data.name || "Item Image"
            }
          />
        ) : (
          <Box
            sx={{
              width: 151,
              height: 151,
              backgroundColor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="subtitle1">No Image</Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <CardContent sx={{ flex: "1 0 auto" }}>
            <Typography component="div" variant="h6">
              {data.propertyName ||
                data.productName ||
                data.name ||
                "Unnamed Item"}
            </Typography>
          </CardContent>
        </Box>
      </Card>
    );
  };

  const renderBulkBoostSection = () => {
    return (
      <Box sx={{ marginTop: 4 }}>
        <Accordion
          expanded={accordionExpanded}
          onChange={() => setAccordionExpanded(!accordionExpanded)}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="bulk-boost-content"
            id="bulk-boost-header"
          >
            <AddIcon sx={{ marginRight: 1 }} />
            <Typography variant="h6">Add More Items</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {userItems.length > 0 ? (
              userItems.map((item) => (
                <FormControlLabel
                  key={item.itemId}
                  control={
                    <Checkbox
                      checked={selectedItemIds.includes(item.itemId)}
                      onChange={() => handleSelectItem(item.itemId)}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={
                            item.propertyName ||
                            item.productName ||
                            item.name ||
                            "Item Image"
                          }
                          width={50}
                          height={50}
                          style={{
                            objectFit: "cover",
                            marginRight: 10,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            backgroundColor: "#f0f0f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 2,
                          }}
                        >
                          <Typography variant="caption">No Image</Typography>
                        </Box>
                      )}
                      <Typography variant="body1">
                        {item.propertyName ||
                          item.productName ||
                          item.name ||
                          "Unnamed Item"}
                      </Typography>
                    </Box>
                  }
                />
              ))
            ) : (
              <Typography variant="body2">No more items to add.</Typography>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  const renderBoostDurationSlider = () => {
    return (
      <Box sx={{ marginTop: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select Boost Duration (Days)
        </Typography>
        <Slider
          value={boostDuration}
          min={1}
          max={7}
          step={1}
          marks
          valueLabelDisplay="auto"
          onChange={handleBoostDurationChange}
        />
        <Typography variant="body1">{boostDuration} Day(s)</Typography>
      </Box>
    );
  };

  const renderTotalPrice = () => {
    return (
      <Box sx={{ marginTop: 4 }}>
        <Typography variant="h5" color="coral">
          Total Price: ${totalPrice.toFixed(2)}
        </Typography>
      </Box>
    );
  };

  const renderCompletePaymentButton = () => {
    return (
      <Button
        variant="contained"
        color="secondary"
        fullWidth
        startIcon={<PaymentIcon />}
        sx={{ marginTop: 4, padding: 2 }}
        onClick={handleProceedToPayment}
      >
        Complete Payment
      </Button>
    );
  };

  if (loadingAuth) {
    return (
      <Container sx={{ textAlign: "center", marginTop: 10 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (errorAuth) {
    return (
      <Container sx={{ textAlign: "center", marginTop: 10 }}>
        <Typography variant="h6" color="error">
          Error: {errorAuth.message}
        </Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container sx={{ textAlign: "center", marginTop: 10 }}>
        <Typography variant="h6">Please log in to access this page.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ paddingY: 4 }}>
      <Typography variant="h4" gutterBottom>
        Boost Your Item
      </Typography>

      {itemData ? (
        <Card sx={{ display: "flex", marginBottom: 4 }}>
          {itemData.imageUrl ? (
            <CardMedia
              component="img"
              sx={{ width: 200 }}
              image={itemData.imageUrl}
              alt={
                itemData.propertyName ||
                itemData.productName ||
                itemData.name ||
                "Item Image"
              }
            />
          ) : (
            <Box
              sx={{
                width: 200,
                height: 200,
                backgroundColor: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="subtitle1">No Image</Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <CardContent>
              <Typography variant="h5">
                {itemData.propertyName ||
                  itemData.productName ||
                  itemData.name ||
                  "Unnamed Item"}
              </Typography>
            </CardContent>
          </Box>
        </Card>
      ) : (
        <Box sx={{ textAlign: "center", marginTop: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Bulk Boost Section */}
      {renderBulkBoostSection()}

      {/* Boost Duration Slider */}
      {renderBoostDurationSlider()}

      {/* Total Price */}
      {renderTotalPrice()}

      {/* Complete Payment Button */}
      {renderCompletePaymentButton()}

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Container>
  );
};

export default BoostPage;
