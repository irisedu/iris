import { useEffect } from 'react';

export function Component() {
	useEffect(() => {
		document.title = 'Iris';
	}, []);

	return (
		<>
			<h1 className="mt-0">Welcome to Iris!</h1>
			<p>
				Iris is your no-nonsense, open-source content management system built
				for education.
			</p>

			<h2>For authors</h2>
			<p>
				To start creating Iris documents, download Iris Studio from{' '}
				<a
					href="https://github.com/irisedu/iris/releases"
					target="_blank"
					className="external"
				>
					the GitHub release page
				</a>
				.
			</p>
		</>
	);
}
