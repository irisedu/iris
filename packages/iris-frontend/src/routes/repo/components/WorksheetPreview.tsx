import { useEffect, useState } from 'react';
import { Switch } from 'iris-components';
import { fetchCsrf } from '../../../utils';

export interface WorksheetPreviewProps {
	wid: string;
	wsid: string;
	editorContents: unknown;
}

export function WorksheetPreview({
	wid,
	wsid,
	editorContents
}: WorksheetPreviewProps) {
	const [showAnswer, setShowAnswer] = useState(false);
	const [data, setData] = useState('');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [errData, setErrData] = useState<any>(null);

	useEffect(() => {
		let objUrl: string | null = null;

		const path = `/api/repo/workspaces/${wid}/worksheets/${wsid}/editorPreview?showAnswer=${showAnswer ? 1 : 0}`;

		fetchCsrf(path, {
			body: JSON.stringify(editorContents),
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(async (res) => {
			if (res.status === 200) {
				objUrl = URL.createObjectURL(await res.blob());
				setData(objUrl);
				setErrData(null);
			} else {
				setData('');
				setErrData(await res.json());
			}
		});

		return () => {
			if (objUrl) URL.revokeObjectURL(objUrl);
		};
	}, [wid, wsid, editorContents, showAnswer]);

	return (
		<>
			<Switch isSelected={showAnswer} onChange={setShowAnswer}>
				Show answer
			</Switch>

			{errData ? (
				<>
					<p className="my-0">
						<strong>Build failed. See compilation log below:</strong>
					</p>
					<div className="grow overflow-y-auto bg-iris-50 text-black p-2 max-w-full">
						<pre>
							<code>{errData.stdout}</code>
						</pre>
					</div>
				</>
			) : (
				data && (
					<object
						className="grow w-full"
						type="application/pdf"
						data={data}
						aria-label="Question preview"
					>
						Worksheet preview
					</object>
				)
			)}
		</>
	);
}
