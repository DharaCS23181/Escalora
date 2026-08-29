# Escalora Architecture

## Overview
This document outlines the foundational architecture of the Escalora intelligent software maintenance ticket escalation system.

## Components

### 1. Frontend (React + Vite)
- Serves as the user interface for monitoring and managing tickets.
- Connects to the backend via standard HTTP REST API calls.
- Future implementation will include WebSockets for real-time ticket updates and SLA breach notifications.

### 2. Backend (FastAPI)
- Handles core business logic, user requests, and API routing.
- Uses SQLAlchemy 2.x as the ORM to interact with PostgreSQL.
- Responsible for queuing background tasks to Celery via Redis.

### 3. Database (PostgreSQL)
- The persistent data store for tickets, user data, SLA definitions, and system configurations.

### 4. Background Processing (Celery & Redis)
- **Redis**: Acts as the message broker passing task instructions from FastAPI to Celery Workers, and stores the results of these tasks.
- **Celery Worker**: Executes time-consuming background jobs.
- **Celery Beat**: A scheduler that triggers periodic tasks based on time intervals or chron schedules.

## Future SLA Processing Flow
The architecture was chosen specifically to handle intelligent ticket escalation logic efficiently:

1. **SLA Monitoring (Celery Beat)**: A scheduled task runs every X minutes to query the database for active tickets nearing their SLA limits.
2. **Warning Generation (Celery Worker)**: If a ticket is approaching an SLA threshold, Celery Beat queues a task for a Worker to emit a warning notification (email/socket).
3. **Escalation Execution (Celery Worker)**: If a ticket breaches its SLA, Celery Beat queues a high-priority task. The Worker computes the business logic to escalate the ticket (e.g., reassignment, urgency update) and saves the new state back to PostgreSQL.
4. **Realtime Update (FastAPI WebSocket)**: The backend detects the state change and broadcasts it to connected React clients.

*(Note: The actual implementation of these SLA business rules is out of scope for the foundation phase and will be added later.)*
