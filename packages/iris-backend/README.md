# iris-backend

Business logic for Iris.

## Environment variables

- `NODE_ENV`: `development` or `production`
- `TRUST_PROXY`: Set to `1` if the server is behind a reverse proxy.
- `DATABASE_URL`: The database connection string. PostgreSQL is expected.
- `REDIS_URL`: The Redis connection string.
- `COOKIE_SECRET`: The secret for signing cookies.
- `CSRF_SECRET`: The secret for CSRF.
- `AUTH_SESSION_PREFIX`: The prefix to use for the Redis session store.
- `AUTH_GOOGLE_CLIENT_ID`: The client ID for Google SSO.
- `AUTH_GOOGLE_CLIENT_SECRET`: The secret for Google SSO.
- `AUTH_GOOGLE_REDIRECT_URL`: The redirect URL for Google SSO.
- `AUTH_TICKET_AUTH_URL`: URL to redirect to for ticket SSO.
- `AUTH_TICKET_SERVICE_ID`: Service ID for ticket SSO.
- `AUTH_TICKET_REDIRECT_URL`: The callback URL for ticket SSO.
- `AUTH_TICKET_VALIDATE_URL`: The validation URL for ticket SSO.
- `OLLAMA_HOST`: Ollama API URL.
- `OLLAMA_MODEL`: Ollama model.

- `BUILD_ROOT`: Directory for git repositories of all projects.
- `ASSETS_ROOT`: Directory for storing assets.
- `SPA_ROOT`: Directory for the frontend build files.
