# https://pnpm.io/docker
FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY . /iris

# Dummy config (doesn't matter for FE/BE)
RUN cp /iris/packages/patchouli/src/distConfig.example.json /iris/packages/patchouli/src/distConfig.json

##################
# Frontend build #
##################

FROM base AS frontend-build

WORKDIR /iris/packages/iris-frontend

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter iris-frontend... install --frozen-lockfile
RUN pnpm run build

# Output: /iris/packages/iris-frontend/dist

#################
# Backend build #
#################

FROM base AS backend-build

WORKDIR /iris/packages/iris-backend

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter iris-backend... install --frozen-lockfile
RUN pnpm run build

# Output: /iris/packages/iris-backend/out

###################################
# Backend production dependencies #
###################################

FROM base AS backend-prod-deps

WORKDIR /iris/packages/iris-backend

# FIXME: ignore scripts bypasses schema prepare step to avoid running tsc
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter iris-backend... install --prod --frozen-lockfile --ignore-scripts

# Output: /iris/node_modules

################
# Final output #
################

FROM base AS backend

WORKDIR /iris/packages/iris-backend

COPY --from=backend-prod-deps /iris/node_modules /iris/node_modules

COPY --from=backend-build /iris/packages/iris-backend/out ./out
COPY --from=frontend-build /iris/packages/iris-frontend/dist ./spa

CMD ["pnpm", "start"]
