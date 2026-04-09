"""add_interpret_feedbacks_table

Revision ID: c3a8f9d2e471
Revises: 150d31f50d94
Create Date: 2026-04-09 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID


revision: str = 'c3a8f9d2e471'
down_revision: Union[str, Sequence[str], None] = '150d31f50d94'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "interpret_feedbacks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("profile_id", UUID(as_uuid=True), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tab_id", sa.String(50), nullable=False),
        sa.Column("rating", sa.SmallInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_interpret_feedbacks_profile_id", "interpret_feedbacks", ["profile_id"])


def downgrade() -> None:
    op.drop_index("ix_interpret_feedbacks_profile_id", table_name="interpret_feedbacks")
    op.drop_table("interpret_feedbacks")
