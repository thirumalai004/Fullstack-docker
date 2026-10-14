# Fullstack Docker Starter

React (Vite) + Node/Express + PostgreSQL. Everything runs in Docker; nothing else needs to be installed.

## Requirements
- Docker Desktop (or Docker Engine + Compose plugin)

## Development (hot reload)
```bash
docker compose up --build
```
- Frontend: http://localhost:3400
- Backend:  http://localhost:5400/api/health

Edit files in `frontend/src` or `backend/src` and changes reload automatically.

## Production-style
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
Open http://localhost:3500 (nginx serves the frontend and proxies `/api` to the backend).

## Useful commands
```bash
docker compose down                 # stop
docker compose down -v              # stop and delete the database volume
docker compose logs -f backend      # follow backend logs
docker compose exec backend sh      # shell inside the backend container
docker compose exec backend npm install some-package   # add a dependency
```

## Structure
```
.
├── docker-compose.yml        # dev
├── docker-compose.prod.yml   # production-style
├── .env                      # database credentials (change the password)
├── backend/                  # Express API
└── frontend/                 # React app (Vite)
```

## Notes
- Containers talk to each other by service name (`db`, `backend`), not `localhost`.
- The frontend calls `/api/...`; Vite (dev) or nginx (prod) forwards it to the backend.
- After adding packages in `package.json`, rebuild: `docker compose up --build`.
