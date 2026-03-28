'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import LogoutButton from "#/components/LogoutButton";

export default function StickyBanner () {
  const [showStickyBanner, setShowStickyBanner] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowStickyBanner(scrollY > 300); // Show banner after scrolling 300px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return showStickyBanner ? (
    <div className="fixed top-0 left-0 right-0 h-[60px] bg-white dark:bg-black border-b border-gray-400 dark:border-white z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Image
          src="/ai-tutor-logo.png"
          alt="Siebert Science AI Tutor"
          width={40}
          height={40}
          className="rounded-full"
        />
        <span className="text-gray-950 dark:text-white font-semibold text-lg">Siebert Science AI Tutor</span>
      </div>
      <LogoutButton />
    </div>
  ) : null;
}