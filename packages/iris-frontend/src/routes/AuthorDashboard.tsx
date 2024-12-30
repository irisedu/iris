import { useEffect } from 'react';
import useAuthorization from '$hooks/useAuthorization';
import { Button, Form, Input } from 'iris-components';
import { fetchCsrf } from '../utils';

export function Component() {
	useAuthorization({ required: true, group: 'authors' });

	useEffect(() => {
		document.title = 'Author Dashboard • Iris';
	}, []);

	return (
		<>
			<h1 className="mt-0">Author Dashboard</h1>

			<h2>Upload a project</h2>
			<p>
				Upload a <code>.zip</code> file containing your project directory,
				including its <code>build</code> folder.
			</p>

			<Form
				className="react-aria-Form font-sans"
				onSubmit={(e) => {
					e.preventDefault();

					const form = e.currentTarget;
					const formData = new FormData(form);

					fetchCsrf('/api/author/upload', {
						body: formData
					}).then(() => {
						form.reset();
					});
				}}
			>
				<Input name="file" type="file" accept={'application/zip'} required />
				<Button
					className="react-aria-Button bg-iris-200 border-iris-400"
					type="submit"
				>
					Submit
				</Button>
			</Form>
		</>
	);
}
