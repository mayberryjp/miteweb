# Mite Frontend (miteweb)

Vue 3 frontend for Mite, a lightweight syslog monitoring and alerting application.

## Prerequisites

- Node.js (latest LTS version recommended)

## Setup

1. Install dependencies:
```
npm install
```

2. Run development server:
```
npm run dev
```
The application will be available at http://localhost:3030

## Build for Production

```
npm run build
```

## Docker

Build and run with Docker:
```
docker build -t mite-frontend .
docker run -p 8088:80 mite-frontend
```

Or use docker-compose:
```
docker compose up -d
```

## Configuration

Copy `.env.example` to `.env` for local development:
```
VITE_API_BASE_URL=http://localhost:8080/api
```

## Technologies

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Axios
