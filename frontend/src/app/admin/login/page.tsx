"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminLogin, setAdminSession } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await adminLogin(username, password);
      setAdminSession(res.access_token, res.admin);
      router.push("/admin");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell-root min-h-[100svh] flex items-center justify-center p-4">
      <div className="app-sheet rounded-[16px] p-8 max-w-md w-full space-y-6">
        <div>
          <p className="text-[12px] font-medium text-[#1b6c80]">
            Nông Sản Sơn La · Phân tích Dữ liệu & ML
          </p>
          <h1 className="text-[22px] font-semibold text-[#131416] mt-1">
            Đăng nhập Quản trị viên
          </h1>
        </div>

        <div className="app-tray p-3.5 text-[13px] text-[#5d5f60]">
          Tài khoản thực nghiệm mặc định:{" "}
          <code className="font-medium text-[#131416]">admin</code> /{" "}
          <code className="font-medium text-[#131416]">admin123</code>
        </div>

        {error && (
          <div className="p-3.5 rounded-[8px] bg-[#ffedea] text-[#831c1e] text-[13px] font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-[14px]">
          <div>
            <label className="block text-[13px] font-medium text-[#131416] mb-1">
              Tên đăng nhập
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2 rounded-[6px] bg-white text-[#131416] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#131416] mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-[6px] bg-white text-[#131416] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-[6px] bg-[#1b6c80] text-white text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Đang xác thực..." : "Truy cập Bảng điều khiển"}
          </button>
        </form>

        <div className="pt-2 text-[13px] text-[#5d5f60]">
          <Link href="/" className="text-[#1b6c80] hover:underline">
            ← Quay về trang chủ Nông Sản Sơn La
          </Link>
        </div>
      </div>
    </div>
  );
}
