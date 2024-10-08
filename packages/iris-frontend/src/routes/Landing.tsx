import { useEffect } from 'react';

export function Component() {
	useEffect(() => {
		document.title = 'Iris';
	});

	return (
		<>
			<h1>Welcome to Iris!</h1>
			<p>
				Iris is your no-nonsense, open-source content management system built
				for education.
			</p>
		</>
	);
}
