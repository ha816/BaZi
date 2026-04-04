from uuid import UUID

from bazi.application.port.member_port import MemberPort
from bazi.domain.member import Member


class MemberService:
    def __init__(self, member_port: MemberPort):
        self.member_port = member_port

    async def create_member(self, name: str, email: str) -> Member:
        existing = await self.member_port.get_by_email(email)
        if existing:
            return existing
        return await self.member_port.create(name, email)

    async def get_member(self, member_id: UUID) -> Member | None:
        return await self.member_port.get(member_id)
