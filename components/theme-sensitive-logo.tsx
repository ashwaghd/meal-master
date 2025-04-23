"use client";

import { useTheme } from 'next-themes';
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export function ThemeSensitiveLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // During server rendering and before mounting, we can't determine the theme
  // to avoid hydration mismatch, render a placeholder or default
  if (!mounted) {
    return (
      <Link href={"/"} className="flex items-center">
        <div className="h-20 w-64 bg-gray-200 animate-pulse rounded" />
      </Link>
    );
  }
  
  // Use resolvedTheme which gives the actual theme accounting for system preference
  const isDarkMode = resolvedTheme === 'dark';
  const logoSrc = isDarkMode ? "/meal-master-logo-white.png" : "/meal-master-logo-black.png";
  
  return (
    <Link href={"/"} className="flex items-center">
      <div className="relative h-20 w-64">
        <Image 
          src={logoSrc}
          alt="Meal-Master by Ash Wagner"
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
    </Link>
  );
} 