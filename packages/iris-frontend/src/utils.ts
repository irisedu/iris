import Cookie from 'js-cookie';

export function goToAnchor(anchor: string) {
	window.history.pushState(null, '', `#${anchor}`);

	const elem = document.getElementById(anchor);
	if (elem) {
		elem.scrollIntoView();
	}
}

function getCsrf() {
	return (
		(import.meta.env.PROD
			? Cookie.get('__Host-iris.x-csrf-token')
			: Cookie.get('iris.x-csrf-token')) ?? ''
	).split('|')[0];
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
