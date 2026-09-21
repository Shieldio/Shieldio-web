"""Lightweight checks that keep shieldio.cz a non-commercial student project."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [p for p in ROOT.rglob("*") if p.is_file() and ".git" not in p.parts and "learn" not in p.parts and "tests" not in p.parts]
TEXT = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in FILES)

FORBIDDEN = (
    "Obchodní podmínky (návrh)",
    "schema.org/PreOrder",
    "google-adsense-account",
    "<iframe",
    "Objednat EduSET",
)

failed = [phrase for phrase in FORBIDDEN if phrase.lower() in TEXT.lower()]
assert not failed, "Zakázané veřejné prvky: " + ", ".join(failed)

red = (ROOT / "products" / "RED.html").read_text(encoding="utf-8")
assert "Odesláním formuláře nevzniká objednávka, rezervace, kupní smlouva" in red
assert "#zajem" in red and "#preorder" not in red
assert "<script src=\"../assets/js/preorder.js\"" not in red
print("legal guardrails OK")
