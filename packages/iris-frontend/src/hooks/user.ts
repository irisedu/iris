import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCsrf } from '../utils';

import { useAppDispatch } from '$state/store';
import { fetchUser } from '$state/userSlice';

export function useLogOut() {
	const dispatch = useAppDispatch();

	const cb = useCallback(async () => {
		await fetchCsrf('/auth/logout');
		dispatch(fetchUser());
	}, [dispatch]);

	return cb;
}

export function useConfirmFederation() {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const cb = useCallback(async () => {
		await fetchCsrf('/auth/confirm-federation');
		dispatch(fetchUser());
		return navigate('/');
	}, [dispatch, navigate]);

	return cb;
}
