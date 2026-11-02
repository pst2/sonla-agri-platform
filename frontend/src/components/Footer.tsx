"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Footer() {
  const pathname = usePathname();
  const footerRef = useRef<HTMLElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const wordmarkRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      if (bgImgRef.current && footerRef.current) {
        gsap.fromTo(
          bgImgRef.current,
          { scale: 1.08, yPercent: -3.5 },
          {
            scale: 1.08,
            yPercent: 3.5,
            ease: "none",
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }

      if (wordmarkRef.current && footerRef.current) {
        gsap.fromTo(
          wordmarkRef.current,
          { y: 24, opacity: 0.25 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 75%",
              once: true,
            },
          }
        );
      }
    }, footerRef);

    return () => ctx.revert();
  }, [pathname]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer
      ref={footerRef}
      className="relative w-full min-h-[88svh] md:min-h-[100svh] bg-bg overflow-hidden flex flex-col justify-between"
    >
      {/* Full-bleed darkened highland landscape photograph with subtle <8% scroll parallax */}
      <img
        ref={bgImgRef}
        src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85"
        alt="Dãy núi cao và vùng nguyên liệu nông sản truyền thống tỉnh Sơn La"
        width={1800}
        height={1100}
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        style={{ filter: "brightness(0.45)" }}
      />

      {/* Top row: short link list left and contact details right */}
      <div
        data-rise=""
        style={{ "--d": 1 } as React.CSSProperties}
        className="relative z-10 w-full px-5 md:px-8 pt-10 flex flex-col md:flex-row items-start justify-between gap-8 text-ink"
      >
        <nav
          aria-label="Liên kết chân trang"
          className="flex flex-col gap-2.5 text-[16px]"
        >
          <Link href="/products" className="text-ink taste-nav-link">
            Danh mục 8 đặc sản Sơn La
          </Link>
          <Link href="/articles" className="text-ink taste-nav-link">
            Chuyên đề vùng trồng & chế biến
          </Link>
          <Link href="/about" className="text-ink taste-nav-link">
            Phương pháp phân cụm K-means & TF-IDF
          </Link>
          <Link href="/contact" className="text-ink taste-nav-link">
            Kết nối Hợp tác xã nguyên liệu
          </Link>
          <Link href="/admin" className="text-accent taste-nav-link">
            Bảng điều khiển Phân tích Dữ liệu
          </Link>
        </nav>

        <div className="text-[16px] text-ink md:text-right space-y-1.5">
          <p className="font-semibold">Tỉnh Sơn La · Tây Bắc Việt Nam</p>
          <p className="text-ink">
            Mai Sơn · Mộc Châu · Tà Xùa · Ngọc Chiến · Yên Châu
          </p>
          <p className="text-[14px] text-ink nums">
            Độ cao canh tác: 400m – 2.200m · Chỉ dẫn địa lý & OCOP
          </p>
        </div>
      </div>

      {/* Bottom wordmark across the photograph + 1 line of legal text */}
      <div
        ref={wordmarkRef}
        className="relative z-10 w-full px-5 md:px-8 pb-8 pt-24 will-change-transform"
      >
        <div
          aria-label="Nông sản Sơn La"
          className="font-display font-extrabold text-ink uppercase leading-[0.92] tracking-[-0.02em] select-none text-[42px] lg:text-[68px]"
        >
          NÔNG SẢN SƠN LA
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[14px] text-ink">
          <p>
            © {new Date().getFullYear()} Nền tảng Truyền thông & Phân tích Hành
            vi Nông sản Truyền thống Tỉnh Sơn La.
          </p>
          <p className="nums">
            K-means Clustering · Vietnamese TF-IDF Content-Based Recommendation
          </p>
        </div>
      </div>
    </footer>
  );
}
