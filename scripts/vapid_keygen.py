"""VAPID 키쌍 생성 → 환경변수 3줄 출력. 사용: uv run python scripts/vapid_keygen.py [mailto:you@example.com]"""
import sys

from cryptography.hazmat.primitives import serialization
from py_vapid import Vapid, b64urlencode

subject = sys.argv[1] if len(sys.argv) > 1 else "mailto:admin@example.com"
v = Vapid()
v.generate_keys()
private_raw = v.private_key.private_numbers().private_value.to_bytes(32, "big")
public_raw = v.public_key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
print(f"export KKACHI_VAPID_PUBLIC_KEY={b64urlencode(public_raw)}")
print(f"export KKACHI_VAPID_PRIVATE_KEY={b64urlencode(private_raw)}")
print(f"export KKACHI_VAPID_SUBJECT={subject}")
