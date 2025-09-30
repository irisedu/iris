# iris-backend

Business logic for Iris.

## Features

Much of Iris is modularized into features. If features are unavailable,
corresponding backend/frontend functionality is disabled.

Base configuration:

- `NODE_ENV`: `development` or `production`
- `FEATURES`: A comma-separated list of optional features to enable.
- `BASE_URL`: The base URL that Iris is hosted at. Used for:
  - Generating request URIs
  - Setting S3 CORS rules
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

- Object storage (`obj`): S3-compatible file storage.
  - Configuration: [see AWS
    documentation](https://docs.aws.amazon.com/sdkref/latest/guide/feature-static-credentials.html).
    - `AWS_ENDPOINT_URL`: S3-like storage base URL.
    - `AWS_ACCESS_KEY`: S3-like storage access key ID.
    - `AWS_SECRET_ACCESS_KEY`: S3-like storage access key.
    - `AWS_REGION`: S3-like storage region.
    - `AWS_FORCE_PATH_STYLE`: If set to `1`, forces path-style rather than
      subdomain-style access.

- Content serving (`serve`): The ability to upload and serve documents and their
  assets
  - Dependencies: feature `obj`, feature `judge` (if needed)
  - Configuration:
    - `S3_REPO_BUCKET`: S3-like bucket to use for unbuilt storing project files.
    - `S3_CONTENT_BUCKET`: S3-like bucket to use for storing published contents.

- Judge (`judge`): Judging students' question responses. Required for questions
  in documents to function.

- Large language models (`llm`): The ability to query LLMs from inside Iris
  documents.
  - Dependencies: feature `serve`, Ollama
  - Configuration:
    - `OLLAMA_HOST`: Ollama API URL.
    - `OLLAMA_MODEL`: Ollama model.
