# TimeTracking System

A simple and efficient time tracking application for employees and admins.

## Prerequisites

- Node.js (v16 or higher)
- npm (Node Package Manager)

## Setup

1.  **Install Dependencies**
    You need to install dependencies for both the server and the client.

    ```bash
    # Install server dependencies
    cd server
    npm install

    # Install client dependencies
    cd ../client
    npm install
    ```

## Running the Application

You need to run both the backend server and the frontend client simultaneously.

### 1. Start the Server

Open a terminal and run:

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3001`.

### 2. Start the Client

Open a **new** terminal window and run:

```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173`.

## Usage

-   **Admin Dashboard**: Manage employees, tasks, shifts, and view reports.
-   **Employee Dashboard**: Clock in/out and view personal shift history.
