import { useEffect, useState } from 'react';
import { Button, ToggleButton } from 'iris-components';
import StyleProvider from '$components/StyleProvider';
import TextSettings from '$components/TextSettings';
import useWidellSimulation from './useWidellSimulation';
import Image from '$components/nodes/Image';

import IrisWord from '$assets/iris-word.svg?react';
import EmbeddedEthics from '$assets/embeddedethics.svg?react';
// import Diagram from '$assets/poster/diagram.svg?react';
import QR from '$assets/poster/qr.svg?react';

import studio from '$assets/poster/studio.png';
import frontend from '$assets/poster/frontend.png';
import ueqComparison from '$assets/poster/ueq-comparison.png';

import ArrowRight from '~icons/tabler/arrow-right';
import Pointer from '~icons/tabler/pointer-filled';

import './Index.css';

/*
   Print settings:
   - Font: Atkinson Hyperlegible
   - Text Settings: Spacing

   Everything else default
*/

export function Component() {
	useEffect(() => {
		document.title =
			'Iris: A Content Management System Supporting Accessibility and Typography';
	}, []);

	useWidellSimulation();

	const [printLayout, setPrintLayout] = useState(false);
	useEffect(() => {
		if (printLayout) {
			document.documentElement.classList.add('group');
			document.documentElement.classList.add('print');
		} else {
			document.documentElement.classList.remove('group');
			document.documentElement.classList.remove('print');
		}
	}, [printLayout]);

	return (
		<StyleProvider className="p-[12mm] relative">
			<ToggleButton
				className="react-aria-Button absolute top-8 left-8 opacity-0 data-[hovered]:opacity-100 data-[focus-visible]:opacity-100 transition-opacity duration-200 z-100"
				isSelected={printLayout}
				onChange={setPrintLayout}
			>
				{printLayout ? 'Column Layout' : 'Print Layout'}
			</ToggleButton>
			{/* Header */}
			<header className="mb-[calc(3*var(--paragraph-spacing))]">
				<div className="flex flex-col lg:flex-row justify-center items-center lg:gap-8 -mt-2 mb-4 text-center lg:text-left group-[.print]:mb-0">
					<IrisWord
						className="iris-rotate max-h-[4.5rem] -ml-8 -mr-4 group-[.print]:max-h-[3.5rem] group-[.print]:ml-0"
						role="img"
						aria-label="Iris logo"
					/>
					<h1 className="text-2xl leading-tight m-0 lg:mt-2 lg:whitespace-nowrap group-[.print]:mt-0 group-[.print]:text-[1.8rem]">
						A Content Management System{' '}
						<br className="hidden lg:inline group-[.print]:hidden" />
						Supporting Typography and Accessibility
					</h1>
					<EmbeddedEthics
						className="max-h-[3.5rem]"
						role="img"
						aria-label="UCSB Embedded Ethics Lab Logo"
					/>
				</div>
				<div className="text-iris-900 text-center max-w-full leading-tight">
					Wong Zhao, Maryam Majedi • Embedded Ethics Lab • University of
					California, Santa Barbara
					<br />
					{'{'}wongzhao, majedi{'}'}@ucsb.edu
				</div>
				<div className="hidden group-[.print]:flex items-center gap-4 absolute top-16 right-8">
					<div className="text-xs text-right">
						<strong>This poster was rendered using Iris.</strong>
						<br />
						<span className="text-iris-900">iris.3e.cs.ucsb.edu/poster</span>
					</div>
					<QR className="h-16 dark:bg-black" aria-hidden="true" />
				</div>
			</header>

			{/* Body */}
			<main>
				<section style={{ gridArea: 'intro' }}>
					<h2>Introduction & Background</h2>
					<p>
						Iris is a course content management system focusing on presentation,
						interactivity, and accessibility improvements.
					</p>
					<ul>
						<li>
							Disabled students in higher education continue to report
							accessibility difficulties [1]
						</li>
						<li>
							Accessibility can improve usability for everyone, not just people
							with disabilities [2]
						</li>
						<li>
							Typography, the visual component of a document, can impact
							readers’ attention [4]
						</li>
						<li>
							Existing tools like SensusAccess isolate readers with
							accessibility needs
						</li>
					</ul>
				</section>
				<section style={{ gridArea: 'problem' }}>
					<h2>Motivation</h2>
					<figure
						className="label-figure p-2 pt-1 group-[.print]:my-2!"
						aria-label="Look"
					>
						<span className="label-figure__label" aria-hidden="true">
							Look
						</span>
						<p
							className="bad text-left text-xs mx-auto mt-1! group-[.print]:text-[0.57rem]"
							role="img"
							aria-label="A paragraph set in small font; all caps; red color with poor contrast; bold, italic, and underline; and tight line spacing."
						>
							<em aria-hidden="true">
								<strong>
									<u>
										This text contains several exaggerated typographical
										mistakes. Is it difficult for you to read? Can you point any
										of these mistakes out? How does the appearance of this
										section compare to the rest of this poster? Systems like
										Iris can prevent these mistakes through documentation,
										in-editor errors, and by making them impossible to begin
										with.
									</u>
								</strong>
							</em>
						</p>
					</figure>
					<figure
						className="label-figure px-2 py-1 group-[.print]:my-2!"
						aria-label="Dyslexia"
					>
						<span className="label-figure__label" aria-hidden="true">
							Dyslexia
						</span>
						<p
							className="text-left text-sm mt-1! group-[.print]:text-[0.7rem]"
							role="img"
							aria-label="A paragraph displaying a simulation of dyslexia, with letters shifting around rapidly."
						>
							<span id="dyslexia" aria-hidden="true">
								“But typography can enhance your writing. Typography can create
								a better first impression. Typography can reinforce your key
								points. Typography can extend reader attention. When you ignore
								typography, you’re ignoring an opportunity to improve the
								effectiveness of your writing.”
							</span>
						</p>
						<figcaption>
							An <em>approximation</em> of dyslexia by Victor Widell [2016].
							Text by Matthew Butterick [2010]. View animation in interactive
							poster.
						</figcaption>
					</figure>
					<figure
						className="label-figure px-2 py-1 group-[.print]:my-2!"
						aria-label="Jargon"
					>
						<span className="label-figure__label" aria-hidden="true">
							Jargon
						</span>
						<p className="text-left text-sm mt-1! group-[.print]:text-[0.62rem]">
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
							Would you understand this if you were new to the topic or a
							non-native English speaker? Text from a CS2 assignment&nbsp;[5].
						</figcaption>
					</figure>
					<figure
						className="label-figure p-2 group-[.print]:my-2!"
						style={{ gridArea: 'semantic' }}
						aria-label="Semantics"
					>
						<span className="label-figure__label" aria-hidden="true">
							Semantics
						</span>
						<div
							role="img"
							aria-label="Paragraph where an image of an Iris versicolor flower is mistakenly placed inline with the text, causing unnatural line spacing."
						>
							<p
								className="group-[.print]:text-xs text-left my-0!"
								aria-hidden="true"
							>
								It is possible in Markdown to accidentally <br /> do this:{' '}
								<img
									src="/page/iris-user-manual/credits/assets/iris-flower.webp"
									alt="Iris versicolor flower, viewed from above."
									className="inline w-24"
								/>
							</p>
						</div>
						<pre className="text-left whitespace-pre-wrap group-[.print]:text-[0.7rem]">
							<code className="p-0! group-[.print]:text-[0.7rem]">
								Because line breaks can be misleading:
								<br />
								![Iris versicolor flower viewed from above](/iris-flower.webp)
							</code>
						</pre>
						<figcaption>
							This mistake is impossible in Iris. (The correct Markdown code
							should have two line breaks.)
						</figcaption>
					</figure>
				</section>
				<section style={{ gridArea: 'features' }}>
					<h2>Base Features</h2>
					<ul>
						<li>
							Iris follows accessibility/typographic guidelines and universal
							design principles [6]
						</li>
						<li>
							Authors can create accessible content with minimal effort:
							Features are available throughout the platform by default
						</li>
						<li>
							Provides a rigid yet flexible document format and editor
							<ul>
								<li>
									Rigid: Many major mistakes (e.g., bad styling and HTML) are
									impossible
								</li>
								<li>Flexible: New rich content types can be added easily</li>
							</ul>
						</li>
						<li>Enforces consistent presentation for all documents</li>
					</ul>
				</section>
				<figure
					className="p-1 group-[.print]:my-0! border-[0.1rem] border-iris-300"
					style={{ gridArea: 'studio' }}
				>
					<figcaption className="mt-0! mb-[calc(var(--paragraph-spacing)/2)] text-lg! group-[.print]:text-[0.8rem]! font-bold">
						Iris Studio: Author/instructor front (editor)
					</figcaption>
					<Image
						src={studio}
						alt="Screenshot of Iris Studio editing the “Typographical Guidelines” article."
					/>
				</figure>
				<figure
					className="p-1 group-[.print]:my-0! border-[0.1rem] border-iris-300"
					style={{ gridArea: 'frontend' }}
				>
					<figcaption className="mt-0! mb-[calc(var(--paragraph-spacing)/2)] text-lg! group-[.print]:text-[0.8rem]! font-bold">
						Website: Reader/student front
					</figcaption>
					<Image
						src={frontend}
						alt="Screenshot of the Iris webpage showing the “Typographical Guidelines” article."
					/>
				</figure>
				{/*
				<figure className="p-1 w-full" style={{ gridArea: 'diagram' }}>
					<Diagram
						role="img"
						aria-label="Diagram of Iris's components, showcasing data flows from authors/readers, Iris Studio (the editor), the website, the backend, and external components like the database, Innostruction [7], and Ollama."
					/>
					<figcaption>Block diagram of Iris.</figcaption>
				</figure>
				*/}
				<section
					className="text-settings px-2"
					style={{ gridArea: 'settings' }}
				>
					<TextSettings />
					<ul>
						<li>Aim to help readers with low vision, dyslexia, etc.</li>
						<li>Provide personalized, comfortable experience to all readers</li>
					</ul>
				</section>
				<section style={{ gridArea: 'llm' }}>
					<h2>LLM Integration</h2>
					<ul>
						<li>User prompts LLM based on text selection</li>
						<li>
							Designed for non-native English speakers and students new to the
							topic
						</li>
						<li>
							Not a replacement for teaching assistants; one-click interface
							acts as a guardrail
						</li>
						<li>
							No arbitrary prompts: Prompt is fetched/templated by the backend
						</li>
						<li>LLM is hosted on campus, ensuring privacy</li>
					</ul>
				</section>
				<figure
					className="label-figure px-2 py-1 group-[.print]:my-0!"
					style={{ gridArea: 'selectprompt' }}
					aria-label="Select to Prompt"
				>
					<span className="label-figure__label" aria-hidden="true">
						Select to Prompt
					</span>
					<div
						className="overflow-auto"
						role="img"
						aria-label="Examples of features: Explain, where a phrase is selected and the LLM responds with its meaning in context, and Simplify, where a passage is selected and the LLM responds with a simpler version of the text."
					>
						<div aria-hidden="true">
							<div className="text-left flex gap-4 items-center">
								<div className="mt-6">
									<p className="text-[0.6rem] w-[22ch]">
										Each node’s value is calculated by the{' '}
										<mark className="relative text-white bg-blue-500">
											<div className="absolute -top-9 left-[50%] -translate-x-[50%] react-aria-Popover text-black no-animation p-1 flex gap-1 text-sm">
												<Button
													className="relative px-1 rounded-md bg-iris-300"
													excludeFromTabOrder
												>
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
								<div className="react-aria-Popover text-black no-animation p-1 text-sm text-[0.6rem] min-w-[18ch]">
									<div className="font-bold">
										Explain <em>weighted sum</em>
									</div>
									<div className="max-h-14 overflow-y-auto">
										In this context, a &quot;weighted sum&quot; refers to the
										process where each input value (like x<sub>1</sub> and x
										<sub>2</sub>) is multiplied by its corresponding weight and
										then summed up. This calculation also includes adding a bias
										term, which helps adjust the node&apos;s activation level
										independently of the inputs. The result of this weighted
										sum, along with the bias, is then passed through an
										activation function to determine the node’s final value in
										the hidden layer.
									</div>
								</div>
							</div>
							<div className="text-left flex gap-4 items-center">
								<div className="mt-4">
									<p className="relative text-[0.6rem] w-[22ch]">
										<mark className="text-white bg-blue-500">
											Each node’s value is calculated by the{' '}
											<div className="absolute -top-9 left-[50%] -translate-x-[50%] react-aria-Popover text-black no-animation p-1 flex gap-1 text-sm">
												<Button
													className="relative px-1 rounded-md bg-iris-300"
													excludeFromTabOrder
												>
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
								<div className="react-aria-Popover text-black no-animation p-1 text-sm text-[0.6rem] min-w-[18ch]">
									<div className="font-bold">Simplify</div>
									<div className="max-h-14 overflow-y-auto">
										The value of each node is found by adding up the values from
										the nodes in the previous layer, using weights, then adding
										a bias. This total is then passed through an activation
										function.
									</div>
								</div>
							</div>
						</div>
					</div>
				</figure>
				<figure
					className="label-figure px-2 py-1 group-[.print]:my-0!"
					style={{ gridArea: 'intextprompt' }}
					aria-label="In-Text Prompt"
				>
					<span className="label-figure__label" aria-hidden="true">
						In-Text Prompt
					</span>
					<div
						className="overflow-auto"
						role="img"
						aria-label="Examples of hint feature, where several prompts like Task?, Purpose?, and Breakdown? are displayed under a section of the text, and the user picks one for the LLM to respond to."
					>
						<div
							className="text-left flex gap-4 items-center"
							aria-hidden="true"
						>
							<div className="text-[0.6rem] w-[25ch]">
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
								<div className="text-[0.6rem] border-l-[0.2rem] border-iris-600 rounded-md px-2 py-1 text-iris-900 mt-1">
									<div className="font-bold mb-1">Hint</div>
									<div className="flex gap-1 items-center">
										<Button
											className="react-aria-Button px-1 py-0.5 text-black"
											excludeFromTabOrder
										>
											Task?
										</Button>
										<Button
											className="react-aria-Button px-1 py-0.5 text-black"
											excludeFromTabOrder
										>
											Purpose?
										</Button>
										<Button
											className="relative react-aria-Button px-1 py-0.5 text-black"
											excludeFromTabOrder
										>
											Breakdown?
											<Pointer className="absolute text-black stroke-white stroke-3 w-4 h-4 -bottom-1 right-3" />
										</Button>
									</div>
								</div>
							</div>
							<ArrowRight className="text-iris-900 w-4 h-4 shrink-0" />
							<div className="text-[0.6rem] border-l-[0.2rem] border-iris-600 rounded-md px-2 py-1 text-iris-900 mt-1">
								<div className="font-bold">Hint</div>
								<p className="max-w-[18ch] max-h-20 overflow-y-auto">
									Start by focusing on functions that help build and manipulate
									the graph structure, such as adding vertices and edges. These
									are often foundational and will make it easier to test and
									expand your implementation. Consider how each function should
									interact with the internal representation of the graph
									you&apos;ve chosen (e.g., adjacency list or matrix).
								</p>
							</div>
						</div>
					</div>
				</figure>
				<section style={{ gridArea: 'eval' }}>
					<h2>Evaluation</h2>
					<ul>
						<li>
							Deployed in CS1/CS2 courses to show assignment instructions,
							conducted 3 surveys
						</li>
						<li>
							Fall 2025 survey: Compares Iris to the previous system in the
							course (Jekyll, Markdown)
						</li>
						<li>
							User Experience Questionnaire (UEQ-S), demographic and
							platform-specific questions
						</li>
					</ul>
				</section>
				<section style={{ gridArea: 'results' }}>
					<figure className="p-2 w-full">
						<Image src={ueqComparison} alt="" />
						<figcaption>
							Comparison of pragmatic, hedonic, and overall UEQ-S scores between
							Iris (left, purple) and Jekyll (right, red).
						</figcaption>
					</figure>
					<h2>Fall 2025 Results & Discussion</h2>
					<ul>
						<li>
							UEQ-S: Statistically significant preference for Iris (<em>N</em> =
							127)
						</li>
						<li>
							Students with disabilities were underrepresented (0 with dyslexia,
							colorblindness)
							<ul>
								<li>
									May be due to response bias and/or underrepresentation in
									course population
								</li>
								<li>
									We plan to conduct research targeted to students with
									disabilities to address this
								</li>
							</ul>
						</li>
						<li>Survey will be repeated in current and future quarters</li>
					</ul>
				</section>
				<section style={{ gridArea: 'references' }}>
					<h2 className="font-normal my-0! text-[0.7rem]! text-left!">
						References
					</h2>
					<div className="references text-xs group-[.print]:text-[0.47rem]">
						<div className="break-inside-avoid">
							[1] Sheryl Burgstahler. 2021. What Higher Education Learned About
							the Accessibility of Online Opportunities During a Pandemic.{' '}
							<em>Journal of Higher Education Theory and Practice</em> 21, 7
							(Aug. 2021).{' '}
							<a href="https://doi.org/10.33423/jhetp.v21i7.4493">
								doi:10.33423/jhetp.v21i7.4493
							</a>
						</div>
						<div className="break-inside-avoid">
							[2] W3C. 2024. Web Content Accessibility Guidelines (WCAG) 2.2.
							Retrieved April 1, 2025 from{' '}
							<a href="https://www.w3.org/TR/WCAG22/">
								https://www.w3.org/TR/WCAG22/
							</a>
						</div>
						<div className="break-inside-avoid">
							[3] Victor Widell. 2016. Dsxyliea. Retrieved April 1, 2025 from{' '}
							<a href="https://geon.github.io/programming/2016/03/03/dsxyliea">
								https://geon.github.io/programming/2016/03/03/dsxyliea
							</a>
						</div>
						<div className="break-inside-avoid">
							[4] Matthew Butterick. 2010. <em>Practical Typography</em>.
							Retrieved April 1, 2025 from{' '}
							<a href="https://practicaltypography.com/">
								https://practicaltypography.com/
							</a>
						</div>
						<div className="break-inside-avoid">
							[5] Zackary Glazewski and Diba Mirza. 2024. Lab 7 Tutorial: A
							Gentle Introduction to Neural Networks. Retrieved April 2, 2025
							from{' '}
							<a href="https://ucsb-cs24-f24.github.io/cs24-f24/lab/lab07-EXTRA/">
								https://ucsb-cs24-f24.github.io/cs24-f24/lab/lab07-EXTRA/
							</a>
							.
						</div>
						<div>
							[6] Centre for Excellence in Universal Design. 2025. The 7
							Principles.{' '}
							<a href="https://universaldesign.ie/about-universal-design/the-7-principles">
								https://universaldesign.ie/about-universal-design/the-7-principles
							</a>
						</div>
						{/*
						<div className="break-inside-avoid">
							[7] Tianle Yu and Maryam Majedi. 2024. Tailored Education: Using
							AI to Manage Large Classes and Support Individual Needs. In{' '}
							<em>AI Community of Practice Spring Symposium 2024</em>, May
							20–24, 2024, Santa Barbara, California. UCSB Office of Teaching &
							Learning, Santa Barbara, CA.
						</div>
						*/}
					</div>
				</section>
			</main>
		</StyleProvider>
	);
}
