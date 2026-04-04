from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Member:
    """서비스 이용 사용자."""

    id: UUID
    name: str
    email: str
    created_at: datetime
