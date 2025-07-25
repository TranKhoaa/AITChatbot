"""add media_type to File

Revision ID: d2b8dd46fe92
Revises: ffded7d5b949
Create Date: 2025-07-23 09:11:35.178702

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
import pgvector.sqlalchemy


# revision identifiers, used by Alembic.
revision: str = 'd2b8dd46fe92'
down_revision: Union[str, Sequence[str], None] = 'ffded7d5b949'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('File', sa.Column('media_type', sqlmodel.sql.sqltypes.AutoString(), nullable=False))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('File', 'media_type')
    # ### end Alembic commands ###
