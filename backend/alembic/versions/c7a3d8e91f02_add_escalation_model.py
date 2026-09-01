"""add_escalation_model

Revision ID: c7a3d8e91f02
Revises: 928a83f027ce
Create Date: 2026-09-01 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c7a3d8e91f02'
down_revision: Union[str, None] = '928a83f027ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely create enums
    op.execute("DROP TYPE IF EXISTS escalationtriggertypeenum CASCADE")
    op.execute("CREATE TYPE escalationtriggertypeenum AS ENUM ('SLA_BREACH', 'MANUAL')")

    op.execute("DROP TYPE IF EXISTS escalationstatusenumenum CASCADE")
    op.execute("CREATE TYPE escalationstatusenumenum AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED')")

    # Create escalations table
    op.create_table(
        'escalations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ticket_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('trigger_type', postgresql.ENUM('SLA_BREACH', 'MANUAL', name='escalationtriggertypeenum', create_type=False), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('triggered_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('assigned_to_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('status', postgresql.ENUM('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED', name='escalationstatusenumenum', create_type=False), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['triggered_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_escalations_ticket_id', 'escalations', ['ticket_id'])
    op.create_index('ix_escalations_project_id', 'escalations', ['project_id'])

    # Partial unique index: prevent duplicate active escalations per ticket
    op.execute("""
        CREATE UNIQUE INDEX uq_active_escalation_per_ticket 
        ON escalations(ticket_id) 
        WHERE status IN ('OPEN', 'ACKNOWLEDGED')
    """)

    # Add ACKNOWLEDGED to existing escalationstatusenum (on tickets table)
    op.execute("ALTER TYPE escalationstatusenum ADD VALUE IF NOT EXISTS 'ACKNOWLEDGED'")


def downgrade() -> None:
    op.drop_index('uq_active_escalation_per_ticket', table_name='escalations')
    op.drop_index('ix_escalations_project_id', table_name='escalations')
    op.drop_index('ix_escalations_ticket_id', table_name='escalations')
    op.drop_table('escalations')

    # Drop enums
    sa.Enum(name='escalationtriggertypeenum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='escalationstatusenumenum').drop(op.get_bind(), checkfirst=True)
