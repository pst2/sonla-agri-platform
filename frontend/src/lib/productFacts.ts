import { ProductItem } from "@/types";

/**
 * Số liệu vùng trồng theo từng đặc sản, tổng hợp từ nguồn công khai
 * (cổng thông tin tỉnh Sơn La, Báo Sơn La, VOV, Báo Nhân Dân, VnEconomy,
 * Dân Việt, Hà Nội Mới…). Giá trị dạng khoảng phản ánh sự khác biệt giữa các báo cáo.
 */
export interface ProductFigure {
  value: string;
  unit: string;
  label: string;
}

export interface ProductFacts {
  /** Phạm vi số liệu: sản phẩm này hay cây trồng nguyên liệu. */
  scope: string;
  figures: ProductFigure[];
  rows: { label: string; value: string }[];
  note?: string;
  sources: string[];
}

const COFFEE: ProductFacts = {
  scope: "Cà phê Arabica toàn tỉnh Sơn La",
  figures: [
    { value: "33.628", unit: "ha", label: "Diện tích năm 2025 (ước), tăng 44,3% so với 2024" },
    { value: "37.724", unit: "tấn", label: "Sản lượng cà phê nhân 2025 (ước)" },
    { value: "112,38", unit: "triệu USD", label: "Giá trị xuất khẩu 2025, khoảng 27.800 tấn nhân" },
  ],
  rows: [
    { label: "Năm 2024", value: "23.312 ha · 29.838 tấn · 88,77 triệu USD xuất khẩu" },
    { label: "Năm 2025 (ước)", value: "33.628 ha · 37.724 tấn · 112,38 triệu USD xuất khẩu" },
    { label: "Vị thế", value: "Đứng đầu cả nước về diện tích và sản lượng Arabica" },
    { label: "Độ cao canh tác", value: "650m – 1.050m (Mai Sơn, Thuận Châu, TP. Sơn La)" },
  ],
  sources: ["sonla.gov.vn", "baosonla.vn", "vnanet.vn", "vusta.vn", "vneconomy.vn"],
};

const PLUM: ProductFacts = {
  scope: "Mận hậu Mộc Châu và toàn tỉnh",
  figures: [
    { value: "3.200–3.500", unit: "ha", label: "Diện tích mận hậu tại Mộc Châu" },
    { value: "12.300+", unit: "ha", label: "Diện tích mận hậu toàn tỉnh Sơn La" },
    { value: "~90.000", unit: "tấn", label: "Sản lượng toàn tỉnh mỗi vụ" },
  ],
  rows: [
    { label: "Diện tích cho thu hoạch", value: "Khoảng 2.400 – 3.000 ha tại Mộc Châu" },
    { label: "Sản lượng Mộc Châu", value: "28.000 – 90.000 tấn/vụ, tùy năm và thời tiết" },
    { label: "Vị thế", value: "Thủ phủ mận hậu lớn nhất cả nước" },
    { label: "Độ cao canh tác", value: "Khoảng 1.050m trên cao nguyên đá vôi" },
  ],
  sources: ["sonla.gov.vn", "kinhtedouong.vn", "vov.gov.vn"],
};

export const PRODUCT_FACTS: Record<string, ProductFacts> = {
  "ca-phe-arabica-son-la": COFFEE,
  "tra-vo-ca-phe": {
    ...COFFEE,
    scope: "Cà phê Arabica, nguồn vỏ quả cascara",
    note:
      "Chưa có thống kê riêng cho cascara. Vỏ quả là phụ phẩm của chế biến cà phê nên quy mô nguyên liệu gắn với sản lượng cà phê của tỉnh.",
  },
  "che-shan-tuyet": {
    scope: "Chè toàn tỉnh Sơn La và Mộc Châu",
    figures: [
      { value: "5.500–5.900", unit: "ha", label: "Diện tích chè toàn tỉnh" },
      { value: "60.000+", unit: "tấn", label: "Sản lượng chè búp tươi mỗi năm" },
      { value: "~22", unit: "triệu USD", label: "Kim ngạch xuất khẩu chè năm 2024" },
    ],
    rows: [
      { label: "Mộc Châu", value: "1.800 – 1.900 ha · hơn 24.300 tấn búp tươi/năm" },
      { label: "Độ cao Tà Xùa, Bắc Yên", value: "1.500m – 2.200m" },
      { label: "Bảo hộ", value: "Chè Shan tuyết Mộc Châu có chỉ dẫn địa lý" },
    ],
    note:
      "Số liệu gộp mọi loại chè của tỉnh, chưa tách riêng chè Shan tuyết cổ thụ Tà Xùa.",
    sources: ["sonla.gov.vn", "danviet.vn", "vov.vn"],
  },
  "man-hau": PLUM,
  "man-say": {
    ...PLUM,
    scope: "Mận hậu Mộc Châu, nguồn nguyên liệu mận sấy",
    note:
      "Chưa có thống kê riêng cho mận sấy. Số liệu là quy mô vùng nguyên liệu mận hậu.",
  },
  "hong-say-deo": {
    scope: "Hồng giòn Mộc Châu, nguyên liệu hồng sấy dẻo",
    figures: [
      { value: "50–100", unit: "ha", label: "Diện tích hồng giòn tại Mộc Châu" },
      { value: "10–14", unit: "tấn/ha", label: "Năng suất trung bình" },
      { value: "500–1.400", unit: "tấn", label: "Sản lượng ước tính (diện tích × năng suất)" },
    ],
    rows: [
      { label: "Giống chủ lực", value: "Fuyu (Nhật Bản) và MC1" },
      { label: "Chứng nhận", value: "Hồng sấy dẻo đạt OCOP 4 sao" },
      { label: "Vùng trồng", value: "Tân Yên, Thảo Nguyên, Nông trường Mộc Châu, Tân Lập" },
    ],
    note: "Sản lượng là ước tính do tính từ diện tích và năng suất, không phải số thống kê chính thức.",
    sources: ["sonla.gov.vn", "baosonla.vn", "vov.vn"],
  },
  "gao-nep-dia-phuong": {
    scope: "Nếp tan xã Ngọc Chiến, huyện Mường La",
    figures: [
      { value: "250–300+", unit: "ha", label: "Diện tích nếp tan tại Ngọc Chiến" },
      { value: "4–6,5", unit: "tấn/ha", label: "Năng suất thóc" },
      { value: "1.000–1.950", unit: "tấn thóc", label: "Sản lượng ước tính (250 ha × 4 tấn đến 300 ha × 6,5 tấn)" },
    ],
    rows: [
      { label: "Chứng nhận", value: "OCOP 4 sao của tỉnh Sơn La" },
      { label: "Bản canh tác", value: "Mường Chiến, Kẻ, Nậm Nghẹp" },
      { label: "Người canh tác", value: "Đồng bào dân tộc Thái" },
    ],
    note:
      "Một số tài liệu thống kê tới hơn 665 ha khi gộp các giống nếp địa phương khác. Sản lượng là ước tính từ diện tích và năng suất.",
    sources: ["baosonla.vn", "langngheviet.com.vn"],
  },
  "toi-den": {
    scope: "Tỏi vùng Yên Châu, nguyên liệu tỏi đen",
    figures: [
      { value: "~200", unit: "ha", label: "Diện tích tỏi tại Yên Châu" },
      { value: "20–25", unit: "tấn/ha", label: "Năng suất tỏi tươi bình quân" },
      { value: "400–500+", unit: "tấn", label: "Sản lượng tỏi củ tươi mỗi vụ" },
    ],
    rows: [
      { label: "Mùa thu hoạch", value: "Tháng 2 – tháng 3 âm lịch" },
      { label: "Lên men tỏi đen", value: "30 – 45 ngày, nhiệt độ ổn định, không chất bảo quản" },
      { label: "Vùng khác", value: "Phù Yên trồng tỏi vụ ba trên ruộng sau lúa mùa" },
    ],
    note: "Tỏi cô đơn là dạng đột biến tự nhiên nên sản lượng rất ít, chưa có thống kê riêng.",
    sources: ["baosonla.vn", "danviet.vn", "baocaovien.vn"],
  },
};

/** Bối cảnh toàn tỉnh năm 2024, dùng chung cho mọi trang sản phẩm. */
export const PROVINCE_CONTEXT = [
  { value: "83.000+", unit: "ha", label: "Cây ăn quả và sơn tra toàn tỉnh" },
  { value: "190", unit: "triệu USD", label: "Nông sản xuất khẩu năm 2024" },
  { value: "200+", unit: "sản phẩm", label: "OCOP từ 3 sao trở lên" },
];

/** Slug đầy đủ trong CSDL seed, trỏ về cùng bộ số liệu. */
const SLUG_ALIASES: Record<string, string> = {
  "che-shan-tuyet-ta-xua": "che-shan-tuyet",
  "tra-tu-vo-ca-phe-cascara": "tra-vo-ca-phe",
  "man-hau-moc-chau": "man-hau",
  "man-say-deo-moc-chau": "man-say",
  "hong-say-deo-moc-chau": "hong-say-deo",
  "gao-nep-tan-ngoc-chien": "gao-nep-dia-phuong",
  "toi-den-mot-nhanh-son-la": "toi-den",
};

export function getProductFacts(slug: string): ProductFacts | undefined {
  return PRODUCT_FACTS[slug] ?? PRODUCT_FACTS[SLUG_ALIASES[slug]];
}

const INITIAL_PRODUCT_DETAILS: Record<string, ProductItem> = {
  "ca-phe-arabica-son-la": {
    product_id: 1,
    product_name: "Cà phê Arabica Sơn La",
    slug: "ca-phe-arabica-son-la",
    category_id: 1,
    location_id: 1,
    origin: "Huyện Mai Sơn & TP. Sơn La, Tỉnh Sơn La",
    short_description:
      "Hạt cà phê Arabica vùng núi cao Tây Bắc đạt chứng nhận Chỉ dẫn địa lý quốc gia và OCOP 5 sao, hương hoa quả tự nhiên và vị chua thanh tao nhã.",
    description:
      "Cà phê Arabica Sơn La được trồng ở độ cao từ 650m đến hơn 1.050m trên các sườn đồi đất đỏ đá vôi tại Mai Sơn, Thuận Châu và TP. Sơn La. Nhờ biên độ nhiệt ngày đêm lớn và sương mù bao phủ, trái cà phê chín chậm trong suốt 9 tháng, tích tụ hàm lượng đường và axit hữu cơ phong phú. Sản phẩm mang hương thơm quyến rũ của hoa rừng, mật ong và trái cây chín, vị chua thanh dịu như cam chanh và hậu vị ngọt sâu kéo dài.",
    ingredients:
      "100% hạt cà phê Arabica (giống Catimor, Bourbon, Typica) thu hái chín đỏ 98–100% tại vùng nguyên liệu Mai Sơn, Sơn La.",
    production_process:
      "1. Thu hái thủ công chọn lọc từng trái chín đỏ trên cây.\n2. Rửa sạch, phân loại nổi và tách vỏ tươi trong vòng 12 giờ sau thu hái.\n3. Lên men ướt kiểm soát nhiệt độ và pH trong 24–36 giờ (hoặc chế biến Honey/Natural).\n4. Phơi giàn trong nhà màng đón nắng núi cao đến độ ẩm chuẩn 11–12%.\n5. Rang mộc bằng công nghệ Hot-air hiện đại, không phụ gia hay hương liệu.",
    characteristics:
      "Hạt đồng đều, tỷ lệ lỗi < 1%; nước pha màu nâu hổ phách trong trẻo; hương thơm hoa trắng, caramel và trái cây nhiệt đới; vị chua thanh (bright acidity), thể chất cân bằng, hàm lượng caffeine thấp (1.1–1.3%).",
    traditional_value:
      "Từ những cây cà phê đầu tiên được đưa lên vùng Tây Bắc từ thập niên 1990, cây cà phê Arabica đã thay thế cây trồng năng suất thấp, trở thành sinh kế bền vững cho hơn 18.000 hộ nông dân dân tộc Thái, Mông tại Sơn La và định danh bản đồ cà phê đặc sản Việt Nam trên thế giới.",
    keywords:
      "cà phê arabica sơn la, cà phê đặc sản, chỉ dẫn địa lý, ocop 5 sao, mai sơn, đồ uống, rang mộc, catimor, bourbon",
    image_url:
      "/images/products/ca-phe-arabica-son-la.jpg",
    season: "Thu hoạch Tháng 10 – Tháng 1",
    certification:
      "Chỉ dẫn địa lý Sơn La · OCOP 5 Sao Quốc gia · VietGAP / Rainforest Alliance",
    producer: "HTX Cà phê Bích Thao Sơn La & Hiệp hội Cà phê Sơn La",
    source_reference:
      "Quyết định số 3399/QĐ-SHTT của Cục Sở hữu trí tuệ về Chỉ dẫn địa lý 'Sơn La' cho sản phẩm cà phê.",
    verification_status: "verified",
    view_count: 711,
    favorite_count: 207,
    contact_click_count: 228,
    is_featured: true,
    created_at: "2026-11-01T05:40:06",
    updated_at: "2026-11-01T05:40:06",
    location: {
      location_id: 1,
      name: "Vùng cà phê Mai Sơn & Thành phố Sơn La",
      slug: "mai-son-thanh-pho-son-la",
      province: "Sơn La",
      district: "Mai Sơn",
      altitude: "650m – 1.050m",
      climate: "Nhiệt đới gió mùa núi cao, biên độ nhiệt ngày đêm lớn (10–14°C), sương mù nhẹ mùa đông.",
      soil_type: "Đất đỏ bazan và đất feralit mùn trên đá vôi thoát nước tốt.",
      description: "Thủ phủ cà phê Arabica lớn nhất miền Bắc Việt Nam.",
    },
    articles: [
      {
        article_id: 1,
        title: "Hành trình Cà phê Arabica Sơn La chinh phục chứng nhận Chỉ dẫn địa lý quốc gia",
        slug: "hanh-trinh-ca-phe-arabica-son-la-chi-dan-dia-ly",
        content_type: "story",
        excerpt: "Từ những sườn đồi sương mù Mai Sơn đến ly cà phê đặc sản xuất khẩu sang châu Âu, Nhật Bản: câu chuyện chuyển mình của thủ phủ Arabica lớn nhất miền Bắc.",
        image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
        reading_time_minutes: 6,
        published_at: "2026-11-01T05:40:06",
        view_count: 340,
      },
      {
        article_id: 2,
        title: "Bí mật chế biến ướt và Honey giúp hạt Arabica Mai Sơn giữ trọn hương hoa rừng",
        slug: "bi-mat-che-bien-uot-va-honey-ca-phe-arabica-mai-son",
        content_type: "knowledge",
        excerpt: "Khám phá quy trình lên men kiểm soát vi sinh và phơi giàn nhà kính giúp nâng điểm Cupping của cà phê Sơn La lên trên 84 điểm SCA.",
        image_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
        reading_time_minutes: 5,
        published_at: "2026-11-01T05:40:06",
        view_count: 280,
      },
    ],
  },
  "che-shan-tuyet-ta-xua": {
    product_id: 2,
    product_name: "Chè Shan tuyết",
    slug: "che-shan-tuyet-ta-xua",
    category_id: 1,
    location_id: 2,
    origin: "Xã Tà Xùa, Huyện Bắc Yên, Tỉnh Sơn La",
    short_description:
      "Búp trà cổ thụ hàng trăm năm tuổi phủ lớp lông tơ trắng như tuyết trên đỉnh Tà Xùa quanh năm mây phủ ở độ cao trên 1.800m.",
    description:
      "Chè Shan tuyết cổ thụ Tà Xùa sinh trưởng tự nhiên ở độ cao 1.500m – 2.200m tại huyện Bắc Yên, tỉnh Sơn La. Quanh năm tắm mình trong mây mù và sương giá núi cao, búp chè tích tụ nội chất dày dặn, phủ lớp lông tơ trắng mịn như tuyết.",
    ingredients: "100% búp chè Shan tuyết cổ thụ 1 tôm 2 lá thu hái tự nhiên tại Tà Xùa, Bắc Yên.",
    production_process:
      "1. Thu hái thủ công búp trà 1 tôm 2 lá từ các cây chè cổ thụ trên 100–300 năm tuổi.\n2. Làm héo tự nhiên trên nong tre trong không khí mát lạnh vùng cao.\n3. Sao diệt men bằng chảo gang truyền thống củi rừng do nghệ nhân người Mông thực hiện.\n4. Vò trà thủ công định hình sợi và lên hương tự nhiên.\n5. Sấy khô hoàn thiện và đóng gói bảo quản kín.",
    characteristics:
      "Nước trà vàng sánh màu mật ong rừng, hương cốm non quyện mùi thảo mộc núi cao, vị chát dịu đầu lưỡi và hậu ngọt thanh kéo dài.",
    traditional_value:
      "Quần thể chè Shan tuyết cổ thụ Tà Xùa là báu vật sinh thái được đồng bào dân tộc Mông gìn giữ qua nhiều thế hệ tại Bắc Yên, Sơn La.",
    keywords: "chè shan tuyết, trà tà xùa, bắc yên, cổ thụ, ocop 4 sao, đồ uống",
    image_url:
      "/images/products/che-shan-tuyet-ta-xua.jpg",
    season: "Vụ Xuân (Tháng 3 – 5) & Vụ Thu (Tháng 9 – 11)",
    certification: "OCOP 4 Sao Tỉnh Sơn La · Cây Di sản & Vùng nguyên liệu hữu cơ tự nhiên",
    producer: "HTX Trà cổ thụ Tà Xùa – Bắc Yên, Sơn La",
    source_reference: "Sở Nông nghiệp & PTNT tỉnh Sơn La – Hồ sơ OCOP Chè Tà Xùa",
    verification_status: "verified",
    view_count: 685,
    favorite_count: 194,
    contact_click_count: 180,
    is_featured: true,
    created_at: "2026-11-01T05:40:06",
    updated_at: "2026-11-01T05:40:06",
    location: {
      location_id: 2,
      name: "Đỉnh Tà Xùa – Huyện Bắc Yên",
      slug: "ta-xua-bac-yen",
      province: "Sơn La",
      district: "Bắc Yên",
      altitude: "1.500m – 2.200m",
      climate: "Quanh năm mây mù bao phủ, độ ẩm không khí 85–90%.",
      soil_type: "Đất mùn núi cao nguyên sinh giàu khoáng chất vi lượng.",
      description: "Vùng quần thể chè Shan tuyết cổ thụ của đồng bào Mông trên dãy Tà Xùa.",
    },
    articles: [
      {
        article_id: 3,
        title: "Báu vật rừng chè Shan tuyết cổ thụ trăm năm trên đỉnh mây Tà Xùa",
        slug: "bau-vat-rung-che-shan-tuyet-co-thu-ta-xua",
        content_type: "story",
        excerpt: "Ở độ cao 1.800m quanh năm mây phủ, những nghệ nhân người Mông cảm nhận nhiệt độ chảo gang bằng đôi bàn tay trần để giữ trọn lớp tuyết trắng trên búp trà.",
        image_url: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=800&q=80",
        reading_time_minutes: 7,
        published_at: "2026-11-01T05:40:06",
        view_count: 310,
      },
    ],
  },
  "tra-tu-vo-ca-phe-cascara": {
    product_id: 3,
    product_name: "Trà từ vỏ cà phê",
    slug: "tra-tu-vo-ca-phe-cascara",
    category_id: 1,
    location_id: 1,
    origin: "Huyện Mai Sơn, Tỉnh Sơn La",
    short_description:
      "Thức uống giàu chất chống oxy hóa chế biến từ lớp vỏ thịt quả cà phê Arabica Sơn La chín đỏ mọng, hương trái cây khô và hồng trà.",
    description:
      "Trà vỏ cà phê Cascara Sơn La được chế biến từ vỏ quả cà phê Arabica chín đỏ mọng tại vùng nguyên liệu Mai Sơn. Thay vì bỏ đi sau quá trình xát tươi, lớp vỏ giàu đường tự nhiên và polyphenol được tách lọc, lên men nhẹ và sấy lạnh ở nhiệt độ thấp.",
    ingredients: "100% vỏ quả cà phê Arabica chín đỏ tuyển chọn tại vùng nguyên liệu Mai Sơn, Sơn La.",
    production_process:
      "1. Thu hái quả cà phê Arabica chín đỏ 100% từ vườn canh tác hữu cơ.\n2. Rửa sạch bằng nước suối nguồn và khử trùng tia UV.\n3. Tách vỏ thịt quả tươi bằng máy xát chuyên dụng không dùng nước.\n4. Sấy lạnh (Cold-drying) ở 40–45°C trong 30 giờ để giữ trọn anthocyanin.\n5. Ủ ổn định hương trong 15 ngày và đóng túi lọc/hộp thiếc.",
    characteristics:
      "Màu nước đỏ hổ phách rực rỡ; hương thơm quả mọng chín, mứt hồng, tầm xuân và mật ong; vị ngọt thanh tự nhiên xen lẫn chút chua dịu sảng khoái.",
    traditional_value:
      "Biểu tượng cho kinh tế tuần hoàn và đổi mới sáng tạo trong ngành cà phê Sơn La, nâng cao thu nhập cho nông hộ trồng cà phê.",
    keywords: "trà vỏ cà phê, cascara sơn la, arabica mai sơn, đồ uống, chống oxy hóa",
    image_url:
      "/images/products/tra-tu-vo-ca-phe-cascara.jpg",
    season: "Chế biến Tháng 11 – Tháng 2 (Cung ứng quanh năm)",
    certification: "OCOP 4 Sao Tỉnh Sơn La · ISO 22000:2018",
    producer: "HTX Cà phê Bích Thao & Công ty CP Phúc Sinh Sơn La",
    source_reference: "Sở Khoa học và Công nghệ tỉnh Sơn La",
    verification_status: "verified",
    view_count: 520,
    favorite_count: 140,
    contact_click_count: 95,
    is_featured: true,
    created_at: "2026-11-01T05:40:06",
    updated_at: "2026-11-01T05:40:06",
    location: {
      location_id: 1,
      name: "Vùng cà phê Mai Sơn & Thành phố Sơn La",
      slug: "mai-son-thanh-pho-son-la",
      province: "Sơn La",
      district: "Mai Sơn",
      altitude: "650m – 1.050m",
      climate: "Nhiệt đới gió mùa núi cao, biên độ nhiệt ngày đêm lớn 10–14°C.",
      soil_type: "Đất đỏ bazan và đất feralit mùn trên đá vôi thoát nước tốt.",
      description: "Thủ phủ cà phê Arabica lớn nhất miền Bắc Việt Nam.",
    },
    articles: [],
  },
  "man-hau-moc-chau": {
    product_id: 4,
    product_name: "Mận hậu",
    slug: "man-hau-moc-chau",
    category_id: 2,
    location_id: 3,
    origin: "Thung lũng Ná Ka & Tân Lập, Cao nguyên Mộc Châu, Sơn La",
    short_description:
      "Trái mận hậu căng mọng phủ lớp phấn trắng tự nhiên từ thung lũng Ná Ka (1.050m), thịt quả đỏ tím giòn tan, vị ngọt đậm xen chua thanh.",
    description:
      "Mận hậu Mộc Châu sinh trưởng trên cao nguyên đá vôi ở độ cao 1.050m với khí hậu ôn đới mát mẻ quanh năm. Nhờ thời gian ngủ đông lạnh giá và nắng ấm mùa xuân, quả mận đạt độ giòn chắc, vỏ tím sẫm phủ lớp phấn trắng tự nhiên.",
    ingredients: "100% quả mận hậu tươi thu hái đúng độ chín tại thung lũng Ná Ka, Mộc Châu.",
    production_process:
      "1. Tỉa cành tạo tán và chăm sóc theo quy trình hữu cơ VietGAP sau vụ thu hoạch.\n2. Thụ phấn tự nhiên mùa hoa mận trắng tháng Giêng – tháng Hai.\n3. Bao trái và tỉa thưa quả non để tập trung dinh dưỡng.\n4. Thu hái thủ công giữ nguyên cuống và lớp phấn trắng vào sáng sớm.\n5. Phân loại kích cỡ (size VIP 16–20 quả/kg) và bảo quản mát vận chuyển nhanh.",
    characteristics:
      "Quả tròn đều, vỏ tím đỏ phủ phấn trắng tự nhiên, ruột đỏ tím giòn rụm, róc hạt, độ ngọt Brix 12–14% cân bằng với vị chua thanh.",
    traditional_value:
      "Biểu tượng văn hóa nông nghiệp và du lịch sinh thái của cao nguyên Mộc Châu qua Lễ hội Hái quả thường niên.",
    keywords: "mận hậu mộc châu, thung lũng ná ka, trái cây, vietgap, ocop 4 sao",
    image_url:
      "/images/products/man-hau-moc-chau.jpg",
    season: "Thu hoạch Tháng 5 – Tháng 7",
    certification: "Nhãn hiệu chứng nhận Mận hậu Mộc Châu · VietGAP · OCOP 4 Sao",
    producer: "HTX Nông sản Bản Tự Nhiên & HTX Dịch vụ Nông nghiệp Mộc Châu",
    source_reference: "Cục Sở hữu trí tuệ & UBND thị xã Mộc Châu",
    verification_status: "verified",
    view_count: 690,
    favorite_count: 215,
    contact_click_count: 190,
    is_featured: true,
    created_at: "2026-11-01T05:40:06",
    updated_at: "2026-11-01T05:40:06",
    location: {
      location_id: 3,
      name: "Cao nguyên Mộc Châu & Vân Hồ",
      slug: "cao-nguyen-moc-chau",
      province: "Sơn La",
      district: "Mộc Châu",
      altitude: "1.050m",
      climate: "Khí hậu ôn đới tiểu vùng cao nguyên, nhiệt độ trung bình 18–20°C.",
      soil_type: "Đất thảo nguyên feralit nâu đỏ tầng dày, giàu hữu cơ.",
      description: "Vùng trồng mận hậu Ná Ka, Tân Lập và hồng giòn Mộc Châu nổi tiếng.",
    },
    articles: [],
  },
  "man-say-deo-moc-chau": {
    product_id: 5,
    product_name: "Mận sấy",
    slug: "man-say-deo-moc-chau",
    category_id: 3,
    location_id: 3,
    origin: "Cao nguyên Mộc Châu, Tỉnh Sơn La",
    short_description:
      "Mận hậu Mộc Châu tuyển chọn chế biến bằng công nghệ sấy lạnh bơm nhiệt giữ trọn sắc tím hồng tự nhiên, dẻo mềm và giàu chất xơ.",
    description:
      "Mận sấy dẻo Mộc Châu được chế biến từ những trái mận hậu chín mọng tại vùng nguyên liệu Ná Ka và Tân Lập. Công nghệ sấy lạnh bơm nhiệt giúp giữ nguyên màu sắc tím đỏ, hương thơm tự nhiên và hàm lượng vitamin, chất xơ hòa tan.",
    ingredients: "95% mận hậu tươi Mộc Châu tuyển chọn, 5% đường mía tinh luyện.",
    production_process:
      "1. Tuyển chọn quả mận hậu chín đều, đường kính > 3.5cm.\n2. Rửa sục khí ozone và tách hạt định hình bằng máy chuyên dụng.\n3. Chần hơi nước ngắn để vô hoạt enzyme gây sẫm màu.\n4. Sấy lạnh bơm nhiệt ở 35–45°C trong 36 giờ.\n5. Đóng gói màng nhôm phức hợp hút chân không.",
    characteristics:
      "Miếng mận dẻo mềm không khô cứng, bề mặt ráo mịn, vị chua ngọt hài hòa tự nhiên.",
    traditional_value:
      "Giải bài toán mùa vụ ngắn ngày của trái mận tươi, nâng tầm giá trị nông sản chế biến sâu của Sơn La.",
    keywords: "mận sấy dẻo, mận hậu mộc châu, sản phẩm chế biến, ocop 4 sao",
    image_url:
      "/images/products/man-say-deo-moc-chau.jpg",
    season: "Cung ứng quanh năm",
    certification: "OCOP 4 Sao Tỉnh Sơn La · HACCP",
    producer: "HTX Quyết Thanh Mộc Châu, Sơn La",
    source_reference: "Hội đồng Đánh giá và Phân hạng sản phẩm OCOP tỉnh Sơn La",
    verification_status: "verified",
    view_count: 480,
    favorite_count: 132,
    contact_click_count: 110,
    is_featured: false,
    created_at: "2026-11-01T05:40:06",
    updated_at: "2026-11-01T05:40:06",
    location: {
      location_id: 3,
      name: "Cao nguyên Mộc Châu & Vân Hồ",
      slug: "cao-nguyen-moc-chau",
      province: "Sơn La",
      district: "Mộc Châu",
      altitude: "1.050m",
      climate: "Khí hậu ôn đới tiểu vùng cao nguyên, mùa hè mát mẻ.",
      soil_type: "Đất thảo nguyên feralit nâu đỏ tầng dày, giàu hữu cơ.",
      description: "Vùng trồng mận hậu Ná Ka, Tân Lập và hồng giòn Mộc Châu nổi tiếng.",
    },
    articles: [],
  },
  "hong-say-deo-moc-chau": {
    product_id: 6,
    product_name: "Hồng sấy dẻo",
    slug: "hong-say-deo-moc-chau",
    category_id: 3,
    location_id: 3,
    origin: "Thị xã Mộc Châu & Huyện Vân Hồ, Tỉnh Sơn La",
    short_description:
      "Quả hồng cao nguyên Mộc Châu sấy gió và sấy lạnh theo công nghệ Hoshigaki Nhật Bản, bên ngoài dẻo dai, bên trong ứa mật ngọt thanh.",
    description:
      "Hồng sấy dẻo Mộc Châu kết hợp giống hồng bản địa và hồng Fuyu trên cao nguyên 1.050m với kỹ thuật treo gió và sấy lạnh hiện đại. Quả hồng chuyển hóa hoàn toàn chất tanin chát thành đường fructose tự nhiên, tạo lớp mật dẻo sóng sánh bên trong.",
    ingredients: "100% quả hồng tươi Mộc Châu (không đường, không chất bảo quản).",
    production_process:
      "1. Thu hái quả hồng già chín vàng cam khi trời nắng ráo cuối thu.\n2. Gọt vỏ mỏng đều giữ nguyên phần tai cuống.\n3. Treo giàn trong phòng sấy lạnh đối lưu gió vô trùng ở 20–25°C.\n4. Mát-xa quả định kỳ từ ngày thứ 7 để phân bố đều mật đường bên trong.\n5. Hoàn thiện sau 25–30 ngày và đóng gói hút chân không từng quả.",
    characteristics:
      "Màu cam hổ phách tới nâu đỏ đẹp mắt, vỏ ngoài dẻo dai nhẹ, ruột trong mềm ứa mật trong suốt, vị ngọt thanh khiết.",
    traditional_value:
      "Kết tinh khí hậu mùa thu đông se lạnh của thảo nguyên Mộc Châu và kỹ nghệ chế biến nông sản tinh tế.",
    keywords: "hồng sấy dẻo, hồng giòn mộc châu, hoshigaki, sản phẩm chế biến, ocop 4 sao",
    image_url:
      "/images/products/hong-say-deo-moc-chau.jpg",
    season: "Thu hoạch & chế biến Tháng 9 – Tháng 12",
    certification: "OCOP 4 Sao Tỉnh Sơn La · VietGAP",
    producer: "HTX Nông sản Sạch Mộc Châu",
    source_reference: "Sở Nông nghiệp & PTNT tỉnh Sơn La",
    verification_status: "verified",
    view_count: 540,
    favorite_count: 165,
    contact_click_count: 142,
    is_featured: true,
    created_at: "2026-11-01T05:40:06",
    updated_at: "2026-11-01T05:40:06",
    location: {
      location_id: 3,
      name: "Cao nguyên Mộc Châu & Vân Hồ",
      slug: "cao-nguyen-moc-chau",
      province: "Sơn La",
      district: "Mộc Châu",
      altitude: "1.050m",
      climate: "Khí hậu ôn đới tiểu vùng cao nguyên, mùa hè mát mẻ.",
      soil_type: "Đất thảo nguyên feralit nâu đỏ tầng dày, giàu hữu cơ.",
      description: "Vùng trồng mận hậu Ná Ka, Tân Lập và hồng giòn Mộc Châu nổi tiếng.",
    },
    articles: [],
  },
  "gao-nep-tan-ngoc-chien": {
    product_id: 7,
    product_name: "Gạo nếp địa phương",
    slug: "gao-nep-tan-ngoc-chien",
    category_id: 4,
    location_id: 4,
    origin: "Xã Ngọc Chiến, Huyện Mường La, Tỉnh Sơn La",
    short_description:
      "Hạt gạo nếp Tan tròn mẩy được nuôi dưỡng bởi nguồn nước khoáng nóng tự nhiên và băng tan từ đỉnh Pú Luông ở độ cao 1.600m.",
    description:
      "Gạo nếp địa phương Sơn La (tiêu biểu là Nếp Tan Ngọc Chiến – Mường La và Nếp Tan Mường Và – Sốp Cộp) được mệnh danh là 'hạt ngọc của núi rừng Tây Bắc'. Được đồng bào dân tộc Thái gieo cấy mỗi năm duy nhất một vụ kéo dài 6 tháng trên những thửa ruộng bậc thang ở độ cao 1.600m, cây lúa tắm mình trong làn nước suối khoáng trong vắt và khí hậu mát lạnh. Hạt gạo tròn mẩy, trắng đục như sữa; khi đồ xôi tỏa hương thơm ngát khắp bản, hạt xôi bóng mẩy, dẻo mềm nhưng không dính tay, để nguội cả ngày vẫn giữ nguyên độ mềm dẻo.",
    ingredients: "100% hạt gạo nếp Tan bản địa thuần chủng canh tác hữu cơ truyền thống tại xã Ngọc Chiến, Mường La.",
    production_process:
      "1. Gieo mạ và cấy lúa thủ công vào tháng 5 trên ruộng bậc thang dẫn nước suối tự nhiên.\n2. Chăm sóc theo phương pháp cổ truyền, không dùng thuốc diệt cỏ hóa học.\n3. Thu hoạch bằng tay (hái từng bông lúa bằng nhíp) khi hạt chín vàng vào tháng 10.\n4. Phơi khô tự nhiên dưới nắng thu vùng cao, xay xát nhẹ giữ lớp cám dinh dưỡng.",
    characteristics:
      "Hạt gạo to tròn đều, màu trắng đục phấn, mùi thơm lúa mới tự nhiên; hàm lượng amylopectin cao tạo độ dẻo đặc biệt, giàu vitamin nhóm B và khoáng chất.",
    traditional_value:
      "Gạo nếp Tan là linh hồn của nền văn minh lúa nước thung lũng vùng cao của người Thái Tây Bắc, không thể thiếu trong mâm cỗ xôi ngũ sắc, cốm non lễ Mừng Cơm Mới và các nghi lễ tâm linh truyền thống của bản làng.",
    keywords: "gạo nếp địa phương, nếp tan ngọc chiến, mường la, nông sản, dân tộc thái, xôi ngũ sắc, chỉ dẫn địa lý",
    image_url:
      "/images/products/gao-nep-tan-ngoc-chien.jpg",
    season: "Thu hoạch vụ mùa Tháng 10 – Tháng 11 (Cung ứng quanh năm)",
    certification: "Nhãn hiệu tập thể 'Nếp Tan Ngọc Chiến' · OCOP 4 Sao · Canh tác hữu cơ bản địa",
    producer: "HTX Nông nghiệp Ngọc Chiến (Mường La, Sơn La)",
    source_reference: "Cục Sở hữu trí tuệ & UBND huyện Mường La, tỉnh Sơn La.",
    verification_status: "verified",
    view_count: 478,
    favorite_count: 145,
    contact_click_count: 132,
    is_featured: true,
    created_at: "2026-11-01T05:40:06",
    updated_at: "2026-11-01T05:40:06",
    location: {
      location_id: 4,
      name: "Thung lũng Ngọc Chiến – Huyện Mường La",
      slug: "ngoc-chien-muong-la",
      province: "Sơn La",
      district: "Mường La",
      altitude: "1.600m – 1.800m",
      climate: "Khí hậu mát lành bốn mùa, nguồn nước suối khoáng nóng và nước băng tan từ đỉnh núi Pú Luông.",
      soil_type: "Đất phù sa cổ ven suối chiến giàu khoáng chất tự nhiên.",
      description: "Cánh đồng Mường Chiến nơi đồng bào dân tộc Thái canh tác giống lúa nếp Tan cổ truyền.",
    },
    articles: [
      {
        article_id: 7,
        title: "Nếp Tan Ngọc Chiến: Hạt ngọc nuôi dưỡng từ dòng suối khoáng nóng Mường La",
        slug: "nep-tan-ngoc-chien-hat-ngoc-suoi-khoang-muong-la",
        content_type: "story",
        excerpt: "Giống lúa nếp cổ truyền chỉ mọc trên cánh đồng cao 1.600m, nơi đồng bào Thái thu hoạch từng bông lúa bằng nhíp để dâng lên lễ Mừng Cơm Mới.",
        image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
        reading_time_minutes: 6,
        published_at: "2026-11-01T05:40:06",
        view_count: 250,
      },
      {
        article_id: 8,
        title: "Ứng dụng Khoa học Dữ liệu và Machine Learning trong truyền thông nông sản bản địa Sơn La",
        slug: "ung-dung-khoa-hoc-du-lieu-ml-truyen-thong-nong-san-son-la",
        content_type: "knowledge",
        excerpt: "Cách nền tảng kết hợp Event-based Tracking, phân cụm hành vi K-means và hệ thống gợi ý Content-based TF-IDF để kết nối đúng nhu cầu người tiêu dùng.",
        image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
        reading_time_minutes: 8,
        published_at: "2026-11-01T05:40:06",
        view_count: 390,
      },
    ],
  },
  "toi-den-mot-nhanh-son-la": {
    product_id: 8,
    product_name: "Tỏi đen",
    slug: "toi-den-mot-nhanh-son-la",
    category_id: 3,
    location_id: 5,
    origin: "Huyện Yên Châu & Huyện Phù Yên, Tỉnh Sơn La",
    short_description:
      "Củ tỏi cô đơn bản địa Yên Châu lên men tự nhiên 60–90 ngày làm tăng gấp 5–10 lần hoạt chất S-Allyl-L-Cysteine (SAC) bảo vệ tim mạch.",
    description:
      "Tỏi đen một nhánh Sơn La được chế biến từ 100% củ tỏi cô đơn bản địa trồng trên đất cát pha ven suối Vạt (Yên Châu) và cánh đồng Mường Tấc (Phù Yên). Qua quá trình lên men Maillard tự nhiên kéo dài 60–90 ngày, hoạt chất S-Allyl-L-Cysteine (SAC), polyphenol và SOD tăng gấp 5–10 lần so với tỏi tươi.",
    ingredients: "100% củ tỏi cô đơn (tỏi một nhánh) bản địa Yên Châu – Phù Yên, lên men tự nhiên không chất phụ gia.",
    production_process:
      "1. Thu hoạch tỏi cô đơn khi lá khô già, phơi khô tự nhiên và phân loại củ tròn đều, không trầy xước.\n2. Rửa sạch, để ráo và xếp vào khay inox 304 chuyên dụng.\n3. Lên men tự nhiên (phản ứng Maillard) trong buồng ủ thông minh suốt 60–90 ngày ở nhiệt độ 60–80°C và độ ẩm 75–85%.\n4. Làm nguội, ủ ổn định hương vị trong 15 ngày và đóng hũ thủy tinh/túi hút chân không.",
    characteristics:
      "Củ tỏi một nhánh nguyên vỏ mỏng màu sáng, ruột đen nhánh dẻo mềm, không dính tay; vị ngọt dịu hơi chua nhẹ như ô mai; hàm lượng SAC và chất chống oxy hóa vượt trội.",
    traditional_value:
      "Kế thừa kinh nghiệm trồng tỏi tía, tỏi cô đơn lâu đời của nông dân thung lũng Yên Châu và Mường Tấc (Phù Yên), ứng dụng công nghệ sinh học lên men hiện đại để tạo ra thực phẩm bảo vệ sức khỏe giá trị cao mang thương hiệu Sơn La.",
    keywords: "tỏi đen, tỏi cô đơn, tỏi một nhánh, yên châu, phù yên, thực phẩm chế biến, sản phẩm chế biến, sức khỏe, lên men, ocop 4 sao",
    image_url:
      "/images/products/toi-den-mot-nhanh-son-la.jpg",
    season: "Quanh năm (Tỏi tươi thu hoạch Tháng 2 – Tháng 3)",
    certification: "OCOP 4 Sao Tỉnh Sơn La · Chứng nhận An toàn thực phẩm & Kiểm nghiệm Viện Kiểm nghiệm ATVSTP Quốc gia",
    producer: "HTX Nông sản Dược liệu Tây Bắc – Yên Châu, Sơn La",
    source_reference: "Sở Khoa học và Công nghệ tỉnh Sơn La – Đề tài nghiên cứu chế biến tỏi cô đơn Sơn La.",
    verification_status: "verified",
    view_count: 638,
    favorite_count: 170,
    contact_click_count: 253,
    is_featured: true,
    created_at: "2026-11-01T05:40:06",
    updated_at: "2026-11-01T05:40:06",
    location: {
      location_id: 5,
      name: "Vùng chuyên canh Yên Châu & Phù Yên",
      slug: "yen-chau-phu-yen",
      province: "Sơn La",
      district: "Yên Châu - Phù Yên",
      altitude: "400m – 750m",
      climate: "Thung lũng nắng ấm, gió Lào khô ráo vào đầu vụ thu hoạch giúp củ tỏi tích tụ tinh dầu tối đa.",
      soil_type: "Đất cát pha thịt nhẹ bồi tụ ven suối Vạt và cánh đồng Mường Tấc.",
      description: "Vùng trồng tỏi tía và tỏi một nhánh (tỏi cô đơn) đặc trưng dùng để lên men tỏi đen dược liệu cao cấp.",
    },
    articles: [],
  },
};

export function getInitialProductBySlug(slug?: string): ProductItem | null {
  if (!slug) return null;
  if (INITIAL_PRODUCT_DETAILS[slug]) return INITIAL_PRODUCT_DETAILS[slug];
  for (const [fullSlug, shortSlug] of Object.entries(SLUG_ALIASES)) {
    if (slug === shortSlug && INITIAL_PRODUCT_DETAILS[fullSlug]) {
      return INITIAL_PRODUCT_DETAILS[fullSlug];
    }
  }
  return null;
}
