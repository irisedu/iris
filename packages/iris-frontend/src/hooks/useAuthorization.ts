import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';
import { useLocation, useNavigate } from 'react-router-dom';

export default function useAuthorization({
	required,
	unauthenticated,
	group
}: {
	required?: boolean;
	unauthenticated?: boolean;
	group?: string;
}) {
	const location = useLocation();
	const navigate = useNavigate();
	const user = useSelector((state: RootState) => state.user.user);

	useEffect(() => {
		if (!user) return;

		function redirect(loc: string) {
			if (location.pathname !== loc) navigate(loc);
		}

		if (
			user.type === 'loggedOut' ||
			(group && user.type === 'registered' && !user.groups.includes(group))
		) {
			if (required) redirect('/');
		} else if (user.type === 'pendingFederation') {
			redirect('/login/pending-federation');
		} else if (user.type === 'registered') {
			if (unauthenticated) redirect('/');
		}
	}, [user, location.pathname, navigate, required, unauthenticated, group]);

	return user;
}
