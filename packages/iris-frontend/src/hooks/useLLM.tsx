import { useState, useRef, useCallback } from 'react';
import { fetchCsrf } from '../utils';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import parse from 'html-react-parser';

import './useLLM.css';

marked.use(markedKatex());

export default function useLLM() {
	const [showOutput, setShowOutput] = useState(false);
	const [output, setOutput] = useState('');
	const [outputDone, setOutputDone] = useState(false);
	const reqId = useRef(0);

	const makeRequest = useCallback((endpoint: string) => {
		const id = ++reqId.current;

		setShowOutput(true);
		setOutput('');
		setOutputDone(false);

		fetchCsrf(endpoint).then(async (res) => {
			if (res.status !== 200) {
				setOutput('Error getting LLM output.');
				setOutputDone(true);
				return;
			}

			const reader = res.body?.getReader();
			if (!reader) return;

			const decoder = new TextDecoder();
			while (true) {
				const { value, done } = await reader.read();

				if (value) {
					// New request started
					if (reqId.current !== id) return;
					setOutput((curr) => curr + decoder.decode(value));
				}

				if (done) break;
			}

			setOutputDone(true);
		});
	}, []);

	const llmOutput =
		output.length > 0 ? (
			<div
				className={
					'llm-output' + (outputDone ? '' : ' llm-output--in-progress')
				}
			>
				{parse(
					marked.parse(
						output
							.replaceAll('\\(', '$')
							.replaceAll('\\)', '$')
							.replaceAll('\\[', '$$')
							.replaceAll('\\]', '$$')
					) as string
				)}
			</div>
		) : (
			<div>Loading…</div>
		);

	return { showOutput, llmOutput, makeRequest };
}
