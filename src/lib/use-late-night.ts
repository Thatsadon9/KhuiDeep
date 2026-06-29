"use client";

import { useEffect, useState } from "react";

export function useLateNight() {
  const [isLateNight, setIsLateNight] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const update = () => {
      setIsLateNight(root.classList.contains("late-night"));
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isLateNight;
}
