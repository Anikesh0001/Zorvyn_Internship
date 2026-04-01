# LEDGR

**LEDGR** is a production-quality Finance Data Processing and Access Control backend system designed to manage and track financial transactions. It features a Brutalist "Dark Editorial" design inspired by Bloomberg Terminals.

## Project Overview

Built entirely on Python, Flask, and an embedded Vanilla JS single-page application, LEDGR implements secure Token Auth (JWT), robust Role-Based Access Control (RBAC), and pure stateless REST architecture.

### Tech Stack
* **Backend:** Python 3.10+, Flask (Blueprints), SQLite (via SQLAlchemy), Flask-JWT-Extended, Marshmallow
* **Frontend:** Pure HTML/CSS/Vanilla JS served statically
* **Aesthetic:** Dark Editorial - #0a0a0f backgrounds, acid-green highlights, JetBrains Mono typography.

## Screenshots

![Screenshot 1](screenshots/1.png)
![Screenshot 2](screenshots/2.png)
![Screenshot 3](screenshots/3.png)
![Screenshot 4](screenshots/4.png)
![Screenshot 5](screenshots/5.png)
![Screenshot 6](screenshots/6.png)

## Architecture

```
   [Browser (SPA)]
        | (Vanilla JS + fetch API + JWT)
        V
    [Flask App]
   /    |    \    \
Auth  Users Txns Dashboard   <-- [Blueprints with RBAC Decorator]
   \    |    /    /
   [SQLAlchemy]
        |
    [SQLite DB]
```

## Getting Started

### 1. Requirements
* Python 3.10 or higher.
* `venv` package.

### 2. Setup
```bash
# Clone the repository and navigate into the project
cd ledgr

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database
python seed.py

# Run the server
python run.py
```

Open your browser to `http://localhost:5001`.

## Default Credentials

Running `seed.py` creates the following accounts along with 50 randomized transactions:

| Role | Email | Password | Allowed Actions |
|---|---|---|---|
| Admin | admin@ledgr.dev | Admin@123 | Full access across all routes, user management. |
| Analyst | analyst@ledgr.dev | Analyst@123 | View transactions, full access to dashboard analytics. |
| Viewer | viewer@ledgr.dev | Viewer@123 | View transactions and recent activity dashboard. |

## Role Permission Matrix

| Endpoint | Method | Admin | Analyst | Viewer |
|---|---|---|---|---|
| `/api/transactions` | GET | ✅ | ✅ | ✅ |
| `/api/transactions/<id>` | GET | ✅ | ✅ | ✅ |
| `/api/transactions` | POST | ✅ | ❌ | ❌ |
| `/api/transactions/<id>` | PATCH/DELETE | ✅ | ❌ | ❌ |
| `/api/dashboard/recent` | GET | ✅ | ✅ | ✅ |
| `/api/dashboard/*` | GET | ✅ | ✅ | ❌ |
| `/api/users/*` | GET/PATCH/DELETE | ✅ | ❌ | ❌ |

## API Reference

* `POST /api/auth/register` - Create viewer account
* `POST /api/auth/login` - Returns JWT Access Token
* `GET /api/auth/me` - Validates and returns current user info

* `GET /api/transactions?page=1&per_page=20` - Paginated transaction history
* `POST /api/transactions` - Insert financial record
* `PATCH /api/transactions/<id>` - Update record
* `DELETE /api/transactions/<id>` - Soft delete record

* `GET /api/dashboard/summary` - Aggregated financial metrics
* `GET /api/dashboard/by-category` - Categorized aggregation
* `GET /api/dashboard/trends` - Rolling 6-month historical totals
* `GET /api/dashboard/recent` - Last 10 records

* `GET /api/users/` - List all users
* `PATCH /api/users/<id>` - Change role or active status
* `DELETE /api/users/<id>` - Deactivate user

## Design Decisions and Assumptions
* **Soft Delete:** Transactions are marked `is_deleted = True` instead of physical `DELETE`. The GET query filters these automatically.
* **Vanilla Architecture:** React/Vue were purposefully avoided in favor of raw DOM manipulation to provide an ultra-lightweight frontend matching the brutalist theme.
* **Pure CSS Charts:** Custom flexing/scaling divs serve as charts avoiding dependency bloat from Chart.js.

## Future Enhancements (Given more time)
* **Refresh Tokens:** Implement a secure cookie-based refresh token scheme.
* **Audit Logging:** Maintain a separate table logging every POST/PATCH/DELETE action.
* **Database Migration:** Replace SQLite with PostgreSQL for production workloads and concurrency handling.
* **Server-side Pagination Limits:** Enforce maximum `per_page` to prevent data denial of service.
