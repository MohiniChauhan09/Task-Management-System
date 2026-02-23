# TaskFlow - Task Management Application

## Tech Stack Used
- Frontend: React (Vite), React Router
- Backend: Node.js, Express
- Database: PostgreSQL
- Authentication: JWT + bcrypt

## Steps To Run The Project Locally
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd Task_Management_System
   ```

2. Create a PostgreSQL database (example name: `task_management`).

3. Run SQL schema from `backend/database/schema.sql` in your PostgreSQL database.
   - You can use pgAdmin Query Tool or `psql`.

4. Set backend environment variables.
   - Create `backend/.env` and add:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/task_management
   JWT_SECRET=your_strong_secret
   JWT_EXPIRES_IN=1d
   RESET_TOKEN_EXPIRES_MINUTES=15
   CLIENT_ORIGIN=http://localhost:5173
   NODE_ENV=development
   ```

5. Set frontend environment variables.
   - Create `frontend/.env` and add:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

6. Install and run backend (Terminal 1):
   ```bash
   cd backend
   npm install
   npm run dev
   ```

7. Install and run frontend (Terminal 2):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

8. Open the app in browser:
   - `http://localhost:5173`

## Assumptions Or Limitations
- PostgreSQL must be running and accessible using `DATABASE_URL`.
- SMTP/email sending is not implemented for forgot-password emails.
- In non-production mode, forgot-password may return a reset token for testing.
- Single user role flow.

## Bonus Features (If Any)
- JWT-based authentication (register/login)
- Forgot password endpoint
- Reset password with hashed token + expiry + one-time use
- Task filter by status (`Pending`, `Completed`)
- Delete task endpoint
