import { useEffect, useState, useRef } from 'react';
import { useRevalidator, useLoaderData } from 'react-router-dom';
import useAuthorization from '$hooks/useAuthorization';
import { Button, Form, Input, DeleteDialog } from 'iris-components';
import { fetchCsrf } from '../utils';

export function loader() {
	return fetch('/api/author/projects');
}

export function Component() {
	useAuthorization({ required: true, group: 'cms:authors' });

	useEffect(() => {
		document.title = 'Author Dashboard • Iris';
	}, []);

	const revalidator = useRevalidator();
	const projects = useLoaderData() as string[];

	const [deleteOpen, setDeleteOpen] = useState(false);
	const deleteCb = useRef<(() => void) | null>(null);
	const [deleteTarget, setDeleteTarget] = useState('');

	return (
		<>
			<h1 className="mt-0">Author Dashboard</h1>

			<DeleteDialog
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				callbackRef={deleteCb}
			>
				<code>{deleteTarget}</code> and all associated assets, submissions, etc.
				will be deleted permanently.
			</DeleteDialog>

			<h2>Your projects</h2>
			<ul>
				{projects.map((project) => (
					<li key={project}>
						<div>
							<code>{project}</code>
						</div>
						<div className="flex gap-2">
							<Button
								onPress={() => {
									setDeleteTarget(project);
									deleteCb.current = () => {
										fetchCsrf(`/api/author/projects/${project}`, {
											method: 'DELETE'
										}).then(() => revalidator.revalidate());
									};

									setDeleteOpen(true);
								}}
							>
								Delete
							</Button>
						</div>
					</li>
				))}
			</ul>

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

					fetchCsrf('/api/author/projects/upload', {
						body: formData
					}).then(() => {
						form.reset();
						revalidator.revalidate();
					});
				}}
			>
				<Input name="file" type="file" accept={'application/zip'} required />
				<Button type="submit">Submit</Button>
			</Form>
		</>
	);
}
