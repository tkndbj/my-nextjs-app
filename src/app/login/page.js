// src/app/Login/LoginPage.jsx

"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "../../../lib/firebase"; // Ensure messaging is initialized in your Firebase config
import { useRouter } from "next/navigation";
import { FaGooglePlusG } from "react-icons/fa"; // Only Google icon is needed
import styles from "./LoginPage.module.css";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { getToken } from "firebase/messaging";

export default function LoginPage() {
  const [isRegisterActive, setIsRegisterActive] = useState(false);
  const router = useRouter();

  // Sign In state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign Up state
  const [registerName, setRegisterName] = useState("");
  const [registerSurname, setRegisterSurname] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRePassword, setRegisterRePassword] = useState("");

  // Registration Success State
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Error State
  const [error, setError] = useState("");

  // Loading State
  const [isLoading, setIsLoading] = useState(false);

  // Handle Navigation after Email Verification
  useEffect(() => {
    if (registrationSuccess) {
      const interval = setInterval(async () => {
        const user = auth.currentUser;
        if (user) {
          await user.reload();
          if (user.emailVerified) {
            clearInterval(interval);
            router.push("/"); // Redirect to Home after verification
          }
        }
      }, 3000); // Check every 3 seconds

      return () => clearInterval(interval);
    }
  }, [registrationSuccess, router]);

  const handleRegisterClick = () => {
    setIsRegisterActive(true);
    setError("");
  };

  const handleBackToLogin = () => {
    setIsRegisterActive(false);
    setError("");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // Start loading
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );
      const user = userCredential.user;

      // Reload user to ensure we have the latest emailVerified status
      await user.reload();

      // Fetch user data from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      let isNewUser = false;
      let userData = {};

      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
        isNewUser = userData.isNew === true;
      }

      // If user is new and not verified
      if (!user.emailVerified && isNewUser) {
        await auth.signOut();
        setError("Please verify your email address before logging in.");
        setIsLoading(false); // Stop loading on error
        return;
      }

      // If user is verified or is not new (old user)
      if (user.emailVerified || !isNewUser) {
        // Add FCM Token
        await addFcmTokenToUser(user.uid);

        // Redirect to Home page
        router.push("/");
      } else {
        // If user is old and still not verified (uncommon scenario)
        setError("Please verify your email to continue.");
        await auth.signOut();
        setIsLoading(false); // Stop loading on error
      }
    } catch (error) {
      setError(error.message);
      setIsLoading(false); // Stop loading on error
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    // Basic Validation
    if (
      !registerName.trim() ||
      !registerSurname.trim() ||
      !registerPhone.trim() ||
      !registerEmail.trim() ||
      !registerPassword ||
      !registerRePassword
    ) {
      setError("All fields are required.");
      return;
    }

    if (registerPassword !== registerRePassword) {
      setError("Passwords do not match.");
      return;
    }

    // Optional: Add more validation (e.g., email format, password strength)

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerEmail.trim(),
        registerPassword
      );
      const user = userCredential.user;

      // Update Profile with Name and Surname
      await updateProfile(user, {
        displayName: `${registerName.trim()} ${registerSurname.trim()}`,
      });

      // Send Email Verification
      await sendEmailVerification(user);

      // Save Additional User Data to Firestore
      await saveUserData(user);

      // Show Success Message
      setRegistrationSuccess(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const saveUserData = async (user) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          displayName: `${registerName.trim()} ${registerSurname.trim()}`,
          email: registerEmail.trim(),
          phoneNumber: registerPhone.trim(),
          accountType: "Bireysel", // Adjust as needed
          isNew: true,
          // Add any other fields to align with your Firestore structure
        },
        { merge: true }
      );
      console.log("User data saved successfully:", {
        displayName: `${registerName.trim()} ${registerSurname.trim()}`,
        email: registerEmail.trim(),
        phoneNumber: registerPhone.trim(),
        accountType: "Bireysel",
        isNew: true,
      });
    } catch (error) {
      console.error("Error saving user data: ", error);
      setError("Failed to save user data.");
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // New user, save data
        await setDoc(
          userDocRef,
          {
            displayName: user.displayName || "",
            email: user.email || "",
            isNew: true,
            // Add other necessary fields as per your Flutter app
          },
          { merge: true }
        );
      }

      // Add FCM Token
      await addFcmTokenToUser(user.uid);

      // Redirect to Home
      router.push("/");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addFcmTokenToUser = async (userId) => {
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: "YOUR_PUBLIC_VAPID_KEY",
      }); // Replace with your VAPID key

      if (currentToken) {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          fcmTokens: arrayUnion(currentToken),
        });
        console.log("FCM token added to user document.");
      } else {
        console.log("No FCM token available.");
      }
    } catch (error) {
      console.error("Error adding FCM token to user:", error);
    }
  };

  return (
    <div className={styles.container}>
      <video
        autoPlay
        loop
        muted
        className={styles.backgroundVideo}
        src="/video1.mp4"
        type="video/mp4"
      />
      <div id="container" className={styles.loginContainer}>
        {/* Login Form */}
        <div
          className={`${styles.form} ${styles.signInForm} ${
            isRegisterActive ? styles.signInHidden : styles.signInVisible
          }`}
        >
          <form
            onSubmit={handleSignIn}
            className="flex flex-col items-center justify-center h-full px-10 bg-white"
          >
            <h1 className="text-xl font-semibold text-black">Sign In</h1>
            <div className="social-icons my-5">
              {/* Google Icon with Text */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center border border-[#ccc] rounded-lg px-4 py-2 bg-white w-full transition-all hover:bg-gray-100"
              >
                <FaGooglePlusG className="text-black mr-2" />
                <span className="text-black font-semibold">
                  Sign in with Google
                </span>
              </button>
            </div>
            <span className="text-sm text-gray-800">
              or use your email and password
            </span>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            <input
              type="email"
              placeholder="Email"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <a href="#" className="text-[13px] mt-3 text-gray-700">
              Forgot Your Password?
            </a>
            {isLoading ? (
              <div className={styles.spinner}></div>
            ) : (
              <button
                type="submit"
                className="bg-[#512da8] text-white text-xs font-semibold uppercase mt-3 px-6 py-2 rounded-lg w-full"
              >
                Sign In
              </button>
            )}
            <button
              type="button"
              onClick={handleRegisterClick}
              className="text-[13px] mt-3 text-gray-700 underline w-full text-left"
            >
              Dont have an account?
            </button>
          </form>
        </div>

        {/* Register Form */}
        <div
          className={`${styles.form} ${styles.registerForm} ${
            isRegisterActive ? styles.registerVisible : styles.registerHidden
          }`}
        >
          <form
            onSubmit={handleSignUp}
            className="flex flex-col items-center justify-center h-full px-10 bg-white"
          >
            <h1 className="text-xl font-semibold text-black">Create Account</h1>
            <div className="social-icons my-5">
              {/* Google Icon with Text */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center border border-[#ccc] rounded-lg px-4 py-2 bg-white w-full transition-all hover:bg-gray-100"
              >
                <FaGooglePlusG className="text-black mr-2" />
                <span className="text-black font-semibold">
                  Sign up with Google
                </span>
              </button>
            </div>
            <span className="text-sm text-gray-800">
              or use your email for registration
            </span>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            <input
              type="text"
              placeholder="Name"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Surname"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2"
              value={registerSurname}
              onChange={(e) => setRegisterSurname(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2"
              value={registerPhone}
              onChange={(e) => setRegisterPhone(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Re-Password"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2"
              value={registerRePassword}
              onChange={(e) => setRegisterRePassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-[#512da8] text-white text-xs font-semibold uppercase mt-3 px-6 py-2 rounded-lg w-full"
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-[13px] mt-3 text-gray-700 underline w-full text-left"
            >
              Back to Login
            </button>
          </form>
        </div>

        {/* Registration Success Message Overlay */}
        {registrationSuccess && (
          <div className={`${styles.overlay} ${styles.showOverlay}`}>
            <div className={styles.successMessage}>
              <h1 className="text-xl font-semibold text-black">
                Registration Successful!
              </h1>
              <p className="text-sm text-gray-800 mt-4 text-center">
                Please check your inbox ({registerEmail}) to verify your email
                address.
              </p>
              <p className="text-sm text-gray-800 mt-2">
                After verification, you will be redirected to the home page.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
