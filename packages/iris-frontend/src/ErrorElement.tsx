import { useEffect } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

import Error from '~icons/tabler/mood-sad';
import Back from '~icons/tabler/arrow-left';

const messages: Record<number, string> = {
	404: 'Not Found'
};

function ErrorElement() {
	const error = useRouteError();
	const isRouteError = isRouteErrorResponse(error);

	const errorText = isRouteError
		? (messages[error.status] ?? 'Error')
		: 'Application Error';

	useEffect(() => {
		document.title = errorText + ' • Iris';
	}, [errorText]);

	return (
		<div className="font-sans text-iris-800 max-w-[55ch] mx-auto min-h-full">
			<h1 className="flex flex-row items-center justify-center gap-2">
				<Error className="inline w-8 h-8" />
				{errorText}
			</h1>

			{isRouteError ? (
				<>
					<p>Status: {error.status}</p>

					{error.data && <p>{error.data}</p>}

					<details className="w-full">
						<summary>Error details</summary>
						<pre className="text-wrap">{JSON.stringify(error)}</pre>
					</details>
				</>
			) : (
				<>
					<p>
						An unexpected error occurred. Report this to the system
						administrator if you think this is an issue.
					</p>

					<details className="w-full">
						<summary>Error details</summary>
						<pre className="text-wrap">{String(error)}</pre>
					</details>
				</>
			)}

			<Link
				to="/"
				className="mt-8 flex flex-row items-center gap-2 justify-center"
			>
				<Back className="w-4 h-4" />
				Back to Home
			</Link>
		</div>
	);
}

export default ErrorElement;
