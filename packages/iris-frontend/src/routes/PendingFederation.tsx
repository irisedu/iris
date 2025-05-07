import { useEffect } from 'react';
import { useConfirmFederation, useLogOut } from '$hooks/user';
import { Button } from 'iris-components';
import useAuthorization from '$hooks/useAuthorization';
import iris from '$assets/iris.svg';

import Google from '~icons/tabler/brand-google-filled';
import CAS from '~icons/tabler/user-circle';
import Right from '~icons/tabler/arrow-right';

function ProviderIcon({ provider }: { provider: string }) {
	switch (provider) {
		case 'google':
			return <Google className="w-8 h-8 text-iris-700" />;
		case 'cas:ucsb':
			return <CAS className="w-8 h-8 text-iris-700" />;
	}
}

export function Component() {
	const user = useAuthorization({ required: true });
	const logOut = useLogOut();
	const confirmFederation = useConfirmFederation();

	const prompt =
		user?.type === 'pendingFederation' && user?.data.existingAccount
			? 'Link accounts?'
			: 'Create an account?';

	useEffect(() => {
		document.title = prompt + ' • Iris';
	}, [user, prompt]);

	return (
		user?.type === 'pendingFederation' && (
			<div className="flex flex-col gap-2 max-w-[50ch] mx-auto">
				<h1 className="mt-0 text-center">{prompt}</h1>
				<div className="flex flex-row gap-3 items-center justify-center">
					<ProviderIcon provider={user.provider} />
					<Right className="w-6 h-6 text-iris-500" />
					<img src={iris} className="w-10 h-10 -ml-1" />
				</div>

				{user.data.existingAccount ? (
					<p>
						You are linking your {user.providerName} account with your existing
						Iris account with email <strong>{user.data.email}</strong>. Do you
						want to continue?
					</p>
				) : (
					<p>
						You are about to create a new Iris account using your{' '}
						{user.providerName} account with email{' '}
						<strong>{user.data.email}</strong>. Do you want to continue?
					</p>
				)}

				<div className="flex flex-row gap-2">
					<Button
						className="react-aria-Button grow border-zinc-300 bg-zinc-100"
						onPress={logOut}
					>
						Cancel
					</Button>
					<Button
						className="react-aria-Button grow border-iris-400 bg-iris-200"
						onPress={confirmFederation}
						autoFocus
					>
						Continue
					</Button>
				</div>
			</div>
		)
	);
}
