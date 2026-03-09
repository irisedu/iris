import { useCallback, useRef, useState } from 'react';
import {
	Button,
	Dialog,
	Form,
	Heading,
	Input,
	Modal,
	TextField
} from 'iris-components';
import { fetchCsrf } from '../../utils';

export default function Templates({
	currentWorkspace,
	templates,
	onRevalidate
}: {
	currentWorkspace: string;
	templates: { id: string; workspace_id: string; name: string; hash: string }[];
	onRevalidate: () => void;
}) {
	const [createName, setCreateName] = useState('');

	const createTemplate = useCallback(
		(wid: string, name: string) => {
			fetchCsrf(`/api/repo/workspaces/${wid}/templates/new`, {
				body: JSON.stringify({ name }),
				headers: {
					'Content-Type': 'application/json'
				}
			}).then(() => {
				onRevalidate();
			});
		},
		[onRevalidate]
	);

	const [updateOpen, setUpdateOpen] = useState(false);
	const updateWorkspaceId = useRef('');
	const updateTemplateId = useRef('');

	return (
		<>
			<Modal isDismissable isOpen={updateOpen} onOpenChange={setUpdateOpen}>
				<Dialog>
					<Heading slot="title">Update template</Heading>
				</Dialog>

				<Form
					onSubmit={(e) => {
						e.preventDefault();

						const form = e.currentTarget;
						const formData = new FormData(form);

						fetchCsrf(
							`/api/repo/workspaces/${updateWorkspaceId.current}/templates/${updateTemplateId.current}/upload`,
							{
								body: formData
							}
						).then(() => {
							form.reset();
							onRevalidate();
							setUpdateOpen(false);
						});
					}}
				>
					<Input name="file" type="file" accept={'application/zip'} required />
					<Button type="submit">Update Template</Button>
				</Form>
			</Modal>

			<div className="flex flex-wrap gap-2 mb-3">
				<TextField
					value={createName}
					onChange={setCreateName}
					className="react-aria-TextField m-0 max-w-full"
				>
					<Input placeholder="Template Name" />
				</TextField>

				<Button
					onPress={() => {
						if (!currentWorkspace.length || !createName.length) return;
						createTemplate(currentWorkspace, createName);
					}}
				>
					New Template
				</Button>
			</div>

			<table className="w-full hyphens-none">
				<thead>
					<tr>
						<th className="text-left">Name</th>
						<th className="text-left">Status</th>
						<th className="text-left">Operation</th>
					</tr>
				</thead>
				<tbody>
					{templates
						.filter((template) => template.workspace_id === currentWorkspace)
						.map((template) => (
							<tr key={template.id}>
								<td>{template.name}</td>
								<td>
									{template.hash ? (
										'Uploaded'
									) : (
										<strong>Not yet uploaded</strong>
									)}
								</td>
								<td className="flex flex-wrap gap-1">
									<Button
										className="react-aria-Button p-0 px-1"
										onPress={() => {
											window.location.href = `/api/repo/workspaces/${template.workspace_id}/templates/${template.id}/download`;
										}}
										isDisabled={!template.hash}
									>
										Download
									</Button>
									<Button
										className="react-aria-Button p-0 px-1"
										onPress={() => {
											updateWorkspaceId.current = template.workspace_id;
											updateTemplateId.current = template.id;
											setUpdateOpen(true);
										}}
									>
										Upload
									</Button>
								</td>
							</tr>
						))}
				</tbody>
			</table>
		</>
	);
}
