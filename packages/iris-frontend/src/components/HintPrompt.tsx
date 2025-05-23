import { useContext, useRef } from 'react';
import { Button } from 'iris-components';
import useLLM from '$hooks/useLLM';
import useAuthorization from '$hooks/useAuthorization';
import { DevContext } from '../routes/Article';

import Sparkles from '~icons/tabler/sparkles';

function HintPrompt({ id }: { id: string }) {
	const ref = useRef<HTMLDivElement>(null);
	const user = useAuthorization({});
	const { dev } = useContext(DevContext);

	const { showOutput, llmOutput, makeRequest } = useLLM();

	function getIndexingBoundary() {
		if (!ref.current) return null;

		let curr: HTMLElement | null = ref.current;

		while (curr) {
			const indexingBoundary = curr.dataset.indexingBoundary;
			if (indexingBoundary) return indexingBoundary;

			curr = curr.parentElement;
		}

		return null;
	}

	function makeHintReq(prompt: string) {
		makeRequest(`/api/llm/hint${getIndexingBoundary()}/${prompt}?id=${id}`);
	}

	return (
		<div
			className="border-l-4 border-iris-800 rounded-md px-2 py-1 my-(--paragraph-spacing)"
			ref={ref}
		>
			<div className="flex gap-2 items-center text-iris-800 font-bold mb-1 text-lg">
				<Sparkles className="w-5 h-5" />
				Hint
			</div>

			{user?.type === 'registered' && !dev && (
				<div className="flex gap-2 flex-wrap text-sm">
					<Button onPress={() => makeHintReq('task')}>Task?</Button>
					<Button onPress={() => makeHintReq('purpose')}>Purpose?</Button>
					<Button onPress={() => makeHintReq('breakdown')}>Breakdown?</Button>
				</div>
			)}

			{user?.type !== 'registered' && (
				<p className="m-0!">You must be logged in to use hints.</p>
			)}

			{dev && (
				<p className="m-0!">
					Hints are unavailable when viewing local content.
				</p>
			)}

			{showOutput && (
				<div className="text-sm my-2">
					<div className="mb-2 overflow-y-auto max-h-36">{llmOutput}</div>
					<div className="text-iris-900 text-xs">
						This output was generated by a large language model. LLMs may
						produce errors.
					</div>
				</div>
			)}
		</div>
	);
}

export default HintPrompt;
