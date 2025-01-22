// src/app/components/Countdown.jsx

"use client";

import React, { useEffect, useState } from "react";

const Countdown = ({ boostEndTime }) => {
  const calculateTimeLeft = () => {
    const difference =
      new Date(boostEndTime.toDate()).getTime() - new Date().getTime();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        Days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        Hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        Minutes: Math.floor((difference / 1000 / 60) % 60),
        Seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isBoostActive, setIsBoostActive] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      const tl = calculateTimeLeft();
      setTimeLeft(tl);

      if (Object.keys(tl).length === 0) {
        setIsBoostActive(false);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [boostEndTime]);

  if (!isBoostActive) {
    return <span className="text-sm text-red-500">Boost Ended</span>;
  }

  return (
    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
      {Object.keys(timeLeft).length > 0
        ? `${timeLeft.Days}d ${timeLeft.Hours}h ${timeLeft.Minutes}m ${timeLeft.Seconds}s`
        : "Boost Ending Soon"}
    </div>
  );
};

export default Countdown;
