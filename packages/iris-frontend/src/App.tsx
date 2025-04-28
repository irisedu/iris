import { useState, useEffect } from 'react';
import {
	createRoutesFromElements,
	createBrowserRouter,
	Route,
	RouterProvider
} from 'react-router-dom';
import Layout from './Layout';
import ErrorElement from './ErrorElement';

import { useSelector } from 'react-redux';
import { useAppDispatch, type RootState } from '$state/store';
import { setDevState, devRefresh } from '$state/devSlice';
import { fetchUser } from '$state/userSlice';

const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route
				path="/"
				element={<Layout />}
				errorElement={
					<Layout>
						<ErrorElement />
					</Layout>
				}
			>
				<Route index lazy={() => import('./routes/Landing')} />

				<Route path="/login" lazy={() => import('./routes/Login')} />
				<Route
					path="/login/pending-federation"
					lazy={() => import('./routes/PendingFederation')}
				/>

				<Route path="/catalog" lazy={() => import('./routes/Catalog')} />
				<Route path="/page/*" lazy={() => import('./routes/Article')} />

				<Route
					path="/author-dashboard"
					lazy={() => import('./routes/AuthorDashboard')}
				/>
			</Route>

			<Route path="/poster" lazy={() => import('./routes/Poster')} />
			<Route
				path="/card-dyslexia"
				lazy={() => import('./routes/CardDyslexia')}
			/>
		</>
	)
);

function App() {
	const dispatch = useAppDispatch();
	const devEnabled = useSelector((state: RootState) => state.dev.enabled);
	const devHost = useSelector((state: RootState) => state.dev.host);
	useSelector((state: RootState) => state.dev.refresh);

	const [devRetry, setDevRetry] = useState(0);

	useEffect(() => {
		if (!devEnabled) {
			return;
		}

		const ws = new WebSocket(`ws://${devHost}/`);
		dispatch(setDevState('connecting'));
		let errored = false;
		let deinit = false;

		ws.addEventListener('error', (e) => {
			dispatch(setDevState('error'));
			console.log('WebSocket error: ', e);
			errored = true;
		});

		ws.addEventListener('open', () => {
			dispatch(setDevState('connected'));
		});

		ws.addEventListener('close', () => {
			if (!errored) {
				dispatch(setDevState('disconnected'));
			}

			if (!deinit && devRetry < 10) {
				setTimeout(() => {
					setDevRetry((r) => r + 1);
				}, 3000);
			}
		});

		ws.addEventListener('message', (e) => {
			const data = JSON.parse(e.data);
			if (data.event === 'reload') {
				// Trigger a full rerender
				dispatch(devRefresh());
			}
		});

		return () => {
			deinit = true;
			ws.close();
		};
	}, [dispatch, devHost, devEnabled, devRetry]);

	useEffect(() => {
		dispatch(fetchUser());
	}, [dispatch]);

	return <RouterProvider router={router} />;
}

export default App;
