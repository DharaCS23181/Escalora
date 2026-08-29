# Escalora

**Intelligent Software Maintenance Ticket Escalation System**

## Description
Escalora is an intelligent ticket escalation system designed to monitor SLAs, detect breaches, and automatically escalate tickets based on business rules. This repository contains the foundational structure of the application.

*Note: In this initial phase, the core SLA monitoring and automatic escalation business rules have not yet been implemented. This phase establishes the underlying containerized infrastructure required to support these features in the future.*

## Technology Stack
- **Frontend**: React.js, Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **Backend**: FastAPI (Python 3.12+), SQLAlchemy 2.x, Alembic
- **Database**: PostgreSQL
- **Background Processing**: Celery + Redis
- **Containerization**: Docker & Docker Compose

## Architecture Overview
The application follows a typical micro-service architecture for modern web apps:
- **Frontend App**: Serves the React SPA.
- **Backend API**: FastAPI application handling REST endpoints.
- **Postgres Database**: Primary persistent storage.
- **Redis**: Used as a Celery broker and result backend.
- **Celery Worker**: Processes asynchronous background jobs.
- **Celery Beat**: Schedules periodic background jobs.

*See `docs/architecture.md` for more details on the planned SLA logic flow.*

## Prerequisites
- Docker Engine & Docker Compose
- Node.js (for local non-Docker frontend development)
- Python 3.12+ (for local non-Docker backend development)

## Environment Setup
1. Clone the repository: `git clone <repo-url>`
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Modify `.env` variables if necessary (the defaults work out-of-the-box for local Docker development).

## Running the Application
To start the entire environment via Docker Compose:
```bash
docker compose up --build -d
```

### Accessing the Services
- **Frontend URL**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### Stopping the Application
```bash
docker compose down
```
To remove volumes (this will erase your database!):
```bash
docker compose down -v
```

## Development Notes
- The database is persisted using Docker volumes (`postgres_data`).
- SLA warnings, breach detection, and ticket rules will be processed by Celery Beat schedules and Celery Workers. Currently, a dummy task is implemented to verify connectivity.
- Authentication (PyJWT, pwdlib) and role-based access control (RBAC) are pending implementation in subsequent phases.
