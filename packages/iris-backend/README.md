# iris-backend

Business logic for Iris.

## Environment variables

- `NODE_ENV`: `development` or `production`
- `DATABASE_URL`: The database connection string. PostgreSQL is expected.
- `REDIS_URL`: The Redis connection string.
- `COOKIE_SECRET`: The secret for signing cookies.
- `CSRF_SECRET`: The secret for CSRF.
- `AUTH_SESSION_PREFIX`: The prefix to use for the Redis session store.
- `AUTH_GOOGLE_CLIENT_ID`: The client ID for Google SSO.
- `AUTH_GOOGLE_CLIENT_SECRET`: The secret for Google SSO.
- `AUTH_GOOGLE_REDIRECT_URL`: The redirect URL for Google SSO.

- `BUILD_ROOT`: Directory for git repositories of all projects.
- `ASSETS_ROOT`: Directory for storing assets.
- `SPA_ROOT`: Directory for the frontend build files.
