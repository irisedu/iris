import { useEffect } from 'react';
import {
	type LoaderFunctionArgs,
	useLoaderData,
	useRevalidator
} from 'react-router-dom';

export async function loader({ params }: LoaderFunctionArgs) {
	const { wid, wsid } = params;

	const out: {
		workspaces?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
		templates?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
		worksheetData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
	} = {};

	out.workspaces = await fetch('/api/repo/workspaces', {
		cache: 'no-store'
	}).then((res) => res.json());

	out.templates = await fetch('/api/repo/workspaces/all/templates', {
		cache: 'no-store'
	}).then((res) => res.json());

	out.worksheetData = await fetch(
		`/api/repo/workspaces/${wid}/worksheets/${wsid}/revs/latest`,
		{
			cache: 'no-store'
		}
	).then((res) => res.json());

	return out;
}

export function Component() {
	const { workspaces, templates, worksheetData } = useLoaderData();
	const revalidator = useRevalidator();

	useEffect(() => {
		document.title = `Worksheet #${worksheetData.num} — ${worksheetData.name} • Iris`;
	}, [worksheetData.num, worksheetData.name]);

	return (
		<>
			<h1 className="mt-0">
				Worksheet {worksheetData.num} — {worksheetData.name}
			</h1>
		</>
	);
}
