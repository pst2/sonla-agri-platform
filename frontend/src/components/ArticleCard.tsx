"use client";

import React from "react";
import Link from "next/link";
import { ArticleItem } from "@/types";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  origin_story: "Câu chuyện nguồn gốc",
  production_process: "Quy trình chế biến",
  cultural_heritage: "Văn hóa bản địa",
  guide: "Cẩm nang thưởng thức",
  innovation: "Đổi mới sáng tạo",
  research: "Khoa học dữ liệu",
  story: "Câu chuyện nông sản",
};

interface ArticleCardProps {
  article: ArticleItem;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const typeLabel =
    CONTENT_TYPE_LABELS[article.content_type] || "Bài viết chuyên đề";

  return (
    <article
      data-rise=""
      className="group bg-surface rounded-xl overflow-hidden flex flex-col justify-between"
    >
      <div>
        <div className="relative aspect-[16/10] overflow-hidden bg-bg">
          <img
            src={
              article.image_url ||
              "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80"
            }
            alt={article.title}
            width={640}
            height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between gap-3 text-[14px] text-muted mb-2 nums">
            <span className="text-accent">{typeLabel}</span>
            <span>
              {article.reading_time_minutes} phút đọc · {article.view_count} lượt xem
            </span>
          </div>

          <Link href={`/articles/${article.slug}`}>
            <h3 className="font-display text-2xl font-bold text-ink group-hover:text-accent transition-colors line-clamp-2">
              {article.title}
            </h3>
          </Link>

          <p className="text-[16px] text-ink mt-2.5 line-clamp-3 leading-relaxed">
            {article.excerpt}
          </p>
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 flex items-center justify-between text-[14px]">
        <span className="text-muted truncate max-w-[65%]">
          {article.author || "Ban Biên Tập Nông Sản Sơn La"}
        </span>
        <Link
          href={`/articles/${article.slug}`}
          className="text-accent font-semibold hover:underline"
        >
          Đọc bài viết
        </Link>
      </div>
    </article>
  );
}
