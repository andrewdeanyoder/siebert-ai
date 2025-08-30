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
    <div className="fixed top-0 left-0 right-0 h-[60px] bg-black border-b border-white z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Image
          src="/memory-lab-brain.png"
          alt="Memory Lab Brain"
          width={40}
          height={40}
          className="rounded-full"
        />
        <span className="text-white font-semibold text-lg">A&P Memory Lab</span>
      </div>
      <LogoutButton />
    </div>
  ) : null;
}