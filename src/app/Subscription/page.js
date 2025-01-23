// ./src/app/Subscription/SubscriptionPage.jsx

"use client";

import React from "react";
import styles from "./Subscription.module.css";
import {
  FaSeedling,
  FaCarrot,
  FaPepperHot,
  FaGem, // Icon for the 4th plan
  FaCheckCircle,
} from "react-icons/fa";
import { auth, db } from "../../../lib/firebase"; // Correct import
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const SubscriptionPage = () => {
  const router = useRouter();

  const handleSubscribe = async (plan) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Lütfen giriş yapınız.");
      router.push("/login"); // Redirect to login if not authenticated
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid); // Use db here
      await updateDoc(userDocRef, {
        subscriptionPlan: plan,
        subscriptionStartDate: new Date(),
        isNew: false, // Update other fields as necessary
      });
      // Removed the alert
      router.push("/"); // Redirect to home page directly
    } catch (error) {
      console.error("Abonelik güncellenirken hata oluştu: ", error);
      alert("Abonelik güncellenirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div className={styles.body}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>
          Esnek planlarımız ile kendinize en uygun olanı seçin
        </h2>
        <p className={styles.headerText}>
          Üyeliğinizi istediğiniz zaman profilinizden iptal edebilirsiniz.
        </p>
      </div>

      <div className={styles.subscriptionContainer}>
        {/* Subscription Option 1 */}
        <div
          className={styles.subscriptionButton}
          onClick={() => handleSubscribe("Level 1")}
        >
          <img
            src="/images/subscriptions/lvl1.png"
            alt="Level 1 Plan"
            className={styles.subscriptionImage}
          />
          <h3 className={`${styles.subscriptionTitle} ${styles.personal}`}>
            Level 1 <FaSeedling className={styles.subscriptionIcon} />
          </h3>
          <span className={styles.subscriptionPrice}>
            ₺0 <span className={styles.subscriptionPriceMonth}>/ ay</span>
          </span>
          <ul className={styles.subscriptionList}>
            <li className={styles.subscriptionItem}>
              <FaCheckCircle className={styles.iconSubscription} />
              <span>
                Bazı özellikler:{" "}
                <span className={styles.subscriptionItemText}>
                  Lorem ipsum dolor sit amet
                </span>
              </span>
            </li>
            <li className={styles.subscriptionItem}>
              <FaCheckCircle className={styles.iconSubscription} />
              <span>
                Daha fazla özellik:{" "}
                <span className={styles.subscriptionItemText}>
                  Explicabo nemo corporis nesciunt aspernatur
                </span>
              </span>
            </li>
            <li className={styles.subscriptionItem}>
              <FaCheckCircle className={styles.iconSubscription} />
              Ücretsiz Etkinlik Geçişleri
            </li>
          </ul>
        </div>

        {/* Subscription Option 2 */}
        <div
          className={styles.subscriptionButton}
          onClick={() => handleSubscribe("Level 2")}
        >
          <img
            src="/images/subscriptions/lvl2.png"
            alt="Level 2 Plan"
            className={styles.subscriptionImage}
          />
          <h3 className={`${styles.subscriptionTitle} ${styles.business}`}>
            Level 2 <FaCarrot className={styles.subscriptionIcon} />
          </h3>
          <span className={styles.subscriptionPrice}>
            ₺350 <span className={styles.subscriptionPriceMonth}>/ ay</span>
          </span>
          <ul className={styles.subscriptionList}>
            <li className={styles.subscriptionItem}>
              <FaCheckCircle className={styles.iconSubscription} />
              <span>
                Rasgele metin:{" "}
                <span className={styles.subscriptionItemText}>
                  Cultivated who resolution connection motionless
                </span>
              </span>
            </li>
            <li className={styles.subscriptionItem}>
              <FaCheckCircle className={styles.iconSubscription} />
              <span>
                Fikir yok:{" "}
                <span className={styles.subscriptionItemText}>
                  Barton did feebly change afford square
                </span>
              </span>
            </li>
            <li className={styles.subscriptionItem}>
              <FaCheckCircle className={styles.iconSubscription} />
              Sınırsız Depolama
            </li>
          </ul>
        </div>

        {/* Subscription Option 3 */}
        <div
          className={styles.subscriptionButton}
          onClick={() => handleSubscribe("Level 3")}
        >
          <img
            src="/images/subscriptions/lvl3.png"
            alt="Level 3 Plan"
            className={styles.subscriptionImage}
          />
          <h3 className={`${styles.subscriptionTitle} ${styles.enterprise}`}>
            Level 3 <FaPepperHot className={styles.subscriptionIcon} />
          </h3>
          <span className={styles.subscriptionPrice}>
            ₺450 <span className={styles.subscriptionPriceMonth}>/ ay</span>
          </span>
          <ul className={styles.subscriptionList}>
            <li className={styles.subscriptionItem}>
              <FaCheckCircle className={styles.iconSubscription} />
              <span>
                Sıklıkla:{" "}
                <span className={styles.subscriptionItemText}>
                  Cultivated resolution connection motionless
                </span>
              </span>
            </li>
            <li className={styles.subscriptionItem}>
              <FaCheckCircle className={styles.iconSubscription} />
              <span>
                Fikir yok:{" "}
                <span className={styles.subscriptionItemText}>
                  Barton did neebly ehange afford square
                </span>
              </span>
            </li>
            <li className={styles.subscriptionItem}>
              <FaCheckCircle className={styles.iconSubscription} />
              Tüm İçeriğe Ömür Boyu Erişim
            </li>
          </ul>
        </div>

        {/* Subscription Option 4 */}
        <div
          className={styles.subscriptionButton}
          onClick={() => handleSubscribe("Level 4")}
        >
          <img
            src="/images/subscriptions/lvl4.png"
            alt="Level 4 Plan"
            className={styles.subscriptionImage}
          />
          <h3 className={`${styles.subscriptionTitle} ${styles.premium}`}>
            Level 4 <FaGem className={styles.subscriptionIcon} />
          </h3>
          <span className={styles.subscriptionPrice}>
            ₺550 <span className={styles.subscriptionPriceMonth}>/ ay</span>
          </span>
          <ul className={styles.subscriptionList}>
            <li className={styles.subscriptionItem}>
              <FaCheckCircle className={styles.iconSubscription} />
              <span>
                Premium Özellik 1:{" "}
                <span className={styles.subscriptionItemText}>
                  Özel içerik erişimi
                </span>
              </span>
            </li>
            <li className={styles.subscriptionItem}>
              <FaCheckCircle className={styles.iconSubscription} />
              <span>
                Premium Özellik 2:{" "}
                <span className={styles.subscriptionItemText}>
                  Öncelikli destek
                </span>
              </span>
            </li>
            <li className={styles.subscriptionItem}>
              <FaCheckCircle className={styles.iconSubscription} />
              Tüm Özelliklere Tam Erişim
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
