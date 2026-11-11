"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTracker } from "@/hooks/useTracker";
import { DEMO_VISITOR_ID } from "@/lib/tracker";

export default function Navbar() {
  const pathname = usePathname();
  const { visitorId, isDemo, switchPersona, track } = useTracker();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!pathname) return;
    track("page_view", {
      content_type: "page",
      properties: { pathname },
    });
  }, [pathname, track]);

  if (pathname?.startsWith("/admin") || pathname === "/") {
    return null;
  }

  const navItems = [
    { href: "/", label: "Trang chủ" },
    { href: "/products", label: "Nông sản" },
    { href: "/articles", label: "Câu chuyện" },
    { href: "/about", label: "Về dự án" },
    { href: "/contact", label: "Liên hệ HTX" },
    { href: "/favorites", label: "Đã lưu" },
    { href: "/search", label: "Tìm kiếm" },
  ];

  return (
    <header className="bg-surface text-ink px-5 md:px-8 py-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display text-[24px] font-extrabold text-ink hover:text-accent transition-colors"
        >
          NÔNG SẢN SƠN LA
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[16px] font-normal taste-nav-link ${
                  active
                    ? "text-accent font-semibold underline underline-offset-4"
                    : "text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => switchPersona(!isDemo)}
            className="taste-btn px-3.5 py-2 rounded-lg bg-bg text-ink text-[14px] hover:text-accent"
            title="Chuyển đổi giữa khách thực tế và Persona mẫu"
          >
            {isDemo ? (
              <span>
                Persona: <code>{DEMO_VISITOR_ID}</code>
              </span>
            ) : (
              <span>
                Khách: <code>{visitorId ? visitorId.slice(0, 10) : "live"}</code>
              </span>
            )}
          </button>

          <Link
            href="/admin"
            className="taste-btn px-4 py-2 rounded-lg bg-accent text-accentInk text-[14px] font-semibold"
          >
            Quản trị ML
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="taste-btn lg:hidden px-3 py-2 rounded-lg bg-bg text-ink text-[14px]"
          >
            {mobileMenuOpen ? "Đóng" : "Danh mục"}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          data-rise=""
          className="lg:hidden mt-4 pt-4 bg-bg rounded-xl p-4 space-y-2"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg text-[16px] text-ink hover:bg-surface transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
