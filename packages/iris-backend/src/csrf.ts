import { doubleCsrf } from 'csrf-csrf';

export const {
	invalidCsrfTokenError,
	generateCsrfToken,
	validateRequest,
	doubleCsrfProtection
} = doubleCsrf({
	getSecret: () => process.env.CSRF_SECRET!,
	getSessionIdentifier: (req) =>
		req.session?.id ?? console.log('YOURE IN TROUBLE'),
	cookieName:
		process.env.NODE_ENV !== 'development'
			? '__Host-iris.x-csrf-token'
			: 'iris.x-csrf-token',
	cookieOptions: {
		sameSite: 'lax',
		secure: process.env.NODE_ENV !== 'development',
		httpOnly: false
	},
	getCsrfTokenFromRequest: (req) =>
		req.headers['x-csrf-token'] ?? (req.query.state as string)
});
