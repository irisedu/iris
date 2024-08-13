import type { ReactNode } from 'react';
import { Button, MenuTrigger, Popover, Menu } from 'react-aria-components';
import irisLogo from '$assets/iris-mono.svg';

import { useSelector } from 'react-redux';
import { useAppDispatch, type RootState } from '$state/store';
import { setDarkTheme } from '$state/appSlice.js';

import X from '~icons/tabler/x';
import ArrowsDiagonal from '~icons/tabler/arrows-diagonal';
import Sun from '~icons/tabler/sun-filled';
import Moon from '~icons/tabler/moon-filled';

function DarkToggle() {
	const dispatch = useAppDispatch();
	const dark = useSelector((state: RootState) => state.app.darkTheme);

	return (
		<Button
			className="round-button"
			onPress={() => dispatch(setDarkTheme(!dark))}
			aria-label="Toggle dark mode"
		>
			{dark ? (
				<Sun className="text-iris-400 w-3/5 h-3/5 m-auto" />
			) : (
				<Moon className="text-iris-400 w-3/5 h-3/5 m-auto" />
			)}
		</Button>
	);
}

interface TopBarProps {
	menuItems: ReactNode;
	children: ReactNode;
}

function TopBar({ menuItems, children }: TopBarProps) {
	return (
		<div className="flex bg-iris-100 flex-row gap-4 items-center h-14 w-full px-2 border-b-2 border-iris-200 drag-region flex-no-shrink">
			<MenuTrigger>
				<Button className="round-button" aria-label="Iris Studio menu">
					<img
						src={irisLogo}
						alt="Iris logo"
						className="w-full h-full brightness-75 dark:brightness-150"
					/>
				</Button>

				<Popover>
					<Menu>{menuItems}</Menu>
				</Popover>
			</MenuTrigger>

			{children}

			<DarkToggle />

			{os.platform !== 'darwin' && (
				<div className="flex flex-row gap-1">
					<Button
						className="round-button"
						onPress={() => win.minimize()}
						aria-label="Minimize"
					>
						<div className="border-iris-400 w-1/3 h-1/3 m-auto border-b-2" />
					</Button>

					<Button
						className="round-button"
						onPress={() => win.toggleMaximize()}
						aria-label="Maximize"
					>
						<ArrowsDiagonal className="text-iris-400 w-3/5 h-3/5 m-auto" />
					</Button>

					<Button
						className="round-button"
						onPress={() => win.close()}
						aria-label="Close"
					>
						<X className="text-iris-400 w-3/5 h-3/5 m-auto" />
					</Button>
				</div>
			)}
		</div>
	);
}

export default TopBar;
