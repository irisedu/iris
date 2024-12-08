import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '$state/store';
import { fetchUser } from '$state/userSlice';

export function useLogOut() {
	const dispatch = useAppDispatch();

	const cb = useCallback(async () => {
		await fetch('/auth/logout', { method: 'POST' });
		dispatch(fetchUser());
	}, [dispatch]);

	return cb;
}

export function useConfirmFederation() {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const cb = useCallback(async () => {
		await fetch('/auth/confirm-federation', { method: 'POST' });
		dispatch(fetchUser());
		return navigate('/');
	}, [dispatch, navigate]);

	return cb;
}
