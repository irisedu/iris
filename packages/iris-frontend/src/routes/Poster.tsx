import { useEffect } from 'react';
import { Button } from 'iris-components';
import StyleProvider from '$components/StyleProvider';
import TextSettings from '$components/TextSettings';

import IrisWord from '$assets/iris-word.svg?react';
import Diagram from '$assets/poster/diagram.svg?react';
import QR from '$assets/poster/qr.svg?react';

import ArrowRight from '~icons/tabler/arrow-right';
import Pointer from '~icons/tabler/pointer-filled';

import './Poster.css';

/*
   Print settings:
   - Font: Atkinson Hyperlegible
   - Paragraph spacing: 0.3em
   - Text Settings: Spacing

   Everything else default
*/

export function Component() {
	useEffect(() => {
		document.title =
			'Iris: An AI-Enhanced Content Management System Supporting Accessibility';

		// Dyslexia approximation
		// https://raw.githubusercontent.com/geon/geon.github.com/refs/heads/master/_posts/2016-03-03-dsxyliea.md
		const textNodes = document.querySelector('#dyslexia')!.childNodes!;

		const wordsInTextNodes: { length: number; position: number }[][] = [];

		for (const node of textNodes) {
			const words = [];

			const re = /\w+/g;
			let match;
			while ((match = re.exec(node.nodeValue!)) != null) {
				const word = match[0];
				const position = match.index;

				words.push({
					length: word.length,
					position: position
				});
			}

			wordsInTextNodes.push(words);
		}

		function messUpWords() {
			for (let i = 0; i < textNodes.length; i++) {
				const node = textNodes[i];

				for (let j = 0; j < wordsInTextNodes[i].length; j++) {
					// Only change a tenth of the words each round.
					if (Math.random() > 1 / 10) continue;

					const wordMeta = wordsInTextNodes[i][j];

					const word = node.nodeValue!.slice(
						wordMeta.position,
						wordMeta.position + wordMeta.length
					);
					const before = node.nodeValue!.slice(0, wordMeta.position);
					const after = node.nodeValue!.slice(
						wordMeta.position + wordMeta.length
					);

					node.nodeValue = before + messUpWord(word) + after;
				}
			}
		}

		function messUpWord(word: string) {
			if (word.length < 3) return word;

			return (
				word[0] + messUpMessyPart(word.slice(1, -1)) + word[word.length - 1]
			);
		}

		function messUpMessyPart(messyPart: string) {
			if (messyPart.length < 2) {
				return messyPart;
			}

			let a = 0,
				b = 0;

			while (!(a < b)) {
				a = getRandomInt(0, messyPart.length - 1);
				b = getRandomInt(0, messyPart.length - 1);
			}

			return (
				messyPart.slice(0, a) +
				messyPart[b] +
				messyPart.slice(a + 1, b) +
				messyPart[a] +
				messyPart.slice(b + 1)
			);
		}

		// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
		function getRandomInt(min: number, max: number) {
			return Math.floor(Math.random() * (max - min + 1) + min);
		}

		const int = setInterval(messUpWords, 50);
		return () => clearInterval(int);
	}, []);

	return (
		<StyleProvider className="p-[12mm] print:pb-0">
			{/* Header */}
			<header className="mb-(--paragraph-spacing) print:mb-1 max-w-[72ch] mx-auto">
				<div className="flex flex-col md:flex-row items-center gap-3 -mt-2 mb-1 text-center md:text-left">
					<IrisWord className="iris-rotate max-h-[4rem] -ml-3" />
					<h1 className="text-[1.33rem] leading-tight m-0 md:mt-2 md:whitespace-nowrap">
						An AI-Enhanced Content Management System{' '}
						<br className="hidden md:inline" />
						Supporting Accessibility
					</h1>
					<div className="grow" />
					<QR className="hidden print:inline-block h-16" />
				</div>
				<div className="text-iris-900 text-center text-[0.65rem] max-w-full leading-tight">
					Wong Zhao, Tianle Yu • Supervisor: Dr. Maryam Majedi • Computer
					Science Education & Embedded Ethics (CS3E) Lab
					<br />
					{'{'}wongzhao, tianleyu, majedi{'}'}@ucsb.edu
				</div>
			</header>

			{/* Body */}
			<main>
				<div className="column">
					<div className="section">
						<h2 className="section__title">Introduction</h2>
						<p>
							Our project, Iris, is a web-based content management system that
							focuses on presentation (typography) and interactivity, supporting
							accessibility.
						</p>
					</div>

					<div className="section">
						<h2 className="section__title">Background</h2>
						<ul>
							<li>
								Typography, the visual component of a document, helps keep
								readers’ attention [1]
							</li>
							<li>
								Accessibility features improve usability for those with
								disabilities and can also improve the reading experience for
								everyone [2]
							</li>
						</ul>
					</div>

					<div className="section">
						<h2 className="section__title">Problem Definition</h2>
						<ul>
							<li>
								There is no easy-to-use content management system available at
								UCSB that prioritizes typography and accessibility
							</li>
							<li>
								Existing accessibility systems (e.g., SensusAccess, integrated
								with Canvas) do not provide a first-class experience to those
								with accessibility needs
							</li>
						</ul>

						<figure className="label-figure p-2 pt-1">
							<span className="label-figure__label">Look</span>
							<p className="bad text-left text-[0.6rem] mx-auto">
								<em>
									<strong>
										<u>
											This text contains several exaggerated typographical
											mistakes. Is it difficult for you to read? Can you point
											any of these mistakes out? How does the appearance of this
											section compare to the rest of this poster? Systems like
											Iris can prevent these mistakes through documentation,
											in-editor errors, and by making them impossible to begin
											with.
										</u>
									</strong>
								</em>
							</p>
						</figure>

						<figure className="label-figure px-2 py-1">
							<span className="label-figure__label">Dyslexia</span>
							<p id="dyslexia" className="text-left text-[0.75rem]">
								“But typography can enhance your writing. Typography can create
								a better first impression. Typography can reinforce your key
								points. Typography can extend reader attention. When you ignore
								typography, you’re ignoring an opportunity to improve the
								effectiveness of your writing.”
							</p>
							<figcaption>
								An <em>approximation</em> of dyslexia by Victor Widell [2016].
								Text by Matthew Butterick [2010]. View animation in interactive
								poster.
							</figcaption>
						</figure>

						<figure className="label-figure px-2 py-1">
							<span className="label-figure__label">Jargon</span>
							<p className="text-left text-[0.75rem]">
								“Each node’s value is calculated by the{' '}
								<mark className="bg-iris-200 text-black px-0.5">
									weighted sum
								</mark>{' '}
								of the values of the previous layer nodes plus a{' '}
								<mark className="bg-iris-200 text-black px-0.5">
									bias followed by an activation
								</mark>
								.”
							</p>
							<figcaption>
								Would you understand this if you were unfamiliar with the topic
								or a non-native English speaker? Text from a CS 24
								assignment&nbsp;[4].
							</figcaption>
						</figure>
					</div>

					<div className="section">
						<h2 className="section__title">Iris Document Format</h2>
						<ul>
							<li>Strict document format and editor</li>
							<li>
								Many major typographical mistakes, such as incorrect spacing and
								poor font/color choice, are impossible
							</li>
							<li>Enforces consistent presentation across the website</li>
						</ul>
					</div>

					<figure className="p-1">
						<Diagram className="w-[95%] mx-auto" />
						<figcaption>Block diagram of Iris</figcaption>
					</figure>
				</div>

				<div className="column">
					<div className="section text-settings px-2">
						<TextSettings />
					</div>

					<div className="section">
						<h2 className="section__title">LLM-Based Accommodations</h2>
						<ul>
							<li>Allow students to query AI models from Iris</li>
							<li>Record queries and provide feedback to authors</li>
						</ul>
						<figure className="label-figure px-2 py-1">
							<span className="label-figure__label">Select to Prompt</span>
							<div className="overflow-auto">
								<div className="text-left flex gap-4 items-center">
									<div className="mt-6">
										<p className="text-[0.65rem] w-[22ch]">
											Each node’s value is calculated by the{' '}
											<mark className="relative text-white bg-blue-500">
												<div className="absolute -top-9 left-[50%] -translate-x-[50%] react-aria-Popover text-black no-animation p-1 flex gap-1 text-sm">
													<Button className="relative px-1 rounded-md bg-iris-300">
														Explain
														<Pointer className="absolute text-black stroke-white stroke-3 w-4 h-4 -bottom-2 -right-2" />
													</Button>
												</div>
												weighted sum
											</mark>{' '}
											of the values of the previous layer nodes plus a bias
											followed by an activation.
										</p>
									</div>
									<ArrowRight className="text-iris-900 w-4 h-4 shrink-0" />
									<div className="react-aria-Popover text-black no-animation p-1 text-sm text-[0.7rem] min-w-[18ch]">
										<div className="font-bold">
											Explain <em>weighted sum</em>
										</div>
										<div className="max-h-14 overflow-y-auto">
											In this context, a &quot;weighted sum&quot; refers to the
											process where each input value (like x<sub>1</sub> and x
											<sub>2</sub>) is multiplied by its corresponding weight
											and then summed up. This calculation also includes adding
											a bias term, which helps adjust the node&apos;s activation
											level independently of the inputs. The result of this
											weighted sum, along with the bias, is then passed through
											an activation function to determine the node’s final value
											in the hidden layer.
										</div>
									</div>
								</div>
								<div className="text-left flex gap-4 items-center">
									<div className="mt-4">
										<p className="relative text-[0.65rem] w-[22ch]">
											<mark className="text-white bg-blue-500">
												Each node’s value is calculated by the{' '}
												<div className="absolute -top-9 left-[50%] -translate-x-[50%] react-aria-Popover text-black no-animation p-1 flex gap-1 text-sm">
													<Button className="relative px-1 rounded-md bg-iris-300">
														Simplify
														<Pointer className="absolute text-black stroke-white stroke-3 w-4 h-4 -bottom-2 -right-2" />
													</Button>
												</div>
												weighted sum of the values of the previous layer nodes
												plus a bias followed by an activation.
											</mark>
										</p>
									</div>
									<ArrowRight className="text-iris-900 w-4 h-4 shrink-0" />
									<div className="react-aria-Popover text-black no-animation p-1 text-sm text-[0.7rem] min-w-[18ch]">
										<div className="font-bold">Simplify</div>
										<div className="max-h-14 overflow-y-auto">
											The value of each node is found by adding up the values
											from the nodes in the previous layer, using weights, then
											adding a bias. This total is then passed through an
											activation function.
										</div>
									</div>
								</div>
							</div>
						</figure>
						<figure className="label-figure px-2 py-1">
							<span className="label-figure__label">In-Text Prompt</span>
							<div className="text-left flex gap-4 items-center overflow-auto">
								<div className="text-[0.65rem] w-[25ch]">
									<p>Implement the following functions:</p>
									<ul>
										<li>
											<code className="text-[0.65rem]">Graph::updateNode</code>
										</li>
										<li>
											<code className="text-[0.65rem]">Graph::getNode</code>
											&hellip;
										</li>
									</ul>
									<div className="text-[0.7rem] border-l-[0.2rem] border-iris-600 rounded-md px-2 py-1 text-iris-900 mt-1">
										<div className="font-bold mb-1">Hint</div>
										<div className="flex gap-1 items-center">
											<Button className="react-aria-Button text-[0.65rem] px-1 py-0.5 text-black">
												Task?
											</Button>
											<Button className="react-aria-Button text-[0.65rem] px-1 py-0.5 text-black">
												Purpose?
											</Button>
											<Button className="relative react-aria-Button text-[0.65rem] px-1 py-0.5 text-black">
												Breakdown?
												<Pointer className="absolute text-black stroke-white stroke-3 w-4 h-4 -bottom-1 right-3" />
											</Button>
										</div>
									</div>
								</div>
								<ArrowRight className="text-iris-900 w-4 h-4 shrink-0" />
								<div className="text-[0.7rem] border-l-[0.2rem] border-iris-600 rounded-md px-2 py-1 text-iris-900 mt-1">
									<div className="font-bold">Hint</div>
									<p className="max-w-[18ch] max-h-20 overflow-y-auto">
										Start by focusing on functions that help build and
										manipulate the graph structure, such as adding vertices and
										edges. These are often foundational and will make it easier
										to test and expand your implementation. Consider how each
										function should interact with the internal representation of
										the graph you&apos;ve chosen (e.g., adjacency list or
										matrix).
									</p>
								</div>
							</div>
						</figure>
					</div>

					<div className="section">
						<h2 className="section__title">
							Ethical and Social Considerations
						</h2>
						<ul>
							<li>
								Ethics: Supplement, not replace, interactions between students
								and course staff
								<ul>
									<li>Simple one-click interface acts as a guardrail</li>
								</ul>
							</li>
							<li>
								Security: Students cannot send arbitrary prompts
								<ul>
									<li>Prompt text is fetched and templated by the system</li>
								</ul>
							</li>
							<li>Privacy: Model is hosted at UCSB; data stays on campus</li>
							<li>
								<abbr title="Diversity, equity, inclusion, and access">
									DEIA
								</abbr>
								: Iris caters to readers of various backgrounds and levels of
								ability
							</li>
						</ul>
					</div>

					<div className="section">
						<h2 className="section__title">Discussion</h2>
						<ul>
							<li>
								First phase: Deployment in introductory CS courses
								<ul>
									<li>
										F24 (CS 24): Used for one assignment, generally
										well-received
									</li>
									<li>
										W25 (CS 16): Used successfully for eight assignments across
										entire quarter
									</li>
								</ul>
							</li>
							<li>
								Second phase:
								<ul>
									<li>
										Experiment plan: Evaluating Iris’s accessibility features
									</li>
									<li>Tailor AI responses using students’ mastery level</li>
									<li>Include target users in development process</li>
								</ul>
							</li>
						</ul>
					</div>
				</div>
			</main>

			<footer className="max-w-[72ch] mx-auto print:-mt-3">
				<div className="text-[0.7rem]">References</div>
				<div className="text-[0.6rem] md:columns-2 md:gap-8">
					<div className="break-inside-avoid">
						[1] Matthew Butterick. 2010. <em>Practical Typography</em>.
						Retrieved April 1, 2025 from{' '}
						<a href="https://practicaltypography.com/">
							https://practicaltypography.com/
						</a>
						.
					</div>
					<div className="break-inside-avoid">
						[2] W3C. 2024. Web Content Accessibility Guidelines (WCAG) 2.2.
						Retrieved April 1, 2025 from{' '}
						<a href="https://www.w3.org/TR/WCAG22/">
							https://www.w3.org/TR/WCAG22/
						</a>
						.
					</div>
					<div className="break-inside-avoid">
						[3] Victor Widell. 2016. Dsxyliea. Retrieved April 1, 2025 from{' '}
						<a href="https://geon.github.io/programming/2016/03/03/dsxyliea">
							https://geon.github.io/programming/2016/03/03/dsxyliea
						</a>
						.
					</div>
					<div className="break-inside-avoid">
						[4] Zackary Glazewski and Diba Mirza. 2024. Lab 7 Tutorial: A Gentle
						Introduction to Neural Networks. Retrieved April 2, 2025 from{' '}
						<a href="https://ucsb-cs24-f24.github.io/cs24-f24/lab/lab07-EXTRA/">
							https://ucsb-cs24-f24.github.io/cs24-f24/lab/lab07-EXTRA/
						</a>
						.
					</div>
					<div className="break-inside-avoid">
						[5] Tianle Yu and Maryam Majedi. 2024. Tailored Education: Using AI
						to Manage Large Classes and Support Individual Needs. In{' '}
						<em>AI Community of Practice Spring Symposium 2024</em>, May 20–24,
						2024, Santa Barbara, California. UCSB Office of Teaching & Learning,
						Santa Barbara, CA.
					</div>
				</div>
				<div className="text-[0.6em] print:-mt-3">
					<strong>This poster was rendered using Iris.</strong> —{' '}
					<span className="text-iris-900">iris.3e.cs.ucsb.edu/poster</span>
				</div>
			</footer>
		</StyleProvider>
	);
}
