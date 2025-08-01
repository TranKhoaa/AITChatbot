"""Remove user id and user role in blacklist table

Revision ID: e04634f4efea
Revises: 2af18f36e35f
Create Date: 2025-07-31 10:04:37.904361

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
import pgvector.sqlalchemy


# revision identifiers, used by Alembic.
revision: str = 'e04634f4efea'
down_revision: Union[str, Sequence[str], None] = '2af18f36e35f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    # Drop indexes for user_id and user_role columns
    op.drop_index('ix_token_blacklist_user_role', table_name='token_blacklist')
    op.drop_index('ix_token_blacklist_user_id', table_name='token_blacklist')
    
    # Drop the user_id and user_role columns
    op.drop_column('token_blacklist', 'user_role')
    op.drop_column('token_blacklist', 'user_id')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    # Add back the user_id and user_role columns
    op.add_column('token_blacklist', sa.Column('user_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False))
    op.add_column('token_blacklist', sa.Column('user_role', sqlmodel.sql.sqltypes.AutoString(), nullable=False))
    
    # Recreate indexes for user_id and user_role columns
    op.create_index('ix_token_blacklist_user_id', 'token_blacklist', ['user_id'], unique=False)
    op.create_index('ix_token_blacklist_user_role', 'token_blacklist', ['user_role'], unique=False)
    # ### end Alembic commands ###
