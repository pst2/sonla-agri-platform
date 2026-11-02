"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  fetchProducts,
  fetchArticles,
  fetchCategoriesAndLocations,
  fetchVisitorFavorites,
  fetchRecommendations,
} from "@/lib/api";
import {
  ProductItem,
  ArticleItem,
  CategoryItem,
  LocationItem,
  RecommendationsResponse,
  RecommendationCandidate,
} from "@/types";
import { useTracker } from "@/hooks/useTracker";
import { DEMO_VISITOR_ID, getVisitorId, trackEvent } from "@/lib/tracker";
import ProducerInquiryModal from "@/components/ProducerInquiryModal";
import SonLaInNumbers from "@/components/SonLaInNumbers";

const STAGE_FALLBACK_PHOTOS: Record<
  number,
  { url: string; caption: string; hours: string; coords: string }
> = {
  1: {
    url: "/images/products/ca-phe-arabica-son-la.jpg",
    caption: "Cao nguyên Mai Sơn · Vùng Cà phê Arabica Chỉ dẫn địa lý",
    hours: "Độ cao 650m – 1.050m · Vụ thu hoạch Tháng 10 – 01",
    coords: "21°12'N 104°03'E · Mai Sơn, Sơn La",
  },
  2: {
    url: "/images/products/che-shan-tuyet-ta-xua.jpg",
    caption: "Đỉnh Tà Xùa Bắc Yên · Rừng Chè Shan tuyết cổ thụ trên mây",
    hours: "Độ cao 1.500m – 2.200m · Vụ trà xuân Tháng 03 – 05",
    coords: "21°18'N 104°28'E · Bắc Yên, Sơn La",
  },
  3: {
    url: "/images/products/man-hau-moc-chau.jpg",
    caption: "Thung lũng Ná Ka Mộc Châu · Vùng Mận hậu & Hồng sấy dẻo ôn đới",
    hours: "Độ cao 1.050m · Mùa quả chín Tháng 05 – 11",
    coords: "20°50'N 104°38'E · Mộc Châu, Sơn La",
  },
  4: {
    url: "/images/products/gao-nep-tan-ngoc-chien.jpg",
    caption: "Mường La Ngọc Chiến · Ruộng bậc thang Nếp Tan suối khoáng",
    hours: "Độ cao 1.600m – 1.800m · Vụ lúa mùa Tháng 09 – 10",
    coords: "21°34'N 104°16'E · Mường La, Sơn La",
  },
  5: {
    url: "/images/products/toi-den-mot-nhanh-son-la.jpg",
    caption: "Thung lũng Yên Châu · Vùng Tỏi đen lên men một nhánh",
    hours: "Độ cao 400m – 750m · Lên men 45 – 60 ngày",
    coords: "21°02'N 104°18'E · Yên Châu, Sơn La",
  },
};

const INITIAL_LOCATIONS: LocationItem[] = [
  {
    location_id: 1,
    name: "Vùng cà phê Mai Sơn & Thành phố Sơn La",
    slug: "mai-son-thanh-pho-son-la",
    province: "Sơn La",
    district: "Mai Sơn",
    altitude: "650m – 1.050m",
    climate: "Nhiệt đới gió mùa núi cao, biên độ nhiệt ngày đêm lớn 10–14°C.",
    soil_type: "Đất đỏ bazan và đất feralit mùn trên đá vôi thoát nước tốt.",
    description:
      "Thủ phủ cà phê Arabica lớn nhất miền Bắc Việt Nam, được cấp chứng nhận Chỉ dẫn địa lý Cà phê Sơn La.",
    latitude: 21.2814,
    longitude: 103.9786,
  },
  {
    location_id: 2,
    name: "Đỉnh Tà Xùa – Huyện Bắc Yên",
    slug: "ta-xua-bac-yen",
    province: "Sơn La",
    district: "Bắc Yên",
    altitude: "1.500m – 2.200m",
    climate: "Quanh năm mây mù bao phủ, độ ẩm không khí 85–90%.",
    soil_type: "Đất mùn núi cao nguyên sinh giàu khoáng chất vi lượng.",
    description:
      "Vùng quần thể chè Shan tuyết cổ thụ hàng trăm năm tuổi của đồng bào dân tộc Mông trên dãy Tà Xùa.",
    latitude: 21.3189,
    longitude: 104.4512,
  },
  {
    location_id: 3,
    name: "Cao nguyên Mộc Châu & Vân Hồ",
    slug: "cao-nguyen-moc-chau",
    province: "Sơn La",
    district: "Mộc Châu",
    altitude: "1.050m",
    climate: "Khí hậu ôn đới tiểu vùng cao nguyên, mùa hè mát mẻ.",
    soil_type: "Đất thảo nguyên feralit nâu đỏ tầng dày, giàu hữu cơ.",
    description:
      "Vùng trồng mận hậu Ná Ka, Tân Lập và hồng giòn Mộc Châu nổi tiếng khắp cả nước.",
    latitude: 20.8447,
    longitude: 104.6392,
  },
  {
    location_id: 4,
    name: "Thung lũng Ngọc Chiến – Huyện Mường La",
    slug: "ngoc-chien-muong-la",
    province: "Sơn La",
    district: "Mường La",
    altitude: "1.600m – 1.800m",
    climate: "Khí hậu mát lành bốn mùa, nguồn nước suối khoáng nóng.",
    soil_type: "Đất phù sa cổ ven suối chiến giàu khoáng chất tự nhiên.",
    description:
      "Cánh đồng Mường Chiến nơi đồng bào dân tộc Thái canh tác giống lúa nếp Tan cổ truyền tiến vua.",
    latitude: 21.5944,
    longitude: 104.1972,
  },
  {
    location_id: 5,
    name: "Vùng chuyên canh Yên Châu & Phù Yên",
    slug: "yen-chau-phu-yen",
    province: "Sơn La",
    district: "Yên Châu",
    altitude: "400m – 750m",
    climate: "Thung lũng nắng ấm, gió Lào khô ráo vào đầu vụ thu hoạch.",
    soil_type: "Đất cát pha thịt nhẹ bồi tụ ven suối Vạt.",
    description:
      "Vùng trồng xoài tròn cổ thụ và tỏi cô đơn đặc trưng dùng để lên men tỏi đen dược liệu cao cấp.",
    latitude: 21.0458,
    longitude: 104.3015,
  },
];

const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    category_id: 1,
    name: "Đồ uống",
    slug: "do-uong",
    description: "Đồ uống đặc sản Sơn La",
    icon: "Coffee",
    display_order: 1,
  },
  {
    category_id: 2,
    name: "Trái cây",
    slug: "trai-cay",
    description: "Trái cây tươi ôn đới",
    icon: "Apple",
    display_order: 2,
  },
  {
    category_id: 3,
    name: "Sản phẩm chế biến",
    slug: "san-pham-che-bien",
    description: "Nông sản chế biến sâu",
    icon: "Sparkles",
    display_order: 3,
  },
  {
    category_id: 4,
    name: "Nông sản",
    slug: "nong-san",
    description: "Lương thực bản địa quý hiếm",
    icon: "Wheat",
    display_order: 4,
  },
];

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    product_id: 1,
    product_name: "Cà phê Arabica Sơn La",
    slug: "ca-phe-arabica-son-la",
    category_id: 1,
    location_id: 1,
    origin: "Huyện Mai Sơn & TP. Sơn La, Tỉnh Sơn La",
    short_description:
      "Hạt cà phê Arabica vùng núi cao Tây Bắc đạt chứng nhận Chỉ dẫn địa lý quốc gia và OCOP 5 sao, hương hoa quả tự nhiên và vị chua thanh tao nhã.",
    description:
      "Cà phê Arabica Sơn La được trồng ở độ cao từ 650m đến hơn 1.050m trên các sườn đồi đất đỏ đá vôi tại Mai Sơn, Thuận Châu và TP. Sơn La.",
    ingredients: "100% hạt cà phê Arabica thu hái chín đỏ tại Mai Sơn, Sơn La.",
    production_process:
      "Thu hái thủ công, lên men ướt, phơi nhà màng, rang mộc Hot-air.",
    characteristics:
      "Hương hoa trắng, caramel và trái cây nhiệt đới, vị chua thanh.",
    traditional_value: "Sinh kế bền vững cho hơn 18.000 hộ nông dân Sơn La.",
    keywords: "cà phê arabica sơn la, ocop 5 sao, mai sơn",
    image_url:
      "/images/products/ca-phe-arabica-son-la.jpg",
    season: "Thu hoạch Tháng 10 – Tháng 1",
    certification: "Chỉ dẫn địa lý Sơn La · OCOP 5 Sao Quốc gia",
    producer: "HTX Cà phê Bích Thao Sơn La",
    source_reference: "Cục Sở hữu trí tuệ Việt Nam",
    verification_status: "verified",
    view_count: 420,
    favorite_count: 85,
    contact_click_count: 24,
    is_featured: true,
    created_at: "2025-02-01T08:00:00",
    updated_at: "2025-02-01T08:00:00",
    articles: [],
  },
  {
    product_id: 2,
    product_name: "Chè Shan tuyết",
    slug: "che-shan-tuyet-ta-xua",
    category_id: 1,
    location_id: 2,
    origin: "Xã Tà Xùa, Huyện Bắc Yên, Tỉnh Sơn La",
    short_description:
      "Búp trà cổ thụ hàng trăm năm tuổi phủ lớp lông tơ trắng như tuyết trên đỉnh núi Tà Xùa ở độ cao 1.800m, nước vàng sánh mật ong.",
    description:
      "Chè Shan tuyết Tà Xùa sinh trưởng tự nhiên trên đỉnh núi đá cao 1.500m – 2.200m tại Bắc Yên.",
    ingredients: "100% búp chè Shan tuyết cổ thụ Tà Xùa.",
    production_process:
      "Hái sương sớm, làm héo tự nhiên, sao chảo gang củi rừng.",
    characteristics: "Nước vàng mật ong, tiền chát dịu hậu ngọt sâu.",
    traditional_value: "Báu vật của đồng bào dân tộc Mông tại Tà Xùa.",
    keywords: "chè shan tuyết, trà tà xùa, bắc yên",
    image_url:
      "/images/products/che-shan-tuyet-ta-xua.jpg",
    season: "Vụ Xuân (Tháng 3 – 4) & Vụ Thu (Tháng 8 – 10)",
    certification: "Chỉ dẫn địa lý Chè Tà Xùa · OCOP 4 Sao",
    producer: "HTX Đặc sản Tây Bắc Tà Xùa",
    source_reference: "Sở KH&CN tỉnh Sơn La",
    verification_status: "verified",
    view_count: 365,
    favorite_count: 72,
    contact_click_count: 19,
    is_featured: true,
    created_at: "2025-02-01T08:00:00",
    updated_at: "2025-02-01T08:00:00",
    articles: [],
  },
  {
    product_id: 3,
    product_name: "Trà từ vỏ cà phê",
    slug: "tra-tu-vo-ca-phe-cascara",
    category_id: 1,
    location_id: 1,
    origin: "Huyện Mai Sơn, Tỉnh Sơn La",
    short_description:
      "Trà Cascara chế biến từ vỏ quả cà phê Arabica chín mọng vùng Mai Sơn, giàu chất chống oxy hóa, hương vị thảo mộc trái cây sấy ngọt thanh.",
    description:
      "Sản phẩm sáng tạo nâng tầm chuỗi giá trị nông nghiệp tuần hoàn tại Sơn La.",
    ingredients: "100% vỏ thịt quả cà phê Arabica Sơn La chín đỏ.",
    production_process:
      "Tuyển chọn trái chín, tách vỏ tươi, sấy lạnh Heat-pump.",
    characteristics:
      "Nước pha màu hồng ngọc đến hổ phách, vị chua ngọt thanh mát.",
    traditional_value: "Kinh tế tuần hoàn bền vững vùng cà phê Sơn La.",
    keywords: "trà vỏ cà phê, cascara, mai sơn",
    image_url:
      "/images/products/tra-tu-vo-ca-phe-cascara.jpg",
    season: "Quanh năm",
    certification: "OCOP 4 Sao Tỉnh Sơn La · ISO 22000",
    producer: "HTX Cà phê Bích Thao Sơn La",
    source_reference: "Chương trình OCOP tỉnh Sơn La",
    verification_status: "verified",
    view_count: 290,
    favorite_count: 54,
    contact_click_count: 15,
    is_featured: true,
    created_at: "2025-02-01T08:00:00",
    updated_at: "2025-02-01T08:00:00",
    articles: [],
  },
  {
    product_id: 4,
    product_name: "Mận hậu Mộc Châu",
    slug: "man-hau-moc-chau",
    category_id: 2,
    location_id: 3,
    origin: "Cao nguyên Mộc Châu, Tỉnh Sơn La",
    short_description:
      "Trái mận hậu chín đỏ tím phủ phấn trắng tự nhiên từ thung lũng Ná Ka ở độ cao 1.050m, thịt giòn róc hạt, vị chua ngọt đậm đà.",
    description:
      "Mận hậu Mộc Châu sinh trưởng trên vùng thảo nguyên mát mẻ 1.050m.",
    ingredients:
      "100% trái mận hậu tươi thu hái tại thung lũng Ná Ka, Mộc Châu.",
    production_process:
      "Canh tác VietGAP, thu hái thủ công giữ lớp phấn trắng.",
    characteristics: "Quả to tròn, giòn tan, róc hạt, vị chua ngọt hài hòa.",
    traditional_value: "Biểu tượng lễ hội Hái quả Mộc Châu hàng năm.",
    keywords: "mận hậu mộc châu, thung lũng ná ka, trái cây",
    image_url:
      "/images/products/man-hau-moc-chau.jpg",
    season: "Tháng 5 – Tháng 7",
    certification: "Nhãn hiệu chứng nhận Mận hậu Mộc Châu · VietGAP",
    producer: "HTX Nông nghiệp sạch Mộc Châu",
    source_reference: "UBND Huyện Mộc Châu",
    verification_status: "verified",
    view_count: 380,
    favorite_count: 78,
    contact_click_count: 21,
    is_featured: true,
    created_at: "2025-02-01T08:00:00",
    updated_at: "2025-02-01T08:00:00",
    articles: [],
  },
  {
    product_id: 5,
    product_name: "Mận sấy",
    slug: "man-say-deo-moc-chau",
    category_id: 3,
    location_id: 3,
    origin: "Thị trấn Nông trường Mộc Châu, Tỉnh Sơn La",
    short_description: "Chế biến từ những trái mận hậu Mộc Châu chín mọng tuyển chọn, sấy lạnh giữ nguyên sắc đỏ ruby, độ dẻo mềm và vị chua ngọt tự nhiên.",
    description: "Mận sấy dẻo Mộc Châu giải quyết bài toán tính mùa vụ ngắn ngủi của trái mận hậu tươi, giữ vị thơm dẻo quanh năm.",
    ingredients: "95% mận hậu tươi Mộc Châu chín mọng, 5% đường mía tinh luyện.",
    production_process: "Tuyển chọn quả chín, sấy lạnh ở nhiệt độ 45–50°C trong 28 giờ.",
    characteristics: "Quả sấy dẻo mềm, không chảy nước, màu tím đỏ tự nhiên, thơm mùi mận chín.",
    traditional_value: "Phát huy bí quyết chế biến mứt quả truyền thống Mộc Châu kết hợp sấy lạnh hiện đại.",
    keywords: "mận sấy, mận sấy dẻo, mộc châu, sản phẩm chế biến",
    image_url: "/images/products/man-say-deo-moc-chau.jpg",
    season: "Quanh năm",
    certification: "OCOP 4 Sao Tỉnh Sơn La · HACCP",
    producer: "HTX Nông sản Quyết Thanh Mộc Châu",
    source_reference: "Sở NN&PTNT tỉnh Sơn La",
    verification_status: "verified",
    view_count: 310,
    favorite_count: 61,
    contact_click_count: 14,
    is_featured: false,
    created_at: "2025-02-01T08:00:00",
    updated_at: "2025-02-01T08:00:00",
    articles: [],
  },
  {
    product_id: 6,
    product_name: "Hồng sấy dẻo",
    slug: "hong-say-deo-moc-chau",
    category_id: 3,
    location_id: 3,
    origin: "Huyện Mộc Châu & Vân Hồ, Tỉnh Sơn La",
    short_description: "Hồng tươi Mộc Châu gọt vỏ treo gió và sấy lạnh theo công nghệ Hoshigaki Nhật Bản, bên ngoài dẻo dai, bên trong mật ngọt sánh mịn.",
    description: "Hồng sấy dẻo Mộc Châu ứng dụng công nghệ treo gió kết hợp sấy lạnh chuẩn Hoshigaki Nhật Bản.",
    ingredients: "100% quả hồng tươi Mộc Châu thu hoạch đúng độ chín vàng cam.",
    production_process: "Treo giàn sấy lạnh kiểm soát nhiệt ẩm trong 25–35 ngày.",
    characteristics: "Nguyên quả dẻo mềm, ruột tươm mật vàng cam sánh mịn, vị ngọt thanh khiết.",
    traditional_value: "Giao thoa tinh tế giữa nguyên liệu hồng cao nguyên và kỹ nghệ chế biến tinh xảo.",
    keywords: "hồng sấy dẻo, hồng treo gió, mộc châu, sản phẩm chế biến",
    image_url: "/images/products/hong-say-deo-moc-chau.jpg",
    season: "Tháng 9 – Tháng 2",
    certification: "OCOP 4 Sao · VietGAP",
    producer: "HTX Nông sản Sạch Mộc Châu",
    source_reference: "UBND Huyện Mộc Châu",
    verification_status: "verified",
    view_count: 335,
    favorite_count: 66,
    contact_click_count: 17,
    is_featured: true,
    created_at: "2025-02-01T08:00:00",
    updated_at: "2025-02-01T08:00:00",
    articles: [],
  },
  {
    product_id: 7,
    product_name: "Gạo nếp Tan Ngọc Chiến",
    slug: "gao-nep-tan-ngoc-chien",
    category_id: 4,
    location_id: 4,
    origin: "Xã Ngọc Chiến, Huyện Mường La, Tỉnh Sơn La",
    short_description:
      "Hạt gạo nếp cổ truyền tròn mẩy được nuôi dưỡng bởi dòng nước suối khoáng nóng và băng tan từ đỉnh Pú Luông ở độ cao 1.600m, đồ xôi dẻo thơm.",
    description:
      "Lúa nếp Tan canh tác trên cánh đồng Mường Chiến cao 1.600m – 1.800m.",
    ingredients: "100% hạt gạo nếp Tan cổ truyền Ngọc Chiến.",
    production_process:
      "Canh tác lúa nước vùng cao, gặt tay bằng nhíp cổ truyền.",
    characteristics: "Hạt tròn trắng đục, đồ xôi bóng dẻo, để nguội vẫn mềm.",
    traditional_value: "Lễ hội Mừng cơm mới của đồng bào Thái trắng Ngọc Chiến.",
    keywords: "gạo nếp tan ngọc chiến, mường la, nông sản",
    image_url:
      "/images/products/gao-nep-tan-ngoc-chien.jpg",
    season: "Vụ Mùa Tháng 9 – Tháng 10",
    certification: "Nhãn hiệu tập thể Nếp Tan Ngọc Chiến · OCOP 4 Sao",
    producer: "HTX Nông nghiệp Ngọc Chiến",
    source_reference: "UBND Huyện Mường La",
    verification_status: "verified",
    view_count: 350,
    favorite_count: 70,
    contact_click_count: 18,
    is_featured: true,
    created_at: "2025-02-01T08:00:00",
    updated_at: "2025-02-01T08:00:00",
    articles: [],
  },
  {
    product_id: 8,
    product_name: "Tỏi đen Yên Châu",
    slug: "toi-den-mot-nhanh-son-la",
    category_id: 3,
    location_id: 5,
    origin: "Huyện Yên Châu, Tỉnh Sơn La",
    short_description:
      "Lên men tự nhiên suốt 45–60 ngày từ củ tỏi một nhánh (tỏi cô đơn) vùng Yên Châu, hàm lượng S-Allyl-L-Cysteine cao, dẻo ngọt như ô mai.",
    description: "Chế biến sâu từ tỏi tía một nhánh đặc sản Yên Châu.",
    ingredients: "100% tỏi cô đơn Yên Châu lên men tự nhiên.",
    production_process: "Lên men kiểm soát nhiệt ẩm 45–60 ngày không phụ gia.",
    characteristics: "Ruột đen nhánh, mềm dẻo, vị ngọt dịu thanh không hăng.",
    traditional_value:
      "Nâng tầm giá trị dược liệu cho cây tỏi bản địa Yên Châu.",
    keywords: "tỏi đen yên châu, tỏi cô đơn, sản phẩm chế biến",
    image_url:
      "/images/products/toi-den-mot-nhanh-son-la.jpg",
    season: "Quanh năm (thu hoạch tỏi tươi Tháng 2 – 3)",
    certification: "OCOP 4 Sao Tỉnh Sơn La · HACCP",
    producer: "HTX Sản xuất Kinh doanh Tỏi Yên Châu",
    source_reference: "Sở KH&CN tỉnh Sơn La",
    verification_status: "verified",
    view_count: 280,
    favorite_count: 58,
    contact_click_count: 16,
    is_featured: false,
    created_at: "2025-02-01T08:00:00",
    updated_at: "2025-02-01T08:00:00",
    articles: [],
  },
];

const INITIAL_ARTICLES: ArticleItem[] = [
  {
    article_id: 1,
    title:
      "Hành trình hạt cà phê Arabica Sơn La từ sườn núi đá vôi đến chứng nhận Chỉ dẫn địa lý",
    slug: "hanh-trinh-hat-ca-phe-arabica-son-la",
    content_type: "cultural_story",
    excerpt:
      "Khám phá điều kiện thổ nhưỡng đất đỏ trên nền đá vôi ở độ cao 800m tại Mai Sơn tạo nên hương vị chua thanh hoa quả độc bản của Arabica Sơn La.",
    content: "Bài viết chuyên đề về vùng nguyên liệu cà phê Arabica Sơn La.",
    author: "Ban Biên tập Nông sản Sơn La",
    reading_time_minutes: 6,
    image_url:
      "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=800&q=80",
    keywords: "cà phê arabica, mai sơn, chỉ dẫn địa lý",
    published_at: "2025-02-15T08:00:00",
    status: "published",
    view_count: 340,
    favorite_count: 42,
    created_at: "2025-02-15T08:00:00",
    updated_at: "2025-02-15T08:00:00",
    products: [],
  },
  {
    article_id: 2,
    title:
      "Nghệ thuật sao chè Shan tuyết cổ thụ bằng chảo gang của người Mông trên đỉnh Tà Xùa",
    slug: "nghe-thuat-sao-che-shan-tuyet-ta-xua",
    content_type: "production_guide",
    excerpt:
      "Ở độ cao 1.800m quanh năm mây phủ, những nghệ nhân người Mông cảm nhận nhiệt độ chảo gang bằng đôi bàn tay trần để giữ trọn lớp tuyết trắng trên búp trà.",
    content: "Bài viết chuyên đề về kỹ thuật chế biến chè Shan tuyết Tà Xùa.",
    author: "Ban Biên tập Nông sản Sơn La",
    reading_time_minutes: 7,
    image_url:
      "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=800&q=80",
    keywords: "chè shan tuyết, tà xùa, bắc yên",
    published_at: "2025-02-18T08:00:00",
    status: "published",
    view_count: 295,
    favorite_count: 38,
    created_at: "2025-02-18T08:00:00",
    updated_at: "2025-02-18T08:00:00",
    products: [],
  },
  {
    article_id: 3,
    title:
      "Thung lũng mận hậu Ná Ka Mộc Châu và tiêu chuẩn canh tác hữu cơ VietGAP bền vững",
    slug: "thung-lung-man-hau-na-ka-moc-chau",
    content_type: "origin_story",
    excerpt:
      "Từ mùa hoa trắng xóa tháng Giêng đến mùa thu hoạch quả chín tím tháng Năm trên thảo nguyên Mộc Châu ở độ cao 1.050m.",
    content: "Bài viết chuyên đề về vùng trồng mận hậu Ná Ka Mộc Châu.",
    author: "Ban Biên tập Nông sản Sơn La",
    reading_time_minutes: 5,
    image_url:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    keywords: "mận hậu mộc châu, ná ka, vietgap",
    published_at: "2025-02-20T08:00:00",
    status: "published",
    view_count: 270,
    favorite_count: 31,
    created_at: "2025-02-20T08:00:00",
    updated_at: "2025-02-20T08:00:00",
    products: [],
  },
  {
    article_id: 4,
    title:
      "Bí quyết canh tác lúa nếp Tan Ngọc Chiến bên dòng suối khoáng nóng Mường La",
    slug: "bi-quyet-canh-tac-nep-tan-ngoc-chien",
    content_type: "cultural_story",
    excerpt:
      "Hạt gạo nếp tròn mẩy được nuôi dưỡng bởi nguồn nước băng tan từ đỉnh Pú Luông và mạch khoáng nóng tự nhiên ở độ cao 1.600m.",
    content: "Bài viết chuyên đề về gạo nếp Tan Ngọc Chiến.",
    author: "Ban Biên tập Nông sản Sơn La",
    reading_time_minutes: 6,
    image_url:
      "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80",
    keywords: "nếp tan ngọc chiến, mường la, lúa vùng cao",
    published_at: "2025-02-22T08:00:00",
    status: "published",
    view_count: 250,
    favorite_count: 29,
    created_at: "2025-02-22T08:00:00",
    updated_at: "2025-02-22T08:00:00",
    products: [],
  },
];

const INITIAL_RECS: RecommendationsResponse = {
  visitor_id: DEMO_VISITOR_ID,
  strategy: "content_based",
  model_version: "tfidf_v1_sonla",
  count: 5,
  items: [
    {
      rank: 1,
      content_type: "product",
      content_id: 1,
      title: "Cà phê Arabica Sơn La",
      slug: "ca-phe-arabica-son-la",
      category_name: "Đồ uống",
      origin: "Mai Sơn, Sơn La",
      image_url:
        "/images/products/ca-phe-arabica-son-la.jpg",
      short_description: "Chỉ dẫn địa lý Sơn La · OCOP 5 Sao",
      score: 0.89,
      reason: "Tương đồng ngữ nghĩa TF-IDF cao với hồ sơ đồ uống vùng cao",
    },
    {
      rank: 2,
      content_type: "product",
      content_id: 2,
      title: "Chè Shan tuyết Tà Xùa",
      slug: "che-shan-tuyet-ta-xua",
      category_name: "Đồ uống",
      origin: "Bắc Yên, Sơn La",
      image_url:
        "/images/products/che-shan-tuyet-ta-xua.jpg",
      short_description: "Đỉnh Tà Xùa 1.800m · OCOP 4 Sao",
      score: 0.84,
      reason: "Cùng nhóm thức uống đặc sản núi cao Tây Bắc",
    },
    {
      rank: 3,
      content_type: "product",
      content_id: 3,
      title: "Trà từ vỏ cà phê Cascara",
      slug: "tra-tu-vo-ca-phe-cascara",
      category_name: "Đồ uống",
      origin: "Mai Sơn, Sơn La",
      image_url:
        "/images/products/tra-tu-vo-ca-phe-cascara.jpg",
      short_description: "Sấy lạnh Heat-pump · OCOP 4 Sao",
      score: 0.79,
      reason: "Liên kết vùng nguyên liệu Arabica Mai Sơn",
    },
    {
      rank: 4,
      content_type: "article",
      content_id: 1,
      title: "Hành trình hạt cà phê Arabica Sơn La",
      slug: "hanh-trinh-hat-ca-phe-arabica-son-la",
      category_name: "Chuyên đề",
      origin: "Mai Sơn, Sơn La",
      image_url:
        "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=200&q=80",
      short_description: "Câu chuyện vùng trồng & Chỉ dẫn địa lý",
      score: 0.75,
      reason: "Bài viết chuyên sâu cùng chủ đề",
    },
    {
      rank: 5,
      content_type: "product",
      content_id: 7,
      title: "Gạo nếp Tan Ngọc Chiến",
      slug: "gao-nep-tan-ngoc-chien",
      category_name: "Nông sản",
      origin: "Mường La, Sơn La",
      image_url:
        "/images/products/gao-nep-tan-ngoc-chien.jpg",
      short_description: "Canh tác suối khoáng 1.600m · OCOP 4 Sao",
      score: 0.71,
      reason: "Phổ biến trong cụm khách hàng quan tâm đặc sản",
    },
  ],
};

export default function HomePage() {
  const { visitorId, isDemo, switchPersona } = useTracker();
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [articles, setArticles] = useState<ArticleItem[]>(INITIAL_ARTICLES);
  const [categories, setCategories] =
    useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [locations, setLocations] = useState<LocationItem[]>(INITIAL_LOCATIONS);
  const [favoriteProductIds, setFavoriteProductIds] = useState<Set<number>>(
    new Set()
  );
  const [recs, setRecs] = useState<RecommendationsResponse>(INITIAL_RECS);

  const [activeLocationId, setActiveLocationId] = useState<number>(1);
  const [hoveredProduct, setHoveredProduct] = useState<ProductItem | null>(
    null
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [showcaseIndex, setShowcaseIndex] = useState<number>(0);
  const [inquiryOpen, setInquiryOpen] = useState<boolean>(false);

  const pageRef = useRef<HTMLDivElement | null>(null);
  const stageImgRef = useRef<HTMLImageElement | null>(null);
  const stageCaptionRef = useRef<HTMLDivElement | null>(null);
  const showcaseImgRef = useRef<HTMLImageElement | null>(null);
  const showcaseDetailRef = useRef<HTMLDivElement | null>(null);

  const loadRecommendations = useCallback(async () => {
    try {
      const r = await fetchRecommendations({
        visitor_id: getVisitorId(),
        limit: 5,
      });
      if (r?.items?.length) setRecs(r);
    } catch {
      // keep initial fallback
    }
  }, []);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [prodRes, artRes, catLocRes, favRes] = await Promise.all([
          fetchProducts(),
          fetchArticles({ limit: 6 }),
          fetchCategoriesAndLocations(),
          fetchVisitorFavorites().catch(() => null),
        ]);
        if (prodRes.items?.length) setProducts(prodRes.items);
        if (artRes.items?.length) setArticles(artRes.items);
        if (catLocRes.categories?.length) setCategories(catLocRes.categories);
        if (catLocRes.locations?.length) setLocations(catLocRes.locations);
        if (favRes) {
          setFavoriteProductIds(
            new Set(
              favRes.favorites
                .filter((f) => f.content_type === "product")
                .map((f) => f.content_id)
            )
          );
        }
      } catch {
        // ignore
      }
    }
    loadHomeData();
    loadRecommendations();

    const handlePersonaChange = () => loadRecommendations();
    window.addEventListener("agri-persona-change", handlePersonaChange);
    return () =>
      window.removeEventListener("agri-persona-change", handlePersonaChange);
  }, [loadRecommendations]);

  // Slow crossfade rotation across the 5 altitude bands when tab is visible and no product row is hovered
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      if (document.hidden || hoveredProduct) return;
      setActiveLocationId((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 6400);
    return () => clearInterval(interval);
  }, [hoveredProduct]);

  // Dedicated GSAP + ScrollTrigger Motion Pass
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // 1. Hero Load Sequence (< 1.2s total settle time per references/motion.md §6)
      const heroTl = gsap.timeline({ defaults: { ease: "expo.out" } });
      heroTl
        .fromTo(
          "[data-hero-line]",
          { yPercent: 100 },
          { yPercent: 0, duration: 0.78, stagger: 0.09 },
          0.05
        )
        .fromTo(
          "[data-hero-lead]",
          { y: 14, opacity: 0.2 },
          { y: 0, opacity: 1, duration: 0.55 },
          0.18
        )
        .fromTo(
          "[data-hero-actions]",
          { y: 14, opacity: 0.2 },
          { y: 0, opacity: 1, duration: 0.55 },
          0.26
        )
        .fromTo(
          "[data-hero-terroir]",
          { y: 18, opacity: 0.25 },
          { y: 0, opacity: 1, duration: 0.65 },
          0.34
        )
        .fromTo(
          "[data-hero-stage-media]",
          { scale: 1.07 },
          { scale: 1, duration: 1.05, ease: "expo.out" },
          0.08
        );

      // 2. Two-Ended Lists Staggered Row Entrances
      gsap.fromTo(
        "[data-rec-row]",
        { y: 14, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.055,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "[data-rec-section]",
            start: "top 88%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        "[data-prod-row]",
        { y: 14, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.045,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "[data-prod-section]",
            start: "top 88%",
            once: true,
          },
        }
      );

      // 3. Section 2: Square Plate Showcase Entrance + Ring Motif + Parallax
      gsap.fromTo(
        "[data-showcase-frame]",
        { scale: 0.96, opacity: 0.3 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.95,
          ease: "expo.out",
          scrollTrigger: {
            trigger: "[data-showcase-section]",
            start: "top 84%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        "[data-ring-motif]",
        { scale: 0.86, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: "[data-showcase-section]",
            start: "top 80%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        "[data-showcase-item]",
        { y: 18, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.075,
          ease: "expo.out",
          scrollTrigger: {
            trigger: "[data-showcase-section]",
            start: "top 82%",
            once: true,
          },
        }
      );

      // 4. Section 3: Itinerary on a Slip Choreographed Entrance
      gsap.fromTo(
        "[data-itinerary-head]",
        { y: 20, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          ease: "expo.out",
          scrollTrigger: {
            trigger: "[data-itinerary-section]",
            start: "top 85%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        "[data-itinerary-step]",
        { y: 22, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.72,
          stagger: 0.085,
          ease: "expo.out",
          scrollTrigger: {
            trigger: "[data-itinerary-section]",
            start: "top 82%",
            once: true,
          },
        }
      );

      // 5. Section 4: Founder's Letter & Cultural Story Cards
      gsap.fromTo(
        "[data-founder-sheet]",
        { y: 24, opacity: 0.25 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          ease: "expo.out",
          scrollTrigger: {
            trigger: "[data-editorial-section]",
            start: "top 84%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        "[data-story-card]",
        { y: 24, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.78,
          stagger: 0.085,
          ease: "expo.out",
          scrollTrigger: {
            trigger: "[data-editorial-section]",
            start: "top 82%",
            once: true,
          },
        }
      );

      // 6. Section 5: Closing Cooperative Contact Band
      gsap.fromTo(
        "[data-contact-col]",
        { y: 18, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.72,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: {
            trigger: "[data-contact-section]",
            start: "top 88%",
            once: true,
          },
        }
      );

      // 7. Subtle Scroll-Linked Parallax (< 8% travel inside oversized frames)
      gsap.utils.toArray<HTMLElement>("[data-parallax-img]").forEach((img) => {
        gsap.fromTo(
          img,
          { scale: 1.08, yPercent: -3.5 },
          {
            scale: 1.08,
            yPercent: 3.5,
            ease: "none",
            scrollTrigger: {
              trigger: img.parentElement || img,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  const activeLocation =
    locations.find((l) => l.location_id === activeLocationId) || locations[0];
  const baseStageMeta =
    STAGE_FALLBACK_PHOTOS[activeLocationId] || STAGE_FALLBACK_PHOTOS[1];

  const stageMeta = hoveredProduct
    ? {
        url: hoveredProduct.image_url,
        caption: `${hoveredProduct.product_name} · ${
          hoveredProduct.certification || "Đặc sản Sơn La"
        }`,
        hours: `${hoveredProduct.origin} · ${
          hoveredProduct.season || "Quanh năm"
        }`,
        coords: `${hoveredProduct.producer || "Hợp tác xã Sơn La"}`,
      }
    : baseStageMeta;

  // Animate Stage Image & Caption on Altitude Band or Product Hover Switch
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (stageImgRef.current) {
      gsap.fromTo(
        stageImgRef.current,
        { scale: 1.05, opacity: 0.78 },
        { scale: 1, opacity: 1, duration: 0.62, ease: "expo.out" }
      );
    }
    if (stageCaptionRef.current) {
      gsap.fromTo(
        stageCaptionRef.current,
        { y: 8, opacity: 0.4 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }
      );
    }
  }, [stageMeta.url, stageMeta.caption]);

  const categoryProducts = selectedCategoryId
    ? products.filter((p) => p.category_id === selectedCategoryId)
    : products;

  const showcaseProduct =
    categoryProducts[showcaseIndex % Math.max(1, categoryProducts.length)] ||
    products[0];

  // Animate Showcase Square Plate & Copy when switching Category Tab or Next Product
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (showcaseImgRef.current) {
      gsap.fromTo(
        showcaseImgRef.current,
        { scale: 1.06, opacity: 0.75 },
        { scale: 1, opacity: 1, duration: 0.65, ease: "expo.out" }
      );
    }
    if (showcaseDetailRef.current) {
      gsap.fromTo(
        showcaseDetailRef.current,
        { y: 10, opacity: 0.35 },
        { y: 0, opacity: 1, duration: 0.42, ease: "power2.out" }
      );
    }
  }, [showcaseProduct?.product_id]);

  const handleRecClick = (item: RecommendationCandidate) => {
    trackEvent("recommendation_click", {
      content_type: item.content_type,
      content_id: item.content_id,
      properties: {
        rank: item.rank,
        score: item.score,
        strategy: recs?.strategy,
        title: item.title,
      },
    });
  };

  return (
    <div
      ref={pageRef}
      className="w-full px-5 md:px-8 pt-4 pb-16 space-y-20"
    >
      {/* =====================================================================
          1. THE SPLIT STAGE: Left scrolling column + Right sticky photograph
          Blueprint: 'menu-column-sticky-photo' + 'list-two-ended-rows'
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* LEFT PANEL: Paper-toned reading & interactive column */}
        <div className="bg-surface rounded-[20px] p-5 sm:p-10 lg:p-12 space-y-8 lg:space-y-14">
          {/* Top bar: compact on phone so hero + CTA stay inside the first phone screen */}
          <header className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="font-display text-[24px] font-extrabold tracking-tight text-ink hover:text-accent transition-colors"
            >
              NÔNG SẢN SƠN LA
            </Link>

            <nav className="flex items-center gap-4 text-[16px]">
              <Link href="/products" className="text-ink taste-nav-link">
                Nông sản
              </Link>
              <Link href="/articles" className="text-ink taste-nav-link">
                Câu chuyện
              </Link>
              <Link href="/about" className="text-ink taste-nav-link">
                Về dự án
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => switchPersona(!isDemo)}
                className="taste-btn px-3 py-1.5 rounded-lg bg-bg text-ink text-[14px] hover:text-accent"
                title="Chuyển đổi giữa khách thực tế và Persona mẫu"
              >
                {isDemo ? (
                  <span>
                    Persona: <code>{DEMO_VISITOR_ID}</code>
                  </span>
                ) : (
                  <span>
                    ID:{" "}
                    <code>{visitorId ? visitorId.slice(0, 8) : "live"}</code>
                  </span>
                )}
              </button>
              <Link
                href="/admin"
                className="taste-btn px-3.5 py-1.5 rounded-lg bg-accent text-accentInk text-[14px] font-semibold"
              >
                Quản trị ML
              </Link>
            </div>
          </header>

          {/* Hero Statement Block with Masked 2-Line Reveal */}
          <div className="py-2 sm:py-6 space-y-5">
            <h1 className="font-display font-bold text-accent leading-[1.04] text-[44px] lg:text-[72px] max-w-[14ch]">
              <span className="hero-line-mask">
                <span data-hero-line="">Đặc sản núi</span>
              </span>
              <span className="hero-line-mask">
                <span data-hero-line="">cao Sơn La</span>
              </span>
            </h1>

            <p
              data-hero-lead=""
              className="text-[18px] text-ink leading-relaxed max-w-[42ch] will-change-transform"
            >
              Tám đặc sản bản địa canh tác ở độ cao 400m đến 2.200m trên năm
              tiểu vùng sinh thái. Riêng năm 2024, Sơn La có hơn 83.000 ha cây
              ăn quả, 190 triệu USD nông sản xuất khẩu và 200+ sản phẩm OCOP.
            </p>

            <div
              data-hero-actions=""
              className="flex flex-wrap items-center gap-4 pt-1 will-change-transform"
            >
              <Link
                href="/products"
                className="taste-btn inline-flex items-center justify-center h-12 px-7 rounded-lg bg-accent text-accentInk text-[16px] font-semibold hover:opacity-90"
              >
                Khám phá 8 đặc sản
              </Link>
              <a
                href="#so-lieu"
                className="taste-btn inline-flex items-center justify-center h-12 px-6 rounded-lg bg-bg text-ink text-[16px] hover:text-accent"
              >
                Xem số liệu vùng trồng
              </a>
            </div>
          </div>

          {/* Interactive Altitude & Terroir Selector ("One Live Thing") */}
          <div
            data-hero-terroir=""
            className="bg-bg rounded-2xl p-5 sm:p-6 space-y-4 will-change-transform"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[24px] font-extrabold text-ink">
                Năm đai cao độ
              </h2>
              <span className="text-[14px] text-accent nums">
                400m – 2.200m so với mực nước biển
              </span>
            </div>

            <p className="text-[16px] text-ink max-w-[46ch]">
              Chọn một đai cao độ để chuyển đổi khung cảnh vùng nguyên liệu bên
              phải và xem tiểu khí hậu, thổ nhưỡng tương ứng:
            </p>

            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => {
                const active =
                  !hoveredProduct && loc.location_id === activeLocationId;
                return (
                  <button
                    key={loc.location_id}
                    type="button"
                    onClick={() => {
                      setHoveredProduct(null);
                      setActiveLocationId(loc.location_id);
                    }}
                    className={`taste-btn px-3.5 py-2 rounded-lg text-[14px] nums ${
                      active
                        ? "bg-accent text-accentInk font-semibold"
                        : "bg-surface text-ink hover:text-accent"
                    }`}
                  >
                    {loc.district} · {loc.altitude}
                  </button>
                );
              })}
            </div>

            {activeLocation && (
              <div className="pt-2 space-y-2 text-[16px]">
                <p className="font-semibold text-ink">
                  {activeLocation.name} ({activeLocation.altitude})
                </p>
                <p className="text-ink leading-relaxed max-w-[46ch]">
                  {activeLocation.description}
                </p>
                <p className="text-[14px] text-muted">
                  Khí hậu: {activeLocation.climate} · Thổ nhưỡng:{" "}
                  {activeLocation.soil_type}
                </p>
              </div>
            )}
          </div>

          {/* Two-Ended List 1: Real-time Personalized ML Recommendations */}
          <div data-rec-section="" className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[24px] font-extrabold text-ink">
                Đề xuất cho bạn
              </h2>
              <button
                type="button"
                onClick={loadRecommendations}
                className="taste-btn text-[14px] text-accent hover:underline"
              >
                Làm mới TF-IDF
              </button>
            </div>

            <p className="text-[16px] text-ink max-w-[46ch]">
              Gợi ý thời gian thực từ vector hành vi có trọng số (Xem: 1 · Cuộn:
              2 · Lưu: 3 · Chia sẻ: 4 · Liên hệ: 5) và độ tương đồng Cosine:
            </p>

            <div className="space-y-1.5 taste-index-list">
              {(recs?.items || []).map((item) => {
                const href =
                  item.content_type === "product"
                    ? `/products/${item.slug}`
                    : `/articles/${item.slug}`;
                return (
                  <Link
                    key={`${item.content_type}_${item.content_id}`}
                    href={href}
                    onClick={() => handleRecClick(item)}
                    data-rec-row=""
                    className="taste-index-row group flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg hover:bg-bg will-change-transform"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={
                          item.image_url ||
                          "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=160&q=80"
                        }
                        alt={item.title}
                        width={24}
                        height={24}
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                      <span className="taste-row-title text-[16px] text-ink truncate">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[14px] text-muted nums shrink-0">
                      Cosine {item.score.toFixed(2)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Two-Ended List 2: Complete Index of 8 Signature Products ('list-two-ended-rows') */}
          <div data-prod-section="" className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[24px] font-extrabold text-ink">
                Danh mục nông sản
              </h2>
              <span className="text-[14px] text-muted nums">
                Chạm hoặc di chuột để xem ảnh vùng trồng
              </span>
            </div>

            <div
              className="space-y-1.5 taste-index-list"
              onMouseLeave={() => setHoveredProduct(null)}
            >
              {products.map((prod) => (
                <Link
                  key={prod.product_id}
                  href={`/products/${prod.slug}`}
                  onMouseEnter={() => setHoveredProduct(prod)}
                  onFocus={() => setHoveredProduct(prod)}
                  data-prod-row=""
                  className="taste-index-row group flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg hover:bg-bg will-change-transform"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={prod.image_url}
                      alt={prod.product_name}
                      width={24}
                      height={24}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                    <span className="taste-row-title text-[16px] text-ink truncate">
                      {prod.product_name}
                    </span>
                  </div>
                  <span className="text-[14px] text-muted nums shrink-0">
                    {prod.origin.split(",")[0]} · {prod.view_count} lượt xem
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Sticky Full-Height Photograph & Footage Stage */}
        <div className="relative lg:sticky lg:top-4 h-[56svh] lg:h-[calc(100svh-32px)] rounded-[20px] overflow-hidden bg-surface flex flex-col justify-end">
          {/* Atmospheric muted loop footage layer with poster frame */}
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={stageMeta.url}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/sonla-highlands.mp4" type="video/mp4" />
          </video>

          <img
            ref={stageImgRef}
            src={stageMeta.url}
            alt={stageMeta.caption}
            width={1200}
            height={1500}
            data-hero-stage-media=""
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
          />

          {/* Floating caption badge at top-left of photograph */}
          <div
            ref={stageCaptionRef}
            className="relative z-10 m-4 sm:m-6 self-start bg-bg text-ink px-4 py-2.5 rounded-xl max-w-md will-change-transform"
          >
            <p className="text-[16px] font-semibold text-accent">
              {stageMeta.caption}
            </p>
          </div>

          <div className="flex-1" />

          {/* Solid 56px bottom bar in paper colour across the photograph's bottom edge */}
          <div className="relative z-10 min-h-[56px] bg-surface text-ink px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-[16px] nums">
            <span>{stageMeta.hours}</span>
            <span className="text-muted">{stageMeta.coords}</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. FULL-WIDTH SHOWCASE: 'showcase-square-plate-spare-text'
          One flat field split 50/50, square photograph left, tabs + title + 2 rectangular cells right
         ===================================================================== */}
      {showcaseProduct && (
        <section
          data-showcase-section=""
          className="bg-surface rounded-[20px] p-5 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
        >
          {/* Left half: Square photograph filling the half's width */}
          <div
            data-showcase-frame=""
            className="relative aspect-square w-full max-w-[540px] mx-auto overflow-hidden bg-bg will-change-transform"
          >
            <img
              ref={showcaseImgRef}
              src={showcaseProduct.image_url}
              alt={showcaseProduct.product_name}
              width={800}
              height={800}
              className="w-full h-full object-cover will-change-transform"
            />
            {/* Simple circular ring motif laid over the square photograph per blueprint */}
            <div
              aria-hidden="true"
              data-ring-motif=""
              className="pointer-events-none absolute inset-[8%] rounded-full border-[5px] border-ink/30 flex items-center justify-center will-change-transform"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-accent/80" />
            </div>
          </div>

          {/* Right half: Flex column with space-between */}
          <div className="flex flex-col justify-between h-full space-y-8">
            {/* Top row of plain text tabs at 18px */}
            <div
              data-showcase-item=""
              className="flex flex-wrap items-center gap-6 text-[18px] will-change-transform"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId(null);
                  setShowcaseIndex(0);
                }}
                className={`taste-btn ${
                  selectedCategoryId === null
                    ? "text-ink font-semibold opacity-100 underline underline-offset-8"
                    : "text-ink opacity-50 hover:opacity-80"
                }`}
              >
                Tất cả ({products.length})
              </button>
              {categories.map((cat) => {
                const active = selectedCategoryId === cat.category_id;
                return (
                  <button
                    key={cat.category_id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.category_id);
                      setShowcaseIndex(0);
                    }}
                    className={`taste-btn ${
                      active
                        ? "text-ink font-semibold opacity-100 underline underline-offset-8"
                        : "text-ink opacity-50 hover:opacity-80"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Middle: 2-line heading + product title + 38ch description */}
            <div
              ref={showcaseDetailRef}
              data-showcase-item=""
              className="space-y-4 will-change-transform"
            >
              <p className="text-[16px] text-accent nums">
                {showcaseProduct.origin} · {showcaseProduct.certification}
              </p>
              <h2 className="font-display text-[34px] font-extrabold text-ink">
                Tám đặc sản bản địa
              </h2>
              <p className="font-display text-[24px] font-bold text-accent">
                {showcaseProduct.product_name}
              </p>
              <p className="text-[18px] text-ink leading-relaxed max-w-[38ch]">
                {showcaseProduct.short_description ||
                  showcaseProduct.description}
              </p>
              <p className="text-[16px] text-muted nums">
                Mùa vụ: {showcaseProduct.season} · Đơn vị:{" "}
                {showcaseProduct.producer}
              </p>
            </div>

            {/* Bottom: Two filled rectangular cells side by side, 72px tall */}
            <div
              data-showcase-item=""
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 will-change-transform"
            >
              <Link
                href={`/products/${showcaseProduct.slug}`}
                className="taste-btn h-[72px] px-6 bg-accent text-accentInk font-semibold text-[16px] flex items-center justify-between hover:opacity-90"
              >
                <span>Xem hồ sơ chi tiết</span>
                <span className="nums">
                  {favoriteProductIds.has(showcaseProduct.product_id)
                    ? "Đã lưu"
                    : `${showcaseProduct.view_count} lượt xem`}
                </span>
              </Link>
              <button
                type="button"
                onClick={() =>
                  setShowcaseIndex(
                    (prev) =>
                      (prev + 1) % Math.max(1, categoryProducts.length)
                  )
                }
                className="taste-btn h-[72px] px-6 bg-bg text-ink font-semibold text-[16px] flex items-center justify-between hover:text-accent text-left"
              >
                <span>Đặc sản tiếp theo</span>
                <span className="text-muted nums">
                  {(showcaseIndex % Math.max(1, categoryProducts.length)) + 1} /{" "}
                  {Math.max(1, categoryProducts.length)}
                </span>
              </button>
            </div>
          </div>
        </section>
      )}

      <SonLaInNumbers />

      {/* =====================================================================
          3. HOW IT WORKS: 'how-it-works-itinerary-on-a-slip'
          Columns 1-5 heading + 30ch paragraph; Columns 6-12 contrasting slip with zigzag cut
         ===================================================================== */}
      <section
        data-itinerary-section=""
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-8"
      >
        <div
          data-itinerary-head=""
          className="lg:col-span-5 lg:sticky lg:top-24 space-y-5 will-change-transform"
        >
          <h2 className="font-display text-[34px] font-extrabold text-ink leading-[1.04]">
            Hành trình truy xuất
          </h2>
          <p className="text-[18px] text-ink leading-relaxed max-w-[34ch]">
            Mỗi đặc sản Sơn La đi từ nông hộ vùng cao qua quy trình chế biến 5
            bước, gắn kết trực tiếp với hệ thống phân tích hành vi K-means và
            gợi ý ngữ nghĩa tiếng Việt TF-IDF.
          </p>
          <div className="pt-2">
            <Link
              href="/about"
              className="taste-btn inline-flex items-center h-12 px-6 rounded-lg bg-surface text-accent text-[16px] font-semibold hover:opacity-90"
            >
              Xem kiến trúc K-means & TF-IDF
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7 bg-surface rounded-t-2xl slip-zigzag p-6 sm:p-10 space-y-7">
          <div
            data-itinerary-step=""
            className="space-y-3 will-change-transform"
          >
            <p className="font-bold text-accent text-[16px]">
              Chặng I · Vùng nguyên liệu & Chế biến chuẩn hóa
            </p>
            <div className="flex items-baseline justify-between gap-2 text-[16px] nums">
              <span className="text-ink">Khảo sát 5 đai cao độ Sơn La</span>
              <span className="text-muted">400m – 2.200m</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-[16px] nums">
              <span className="text-ink">Chuẩn hóa hồ sơ 8 đặc sản OCOP</span>
              <span className="text-muted">5 bước / sản phẩm</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-[16px] nums">
              <span className="text-ink">
                Biên soạn chuyên đề văn hóa & kỹ thuật
              </span>
              <span className="text-muted">14 bài viết</span>
            </div>
          </div>

          <div
            data-itinerary-step=""
            className="space-y-3 will-change-transform"
          >
            <p className="font-bold text-accent text-[16px]">
              Chặng II · Thu thập 10 sự kiện & Phân cụm K-means
            </p>
            <div className="flex items-baseline justify-between gap-2 text-[16px] nums">
              <span className="text-ink">
                Ghi nhận tương tác ẩn danh thời gian thực
              </span>
              <span className="text-muted">10 loại sự kiện</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-[16px] nums">
              <span className="text-ink">
                Trích xuất vector hành vi người dùng
              </span>
              <span className="text-muted">9 đặc trưng X</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-[16px] nums">
              <span className="text-ink">
                Phân khúc K-means Clustering tự động
              </span>
              <span className="text-muted">K = 4 cụm</span>
            </div>
          </div>

          <div
            data-itinerary-step=""
            className="space-y-3 will-change-transform"
          >
            <p className="font-bold text-accent text-[16px]">
              Chặng III · Gợi ý Nội dung TF-IDF Tiếng Việt
            </p>
            <div className="flex items-baseline justify-between gap-2 text-[16px] nums">
              <span className="text-ink">
                Vector hóa văn bản kết hợp hoàn cảnh địa lý
              </span>
              <span className="text-muted">TF-IDF + Cosine</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-[16px] nums">
              <span className="text-ink">
                Xử lý Cold-Start đa tầng thông minh
              </span>
              <span className="text-muted">3 chiến lược</span>
            </div>
          </div>

          {/* Inverted final row per blueprint */}
          <div
            data-itinerary-step=""
            className="bg-accent text-accentInk min-h-[48px] px-5 py-3 rounded-lg flex flex-wrap items-center justify-between gap-2 font-semibold text-[16px] nums will-change-transform"
          >
            <span>Kết quả: Đề xuất Top-5 cá nhân hóa minh bạch</span>
            <span>Phản hồi &lt; 50ms</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. ABOUT ('about-founders-letter') & CULTURAL STORIES
          Balanced two-column editorial spread: Founder's letter left, Stories right
         ===================================================================== */}
      <section
        data-editorial-section=""
        className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start py-10"
      >
        {/* Left: Founder's Letter on a contrasting sheet */}
        <div
          data-founder-sheet=""
          className="lg:col-span-5 bg-surface rounded-[20px] p-6 sm:p-12 space-y-6 will-change-transform"
        >
          <div className="w-44 h-36 rounded-2xl overflow-hidden bg-bg">
            <img
              data-parallax-img=""
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
              alt="Đại diện Nhóm Nghiên cứu Nông sản Sơn La"
              width={180}
              height={140}
              className="w-full h-full object-cover will-change-transform"
            />
          </div>

          <div className="space-y-4 text-[16px] text-ink leading-[1.6]">
            <p>
              Khi đi dọc quốc lộ 6 từ cao nguyên Mộc Châu lên đỉnh Tà Xùa hay
              vào thung lũng Ngọc Chiến, chúng tôi nhận ra mỗi nông sản Sơn La
              đều mang trong mình một câu chuyện sinh thái độc bản của độ cao,
              sương mù và bàn tay đồng bào Thái, Mông.
            </p>
            <p>
              Thế nhưng trên không gian số, thông tin về các đặc sản truyền
              thống thường rời rạc và thiếu sự kết nối giữa{" "}
              <mark className="bg-accent text-accentInk px-1.5 py-0.5 font-semibold">
                câu chuyện văn hóa vùng trồng và dữ liệu hành vi độc giả
              </mark>
              .
            </p>
            <p>
              Dự án này được xây dựng như một tạp chí số biên tập kỹ lưỡng, kết
              hợp mô hình phân cụm K-means trên 9 đặc trưng tương tác và hệ
              thống gợi ý nội dung TF-IDF để đưa đúng nông sản, đúng câu chuyện
              đến từng nhóm người đọc.
            </p>
          </div>

          <div className="pt-2">
            <p className="font-body italic text-[18px] text-ink">
              Ban Biên tập & Nhóm Nghiên cứu Khoa học Dữ liệu
            </p>
            <p className="text-[14px] text-muted mt-0.5">
              Đồ án Truyền thông & Phân tích Hành vi Nông sản Tỉnh Sơn La
            </p>
          </div>
        </div>

        {/* Right: Featured Cultural & Production Stories */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-[34px] font-extrabold text-ink">
              Câu chuyện vùng trồng
            </h2>
            <Link
              href="/articles"
              className="text-[16px] text-accent font-semibold taste-nav-link"
            >
              Xem toàn bộ 14 bài viết
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {articles.slice(0, 4).map((art) => (
              <Link
                key={art.article_id}
                href={`/articles/${art.slug}`}
                data-story-card=""
                className="group bg-surface rounded-2xl overflow-hidden flex flex-col justify-between will-change-transform"
              >
                <div>
                  <div className="aspect-[16/10] w-full overflow-hidden bg-bg">
                    <img
                      data-parallax-img=""
                      src={
                        art.image_url ||
                        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={art.title}
                      width={600}
                      height={375}
                      className="w-full h-full object-cover will-change-transform"
                    />
                  </div>
                  <div className="p-6 space-y-2.5">
                    <div className="text-[14px] text-accent nums">
                      {art.reading_time_minutes} phút đọc · {art.view_count}{" "}
                      lượt xem
                    </div>
                    <p className="font-display text-[18px] font-bold text-ink group-hover:text-accent transition-colors leading-snug">
                      {art.title}
                    </p>
                    <p className="text-[16px] text-ink leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-5 text-[14px] text-ink font-semibold group-hover:text-accent transition-colors">
                  Đọc chuyên đề →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. CONTACT: 'contact-sentence-portrait-links'
          12-column closing row: Columns 1-5 sentence, Columns 7-8 square photo, Columns 9-12 links
         ===================================================================== */}
      <section
        data-contact-section=""
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-16 pb-12"
      >
        <p
          data-contact-col=""
          className="lg:col-span-5 font-display font-bold text-ink text-[24px] lg:text-[34px] leading-[1.15] will-change-transform"
        >
          Kết nối trực tiếp doanh nghiệp thu mua và độc giả với các Hợp tác xã
          nông sản Sơn La.
        </p>

        <div className="hidden lg:block lg:col-span-1" />

        <div
          data-contact-col=""
          className="lg:col-span-2 w-44 h-44 rounded-xl overflow-hidden bg-surface will-change-transform"
        >
          <img
            data-parallax-img=""
            src="https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=400&q=80"
            alt="Thu hoạch cà phê Arabica tại Sơn La"
            width={176}
            height={176}
            className="w-full h-full object-cover will-change-transform"
          />
        </div>

        <div
          data-contact-col=""
          className="lg:col-span-4 space-y-4 will-change-transform"
        >
          <p className="text-[18px] font-semibold text-ink">
            Bạn cần kết nối mùa vụ hoặc dữ liệu nghiên cứu?
          </p>
          <div className="flex flex-col items-start gap-2.5 text-[18px]">
            <button
              type="button"
              onClick={() => {
                trackEvent("contact_click", {
                  content_type: "product",
                  content_id: showcaseProduct?.product_id || 1,
                  properties: { source: "home_closing_band" },
                });
                setInquiryOpen(true);
              }}
              className="taste-btn text-accent underline underline-offset-4 hover:opacity-80 text-left"
            >
              Mở phiếu kết nối Hợp tác xã Sơn La
            </button>
            <Link
              href="/products"
              className="text-ink underline underline-offset-4 hover:text-accent transition-colors"
            >
              Hồ sơ 8 đặc sản Chỉ dẫn địa lý & OCOP
            </Link>
            <Link
              href="/admin"
              className="text-ink underline underline-offset-4 hover:text-accent transition-colors"
            >
              Mở Bảng điều khiển Phân tích Hành vi ML
            </Link>
          </div>
        </div>
      </section>

      {showcaseProduct && (
        <ProducerInquiryModal
          product={showcaseProduct}
          isOpen={inquiryOpen}
          onClose={() => setInquiryOpen(false)}
        />
      )}
    </div>
  );
}
