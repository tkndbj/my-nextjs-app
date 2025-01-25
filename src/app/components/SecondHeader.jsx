"use client";

import React from "react";
import styles from "./SecondHeader.module.css";

const SecondHeader = () => {
  const menuItems = [
    "Woman",
    "Man",
    "Most Sold",
    "Deal Products",
    "Trending",
    "Almost Sold Out",
    "Cosmetics",
    "Electronics",
  ];

  return (
    <div className={styles.secondHeader}>
      <ul className={styles.menu}>
        {menuItems.map((item) => (
          <li key={item} className={styles.menuItem}>
            <a
              href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className={styles.link}
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SecondHeader;
