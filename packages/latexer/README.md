# Latexer

Worker for building LaTeX and Iris projects.

No authentication is provided. This service should not be deployed on an exposed
port.

Environment variables:

- `PORT`: Port to listen on. Default is 58060.
- `BUILD_DIR`: Working directory for builds. Does not need to be shared between
  deployments. Default is `%TEMP%/latexer`. This directory is managed solely by
  the service and should not be modified externally.

Runtime dependencies:

- LaTeX environment, e.g., by TeX Live. In production, recommended to use a full
  installation.
- `pdftocairo`, provided by [Poppler utils](https://poppler.freedesktop.org/).
