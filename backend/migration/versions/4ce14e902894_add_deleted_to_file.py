"""add deleted to File

Revision ID: 4ce14e902894
Revises: d2b8dd46fe92
Create Date: 2025-07-24 13:27:20.897656

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
import pgvector.sqlalchemy


# revision identifiers, used by Alembic.
revision: str = '4ce14e902894'
down_revision: Union[str, Sequence[str], None] = 'd2b8dd46fe92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('File', sa.Column('deleted', sa.BOOLEAN(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('File', 'deleted')
    # ### end Alembic commands ###
