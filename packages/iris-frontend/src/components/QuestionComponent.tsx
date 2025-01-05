import { useEffect, useState } from 'react';
import Activity from './Activity';
import {
	QuestionNodeType,
	ensurePoints,
	nodesToString,
	type Question,
	type QuestionNode,
	type QuestionSubmission,
	type QuestionOutcome,
	type QuestionResponse,
	type QuestionGrade,
	type MultipleChoiceQuestionNode,
	type MultipleChoiceQuestionResponse,
	type MultipleChoiceQuestionGrade,
	type IriscNode,
	getTotalPoints
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
import { fetchCsrf } from '../utils';

import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';

import Correct from '~icons/tabler/check';
import Incorrect from '~icons/tabler/x';

function QuestionFeedback({
	label,
	correct,
	explanation
}: {
	label?: string;
	correct: boolean;
	explanation?: IriscNode[];
}) {
	return (
		<div
			className={`my-2 p-2 border-l-4 ${correct ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}
		>
			{correct ? (
				<div className="text-green-800 font-bold">
					<Correct className="inline-block -mt-1 w-5 h-5" />{' '}
					{label && label + ': '}Correct
				</div>
			) : (
				<div className="text-red-800 font-bold">
					<Incorrect className="inline-block -mt-1 w-5 h-5" />{' '}
					{label && label + ': '}Incorrect
				</div>
			)}
			{explanation && (
				<div>
					<IriscBlockContent nodes={explanation} />
				</div>
			)}
		</div>
	);
}

interface MCQNodeComponentProps {
	node: MultipleChoiceQuestionNode;
	response?: MultipleChoiceQuestionResponse;
	setResponse: (newVal: MultipleChoiceQuestionResponse) => void;
	grade?: MultipleChoiceQuestionGrade;
}

function MCQNodeComponent({
	node,
	response,
	setResponse,
	grade
}: MCQNodeComponentProps) {
	return node.multipleResponse ? (
		<CheckboxGroup
			aria-label="Multiple choice response"
			value={response?.choices ?? []}
			onChange={(choices) =>
				setResponse({ type: QuestionNodeType.MCQ, choices })
			}
		>
			{node.options.map((opt, i) => (
				<div className="flex gap-2 items-start my-2" key={opt.id}>
					<Checkbox value={opt.id} aria-label={`Option ${i + 1}`}></Checkbox>
					<div>
						<IriscBlockContent nodes={opt.label} />
						{grade?.options[opt.id] && (
							<QuestionFeedback
								correct={grade.options[opt.id].correct}
								explanation={grade.options[opt.id].explanation}
							/>
						)}
					</div>
				</div>
			))}
		</CheckboxGroup>
	) : (
		<RadioGroup
			aria-label="Multiple choice response"
			value={response?.choices?.length ? response.choices[0] : null}
			onChange={(choice) =>
				setResponse({ type: QuestionNodeType.MCQ, choices: [choice] })
			}
			isRequired
		>
			{node.options.map((opt) => (
				<div className="flex gap-2 items-start my-2" key={opt.id}>
					<Radio value={opt.id} aria-label={nodesToString(opt.label)}></Radio>
					<div className="-mt-1">
						<IriscBlockContent nodes={opt.label} />
						{grade?.options[opt.id] && (
							<QuestionFeedback
								correct={grade.options[opt.id].correct}
								explanation={grade.options[opt.id].explanation}
							/>
						)}
					</div>
				</div>
			))}
		</RadioGroup>
	);
}

interface QuestionNodeComponentProps {
	node: QuestionNode;
	response?: QuestionResponse;
	setResponse: (newVal: QuestionResponse) => void;
	grade?: QuestionGrade;
}

function QuestionNodeComponent({
	node,
	response,
	setResponse,
	grade
}: QuestionNodeComponentProps) {
	switch (node.type) {
		case QuestionNodeType.Iris:
			return <IriscBlockContent nodes={node.data} />;

		case QuestionNodeType.MCQ: {
			// Average TypeScript nonsense
			const resp = response?.type === node.type ? response : undefined;
			const grd = grade?.type === node.type ? grade : undefined;

			return (
				<MCQNodeComponent
					node={node}
					response={resp}
					setResponse={setResponse}
					grade={grd}
				/>
			);
		}

		case QuestionNodeType.FillInTheBlank: {
			const resp = response?.type === node.type ? response : undefined;
			const grd = grade?.type === node.type ? grade : undefined;

			return (
				<>
					<div>
						<IriscBlockContent
							nodes={node.prompt}
							ctx={{
								getBlankValue(id) {
									return resp?.blanks[id] ?? '';
								},
								setBlankValue(id, val) {
									const newBlanks = { ...resp?.blanks };
									newBlanks[id] = val;
									setResponse({
										type: QuestionNodeType.FillInTheBlank,
										blanks: newBlanks
									});
								}
							}}
						/>
					</div>
					{grd && (
						<div>
							{node.blanks.map((b, i) => (
								<QuestionFeedback
									key={b.id}
									label={`Blank ${i + 1}`}
									correct={grd.blanks[b.id].correct}
									explanation={grd.blanks[b.id].explanation}
								/>
							))}
						</div>
					)}
				</>
			);
		}

		case QuestionNodeType.FreeResponse: {
			const resp = response?.type === node.type ? response : undefined;
			const grd = grade?.type === node.type ? grade : undefined;

			return (
				<>
					<TextField
						aria-label="Free response"
						isRequired
						value={resp?.response ?? ''}
						onChange={(newVal) =>
							setResponse({
								type: QuestionNodeType.FreeResponse,
								response: newVal
							})
						}
					>
						{node.multiline ? <TextArea /> : <Input />}
					</TextField>
					{grd && (
						<QuestionFeedback
							correct={grd.correct}
							explanation={grd.explanation}
						/>
					)}
				</>
			);
		}
	}
}

interface QuestionNodesProps {
	baseNumber?: string;
	nodes: QuestionNode[];
	submission: QuestionSubmission;
	setSubmission: (newVal: QuestionSubmission) => void;
	outcome: QuestionOutcome;
}

function QuestionNodes({
	baseNumber,
	nodes,
	submission,
	setSubmission,
	outcome
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
						outcome={outcome}
					/>
				</div>
			);
		}

		const pts = ensurePoints(n);

		return (
			<div key={n.id} className="my-2">
				{pts && (
					<div className="text-sm text-zinc-700">
						{outcome[n.id] &&
							Math.round(outcome[n.id].points * 100) / 100 + '/'}
						{pts.points} {pts.points === 1 ? 'point' : 'points'}
					</div>
				)}
				<QuestionNodeComponent
					node={n}
					response={submission[n.id]}
					setResponse={(newVal) => {
						const newSubmission = { ...submission };
						newSubmission[n.id] = newVal;
						setSubmission(newSubmission);
					}}
					grade={outcome[n.id]}
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
	outcome: QuestionOutcome;
}

export function QuestionComponent({
	question,
	submission,
	setSubmission,
	outcome
}: QuestionComponentProps) {
	useHighlight();

	return (
		<QuestionNodes
			nodes={question.data}
			submission={submission}
			setSubmission={setSubmission}
			outcome={outcome}
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
	const [unsaved, setUnsaved] = useState(false);
	const [submission, setSubmission] = useState<QuestionSubmission>({});
	const [outcome, setOutcome] = useState<QuestionOutcome>({});

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

	useEffect(() => {
		if (isDev) return setSubmission({});

		fetch(`/api/judge${src}/submissions`)
			.then((res) => res.json())
			.then((sub) => {
				setSubmission(sub.submission ?? {});
				setOutcome(sub.outcome ?? {});
			})
			.catch(console.error);
	}, [src, isDev]);

	useEffect(() => {
		if (!unsaved) return;

		function onBeforeUnload(e: BeforeUnloadEvent) {
			e.preventDefault();
		}

		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [unsaved]);

	const totalPointsEarned = Object.values(outcome).reduce(
		(acc, curr) => acc + curr.points,
		0
	);

	const totalPointsPossible = question && getTotalPoints(question);

	let status;

	if (totalPointsEarned === totalPointsPossible) {
		status = 'done';
	} else if (Object.values(outcome).length === 0) {
		status = 'incomplete';
	} else {
		status = 'progress';
	}

	return (
		<Activity title="Question" unsaved={unsaved} status={status}>
			<Form
				onSubmit={(e) => {
					e.preventDefault();

					fetchCsrf(`/api/judge${src}/submissions`, {
						body: JSON.stringify(submission),
						headers: {
							'Content-Type': 'application/json'
						}
					})
						.then((res) => res.json())
						.then((res) => {
							setOutcome(res);
							setUnsaved(false);
						});
				}}
			>
				{question ? (
					<QuestionComponent
						question={question}
						submission={submission}
						setSubmission={(newVal) => {
							setUnsaved(true);
							setSubmission(newVal);
						}}
						outcome={isDev ? {} : outcome}
					/>
				) : (
					<p>Loading question…</p>
				)}

				{!isDev && (
					<div className="flex gap-2">
						<Button type="submit">Submit</Button>
						<Button
							onPress={() => {
								fetchCsrf(`/api/judge${src}/submissions?saveOnly=1`, {
									body: JSON.stringify(submission),
									headers: {
										'Content-Type': 'application/json'
									}
								}).then(() => {
									setOutcome({});
									setUnsaved(false);
								});
							}}
						>
							Save Answers
						</Button>
					</div>
				)}
			</Form>
		</Activity>
	);
}
