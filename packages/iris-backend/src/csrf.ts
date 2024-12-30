import { doubleCsrf } from 'csrf-csrf';

export const {
	invalidCsrfTokenError,
	generateToken,
	validateRequest,
	doubleCsrfProtection
} = doubleCsrf({
	getSecret: () => process.env.CSRF_SECRET!,
	getSessionIdentifier: (req) => req.session?.id,
	cookieName:
		process.env.NODE_ENV !== 'development'
			? '__Host-iris.x-csrf-token'
			: 'iris.x-csrf-token',
	cookieOptions: {
		sameSite: 'lax',
		secure: process.env.NODE_ENV !== 'development',
		httpOnly: false
	},
	getTokenFromRequest: (req) =>
		req.headers['x-csrf-token'] ?? (req.query.state as string)
});
