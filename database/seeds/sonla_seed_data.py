from datetime import datetime, timedelta
from typing import Dict, List
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.entities import (
    AdminUser,
    Article,
    Category,
    Location,
    Product,
)

SONLA_LOCATIONS = [
    {
        "location_id": 1,
        "name": "Vùng cà phê Mai Sơn & Thành phố Sơn La",
        "slug": "mai-son-thanh-pho-son-la",
        "province": "Sơn La",
        "district": "Mai Sơn - TP. Sơn La",
        "altitude": "650m – 1.050m",
        "climate": "Nhiệt đới gió mùa núi cao, biên độ nhiệt ngày đêm lớn (10–14°C), sương mù nhẹ mùa đông.",
        "soil_type": "Đất đỏ bazan và đất feralit mùn trên đá vôi thoát nước tốt.",
        "description": "Thủ phủ cà phê Arabica lớn nhất miền Bắc Việt Nam, được cấp chứng nhận Chỉ dẫn địa lý 'Cà phê Sơn La'.",
        "latitude": 21.2814,
        "longitude": 103.9786,
    },
    {
        "location_id": 2,
        "name": "Đỉnh Tà Xùa – Huyện Bắc Yên",
        "slug": "ta-xua-bac-yen",
        "province": "Sơn La",
        "district": "Bắc Yên",
        "altitude": "1.500m – 2.200m",
        "climate": "Quanh năm mây mù bao phủ, độ ẩm không khí 85–90%, nhiệt độ trung bình 15–18°C.",
        "soil_type": "Đất mùn núi cao nguyên sinh giàu khoáng chất vi lượng.",
        "description": "Vùng quần thể chè Shan tuyết cổ thụ hàng trăm năm tuổi của đồng bào dân tộc Mông trên dãy Tà Xùa.",
        "latitude": 21.3189,
        "longitude": 104.4512,
    },
    {
        "location_id": 3,
        "name": "Cao nguyên Mộc Châu & Vân Hồ",
        "slug": "cao-nguyen-moc-chau",
        "province": "Sơn La",
        "district": "Mộc Châu",
        "altitude": "1.050m",
        "climate": "Khí hậu ôn đới tiểu vùng cao nguyên, mùa hè mát mẻ, mùa đông lạnh khô thuận lợi cho cây ăn quả ôn đới.",
        "soil_type": "Đất thảo nguyên feralit nâu đỏ tầng dày, giàu hữu cơ.",
        "description": "Vùng trồng mận hậu Ná Ka, Tân Lập và hồng giòn Mộc Châu nổi tiếng khắp cả nước.",
        "latitude": 20.8447,
        "longitude": 104.6392,
    },
    {
        "location_id": 4,
        "name": "Thung lũng Ngọc Chiến – Huyện Mường La",
        "slug": "ngoc-chien-muong-la",
        "province": "Sơn La",
        "district": "Mường La",
        "altitude": "1.600m – 1.800m",
        "climate": "Khí hậu mát lành bốn mùa, nguồn nước suối khoáng nóng và nước băng tan từ đỉnh núi Pú Luông.",
        "soil_type": "Đất phù sa cổ ven suối chiến giàu khoáng chất tự nhiên.",
        "description": "Cánh đồng Mường Chiến nơi đồng bào dân tộc Thái canh tác giống lúa nếp Tan cổ truyền tiến vua.",
        "latitude": 21.5944,
        "longitude": 104.1972,
    },
    {
        "location_id": 5,
        "name": "Vùng chuyên canh Yên Châu & Phù Yên",
        "slug": "yen-chau-phu-yen",
        "province": "Sơn La",
        "district": "Yên Châu - Phù Yên",
        "altitude": "400m – 750m",
        "climate": "Thung lũng nắng ấm, gió Lào khô ráo vào đầu vụ thu hoạch giúp củ tỏi tích tụ tinh dầu tối đa.",
        "soil_type": "Đất cát pha thịt nhẹ bồi tụ ven suối Vạt và cánh đồng Mường Tấc.",
        "description": "Vùng trồng tỏi tía và tỏi một nhánh (tỏi cô đơn) đặc trưng dùng để lên men tỏi đen dược liệu cao cấp.",
        "latitude": 21.0458,
        "longitude": 104.3015,
    },
]

SONLA_CATEGORIES = [
    {
        "category_id": 1,
        "name": "Đồ uống",
        "slug": "do-uong",
        "description": "Các thức uống đặc sản từ núi rừng Sơn La: Cà phê Arabica chỉ dẫn địa lý, Chè Shan tuyết cổ thụ và Trà vỏ cà phê Cascara.",
        "icon": "Coffee",
        "display_order": 1,
    },
    {
        "category_id": 2,
        "name": "Trái cây",
        "slug": "trai-cay",
        "description": "Trái cây tươi ôn đới và á nhiệt đới canh tác theo tiêu chuẩn VietGAP trên cao nguyên Mộc Châu.",
        "icon": "Apple",
        "display_order": 2,
    },
    {
        "category_id": 3,
        "name": "Sản phẩm chế biến",
        "slug": "san-pham-che-bien",
        "description": "Nông sản chế biến sâu bằng công nghệ sấy lạnh và lên men hiện đại, giữ trọn hương vị và dưỡng chất tự nhiên.",
        "icon": "Sparkles",
        "display_order": 3,
    },
    {
        "category_id": 4,
        "name": "Nông sản",
        "slug": "nong-san",
        "description": "Lương thực bản địa quý hiếm gắn liền với văn hóa canh tác lúa nước vùng cao của đồng bào dân tộc Thái.",
        "icon": "Wheat",
        "display_order": 4,
    },
]

SONLA_PRODUCTS = [
    {
        "product_id": 1,
        "product_name": "Cà phê Arabica Sơn La",
        "slug": "ca-phe-arabica-son-la",
        "category_id": 1,
        "location_id": 1,
        "origin": "Huyện Mai Sơn & TP. Sơn La, Tỉnh Sơn La",
        "short_description": "Hạt cà phê Arabica vùng núi cao Tây Bắc đạt chứng nhận Chỉ dẫn địa lý quốc gia và OCOP 5 sao, hương hoa quả tự nhiên và vị chua thanh tao nhã.",
        "description": (
            "Cà phê Arabica Sơn La được trồng ở độ cao từ 650m đến hơn 1.050m trên các sườn đồi đất đỏ đá vôi tại Mai Sơn, Thuận Châu và TP. Sơn La. "
            "Nhờ biên độ nhiệt ngày đêm lớn và sương mù bao phủ, trái cà phê chín chậm trong suốt 9 tháng, tích tụ hàm lượng đường và axit hữu cơ phong phú. "
            "Sản phẩm mang hương thơm quyến rũ của hoa rừng, mật ong và trái cây chín, vị chua thanh dịu như cam chanh và hậu vị ngọt sâu kéo dài."
        ),
        "ingredients": "100% hạt cà phê Arabica (giống Catimor, Bourbon, Typica) thu hái chín đỏ 98–100% tại vùng nguyên liệu Mai Sơn, Sơn La.",
        "production_process": (
            "1. Thu hái thủ công chọn lọc từng trái chín đỏ trên cây.\n"
            "2. Rửa sạch, phân loại nổi và tách vỏ tươi trong vòng 12 giờ sau thu hái.\n"
            "3. Lên men ướt kiểm soát nhiệt độ và pH trong 24–36 giờ (hoặc chế biến Honey/Natural).\n"
            "4. Phơi giàn trong nhà màng đón nắng núi cao đến độ ẩm chuẩn 11–12%.\n"
            "5. Rang mộc bằng công nghệ Hot-air hiện đại, không phụ gia hay hương liệu."
        ),
        "characteristics": "Hạt đồng đều, tỷ lệ lỗi < 1%; nước pha màu nâu hổ phách trong trẻo; hương thơm hoa trắng, caramel và trái cây nhiệt đới; vị chua thanh (bright acidity), thể chất cân bằng, hàm lượng caffeine thấp (1.1–1.3%).",
        "traditional_value": (
            "Từ những cây cà phê đầu tiên được đưa lên vùng Tây Bắc từ thập niên 1990, cây cà phê Arabica đã thay thế cây trồng năng suất thấp, "
            "trở thành sinh kế bền vững cho hơn 18.000 hộ nông dân dân tộc Thái, Mông tại Sơn La và định danh bản đồ cà phê đặc sản Việt Nam trên thế giới."
        ),
        "keywords": "cà phê arabica sơn la, cà phê đặc sản, chỉ dẫn địa lý, ocop 5 sao, mai sơn, đồ uống, rang mộc, catimor, bourbon",
        "image_url": "/images/products/ca-phe-arabica-son-la.jpg",
        "season": "Thu hoạch Tháng 10 – Tháng 1",
        "certification": "Chỉ dẫn địa lý Sơn La · OCOP 5 Sao Quốc gia · VietGAP / Rainforest Alliance",
        "producer": "HTX Cà phê Bích Thao Sơn La & Hiệp hội Cà phê Sơn La",
        "source_reference": "Quyết định số 3399/QĐ-SHTT của Cục Sở hữu trí tuệ về Chỉ dẫn địa lý 'Sơn La' cho sản phẩm cà phê.",
        "verification_status": "verified",
    },
    {
        "product_id": 2,
        "product_name": "Chè Shan tuyết",
        "slug": "che-shan-tuyet-ta-xua",
        "category_id": 1,
        "location_id": 2,
        "origin": "Xã Tà Xùa, Huyện Bắc Yên, Tỉnh Sơn La",
        "short_description": "Búp trà cổ thụ hàng trăm năm tuổi phủ lớp lông tơ trắng như tuyết trên đỉnh núi Tà Xùa ở độ cao 1.800m, nước vàng sánh mật ong, tiền chát dịu hậu ngọt sâu.",
        "description": (
            "Chè Shan tuyết Tà Xùa sinh trưởng hoàn toàn tự nhiên trên các đỉnh núi đá cao từ 1.500m – 2.200m tại huyện Bắc Yên, nơi mây mù bao phủ quanh năm. "
            "Những gốc chè cổ thụ tuổi đời từ 100 đến hơn 300 năm hút linh khí đất trời và sương núi, tạo nên búp chè to mập phủ lớp lông mao trắng mịn như tuyết. "
            "Khi pha, trà tỏa hương cốm non hòa quyện mùi khói bếp thoảng nhẹ đặc trưng của người Mông, nước trà vàng óng như mật ong rừng, vị chát êm dịu và vị ngọt thanh lưu lại rất lâu nơi cổ họng."
        ),
        "ingredients": "100% búp chè Shan tuyết cổ thụ (1 tôm 1–2 lá non) thu hái tự nhiên tại rừng chè cổ thụ Tà Xùa, Bắc Yên.",
        "production_process": (
            "1. Đồng bào dân tộc Mông trèo lên các gốc chè cổ thụ hái búp vào sáng sớm khi sương vừa tan.\n"
            "2. Làm héo tự nhiên trên nong tre nơi thoáng gió.\n"
            "3. Sao diệt men bằng chảo gang củi rừng với kỹ thuật cảm nhận nhiệt bằng đôi bàn tay truyền thống.\n"
            "4. Vò trà thủ công giúp tế bào lá tiết tinh chất bao phủ mặt búp.\n"
            "5. Sấy khô hoàn thiện hoặc ép bánh trà Phổ Nhĩ sống lưu trữ lâu năm."
        ),
        "characteristics": "Cánh trà săn chắc phủ tuyết trắng bạc; màu nước vàng mật ong trong vắt; hương thơm thảo mộc núi rừng thanh khiết; giàu hợp chất EGCG, polyphenol và L-theanine tự nhiên.",
        "traditional_value": (
            "Đối với đồng bào dân tộc Mông tại Tà Xùa, cây chè Shan tuyết cổ thụ là báu vật của tổ tiên để lại. "
            "Nghề làm trà thủ công gắn kết cộng đồng bản làng, giữ gìn hệ sinh thái rừng nguyên sinh và văn hóa thưởng trà vùng cao Tây Bắc."
        ),
        "keywords": "chè shan tuyết, trà tà xùa, bắc yên, chè cổ thụ, hữu cơ tự nhiên, ocop 4 sao, đồ uống, dân tộc mông",
        "image_url": "/images/products/che-shan-tuyet-ta-xua.jpg",
        "season": "Vụ Xuân (Tháng 3 – 4) & Vụ Thu (Tháng 8 – 10)",
        "certification": "Chứng nhận Chỉ dẫn địa lý Chè Tà Xùa · OCOP 4 Sao · Hữu cơ tự nhiên",
        "producer": "HTX Đặc sản Tây Bắc Tà Xùa (Bắc Yên, Sơn La)",
        "source_reference": "Cục Sở hữu trí tuệ Việt Nam & Sở Khoa học và Công nghệ tỉnh Sơn La.",
        "verification_status": "verified",
    },
    {
        "product_id": 3,
        "product_name": "Trà từ vỏ cà phê",
        "slug": "tra-tu-vo-ca-phe-cascara",
        "category_id": 1,
        "location_id": 1,
        "origin": "Huyện Mai Sơn, Tỉnh Sơn La",
        "short_description": "Trà Cascara chế biến từ vỏ quả cà phê Arabica chín mọng vùng Mai Sơn, giàu chất chống oxy hóa, hương vị thảo mộc trái cây sấy ngọt thanh độc đáo.",
        "description": (
            "Trà từ vỏ cà phê (Cascara Tea) là sản phẩm sáng tạo nâng tầm chuỗi giá trị nông nghiệp tuần hoàn tại Sơn La. "
            "Được làm từ lớp vỏ thịt chín đỏ mọng nước của những trái cà phê Arabica canh tác hữu cơ trên vùng cao Mai Sơn, "
            "trà Cascara mang sắc đỏ hổ phách rực rỡ, hương thơm ngọt ngào của hoa dâm bụt, quả tầm xuân, táo đỏ và mật mía. "
            "Thức uống có hàm lượng caffeine cực thấp (< 1/4 so với cà phê), rất giàu chất chống oxy hóa polyphenol, thích hợp thưởng thức nóng hoặc ủ lạnh (Cold Brew) mỗi ngày."
        ),
        "ingredients": "100% vỏ thịt quả cà phê Arabica Sơn La chín đỏ canh tác theo hướng hữu cơ, không tồn dư hóa chất.",
        "production_process": (
            "1. Tuyển chọn những trái cà phê Arabica chín đỏ 100%, rửa sạch bằng nước suối lọc.\n"
            "2. Tách vỏ tươi bằng máy chuyên dụng đảm bảo vệ sinh thực phẩm.\n"
            "3. Sấy lạnh tuần hoàn (Heat-pump drying) ở nhiệt độ thấp 40–45°C để giữ trọn vitamin, màu sắc và hương thơm trái cây.\n"
            "4. Khử khuẩn bằng tia UV và đóng gói túi lọc hoặc nguyên vỏ cao cấp."
        ),
        "characteristics": "Vỏ sấy khô màu đỏ nâu bóng tự nhiên; nước pha màu hồng ngọc đến hổ phách; vị chua ngọt thanh mát như trà trái cây rừng; hàm lượng chất chống oxy hóa cao.",
        "traditional_value": (
            "Kết hợp truyền thống trồng cà phê lâu đời của Sơn La với tư duy kinh tế tuần hoàn hiện đại, biến phụ phẩm nông nghiệp thành thức uống giá trị cao, "
            "giảm thiểu phát thải môi trường và gia tăng thu nhập cho nông hộ bản địa."
        ),
        "keywords": "trà vỏ cà phê, trà cascara, arabica sơn la, đồ uống, chống oxy hóa, kinh tế tuần hoàn, ocop 4 sao",
        "image_url": "/images/products/tra-tu-vo-ca-phe-cascara.jpg",
        "season": "Quanh năm (chế biến từ vụ thu hoạch Tháng 10 – Tháng 1)",
        "certification": "OCOP 4 Sao Tỉnh Sơn La · ISO 22000:2018",
        "producer": "HTX Cà phê Bích Thao & Công ty CP Cà phê Phúc Sinh Sơn La",
        "source_reference": "Chương trình Mỗi xã một sản phẩm (OCOP) tỉnh Sơn La.",
        "verification_status": "verified",
    },
    {
        "product_id": 4,
        "product_name": "Mận hậu",
        "slug": "man-hau-moc-chau",
        "category_id": 2,
        "location_id": 3,
        "origin": "Thung lũng Ná Ka & Tân Lập, Huyện Mộc Châu, Tỉnh Sơn La",
        "short_description": "Thức quà mùa hạ trứ danh của cao nguyên Mộc Châu với lớp phấn trắng tự nhiên, vỏ căng mọng đỏ tím, thịt quả giòn tan, chua ngọt đậm đà.",
        "description": (
            "Mận hậu Mộc Châu là biểu tượng nông sản của vùng cao nguyên sương mờ ở độ cao hơn 1.050m. "
            "Mỗi độ xuân về, hàng ngàn héc-ta rừng mận tại thung lũng Ná Ka, Mu Náu, Tân Lập nở hoa trắng xóa cả bầu trời Tây Bắc, "
            "đến tháng 5 – tháng 7 lại kết thành những chùm quả tròn trịa, vỏ tím đỏ phủ lớp phấn trắng mịn màng tự nhiên. "
            "Mận hậu Mộc Châu nổi tiếng bởi độ giòn sần sật, thịt dày розовый đỏ, hạt nhỏ роc, vị ngọt đậm xen lẫn chút chua thanh mát lành."
        ),
        "ingredients": "100% quả mận hậu tươi thu hái đúng độ chín sinh học tại vùng trồng đạt chuẩn VietGAP Mộc Châu.",
        "production_process": (
            "1. Đốn tỉa tạo tán, bón phân hữu cơ vi sinh và bao trái bảo vệ sinh học.\n"
            "2. Thu hái thủ công bằng tay từng quả, giữ nguyên cuống và lớp phấn trắng bảo vệ tự nhiên.\n"
            "3. Phân loại kích cỡ (Size VIP 16–20 quả/kg) và làm mát sơ bộ.\n"
            "4. Đóng hộp có tem QR truy xuất nguồn gốc mã số vùng trồng."
        ),
        "characteristics": "Quả tròn đều, đường kính 4–5.5cm, vỏ màu đỏ tím phủ phấn trắng tự nhiên; thịt quả giòn chắc, nhiều nước; giàu vitamin C, vitamin A, chất xơ và anthocyanin.",
        "traditional_value": (
            "Cây mận hậu đã gắn bó hơn 40 năm với đời sống kinh tế và văn hóa của đồng bào các dân tộc cao nguyên Mộc Châu, "
            "khởi nguồn cho Lễ hội Hái quả Mộc Châu thường niên thu hút hàng trăm ngàn du khách trong và ngoài nước."
        ),
        "keywords": "mận hậu, mận hậu mộc châu, thung lũng ná ka, trái cây, vietgap, đặc sản sơn la, mùa hè",
        "image_url": "/images/products/man-hau-moc-chau.jpg",
        "season": "Tháng 5 – Tháng 7 hàng năm",
        "certification": "Nhãn hiệu chứng nhận 'Mận hậu Mộc Châu' · VietGAP · Mã số vùng trồng xuất khẩu",
        "producer": "HTX Nông nghiệp Mận hậu Ná Ka Mộc Châu",
        "source_reference": "Sở Nông nghiệp và Phát triển nông thôn tỉnh Sơn La & UBND huyện Mộc Châu.",
        "verification_status": "verified",
    },
    {
        "product_id": 5,
        "product_name": "Mận sấy",
        "slug": "man-say-deo-moc-chau",
        "category_id": 3,
        "location_id": 3,
        "origin": "Thị trấn Nông trường Mộc Châu, Tỉnh Sơn La",
        "short_description": "Chế biến từ những trái mận hậu Mộc Châu chín mọng tuyển chọn, sấy lạnh giữ nguyên sắc đỏ ruby, độ dẻo mềm và vị chua ngọt tự nhiên.",
        "description": (
            "Mận sấy dẻo Mộc Châu giải quyết bài toán tính mùa vụ ngắn ngủi của trái mận hậu tươi, giúp người tiêu dùng thưởng thức hương vị cao nguyên quanh năm. "
            "Những quả mận hậu chín tím căng mọng được tuyển chọn kỹ lưỡng, khía nhẹ và đưa vào quy trình sấy lạnh công nghệ cao. "
            "Sản phẩm giữ được màu đỏ tím ruby đẹp mắt, thớ thịt dẻo mềm không bị khô cứng, vị chua thanh hòa quyện vị ngọt dịu tự nhiên mà không sử dụng chất bảo quản hay phẩm màu."
        ),
        "ingredients": "95% mận hậu tươi Mộc Châu chín mọng, 5% đường mía tinh luyện (hoặc dòng không đường kết hợp mật ong rừng).",
        "production_process": (
            "1. Tuyển chọn quả mận hậu chín đều, đạt độ đường Brix > 12%, rửa sục khí ozone.\n"
            "2. Tách hạt hoặc khía múi, chần hơi nước ngắn để giữ màu sắc.\n"
            "3. Thẩm thấu lạnh trong 12 giờ giúp cấu trúc thịt quả săn dẻo.\n"
            "4. Sấy lạnh ở nhiệt độ 45–50°C trong 28 giờ đến độ ẩm 18–20%.\n"
            "5. Đóng gói màng nhôm hút chân không đảm bảo an toàn thực phẩm."
        ),
        "characteristics": "Quả sấy dẻo mềm, không chảy nước, màu tím đỏ tự nhiên, thơm mùi mận chín đặc trưng, giàu chất xơ hỗ trợ tiêu hóa và anthocyanin chống lão hóa.",
        "traditional_value": (
            "Phát huy bí quyết chế biến mứt quả truyền thống của cư dân nông trường Mộc Châu kết hợp công nghệ sấy lạnh hiện đại, "
            "nâng cao giá trị nông sản gấp 3–4 lần và tạo việc làm ổn định quanh năm cho phụ nữ vùng cao."
        ),
        "keywords": "mận sấy, mận sấy dẻo, mộc châu, sản phẩm chế biến, ocop 4 sao, quà tặng đặc sản, sấy lạnh",
        "image_url": "/images/products/man-say-deo-moc-chau.jpg",
        "season": "Quanh năm",
        "certification": "OCOP 4 Sao Tỉnh Sơn La · HACCP / ISO 22000",
        "producer": "HTX Nông sản Quyết Thanh Mộc Châu",
        "source_reference": "Danh mục sản phẩm OCOP tiêu biểu tỉnh Sơn La.",
        "verification_status": "verified",
    },
    {
        "product_id": 6,
        "product_name": "Hồng sấy dẻo",
        "slug": "hong-say-deo-moc-chau",
        "category_id": 3,
        "location_id": 3,
        "origin": "Huyện Mộc Châu & Vân Hồ, Tỉnh Sơn La",
        "short_description": "Hồng tươi Mộc Châu gọt vỏ treo gió và sấy lạnh theo công nghệ Hoshigaki Nhật Bản, bên ngoài dẻo dai phủ phấn đường tự nhiên, bên trong mật ngọt sánh mịn.",
        "description": (
            "Hồng sấy dẻo Mộc Châu được chế biến từ giống hồng giòn Fuyu và hồng chát bản địa trồng trên độ cao trên 1.000m tại Mộc Châu và Vân Hồ. "
            "Ứng dụng công nghệ treo gió kết hợp sấy lạnh chuẩn Hoshigaki Nhật Bản, từng quả hồng được gọt vỏ tỉ mỉ, massage định kỳ để lượng tannin chuyển hóa hoàn toàn thành đường mật tự nhiên. "
            "Thành phẩm có lớp vỏ ngoài dẻo dai màu hổ phách sẫm, ruột bên trong mềm sánh như thạch mật, vị ngọt thanh khiết tuyệt hảo khi thưởng thức cùng trà Shan tuyết."
        ),
        "ingredients": "100% quả hồng tươi Mộc Châu thu hoạch đúng độ chín vàng cam, hoàn toàn không thêm đường hay phụ gia.",
        "production_process": (
            "1. Thu hái quả hồng giữ nguyên cuống chữ T từ những vườn hồng cổ Mộc Châu.\n"
            "2. Rửa sạch, gọt vỏ mỏng và khử trùng bề mặt.\n"
            "3. Treo giàn trong phòng sấy lạnh kiểm soát nhiệt độ (18–25°C), độ ẩm và luồng gió đối lưu trong 25–35 ngày.\n"
            "4. Thực hiện massage quả thủ công từ ngày thứ 7 để ruột hồng tươm mật đều.\n"
            "5. Ủ lạnh lên phấn đường glucose tự nhiên và đóng gói từng quả."
        ),
        "characteristics": "Nguyên quả dẻo mềm, ruột tươm mật vàng cam sánh mịn, lớp phấn trắng glucose tự nhiên bên ngoài, vị ngọt thanh không gắt, giàu vitamin A, C và khoáng chất.",
        "traditional_value": (
            "Sự giao thoa tinh tế giữa nguồn nguyên liệu hồng bản địa cao nguyên Mộc Châu và kỹ nghệ chế biến tinh xảo, "
            "tạo nên thức quà biếu sang trọng dịp Tết cổ truyền của người Việt."
        ),
        "keywords": "hồng sấy dẻo, hồng treo gió, mộc châu, hoshigaki, sản phẩm chế biến, ocop 4 sao, quà tết",
        "image_url": "/images/products/hong-say-deo-moc-chau.jpg",
        "season": "Chính vụ Thu – Đông (Tháng 9 – Tháng 2)",
        "certification": "OCOP 4 Sao · VietGAP vùng nguyên liệu",
        "producer": "HTX Nông sản Sạch Mộc Châu & HTX Quyết Thanh",
        "source_reference": "Báo cáo phát triển nông sản chế biến sâu huyện Mộc Châu, tỉnh Sơn La.",
        "verification_status": "verified",
    },
    {
        "product_id": 7,
        "product_name": "Gạo nếp địa phương",
        "slug": "gao-nep-tan-ngoc-chien",
        "category_id": 4,
        "location_id": 4,
        "origin": "Xã Ngọc Chiến, Huyện Mường La, Tỉnh Sơn La",
        "short_description": "Giống lúa nếp Tan cổ truyền canh tác trên cánh đồng Mường Chiến cao 1.600m tưới bằng nguồn nước suối khoáng tự nhiên, hạt gạo tròn mẩy, đồ xôi dẻo thơm nức tiếng.",
        "description": (
            "Gạo nếp địa phương Sơn La (tiêu biểu là Nếp Tan Ngọc Chiến – Mường La và Nếp Tan Mường Và – Sốp Cộp) được mệnh danh là 'hạt ngọc của núi rừng Tây Bắc'. "
            "Được đồng bào dân tộc Thái gieo cấy mỗi năm duy nhất một vụ kéo dài 6 tháng trên những thửa ruộng bậc thang ở độ cao 1.600m, "
            "cây lúa tắm mình trong làn nước suối khoáng trong vắt và khí hậu mát lạnh. "
            "Hạt gạo tròn mẩy, trắng đục như sữa; khi đồ xôi tỏa hương thơm ngát khắp bản, hạt xôi bóng mẩy, dẻo mềm nhưng không dính tay, để nguội cả ngày vẫn giữ nguyên độ mềm dẻo."
        ),
        "ingredients": "100% hạt gạo nếp Tan bản địa thuần chủng canh tác hữu cơ truyền thống tại xã Ngọc Chiến, Mường La.",
        "production_process": (
            "1. Gieo mạ và cấy lúa thủ công vào tháng 5 trên ruộng bậc thang dẫn nước suối tự nhiên.\n"
            "2. Chăm sóc theo phương pháp cổ truyền, không dùng thuốc diệt cỏ hóa học.\n"
            "3. Thu hoạch bằng tay (hái từng bông lúa bằng nhíp) khi hạt chín vàng vào tháng 10.\n"
            "4. Phơi khô tự nhiên dưới nắng thu vùng cao, xay xát nhẹ giữ lớp cám dinh dưỡng."
        ),
        "characteristics": "Hạt gạo to tròn đều, màu trắng đục phấn, mùi thơm lúa mới tự nhiên; hàm lượng amylopectin cao tạo độ dẻo đặc biệt, giàu vitamin nhóm B và khoáng chất.",
        "traditional_value": (
            "Gạo nếp Tan là linh hồn của nền văn minh lúa nước thung lũng vùng cao của người Thái Tây Bắc, "
            "không thể thiếu trong mâm cỗ xôi ngũ sắc, cốm non lễ Mừng Cơm Mới và các nghi lễ tâm linh truyền thống của bản làng."
        ),
        "keywords": "gạo nếp địa phương, nếp tan ngọc chiến, mường la, nông sản, dân tộc thái, xôi ngũ sắc, chỉ dẫn địa lý",
        "image_url": "/images/products/gao-nep-tan-ngoc-chien.jpg",
        "season": "Thu hoạch vụ mùa Tháng 10 – Tháng 11 (Cung ứng quanh năm)",
        "certification": "Nhãn hiệu tập thể 'Nếp Tan Ngọc Chiến' · OCOP 4 Sao · Canh tác hữu cơ bản địa",
        "producer": "HTX Nông nghiệp Ngọc Chiến (Mường La, Sơn La)",
        "source_reference": "Cục Sở hữu trí tuệ & UBND huyện Mường La, tỉnh Sơn La.",
        "verification_status": "verified",
    },
    {
        "product_id": 8,
        "product_name": "Tỏi đen",
        "slug": "toi-den-mot-nhanh-son-la",
        "category_id": 3,
        "location_id": 5,
        "origin": "Huyện Yên Châu & Phù Yên, Tỉnh Sơn La",
        "short_description": "Lên men tự nhiên suốt 60–90 ngày từ củ tỏi cô đơn (tỏi một nhánh) vùng Yên Châu – Phù Yên, giàu hoạt chất S-Allyl-L-Cysteine (SAC), dẻo mềm vị ngọt như ô mai.",
        "description": (
            "Tỏi đen Sơn La được chế biến từ nguồn nguyên liệu quý là củ tỏi một nhánh (tỏi cô đơn) trồng trên vùng đất cát pha giàu khoáng chất ven suối tại Yên Châu và Phù Yên. "
            "Trải qua quá trình lên men chậm tự nhiên trong 60 đến 90 ngày dưới sự kiểm soát nghiêm ngặt về nhiệt độ và độ ẩm, "
            "củ tỏi trắng cay nồng chuyển hóa thành màu đen tuyền bóng mượt, hoàn toàn mất mùi hăng cay, thay vào đó là vị ngọt dịu thanh như trái cây sấy dẻo. "
            "Quá trình lên men giúp hàm lượng hợp chất quý S-Allyl-L-Cysteine (SAC), polyphenol và SOD tăng gấp 5–10 lần so với tỏi tươi, hỗ trợ tăng cường miễn dịch và bảo vệ tim mạch."
        ),
        "ingredients": "100% củ tỏi cô đơn (tỏi một nhánh) bản địa Yên Châu – Phù Yên, lên men tự nhiên không chất phụ gia.",
        "production_process": (
            "1. Thu hoạch tỏi cô đơn khi lá khô già, phơi khô tự nhiên và phân loại củ tròn đều, không trầy xước.\n"
            "2. Rửa sạch, để ráo và xếp vào khay inox 304 chuyên dụng.\n"
            "3. Lên men tự nhiên (phản ứng Maillard) trong buồng ủ thông minh suốt 60–90 ngày ở nhiệt độ 60–80°C và độ ẩm 75–85%.\n"
            "4. Làm nguội, ủ ổn định hương vị trong 15 ngày và đóng hũ thủy tinh/túi hút chân không."
        ),
        "characteristics": "Củ tỏi một nhánh nguyên vỏ mỏng màu sáng, ruột đen nhánh dẻo mềm, không dính tay; vị ngọt dịu hơi chua nhẹ như ô mai; hàm lượng SAC và chất chống oxy hóa vượt trội.",
        "traditional_value": (
            "Kế thừa kinh nghiệm trồng tỏi tía, tỏi cô đơn lâu đời của nông dân thung lũng Yên Châu và Mường Tấc (Phù Yên), "
            "ứng dụng công nghệ sinh học lên men hiện đại để tạo ra thực phẩm bảo vệ sức khỏe giá trị cao mang thương hiệu Sơn La."
        ),
        "keywords": "tỏi đen, tỏi cô đơn, tỏi một nhánh, yên châu, phù yên, thực phẩm chế biến, sản phẩm chế biến, sức khỏe, lên men, ocop 4 sao",
        "image_url": "/images/products/toi-den-mot-nhanh-son-la.jpg",
        "season": "Quanh năm (Tỏi tươi thu hoạch Tháng 2 – Tháng 3)",
        "certification": "OCOP 4 Sao Tỉnh Sơn La · Chứng nhận An toàn thực phẩm & Kiểm nghiệm Viện Kiểm nghiệm ATVSTP Quốc gia",
        "producer": "HTX Nông sản Dược liệu Tây Bắc – Yên Châu, Sơn La",
        "source_reference": "Sở Khoa học và Công nghệ tỉnh Sơn La – Đề tài nghiên cứu chế biến tỏi cô đơn Sơn La.",
        "verification_status": "verified",
    },
]

SONLA_ARTICLES = [
    {
        "article_id": 1,
        "title": "Hành trình Cà phê Arabica Sơn La chinh phục chứng nhận Chỉ dẫn địa lý quốc gia",
        "slug": "hanh-trinh-ca-phe-arabica-son-la-chi-dan-dia-ly",
        "excerpt": "Từ những sườn đồi sương mù Mai Sơn đến ly cà phê đặc sản xuất khẩu sang châu Âu, Nhật Bản: câu chuyện chuyển mình của thủ phủ Arabica lớn nhất miền Bắc.",
        "content": (
            "Sơn La hiện sở hữu hơn 20.000 ha cà phê chè (Arabica), trở thành vùng sản xuất Arabica lớn nhất miền Bắc Việt Nam. "
            "Điều làm nên phẩm chất khác biệt của Cà phê Arabica Sơn La chính là điều kiện tự nhiên độc đáo: độ cao từ 650m đến hơn 1.000m, "
            "đất đỏ bazan xen đá vôi giàu khoáng chất và biên độ nhiệt ngày đêm lên tới 12–14 độ C.\n\n"
            "Những năm gần đây, các Hợp tác xã tại Mai Sơn và TP. Sơn La đã chuyển đổi mạnh mẽ sang canh tác hữu cơ, thu hái 100% quả chín đỏ "
            "và ứng dụng quy trình chế biến ướt, chế biến Honey và Natural trong nhà màng. Nhờ đó, hạt cà phê giữ trọn hương hoa trắng, trái cây nhiệt đới "
            "và vị chua thanh tao nhã, đạt chứng nhận Chỉ dẫn địa lý quốc gia và OCOP 5 sao."
        ),
        "content_type": "origin_story",
        "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 6,
        "keywords": "cà phê arabica sơn la, chỉ dẫn địa lý, mai sơn, ocop 5 sao, xuất khẩu",
        "source_reference": "Cục Sở hữu trí tuệ & Hiệp hội Cà phê Sơn La",
        "product_ids": [1, 3],
    },
    {
        "article_id": 2,
        "title": "Bí mật chế biến ướt và Honey giúp hạt Arabica Mai Sơn giữ trọn hương hoa rừng",
        "slug": "bi-mat-che-bien-uot-va-honey-ca-phe-arabica-mai-son",
        "excerpt": "Khám phá quy trình lên men kiểm soát vi sinh và phơi giàn nhà kính giúp nâng điểm Cupping của cà phê Sơn La lên trên 84 điểm SCA.",
        "content": (
            "Trong chuỗi giá trị cà phê đặc sản, khâu sơ chế sau thu hoạch quyết định tới 60% hương vị cuối cùng trong tách cà phê. "
            "Tại các HTX tiên phong ở Mai Sơn, quả cà phê sau khi hái chín đỏ được đưa vào bể tuyển nổi tách quả lép ngay trong ngày.\n\n"
            "Với phương pháp Honey Process, lớp chất nhầy (mucilage) giàu đường tự nhiên được giữ lại trên vỏ thóc và phơi chậm trên giàn lưới trong nhà màng từ 18–25 ngày. "
            "Quá trình thẩm thấu đường tự nhiên vào nhân xanh giúp hạt cà phê sau khi rang có hậu vị ngọt sâu như mật ong rừng và hương thơm trái cây chín vô cùng quyến rũ."
        ),
        "content_type": "production_process",
        "image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 5,
        "keywords": "quy trình chế biến, honey process, cà phê arabica sơn la, mai sơn",
        "source_reference": "Tài liệu kỹ thuật HTX Cà phê Bích Thao Sơn La",
        "product_ids": [1],
    },
    {
        "article_id": 3,
        "title": "Báu vật rừng chè Shan tuyết cổ thụ trăm năm trên đỉnh mây Tà Xùa",
        "slug": "bau-vat-rung-che-shan-tuyet-co-thu-ta-xua",
        "excerpt": "Trên độ cao hơn 1.800m quanh năm mây phủ, những gốc chè cổ thụ rêu phong của người Mông vẫn bền bỉ dâng tặng những búp trà trắng như tuyết.",
        "content": (
            "Xã vùng cao Tà Xùa (huyện Bắc Yên, tỉnh Sơn La) không chỉ nổi tiếng với thiên đường săn mây mà còn là quê hương của quần thể hàng vạn cây chè Shan tuyết cổ thụ tuổi đời 100–300 năm. "
            "Khác với chè trồng thâm canh dưới thấp, chè Shan tuyết Tà Xùa mọc tự nhiên trong sương mù, rễ cắm sâu vào tầng đất đá nguyên sinh.\n\n"
            "Để thu hái được những búp chè 'một tôm hai lá' phủ đầy lông tơ trắng muốt, những sơn nữ người Mông phải trèo lên thân cây cổ thụ cao hàng chục mét từ lúc sương sớm. "
            "Trà Tà Xùa khi pha có màu nước vàng sánh như mật ong, vị chát dịu nhẹ nơi đầu lưỡi rồi nhanh chóng chuyển thành vị ngọt thanh lan tỏa."
        ),
        "content_type": "cultural_heritage",
        "image_url": "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 7,
        "keywords": "chè shan tuyết, tà xùa, bắc yên, chè cổ thụ, văn hóa dân tộc mông",
        "source_reference": "Sở Văn hóa, Thể thao và Du lịch tỉnh Sơn La",
        "product_ids": [2],
    },
    {
        "article_id": 4,
        "title": "Nghệ thuật sao trà bằng chảo gang và cách thưởng thức Chè Shan tuyết đúng điệu",
        "slug": "nghe-thuat-sao-tra-va-cach-pha-che-shan-tuyet",
        "excerpt": "Đôi bàn tay trần cảm nhận nhiệt độ chảo gang củi rừng và bí quyết đánh thức hương cốm non của búp trà cổ thụ vùng cao.",
        "content": (
            "Người nghệ nhân làm trà Shan tuyết tại bản Bẹ, xã Tà Xùa vẫn giữ nguyên phương pháp sao suốt thủ công bằng chảo gang đun củi rừng. "
            "Không dùng nhiệt kế máy móc, người thợ dùng chính đôi bàn tay trần đảo đều búp chè trên mặt chảo nóng để diệt men vừa đủ, giữ lại lớp tuyết trắng và hoạt chất quý.\n\n"
            "Khi pha trà Shan tuyết, nên dùng nước suối mềm ở nhiệt độ 85–90°C, tráng ấm chén nóng và ủ trà trong 30–45 giây cho mỗi tuần nước. "
            "Một ấm trà Shan tuyết cổ thụ chuẩn có thể pha tới 8–10 tuần nước mà hương vị vẫn đượm nồng."
        ),
        "content_type": "guide",
        "image_url": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 5,
        "keywords": "chè shan tuyết, nghệ thuật pha trà, sao trà thủ công, tà xùa",
        "source_reference": "HTX Đặc sản Tây Bắc Tà Xùa",
        "product_ids": [2],
    },
    {
        "article_id": 5,
        "title": "Trà vỏ cà phê Cascara: Bước đột phá kinh tế tuần hoàn từ trái Arabica Sơn La",
        "slug": "tra-vo-ca-phe-cascara-kinh-te-tuan-hoan-son-la",
        "excerpt": "Từ lớp vỏ quả từng bị bỏ đi sau thu hoạch đến thức uống giàu chất chống oxy hóa được giới trẻ và thị trường quốc tế ưa chuộng.",
        "content": (
            "Trong tiếng Tây Ban Nha, 'Cascara' có nghĩa là lớp vỏ. Trước đây, sau khi xát tươi lấy nhân cà phê, hàng chục ngàn tấn vỏ quả tại Sơn La chỉ được ủ làm phân bón. "
            "Nhận thấy lớp vỏ thịt của trái Arabica chín đỏ vùng núi cao chứa hàm lượng đường trái cây và polyphenol cực kỳ dồi dào, các HTX tại Mai Sơn đã đầu tư dây chuyền sấy lạnh tuần hoàn.\n\n"
            "Trà từ vỏ cà phê Sơn La mang hương vị giao thoa độc đáo giữa trà thảo mộc và nước ép trái cây sấy (táo đỏ, mận chín, hoa dâm bụt). "
            "Đặc biệt, lượng caffeine rất thấp giúp người dùng có thể thưởng thức vào buổi chiều tối mà không lo mất ngủ."
        ),
        "content_type": "innovation",
        "image_url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 5,
        "keywords": "trà từ vỏ cà phê, trà cascara, kinh tế tuần hoàn, chống oxy hóa, cà phê arabica",
        "source_reference": "Hội thảo Nông nghiệp tuần hoàn Tây Bắc",
        "product_ids": [3, 1],
    },
    {
        "article_id": 6,
        "title": "Mùa mận hậu chín đỏ thung lũng Ná Ka và câu chuyện nông nghiệp VietGAP Mộc Châu",
        "slug": "mua-man-hau-chin-do-thung-lung-na-ka-moc-chau",
        "excerpt": "Tháng 5 về trên cao nguyên Mộc Châu, những vườn mận hậu canh tác hữu cơ và VietGAP bước vào vụ thu hoạch rộn ràng.",
        "content": (
            "Thung lũng mận Ná Ka (xã Tân Lập, huyện Mộc Châu) rộng hơn 100 ha được ví như viên ngọc xanh của cao nguyên. "
            "Để nâng tầm thương hiệu 'Mận hậu Mộc Châu', các hộ nông dân và HTX đã áp dụng quy trình tỉa cành tạo tán thấp, bón phân hữu cơ ủ hoai và tỉa bớt quả non để cây tập trung dinh dưỡng.\n\n"
            "Nhờ đó, quả mận hậu đạt kích thước đồng đều (16–20 quả/kg), vỏ tím thẫm phủ lớp phấn trắng tự nhiên dày dặn, thịt quả giòn tan và ngọt đậm, "
            "đủ tiêu chuẩn bước vào hệ thống siêu thị cao cấp và xuất khẩu."
        ),
        "content_type": "origin_story",
        "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 6,
        "keywords": "mận hậu, mộc châu, thung lũng ná ka, vietgap, trái cây",
        "source_reference": "UBND huyện Mộc Châu, tỉnh Sơn La",
        "product_ids": [4, 5],
    },
    {
        "article_id": 7,
        "title": "Lễ hội Hái quả Mộc Châu: Nơi văn hóa bản địa giao hòa cùng du lịch nông nghiệp",
        "slug": "le-hoi-hai-qua-moc-chau-du-lich-nong-nghiep",
        "excerpt": "Trải nghiệm tự tay hái những chùm mận hậu còn nguyên phấn trắng và hòa mình vào điệu xòe Thái, tiếng khèn Mông trên cao nguyên.",
        "content": (
            "Mỗi dịp cuối tháng 5 đầu tháng 6, Lễ hội Hái quả Mộc Châu tại thung lũng Ná Ka lại thu hút hàng vạn du khách. "
            "Không chỉ là dịp tôn vinh người trồng mận hậu, lễ hội còn kết hợp các phần thi hái quả, trưng bày sản phẩm chế biến từ mận (mận sấy dẻo, rượu mận, siro mận) "
            "và trình diễn văn hóa dân gian đặc sắc của đồng bào dân tộc Thái, Mông, Dao.\n\n"
            "Mô hình du lịch nông nghiệp gắn với truyền thông số đã giúp giá trị quả mận hậu tăng trưởng bền vững, mang lại nguồn thu ổn định cho người dân bản địa."
        ),
        "content_type": "cultural_heritage",
        "image_url": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 5,
        "keywords": "lễ hội hái quả, mận hậu, mận sấy, du lịch nông nghiệp, mộc châu",
        "source_reference": "Trung tâm Truyền thông - Văn hóa huyện Mộc Châu",
        "product_ids": [4, 5],
    },
    {
        "article_id": 8,
        "title": "Công nghệ sấy lạnh giúp Mận sấy dẻo Mộc Châu giữ trọn sắc hương bốn mùa",
        "slug": "cong-nghe-say-lanh-man-say-deo-moc-chau",
        "excerpt": "Giải bài toán mùa vụ ngắn của trái cây tươi bằng quy trình chế biến sâu đạt chuẩn OCOP 4 sao và ISO 22000.",
        "content": (
            "Trái mận hậu tươi chỉ kéo dài vụ thu hoạch trong khoảng 6–8 tuần. Để kéo dài vòng đời sản phẩm và gia tăng giá trị kinh tế, "
            "các HTX tại Mộc Châu đã nghiên cứu quy trình sấy lạnh bơm nhiệt ở dải nhiệt độ thấp 45–50°C.\n\n"
            "Khác với sấy nhiệt truyền thống dễ làm quả bị thâm đen và mất vitamin, sấy lạnh giúp hơi nước thoát ra từ từ, "
            "giữ nguyên màu đỏ ruby của thịt mận, hương thơm tự nhiên và độ dẻo mềm hấp dẫn."
        ),
        "content_type": "production_process",
        "image_url": "https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 5,
        "keywords": "mận sấy, sấy lạnh, chế biến sâu, mận hậu, ocop 4 sao",
        "source_reference": "HTX Nông sản Quyết Thanh Mộc Châu",
        "product_ids": [5, 4],
    },
    {
        "article_id": 9,
        "title": "Kỹ nghệ làm Hồng sấy dẻo treo gió Hoshigaki trên cao nguyên sương mờ Mộc Châu",
        "slug": "ky-nghe-lam-hong-say-deo-treo-gio-moc-chau",
        "excerpt": "30 ngày treo gió và massage thủ công từng quả hồng để kết tinh lớp mật ngọt sánh mịn và phấn đường tự nhiên.",
        "content": (
            "Vào mùa thu đông từ tháng 9 đến tháng 12, những vườn hồng cổ thụ tại Mộc Châu và Vân Hồ chuyển sang sắc vàng cam rực rỡ. "
            "Học hỏi công nghệ Hoshigaki trứ danh của Nhật Bản và điều chỉnh phù hợp với khí hậu cao nguyên Sơn La, các nghệ nhân gọt vỏ từng quả hồng còn cuống chữ T, "
            "treo thành từng chuỗi trong nhà sấy đối lưu gió sạch.\n\n"
            "Sau khoảng 1 tuần, khi bề mặt quả se lại, người thợ phải nhẹ nhàng massage từng quả mỗi ngày để phá vỡ các túi tannin bên trong, "
            "giúp ruột hồng chuyển sang dạng thạch mật ngọt dịu và tự tiết ra lớp phấn đường glucose trắng mịn ngoài vỏ."
        ),
        "content_type": "production_process",
        "image_url": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 6,
        "keywords": "hồng sấy dẻo, hồng treo gió, hoshigaki, mộc châu, sản phẩm chế biến",
        "source_reference": "Sở Khoa học và Công nghệ tỉnh Sơn La",
        "product_ids": [6],
    },
    {
        "article_id": 10,
        "title": "Thưởng thức Hồng sấy dẻo cùng Chè Shan tuyết: Sự kết hợp tinh tế của ẩm thực Tây Bắc",
        "slug": "thuong-thuc-hong-say-deo-cung-che-shan-tuyet",
        "excerpt": "Vị ngọt mật thanh tao của hồng treo gió hòa quyện cùng vị chát dịu hậu ngọt của trà cổ thụ tạo nên nghệ thuật trà đạo vùng cao.",
        "content": (
            "Trong văn hóa ẩm thực thưởng trà, thức quà đi kèm (trà thực) đóng vai trò tôn vinh hương vị của chén trà. "
            "Khi thưởng thức một miếng hồng sấy dẻo Mộc Châu mềm sánh mật ong rồi nhấp một ngụm Chè Shan tuyết Tà Xùa ấm nóng, "
            "vị chát thanh của polyphenol trong trà sẽ cân bằng hoàn hảo độ ngọt của quả hồng, để lại dư vị thơm ngát của núi rừng Tây Bắc.\n\n"
            "Bộ đôi Hồng sấy dẻo và Chè Shan tuyết hiện là lựa chọn quà biếu văn hóa được nhiều khách hàng yêu thích nhất trên nền tảng."
        ),
        "content_type": "guide",
        "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 4,
        "keywords": "hồng sấy dẻo, chè shan tuyết, ẩm thực tây bắc, quà biếu đặc sản",
        "source_reference": "Cẩm nang Văn hóa Ẩm thực Sơn La",
        "product_ids": [6, 2],
    },
    {
        "article_id": 11,
        "title": "Nếp Tan Ngọc Chiến: Hạt ngọc nuôi dưỡng từ dòng suối khoáng nóng Mường La",
        "slug": "nep-tan-ngoc-chien-hat-ngoc-muong-la-son-la",
        "excerpt": "Giống lúa nếp cổ truyền chỉ mọc trên cánh đồng cao 1.600m, nơi đồng bào Thái thu hoạch từng bông lúa bằng nhíp thủ công.",
        "content": (
            "Nằm sâu giữa những dãy núi hùng vĩ giáp ranh Mù Cang Chải, thung lũng Ngọc Chiến (huyện Mường La, Sơn La) ở độ cao 1.600m được thiên nhiên ban tặng dòng suối khoáng nóng và nguồn nước tinh khiết chảy từ rừng già. "
            "Chính nguồn nước giàu khoáng chất và khí hậu ngày nắng ấm, đêm se lạnh đã tạo nên hương vị độc nhất vô nhị của Gạo nếp Tan Ngọc Chiến.\n\n"
            "Người Thái ở Ngọc Chiến vẫn giữ tập tục thu hoạch lúa nếp bằng 'nhíp' hái từng bông chứ không cắt cả gốc, nhằm chọn ra những bông lúa chín đều nhất. "
            "Chỉ cần một nhà đồ xôi ở đầu bản, hương thơm lúa mới đã lan tỏa tới tận cuối bản."
        ),
        "content_type": "origin_story",
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 6,
        "keywords": "gạo nếp địa phương, nếp tan ngọc chiến, mường la, dân tộc thái, nông sản",
        "source_reference": "UBND huyện Mường La, tỉnh Sơn La",
        "product_ids": [7],
    },
    {
        "article_id": 12,
        "title": "Lễ mừng cơm mới của người Thái Sơn La và nghệ thuật làm xôi ngũ sắc từ Nếp Tan",
        "slug": "le-mung-com-moi-nguoi-thai-va-xoi-ngu-sac-nep-tan",
        "excerpt": "Khám phá nghi lễ tạ ơn đất trời sau vụ mùa tháng 10 và bí quyết nhuộm màu xôi tự nhiên từ lá rừng Tây Bắc.",
        "content": (
            "Hàng năm vào dịp rằm tháng 10 âm lịch, khi những cánh đồng Nếp Tan tại Ngọc Chiến (Mường La) và Mường Và (Sốp Cộp) chín vàng rực rỡ, "
            "đồng bào dân tộc Thái lại nô nức tổ chức Lễ hội Mừng Cơm Mới để tạ ơn tổ tiên và thần nông.\n\n"
            "Từ hạt gạo nếp địa phương tròn mẩy, những người phụ nữ Thái khéo léo ngâm gạo với nước sắc từ lá cẩm tím, lá khảu đen, nghệ vàng và quả gấc đỏ "
            "để đồ trong chõ gỗ, tạo nên mâm xôi ngũ sắc tượng trưng cho ngũ hành âm dương và ước vọng mùa màng bội thu."
        ),
        "content_type": "cultural_heritage",
        "image_url": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 5,
        "keywords": "lễ mừng cơm mới, xôi ngũ sắc, gạo nếp địa phương, văn hóa dân tộc thái",
        "source_reference": "Bảo tàng tỉnh Sơn La",
        "product_ids": [7],
    },
    {
        "article_id": 13,
        "title": "Từ củ tỏi cô đơn Yên Châu đến Tỏi đen lên men 90 ngày giàu dược tính",
        "slug": "tu-cu-toi-co-don-yen-chau-den-toi-den-len-men",
        "excerpt": "Giải mã quá trình chuyển hóa sinh học giúp hàm lượng hoạt chất S-Allyl-L-Cysteine (SAC) trong tỏi đen Sơn La tăng gấp nhiều lần.",
        "content": (
            "Vùng đất Yên Châu và Phù Yên (Sơn La) từ lâu đã nổi tiếng với giống tỏi tía một nhánh (tỏi cô đơn) có hàm lượng tinh dầu allicin rất cao nhờ điều kiện thổ nhưỡng đất cát pha ven suối và nắng gió đặc trưng. "
            "Khi đưa củ tỏi một nhánh vào quy trình lên men tự nhiên suốt 60–90 ngày ở nhiệt độ và độ ẩm tiêu chuẩn, phản ứng Maillard diễn ra hoàn toàn tự nhiên mà không cần bất kỳ hóa chất nào.\n\n"
            "Kết quả kiểm nghiệm cho thấy Tỏi đen Sơn La rất giàu S-Allyl-L-Cysteine (SAC) và polyphenol, có vị ngọt dẻo dễ ăn, giúp nâng cao sức đề kháng, giảm cholesterol và chống oxy hóa hiệu quả."
        ),
        "content_type": "production_process",
        "image_url": "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 6,
        "keywords": "tỏi đen, tỏi cô đơn, yên châu, phù yên, lên men tự nhiên, sức khỏe",
        "source_reference": "Đề tài KHCN chế biến Tỏi đen Sơn La",
        "product_ids": [8],
    },
    {
        "article_id": 14,
        "title": "Ứng dụng Khoa học Dữ liệu và Machine Learning trong truyền thông nông sản bản địa Sơn La",
        "slug": "ung-dung-machine-learning-truyen-thong-nong-san-son-la",
        "excerpt": "Cách nền tảng kết hợp Event-based Tracking, phân cụm hành vi K-means và hệ thống gợi ý Content-based TF-IDF để kết nối đúng nhu cầu người tiêu dùng.",
        "content": (
            "Một trong những thách thức lớn nhất của nông sản truyền thống địa phương là thông tin bị phân mảnh và chưa nắm bắt được nhu cầu thực sự của từng nhóm độc giả, khách hàng. "
            "Nền tảng Nông sản Truyền thống Sơn La được thiết kế tích hợp hệ thống thu thập sự kiện tương tác ẩn danh (Event-based Tracking) với 10 loại sự kiện chuẩn hóa.\n\n"
            "Từ vector 9 đặc trưng hành vi X = [S, P, A, T, Q, F, C, R, U], thuật toán K-means tự động phân nhóm người truy cập thành các phân khúc khách quan, "
            "đồng thời mô hình Content-based Recommendation sử dụng TF-IDF tiếng Việt và Cosine Similarity đề xuất chính xác Top 5 sản phẩm và câu chuyện phù hợp nhất cho từng người dùng."
        ),
        "content_type": "research",
        "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
        "reading_time_minutes": 7,
        "keywords": "machine learning, k-means, content-based recommendation, tf-idf, nông sản sơn la",
        "source_reference": "Báo cáo Đồ án tốt nghiệp – Hệ thống truyền thông & phân tích dữ liệu nông sản",
        "product_ids": [1, 2, 4, 7, 8],
    },
]


def seed_initial_catalog_and_admin(db: Session) -> Dict[str, int]:
    """
    Seed AdminUser, Locations (5), Categories (4), Products (8), and Articles (14)
    along with article_products M2M relationships. Idempotent.
    """
    # 1. Seed default Admin user
    admin = db.query(AdminUser).filter(AdminUser.username == "admin").first()
    if not admin:
        admin = AdminUser(
            username="admin",
            password_hash=get_password_hash("admin123"),
            full_name="Quản trị viên Nông sản Sơn La",
            email="admin@sonla-agri.vn",
            role="super_admin",
            is_active=True,
        )
        db.add(admin)

    # 2. Seed Locations
    existing_locs = {loc.location_id: loc for loc in db.query(Location).all()}
    for loc_data in SONLA_LOCATIONS:
        loc_obj = existing_locs.get(loc_data["location_id"])
        if not loc_obj:
            loc_obj = Location(**loc_data)
            db.add(loc_obj)
        else:
            for k, v in loc_data.items():
                setattr(loc_obj, k, v)

    # 3. Seed Categories
    existing_cats = {cat.category_id: cat for cat in db.query(Category).all()}
    for cat_data in SONLA_CATEGORIES:
        cat_obj = existing_cats.get(cat_data["category_id"])
        if not cat_obj:
            cat_obj = Category(**cat_data)
            db.add(cat_obj)
        else:
            for k, v in cat_data.items():
                setattr(cat_obj, k, v)

    db.flush()

    # 4. Seed Products
    existing_prods = {p.product_id: p for p in db.query(Product).all()}
    prods_by_id: Dict[int, Product] = {}
    for p_data in SONLA_PRODUCTS:
        p_obj = existing_prods.get(p_data["product_id"])
        if not p_obj:
            p_obj = Product(**p_data)
            db.add(p_obj)
        else:
            for k, v in p_data.items():
                setattr(p_obj, k, v)
        prods_by_id[p_data["product_id"]] = p_obj

    db.flush()

    # 5. Seed Articles & M2M Links
    existing_arts = {a.article_id: a for a in db.query(Article).all()}
    now = datetime.utcnow()
    for idx, a_data in enumerate(SONLA_ARTICLES):
        p_ids = a_data["product_ids"]
        clean_data = {k: v for k, v in a_data.items() if k != "product_ids"}
        a_obj = existing_arts.get(clean_data["article_id"])
        if not a_obj:
            a_obj = Article(
                **clean_data,
                published_at=now - timedelta(days=(len(SONLA_ARTICLES) - idx) * 2),
                status="published",
            )
            db.add(a_obj)
        else:
            for k, v in clean_data.items():
                setattr(a_obj, k, v)
        a_obj.products = [prods_by_id[pid] for pid in p_ids if pid in prods_by_id]

    db.commit()
    return {
        "locations": len(SONLA_LOCATIONS),
        "categories": len(SONLA_CATEGORIES),
        "products": len(SONLA_PRODUCTS),
        "articles": len(SONLA_ARTICLES),
    }
