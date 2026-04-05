"""rename_daily_fortunes_to_fortunes

Revision ID: 150d31f50d94
Revises: fbc0f370afd4
Create Date: 2026-04-05 17:56:42.656928

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '150d31f50d94'
down_revision: Union[str, Sequence[str], None] = 'fbc0f370afd4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table("daily_fortunes", "fortunes")
    op.execute("ALTER INDEX uq_daily_fortune_profile_date RENAME TO uq_fortune_profile_date")


def downgrade() -> None:
    op.execute("ALTER INDEX uq_fortune_profile_date RENAME TO uq_daily_fortune_profile_date")
    op.rename_table("fortunes", "daily_fortunes")
