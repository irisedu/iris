import { Link, Outlet } from 'react-router-dom';
import { Link as AriaLink } from 'react-aria-components';
import DevAlert from '$components/DevAlert';

import { useSelector } from 'react-redux';
import { useAppDispatch, type RootState } from '$state/store';
import { setDevEnabled } from '$state/devSlice';

import Git from '~icons/tabler/brand-git';
import React from '~icons/tabler/brand-react';
import Braces from '~icons/tabler/braces';
import Heart from '~icons/tabler/heart-filled';
import irisWord from '$assets/iris-word.svg';
import irisFlower from '$assets/iris.svg';

function Layout() {
	const dispatch = useAppDispatch();
	const devEnabled = useSelector((state: RootState) => state.dev.enabled);

	return (
		<div className="relative flex flex-col bg-iris-50 min-h-screen">
			<div className="h-1 w-screen bg-iris-600" />

			<nav className="flex flex-col items-center md:flex-row">
				<Link to="/" className="h-12">
					<img src={irisWord} alt="Iris logo" className="h-full" />
				</Link>

				<div className="flex flex-row max-md:justify-center max-md:flex-wrap gap-4 items-center mx-4 mt-2 grow">
					<Link to="/catalog">Catalog</Link>
				</div>
			</nav>

			<DevAlert className="m-4" />

			<div className="grow p-8">
				<Outlet />
			</div>

			<footer className="relative pt-8 pb-4 bg-iris-200">
				<div className="absolute -top-5 h-10 w-full flex flex-row items-center">
					<div className="grow h-1 bg-iris-600" />
					<img
						src={irisFlower}
						alt="Iris flower"
						className="h-full bg-white rounded-full shadow-md"
					/>
					<div className="grow h-1 bg-iris-600" />
				</div>

				<div className="flex flex-col items-center">
					<span>
						<span className="font-bold text-xl">Iris</span> •{' '}
						<AriaLink
							className="font-sans external"
							href="https://cs.ucsb.edu/"
							target="_blank"
						>
							CS @ UCSB
						</AriaLink>
					</span>
					<p className="text-sm text-center my-1">
						Please report accessibility issues or other complaints by emailing{' '}
						<AriaLink
							href="mailto:contact@seki.pw"
							className="external"
							target="_blank"
						>
							contact@seki.pw
						</AriaLink>
						.
					</p>

					<div className="flex flex-row flex-wrap items-center gap-1">
						<AriaLink
							href="https://github.com/irisedu/iris"
							aria-label="GitHub"
						>
							<Git className="w-5 h-5" />
						</AriaLink>
						<AriaLink href="https://react.dev/" aria-label="React">
							<React className="w-5 h-5" />
						</AriaLink>
						<AriaLink
							aria-label="Preview mode"
							onPress={() => dispatch(setDevEnabled(!devEnabled))}
						>
							<Braces className="w-5 h-5" />
						</AriaLink>
						<Heart className="w-5 h-5 text-iris-900" />
					</div>

					<span className="text-xs mt-2 text-gray-700">v{__APP_VERSION__}</span>
				</div>
			</footer>
		</div>
	);
}

export default Layout;
