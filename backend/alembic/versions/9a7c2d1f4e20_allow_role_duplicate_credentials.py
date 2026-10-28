"""allow credentials to be reused by tenant and landlord accounts

Revision ID: 9a7c2d1f4e20
Revises: 55000e300e96
"""
from typing import Sequence, Union

from alembic import op


revision: str = "9a7c2d1f4e20"
down_revision: Union[str, Sequence[str], None] = "55000e300e96"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_users_phone", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.create_index("ix_users_phone", "users", ["phone"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_phone", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
