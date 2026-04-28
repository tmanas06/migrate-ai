"use client";
// ============================================================
// Logo – Premium app icon component
// ============================================================
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 40 }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 ${className}`}>
      <Image
        src="/logo.png"
        alt="MigrateAI Logo"
        width={size}
        height={size}
        className="object-cover"
        priority
      />
    </div>
  );
}
