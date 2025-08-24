# iris-backend

Business logic for Iris.

## Features

Much of Iris is modularized into features. If features are unavailable,
corresponding backend/frontend functionality is disabled.

Base configuration:

- `NODE_ENV`: `development` or `production`
- `FEATURES`: A comma-separated list of optional features to enable.
- `BASE_URL`: The base URL that Iris is hosted at.
- `TRUST_PROXY`: Set to `1` if the server is behind a reverse proxy.

Base dependencies:

- PostgreSQL
  - Note: All database tables will be created, even if the corresponding
    features are disabled.
  - Configuration:
    - `DATABASE_URL`: The database connection string.

Required features:

- Authentication (`auth`): User management, cookies, CSRF, SSO, etc.
  - Dependencies: Redis
  - Configuration:
    - `REDIS_URL`: The Redis connection string.
    - `AUTH_SESSION_PREFIX`: The prefix to use for the Redis session store.
    - `COOKIE_SECRET`: The secret for signing cookies.
    - `CSRF_SECRET`: The secret for CSRF.
    - `AUTH_GOOGLE_CLIENT_ID`: The client ID for Google SSO.
    - `AUTH_GOOGLE_CLIENT_SECRET`: The secret for Google SSO.

- Frontend (`spa`): Serving the corresponding single-page application
  (`iris-frontend`).
  - Configuration:
    - `SPA_ROOT`: Directory for the frontend build files.

Optional features:

- Content serving (`serve`): The ability to upload and serve documents and their
  assets
  - Dependencies: feature `judge` (if needed), `git`
  - Configuration:
    - `BUILD_ROOT`: Directory for git repositories of all projects. Defaults to
      a directory called `repo` in the current working directory.
    - `ASSETS_ROOT`: Directory for storing assets. Defaults to a directory
      called `assets` in the current working directory.

- Judge (`judge`): Judging students' question responses. Required for questions
  in documents to function.

- Large language models (`llm`): The ability to query LLMs from inside Iris
  documents.
  - Dependencies: feature `serve`, Ollama
  - Configuration:
    - `OLLAMA_HOST`: Ollama API URL.
    - `OLLAMA_MODEL`: Ollama model.
