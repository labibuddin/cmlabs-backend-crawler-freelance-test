# Crawler Backend API

This is the backend engine for the Crawler Web application. It utilizes Express.js and Playwright to natively render server-side, single-page (SPA), and progressive web applications (PWA). 

## Prerequisites
- **Node.js**: v18+ recommended
- **pnpm**: Fast package manager

## Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Install Playwright Browsers**
   Playwright requires system browsers to execute crawlings properly.
   ```bash
   npx playwright install
   ```
   *(If prompted that system dependencies are missing, run `sudo npx playwright install-deps` as instructed by the terminal).*

3. **Environment Setup**
   Ensure you have a `.env` file in this `/backend` directory.
   ```bash
   PORT=3001
   OUTPUT_DIR=./output
   ```

## Development Server

Launch the backend with hot-reload enabled via `ts-node-dev`:
```bash
pnpm dev
```
The server will be available at `http://localhost:3001`.

## Swagger Documentation

This backend is fully documented via **Swagger**. 

To view the interactive API documentation:
1. Ensure the backend server is running (`pnpm dev`).
2. Open your browser and navigate to:
   👉 **http://localhost:3001/api/docs**

All endpoints, payload schemas, and possible responses are detailed there. You can even execute requests directly from the Swagger UI.

*Note: The Swagger configuration reads JSDoc directly from the `src/routes/` files via `swagger-jsdoc`.*
