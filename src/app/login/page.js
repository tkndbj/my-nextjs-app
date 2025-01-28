"use client";

import React, { useState, useEffect } from "react";
import useWindowWidth from "../../hooks/useWindowWidth";
import { MOBILE_BREAKPOINT } from "../constants/breakpoints";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
} from "firebase/auth";

import { auth, db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import { FaGooglePlusG } from "react-icons/fa";
import styles from "./LoginPage.module.css";

import {
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "firebase/firestore";
import {
  getFunctions as getFirebaseFunctions,
  httpsCallable
} from "firebase/functions";
import { QRCodeCanvas } from "qrcode.react"; // For generating the QR code

export default function LoginPage() {
  // 1) Check window size to show/hide background video
  const windowWidth = useWindowWidth();
  const isMobile =
    windowWidth !== undefined && windowWidth < MOBILE_BREAKPOINT;

  // 2) Next.js router
  const router = useRouter();

  // 3) Toggle: Sign in or Register form
  const [isRegisterActive, setIsRegisterActive] = useState(false);

  // 4) Sign In form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // 5) Registration form state
  const [registerName, setRegisterName] = useState("");
  const [registerSurname, setRegisterSurname] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRePassword, setRegisterRePassword] = useState("");

  // 6) Registration success & error
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [error, setError] = useState("");

  // 7) Loading indicator (for sign-in or sign-up)
  const [isLoading, setIsLoading] = useState(false);

  // 8) QR Authentication states
  const [sessionId, setSessionId] = useState(null);
  const [qrAuthError, setQrAuthError] = useState(null);
  const [isQrAuthLoading, setIsQrAuthLoading] = useState(false);

  // -------------------------------------------------------------------------
  // A) Poll for Email Verification after Registration
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!registrationSuccess) return;

    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(interval);
          router.push("/");
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [registrationSuccess, router]);

  // -------------------------------------------------------------------------
  // B1) QR Authentication - Create QR Session
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (sessionId) return; // Do not create a new session if one already exists

    const functionsInstance = getFirebaseFunctions(undefined, "europe-west3");
    const createQrAuthSessionFn = httpsCallable(
      functionsInstance,
      "createQrAuthSession"
    );

    // 1) Create a new QR session
    const createQrSession = async () => {
      setIsQrAuthLoading(true);
      setQrAuthError(null);

      try {
        const result = await createQrAuthSessionFn();
        const { sessionId } = result.data;
        setSessionId(sessionId);
        console.log("QR Session Created:", sessionId);
      } catch (err) {
        console.error("Error creating QR auth session:", err);
        setQrAuthError("Failed to generate QR code. Please try again.");
      } finally {
        setIsQrAuthLoading(false);
      }
    };

    // 2) Call once on mount or when sessionId is null
    createQrSession();
  }, [sessionId]);

  // -------------------------------------------------------------------------
  // B2) QR Authentication - Listen to QR Session Document
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!sessionId) return; // Only listen if sessionId is available

    const sessionRef = doc(db, "qrSessions", sessionId);
    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();

        if (data.customToken) {
          signInWithCustomToken(auth, data.customToken)
            .then(() => {
              console.log("Successfully signed in via QR code!");
              router.push("/");
            })
            .catch((err) => {
              console.error("Error signing in with custom token:", err);
              setQrAuthError("Failed to sign in with scanned QR code.");
            });
        }
      },
      (error) => {
        console.error("Error listening to QR session:", error);
        setQrAuthError("Failed to listen to QR session.");
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sessionId, router]);

  // -------------------------------------------------------------------------
  // C) Handlers
  // -------------------------------------------------------------------------
  const handleRegisterClick = () => {
    setIsRegisterActive(true);
    setError("");
  };

  const handleBackToLogin = () => {
    setIsRegisterActive(false);
    setError("");
  };

  // Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );
      const user = userCredential.user;
      await user.reload();

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let isNewUser = false;
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        isNewUser = userData.isNew === true;
      }

      if (!user.emailVerified && isNewUser) {
        await auth.signOut();
        setError("Please verify your email address before logging in.");
        setIsLoading(false);
        return;
      }

      if (user.emailVerified || !isNewUser) {
        router.push("/");
      } else {
        setError("Please verify your email to continue.");
        await auth.signOut();
        setIsLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

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

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerEmail.trim(),
        registerPassword
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${registerName.trim()} ${registerSurname.trim()}`,
      });

      await sendEmailVerification(user);
      await saveUserData(user);

      setRegistrationSuccess(true);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Save user data
  const saveUserData = async (user) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          displayName: `${registerName.trim()} ${registerSurname.trim()}`,
          email: registerEmail.trim(),
          phoneNumber: registerPhone.trim(),
          accountType: "Bireysel",
          isNew: true,
        },
        { merge: true }
      );
      console.log("User data saved successfully.");
    } catch (err) {
      console.error("Error saving user data:", err);
      setError("Failed to save user data.");
      setIsLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(
          userDocRef,
          {
            displayName: user.displayName || "",
            email: user.email || "",
            isNew: true,
          },
          { merge: true }
        );
      }

      router.push("/");
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // D) Render
  // -------------------------------------------------------------------------
  return (
    <div className={styles.container}>
      {/* Desktop background video; hidden on mobile */}
      {!isMobile && (
        <video
          autoPlay
          loop
          muted
          className={styles.backgroundVideo}
          src="/video1.mp4"
          type="video/mp4"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      <div id="container" className={styles.loginContainer}>
        {/* Sign In Form */}
        <div
          className={`${styles.form} ${styles.signInForm} ${
            isRegisterActive ? styles.signInHidden : styles.signInVisible
          }`}
        >
          <form
            onSubmit={handleSignIn}
            className="flex flex-col items-center justify-center h-full px-10 bg-white"
          >
            {/* ========= QR CODE FOR SIGN IN ========== */}
            <div className={styles.qrSection}>
              <h2 className="text-lg font-semibold text-black mb-2">
                Sign in with QR Code
              </h2>
              {isQrAuthLoading ? (
                <div className={styles.spinner}></div>
              ) : qrAuthError ? (
                <div className="text-red-500 text-sm">{qrAuthError}</div>
              ) : sessionId ? (
                <div className="flex flex-col items-center">
                  {/* Use a smaller size prop or style class to prevent oversizing */}
                  <QRCodeCanvas
                    value={sessionId}
                    size={150}
                    className={styles.qrCanvas}
                  />
                  <p className="text-sm text-gray-700 mt-2 text-center">
                    Scan this code with your mobile app to log in.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Clear session -> triggers new call in B1 useEffect
                      setSessionId(null);
                      setQrAuthError(null);
                    }}
                    className="mt-3 text-blue-500 underline"
                  >
                    Regenerate QR Code
                  </button>
                </div>
              ) : (
                <div className="text-gray-700 text-sm">
                  Generating QR Code...
                </div>
              )}
            </div>
            {/* ======================================== */}

            <h1 className="text-xl font-semibold text-black mt-4">Sign In</h1>

            <div className="social-icons my-5 w-full">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center border border-[#ccc] rounded-lg px-4 py-2 bg-white w-full transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#512da8]"
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

            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}

            <input
              type="email"
              placeholder="Email"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2 text-base"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2 text-base"
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
                className="bg-[#512da8] text-white text-xs font-semibold uppercase mt-3 px-6 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#512da8]"
              >
                Sign In
              </button>
            )}

            <button
              type="button"
              onClick={handleRegisterClick}
              className="text-[13px] mt-3 text-gray-700 underline w-full text-left"
            >
              Don't have an account?
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
            <h1 className="text-xl font-semibold text-black">
              Create Account
            </h1>

            <div className="social-icons my-5 w-full">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center border border-[#ccc] rounded-lg px-4 py-2 bg-white w-full transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#512da8]"
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
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}

            <input
              type="text"
              placeholder="Name"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2 text-base"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Surname"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2 text-base"
              value={registerSurname}
              onChange={(e) => setRegisterSurname(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2 text-base"
              value={registerPhone}
              onChange={(e) => setRegisterPhone(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2 text-base"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2 text-base"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Re-Password"
              className="bg-[#eee] rounded-lg p-3 text-sm w-full mt-2 text-base"
              value={registerRePassword}
              onChange={(e) => setRegisterRePassword(e.target.value)}
              required
            />

            {isLoading ? (
              <div className={styles.spinner}></div>
            ) : (
              <button
                type="submit"
                className="bg-[#512da8] text-white text-xs font-semibold uppercase mt-3 px-6 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#512da8]"
              >
                Sign Up
              </button>
            )}

            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-[13px] mt-3 text-gray-700 underline w-full text-left"
            >
              Back to Login
            </button>
          </form>
        </div>

        {/* Registration Success Overlay */}
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
