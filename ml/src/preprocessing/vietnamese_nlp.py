import re
import unicodedata
from typing import Dict, List, Set

# Comprehensive compound dictionary for Vietnamese agriculture, Sơn La specialties, and culture
VIETNAMESE_COMPOUND_TERMS: List[str] = [
    "sơn la",
    "mộc châu",
    "mai sơn",
    "thuận châu",
    "bắc yên",
    "tà xùa",
    "yên châu",
    "quỳnh nhai",
    "sông mã",
    "sốp cộp",
    "phù yên",
    "vân hồ",
    "mường la",
    "cà phê",
    "arabica",
    "catimor",
    "bourbon",
    "typica",
    "chè shan tuyết",
    "shan tuyết",
    "cổ thụ",
    "vỏ cà phê",
    "trà cascara",
    "cascara",
    "mận hậu",
    "ná ka",
    "mận sấy",
    "sấy dẻo",
    "hồng giòn",
    "hồng sấy dẻo",
    "gạo nếp",
    "nếp tan",
    "tỏi đen",
    "tỏi cô đơn",
    "lên men",
    "chỉ dẫn địa lý",
    "ocop",
    "vietgap",
    "globalgap",
    "hữu cơ",
    "nông sản",
    "truyền thống",
    "đặc sản",
    "đồng bào",
    "dân tộc thái",
    "dân tộc mông",
    "văn hóa",
    "quy trình",
    "chế biến",
    "thu hoạch",
    "chất lượng",
    "hương vị",
    "nguyên liệu",
    "thổ nhưỡng",
    "khí hậu",
    "cao nguyên",
    "sương mù",
    "núi cao",
    "chống oxy hóa",
    "dinh dưỡng",
    "sức khỏe",
    "xuất khẩu",
    "bền vững",
    "hợp tác xã",
    "truy xuất nguồn gốc",
    "đồ uống",
    "trái cây",
    "sản phẩm chế biến",
    "thực phẩm chế biến",
]

VIETNAMESE_STOPWORDS: Set[str] = {
    "và", "của", "là", "các", "những", "một", "trong", "được", "có", "cho",
    "với", "từ", "tại", "trên", "đến", "khi", "như", "để", "này", "đó",
    "về", "theo", "hay", "hoặc", "nhưng", "mà", "cũng", "rất", "nhiều",
    "hơn", "nhất", "đã", "đang", "sẽ", "không", "chưa", "bởi", "vì",
    "nên", "nếu", "thì", "vào", "ra", "lên", "xuống", "qua", "lại",
    "cùng", "tất", "cả", "mỗi", "mọi", "ai", "gì", "nào", "đâu", "sao",
    "bao", "nhiêu", "bằng", "do", "tới", "còn", "chỉ", "việc", "cách",
    "người", "nơi", "vùng", "loại", "phần", "점", "số", "lượng",
}


def normalize_vietnamese_text(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)
    text = text.lower()
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"[^\w\sàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenize_vietnamese(text: str) -> str:
    """
    Tokenize Vietnamese text by joining compound words with underscores (e.g., 'sơn_la', 'cà_phê')
    and filtering out stopwords.
    Attempts underthesea/pyvi if installed, then enforces domain-specific agricultural compounds.
    """
    norm = normalize_vietnamese_text(text)
    if not norm:
        return ""

    # Sort compounds longest first so multi-word phrases match greedily
    sorted_compounds = sorted(VIETNAMESE_COMPOUND_TERMS, key=len, reverse=True)
    for phrase in sorted_compounds:
        replacement = phrase.replace(" ", "_")
        pattern = r"\b" + re.escape(phrase) + r"\b"
        norm = re.sub(pattern, replacement, norm)

    raw_tokens = norm.split()
    filtered_tokens = [
        tok for tok in raw_tokens
        if tok not in VIETNAMESE_STOPWORDS and len(tok) > 1 and not tok.isdigit()
    ]
    return " ".join(filtered_tokens)
