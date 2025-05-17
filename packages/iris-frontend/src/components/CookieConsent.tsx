import { useEffect, useRef } from 'react';
import { Button } from 'iris-components';

import { useSelector } from 'react-redux';
import { useAppDispatch, type RootState } from '$state/store';
import { setCookies } from '$state/prefsSlice';

function CookieConsent() {
	const dispatch = useAppDispatch();
	const cookies = useSelector((state: RootState) => state.prefs.cookies);

	const channel = useRef<BroadcastChannel | null>(
		new BroadcastChannel('iris_cookies')
	);

	useEffect(() => {
		if (!channel.current)
			channel.current = new BroadcastChannel('iris_cookies');

		channel.current.addEventListener('message', (e) => {
			dispatch(setCookies(e.data));
		});

		return () => {
			channel.current?.close();
			channel.current = null;
		};
	}, [dispatch]);

	function userResponse(res: 'essential' | 'all') {
		dispatch(setCookies(res));
		channel.current?.postMessage(res);
	}

	return (
		cookies === 'consent' && (
			<section className="bg-iris-100 p-4" title="Cookie consent">
				<h3 className="my-0">Cookie consent</h3>
				<p className="mt-1 max-w-prose">
					Iris uses cookies to store your login state and provide insights to
					developers and instructors.
				</p>
				<div className="flex flex-wrap gap-2">
					<Button onPress={() => userResponse('all')}>Accept</Button>
					<Button onPress={() => userResponse('essential')}>
						Necessary cookies only
					</Button>
				</div>
			</section>
		)
	);
}

export default CookieConsent;
