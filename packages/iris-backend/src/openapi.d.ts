export interface paths {
    "/api": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * [DEV] Get OpenAPI description
         * @description Get the OpenAPI description for this API. Available only in development.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/features": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get supported features
         * @description Get a list of Iris features supported by the backend.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": string[];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/info": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Current user information
         * @description Get information about the currently logged-in user.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UserInfoResult"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        LoggedOutSessionData: {
            /**
             * @description Indicates the user is logged out.
             * @constant
             */
            type: "loggedOut";
        };
        PendingFederationSessionData: {
            /**
             * @description Indicates the user is pending federation (i.e., has not finalized account creation/SSO connection).
             * @constant
             */
            type: "pendingFederation";
            /** @description Machine-readable authentication provider name. */
            provider: string;
            /** @description Human-readable authentication provider name. */
            providerName: string;
            /** @description The user's data. */
            data: {
                /** @description The UUID of the existing user account, if any. */
                existingAccount?: string;
                /** @description The ID of the user provided by the external auth provider. */
                id: string;
                /** @description The email of the user provided by the external auth provider. */
                email: string;
                /** @description The full name of the user provided by the external auth provider, if available. */
                name?: string;
            };
        };
        RegisteredSessionData: {
            /**
             * @description Indicates the user is logged in and registered.
             * @constant
             */
            type: "registered";
            /** @description The user's data. */
            data: {
                /** @description UUID assigned to the user. */
                id: string;
                /** @description The user's email. */
                email: string;
                /** @description The user's full name, if available. */
                name: string | null;
            };
            /** @description A list of the groups the user is part of. */
            groups: string[];
        };
        /** @description Result of the /auth/info endpoint. */
        UserInfoResult: components["schemas"]["LoggedOutSessionData"] | components["schemas"]["PendingFederationSessionData"] | components["schemas"]["RegisteredSessionData"];
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
