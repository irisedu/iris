import { useEffect } from 'react';

export function Component() {
	useEffect(() => {
		document.title = 'Iris';
	});

	return (
		<>
			<h1>Heading 1</h1>
			<p>Prose text</p>

			<h2>Heading 2</h2>
			<p>Prose text</p>

			<h3>Heading 3</h3>
			<p>Prose text</p>

			<h4>Heading 4</h4>
			<p>Prose text</p>

			<h5>Heading 5</h5>
			<p>Prose text</p>

			<h6>Heading 6</h6>
			<p>Prose text</p>
		</>
	);
}
