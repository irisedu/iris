import useAuthorization from '$hooks/useAuthorization';
import { useEffect } from 'react';

export function Component() {
	const user = useAuthorization({ unauthenticated: true });

	useEffect(() => {
		document.title = 'Login • Iris';
		if (user && user.type === 'loggedOut')
			window.location.replace('/auth/cas/ucsb/login');
	}, [user]);

	return <h1 className="mt-0 text-center">Redirecting...</h1>;
}
