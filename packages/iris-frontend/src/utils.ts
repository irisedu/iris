import Cookie from 'js-cookie';

function getCsrf() {
	return (
		(import.meta.env.PROD
			? Cookie.get('__Host-iris.x-csrf-token')
			: Cookie.get('iris.x-csrf-token')) ?? ''
	);
}

export function fetchCsrf(route: string, init?: RequestInit) {
	return fetch(route, {
		method: 'POST',
		...init,
		headers: {
			'x-csrf-token': getCsrf() ?? '',
			...init?.headers
		}
	});
}
