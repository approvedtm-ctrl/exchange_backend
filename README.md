# Exchange Backend

A Node.js backend using MVC architecture for the Exchange platform.

## Features
- MVC (Model-View-Controller) architecture.
- MySQL integration with connection pooling.
- RESTful API endpoints.
- Environment variable configuration.

## Folder Structure
- `config/`: Database connection setup.
- `controllers/`: Request handling logic.
- `models/`: Database interaction logic.
- `routes/`: API endpoint definitions.
- `middleware/`: Custom middleware.
- `server.js`: entry point.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server

### Installation
1. Clone the repository.
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
1. Create a `.env` file in the `backend` root (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Update the `.env` file with your database credentials.

### Running the Server
- **Production mode**:
  ```bash
  npm start
  ```
- **Development mode** (with nodemon):
  ```bash
  npm run dev
  ```

## API Endpoints
- `GET /api/users`: Get all users.
- `GET /api/users/:id`: Get a user by ID.
- `POST /api/users`: Create a new user.
