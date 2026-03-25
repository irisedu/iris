import { useEffect, useState } from 'react';
import { Button, Dialog, Heading, Modal, Switch } from 'iris-components';

import X from '~icons/tabler/x';
import { fetchCsrf } from '../../../utils';

export interface QuestionPreviewProps {
	wid: string;
	qid: string;
	num: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	editorContents?: any;
}

export function QuestionPreview({
	wid,
	qid,
	editorContents
}: QuestionPreviewProps) {
	const [showAnswer, setShowAnswer] = useState(false);
	const [data, setData] = useState('');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [errData, setErrData] = useState<any>(null);

	useEffect(() => {
		let objUrl: string | null = null;

		if (editorContents) {
			const path = `/api/repo/workspaces/${wid}/questions/${qid}/editorPreview?showAnswer=${showAnswer ? 1 : 0}`;

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
		} else {
			const path = `/api/repo/workspaces/${wid}/questions/${qid}/revs/latest/preview/pdf?showAnswer=${showAnswer ? 1 : 0}`;

			fetch(path).then(async (res) => {
				if (res.status === 200) {
					objUrl = URL.createObjectURL(await res.blob());
					setData(objUrl);
					setErrData(null);
				} else {
					setData('');
					setErrData(await res.json());
				}
			});
		}

		return () => {
			if (objUrl) URL.revokeObjectURL(objUrl);
		};
	}, [wid, qid, editorContents, showAnswer]);

	return (
		<>
			<Switch isSelected={showAnswer} onChange={setShowAnswer}>
				Show answer
			</Switch>

			{errData ? (
				<>
					<p className="my-0">
						<strong>{errData.error}</strong>
					</p>
					{errData.stdout && (
						<div className="grow overflow-y-auto bg-iris-50 text-black p-2 max-w-full">
							<pre>
								<code>{errData.stdout}</code>
							</pre>
						</div>
					)}
				</>
			) : (
				data && (
					<object
						className="grow w-full"
						type="application/pdf"
						data={data}
						aria-label="Question preview"
					>
						Question preview
					</object>
				)
			)}
		</>
	);
}

export interface QuestionPreviewDialogProps extends QuestionPreviewProps {
	isOpen: boolean;
	setIsOpen: (val: boolean) => void;
}

export function QuestionPreviewDialog({
	wid,
	qid,
	num,
	isOpen,
	setIsOpen
}: QuestionPreviewDialogProps) {
	return (
		<Modal
			isDismissable
			isOpen={isOpen}
			onOpenChange={setIsOpen}
			className="size-full text-[white]"
		>
			<Dialog className="react-aria-Dialog size-full p-4 flex flex-col gap-2 items-start">
				<Heading slot="title" className="my-0">
					Question #{num}
				</Heading>
				<Button
					className="fixed top-5 right-5 rounded-full text-black bg-iris-100 data-[hovered]:bg-iris-200 data-[pressed]:bg-iris-300 p-1 cursor-pointer"
					aria-label="Close image popup"
					slot="close"
				>
					<X />
				</Button>

				<QuestionPreview wid={wid} qid={qid} num={num} />
			</Dialog>
		</Modal>
	);
}
