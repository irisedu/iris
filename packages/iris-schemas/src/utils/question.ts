import {
	QuestionNodeType,
	type Question,
	type QuestionNode,
	type QuestionResponse,
	type QuestionGrade,
	type QuestionSubmission,
	type QuestionOutcome,
	type QuestionNodePointsBase,
	type FillInTheBlankQuestionGrade,
	type MultipleChoiceQuestionGrade
} from '../schemas/question.js';
import { getTextRange, parseAddress, type TextRange } from './irisc.js';

export function ensurePoints(q: QuestionNode): QuestionNodePointsBase | null {
	if (q.type !== QuestionNodeType.Question && q.type !== QuestionNodeType.Iris)
		return q;

	return null;
}

export function getTotalPoints(q: Question) {
	function getNodesPoints(qs: QuestionNode[]) {
		let points = 0;

		for (const qn of qs) {
			if (qn.type === QuestionNodeType.Question) {
				points += getNodesPoints(qn.contents);
			} else {
				const pts = ensurePoints(qn);
				if (pts) points += pts.points;
			}
		}

		return points;
	}

	return getNodesPoints(q.data);
}

export function gradeQuestionNode(
	q: QuestionNode,
	s: QuestionResponse
): QuestionGrade | null {
	switch (q.type) {
		case QuestionNodeType.MCQ: {
			if (s.type !== q.type) return null;

			const chosenOptions = s.choices
				.map((c) => q.options.find((o) => o.id === c))
				.filter((o) => o !== undefined);

			const options: MultipleChoiceQuestionGrade['options'] = {};

			if (q.multipleResponse) {
				const choicesSet = new Set(s.choices);
				const correctChoices = chosenOptions.filter((co) => co.correct);
				const omissions = q.options.filter((o) => !choicesSet.has(o.id));
				const correctOmissions = omissions.filter((o) => !o.correct);

				chosenOptions.forEach(
					(co) =>
						(options[co.id] = {
							correct: co.correct,
							explanation: co.explanation
						})
				);

				const points =
					q.points *
					((correctChoices.length + correctOmissions.length) /
						q.options.length);

				return {
					type: q.type,
					options,
					missingResponses: omissions.length > correctOmissions.length,
					points
				};
			} else {
				if (chosenOptions.length !== 1) return null;

				const opt = chosenOptions[0];

				options[opt.id] = {
					correct: opt.correct,
					explanation: opt.explanation
				};

				return {
					type: q.type,
					options,
					points: opt.correct ? q.points : 0
				};
			}
		}
		case QuestionNodeType.FillInTheBlank: {
			if (s.type !== q.type) return null;

			const blanks: FillInTheBlankQuestionGrade['blanks'] = {};
			let numCorrect = 0;

			for (const blank of q.blanks) {
				const resp = s.blanks[blank.id];
				if (!resp) {
					blanks[blank.id] = {
						correct: false,
						explanation: blank.catchAllExplanation
					};

					continue;
				}

				const opt = blank.options.find((o) => o.value === resp);

				if (opt?.correct) numCorrect++;

				blanks[blank.id] = {
					correct: opt?.correct ?? false,
					explanation: opt?.explanation ?? blank.catchAllExplanation
				};
			}

			return {
				type: q.type,
				blanks,
				points: q.points * (numCorrect / q.blanks.length)
			};
		}
		case QuestionNodeType.FreeResponse: {
			if (s.type !== q.type) return null;

			const opt = q.options.find((o) => o.value === s.response);

			return {
				type: q.type,
				correct: opt?.correct ?? false,
				explanation: opt?.explanation ?? q.catchAllExplanation,
				points: opt?.correct ? q.points : 0
			};
		}
	}

	return null;
}

export function gradeQuestion(
	q: Question,
	s: QuestionSubmission
): QuestionOutcome {
	const outcome: QuestionOutcome = {};

	function gradeQuestionNodes(qn: QuestionNode[]) {
		for (const n of qn) {
			if (n.type === QuestionNodeType.Question) {
				gradeQuestionNodes(n.contents);
			} else {
				const grade = gradeQuestionNode(n, s[n.id]);
				if (grade) outcome[n.id] = grade;
			}
		}
	}

	gradeQuestionNodes(q.data);
	return JSON.parse(JSON.stringify(outcome)); // strip undefined
}

export function getQuestionTextRange(
	q: QuestionNode[],
	a: string,
	b: string
): TextRange | null {
	if (!a.length || !b.length) return null;

	const addrA = parseAddress(a);
	const addrB = parseAddress(b);

	// Find question node to find Iris contents inside
	let i = 0;
	let questionAncestor: QuestionNode | undefined;

	while (
		i < addrA.length &&
		i < addrB.length &&
		addrA[i] === addrB[i] &&
		(!questionAncestor || questionAncestor.type === QuestionNodeType.Question)
	) {
		if (questionAncestor) {
			if (addrA[i] >= questionAncestor.contents.length) return null;
			questionAncestor = questionAncestor.contents[addrA[i]];
		} else {
			if (addrA[i] >= q.length) return null;
			questionAncestor = q[addrA[i]];
		}

		i++;
	}

	if (!questionAncestor) return null;

	switch (questionAncestor.type) {
		case QuestionNodeType.Question:
			return null;

		case QuestionNodeType.Iris:
			return getTextRange(
				questionAncestor.data,
				addrA.slice(i).join('.'),
				addrB.slice(i).join('.')
			);

		case QuestionNodeType.MCQ: {
			if (addrA[i] !== addrB[i] || addrA[i] >= questionAncestor.options.length)
				return null;

			const opt = questionAncestor.options[addrA[i]];

			return getTextRange(
				opt.label,
				addrA.slice(i + 1).join('.'),
				addrB.slice(i + 1).join('.')
			);
		}

		case QuestionNodeType.FillInTheBlank:
			return getTextRange(
				questionAncestor.prompt,
				addrA.slice(i).join('.'),
				addrB.slice(i).join('.')
			);

		case QuestionNodeType.FreeResponse:
			return null;
	}
}
