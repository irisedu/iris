import { useEffect, useState } from 'react';
import Activity from './Activity';
import {
	type MultipleChoiceQuestionNode,
	type MultipleChoiceQuestionResponse,
	QuestionNodeType,
	type Question,
	type QuestionNode,
	type QuestionSubmission,
	type FillInTheBlankQuestionResponse,
	ensurePoints,
	type FreeResponseQuestionResponse,
	nodesToString
} from '@irisedu/schemas';
import { IriscBlockContent } from './nodes/IriscNode';
import {
	Button,
	Checkbox,
	CheckboxGroup,
	Form,
	Input,
	Radio,
	RadioGroup,
	TextArea,
	TextField
} from 'iris-components';
import { useHighlight } from '$hooks/useHighlight';

import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';

interface MCQNodeComponentProps {
	node: MultipleChoiceQuestionNode;
	response: MultipleChoiceQuestionResponse;
	setResponse: (newVal: MultipleChoiceQuestionResponse) => void;
}

function MCQNodeComponent({
	node,
	response,
	setResponse
}: MCQNodeComponentProps) {
	return node.multipleResponse ? (
		<CheckboxGroup
			aria-label="Multiple choice response"
			value={response.choices}
			onChange={(choices) => setResponse({ ...response, choices })}
		>
			{node.options.map((opt, i) => (
				<div className="flex gap-2 items-start my-2" key={opt.id}>
					<Checkbox value={opt.id} aria-label={`Option ${i + 1}`}></Checkbox>
					<div>
						<IriscBlockContent nodes={opt.label} />
					</div>
				</div>
			))}
		</CheckboxGroup>
	) : (
		<RadioGroup
			aria-label="Multiple choice response"
			value={response.choices.length ? response.choices[0] : null}
			onChange={(choice) => setResponse({ ...response, choices: [choice] })}
			isRequired
		>
			{node.options.map((opt, i) => (
				<div className="flex gap-2 items-start my-2" key={opt.id}>
					<Radio value={opt.id} aria-label={nodesToString(opt.label)}></Radio>
					<div className="-mt-1" aria-label={`Option ${i + 1}`}>
						<IriscBlockContent nodes={opt.label} />
					</div>
				</div>
			))}
		</RadioGroup>
	);
}

interface QuestionNodeComponentProps {
	node: QuestionNode;
	submission: QuestionSubmission;
	setSubmission: (newVal: QuestionSubmission) => void;
}

function QuestionNodeComponent({
	node,
	submission,
	setSubmission
}: QuestionNodeComponentProps) {
	switch (node.type) {
		case QuestionNodeType.Iris:
			return <IriscBlockContent nodes={node.data} />;

		case QuestionNodeType.MCQ:
			return (
				<MCQNodeComponent
					node={node}
					response={
						(submission[node.id] as
							| MultipleChoiceQuestionResponse
							| undefined) ?? {
							type: QuestionNodeType.MCQ,
							choices: []
						}
					}
					setResponse={(newVal) => {
						const newSubmission = { ...submission };
						newSubmission[node.id] = newVal;
						setSubmission(newSubmission);
					}}
				/>
			);

		case QuestionNodeType.FillInTheBlank:
			return (
				<div>
					<IriscBlockContent
						nodes={node.prompt}
						ctx={{
							getBlankValue(id) {
								const resp = submission[node.id] as
									| FillInTheBlankQuestionResponse
									| undefined;
								return resp?.blanks[id] ?? '';
							},
							setBlankValue(id, val) {
								const resp = (submission[node.id] as
									| FillInTheBlankQuestionResponse
									| undefined) ?? {
									type: QuestionNodeType.FillInTheBlank,
									blanks: {}
								};

								const newBlanks = { ...resp.blanks };
								newBlanks[id] = val;

								const newSubmission = { ...submission };
								newSubmission[node.id] = { ...resp, blanks: newBlanks };
								setSubmission(newSubmission);
							}
						}}
					/>
				</div>
			);

		case QuestionNodeType.FreeResponse:
			return (
				<TextField
					aria-label="Free response"
					isRequired
					value={
						(submission[node.id] as FreeResponseQuestionResponse | undefined)
							?.response ?? ''
					}
					onChange={(newVal) => {
						const resp = (submission[node.id] as
							| FreeResponseQuestionResponse
							| undefined) ?? {
							type: QuestionNodeType.FreeResponse,
							response: ''
						};

						const newSubmission = { ...submission };
						newSubmission[node.id] = { ...resp, response: newVal };
						setSubmission(newSubmission);
					}}
				>
					{node.multiline ? <TextArea /> : <Input />}
				</TextField>
			);
	}
}

interface QuestionNodesProps {
	baseNumber?: string;
	nodes: QuestionNode[];
	submission: QuestionSubmission;
	setSubmission: (newVal: QuestionSubmission) => void;
}

function QuestionNodes({
	baseNumber,
	nodes,
	submission,
	setSubmission
}: QuestionNodesProps) {
	let partNumber = 0;

	return nodes.map((n) => {
		if (n.type === QuestionNodeType.Question) {
			partNumber++;
			const numberText = baseNumber
				? `${baseNumber}${partNumber}`
				: `Part ${partNumber}`;

			return (
				<div className="my-2" key={n.id}>
					<div className="font-bold my-1">{numberText}</div>
					<QuestionNodes
						baseNumber={numberText + '.'}
						nodes={n.contents}
						submission={submission}
						setSubmission={setSubmission}
					/>
				</div>
			);
		}

		const pts = ensurePoints(n);

		return (
			<div key={n.id} className="my-2">
				{pts && (
					<div className="text-sm text-zinc-700">
						{pts.points} {pts.points === 1 ? 'point' : 'points'}
					</div>
				)}
				<QuestionNodeComponent
					node={n}
					submission={submission}
					setSubmission={setSubmission}
				/>
			</div>
		);
	});
}

export interface QuestionComponentProps {
	// TODO: Display past submission results
	// NOTE: This type is not technically correct as some information is
	// redacted by the server. Accessing these will cause errors.
	// Not a bug, this is a feature (TM)
	question: Question;
	submission: QuestionSubmission;
	setSubmission: (newVal: QuestionSubmission) => void;
}

export function QuestionComponent({
	question,
	submission,
	setSubmission
}: QuestionComponentProps) {
	useHighlight();

	return (
		<QuestionNodes
			nodes={question.data}
			submission={submission}
			setSubmission={setSubmission}
		/>
	);
}

export interface NetQuestionComponentProps {
	src: string;
}

export function NetQuestionComponent({ src }: NetQuestionComponentProps) {
	const devEnabled = useSelector((state: RootState) => state.dev.enabled);
	const devHost = useSelector((state: RootState) => state.dev.host);
	const refresh = useSelector((state: RootState) => state.dev.refresh);

	const [isDev, setIsDev] = useState(false);
	const [question, setQuestion] = useState<Question | null>(null);
	const [submission, setSubmission] = useState<QuestionSubmission>({});

	useEffect(() => {
		fetch(devEnabled ? `http://${devHost}${src}` : src)
			.then((res) => {
				if (devEnabled && res.status !== 200) {
					setIsDev(false);
					return fetch(src);
				}

				setIsDev(devEnabled);
				return res;
			})
			.then((res) => res.json())
			.then(setQuestion)
			.catch(console.error);
	}, [devEnabled, devHost, src, refresh]);

	return (
		<Activity title="Question">
			<Form>
				{question ? (
					<QuestionComponent
						question={question}
						submission={submission}
						setSubmission={setSubmission}
					/>
				) : (
					<p>Loading question…</p>
				)}

				{!isDev && <Button type="submit">Submit</Button>}
			</Form>
		</Activity>
	);
}
