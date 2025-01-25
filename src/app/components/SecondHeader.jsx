"use client";

import React, { useEffect, useRef } from "react";
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

  const menuRef = useRef(null);

  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.scrollLeft = 0;
    }
  }, []);

  return (
    <div className={styles.secondHeader}>
      <ul className={`${styles.menu} no-scrollbar`} ref={menuRef}>
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
