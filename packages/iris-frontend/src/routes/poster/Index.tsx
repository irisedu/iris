import { ReactElement, useEffect, useState } from 'react';
import { Button, ToggleButton } from 'iris-components';
import StyleProvider from '$components/StyleProvider';
import TextSettings from '$components/TextSettings';
import useWidellSimulation from './useWidellSimulation';
import Image from '$components/nodes/Image';

import IrisWord from '$assets/iris-word.svg?react';
import Diagram from '$assets/poster/diagram.svg?react';
import QR from '$assets/poster/qr.svg?react';

import studio from '$assets/poster/studio.png';
import frontend from '$assets/poster/frontend.png';
import ueqComparison from '$assets/poster/ueq-comparison.png';

import ArrowRight from '~icons/tabler/arrow-right';
import Pointer from '~icons/tabler/pointer-filled';
import Edit from '~icons/tabler/pencil';
import Braces from '~icons/tabler/braces';
import Right from '~icons/tabler/arrow-badge-right';
import Accessibility from '~icons/tabler/accessible';
import Navigate from '~icons/tabler/list-search';
import Brush from '~icons/tabler/brush';

import './Index.css';

/*
   Print settings:
   - Font: Atkinson Hyperlegible
   - Paragraph spacing: 0.3em
   - Text Settings: Spacing

   Everything else default
*/

function Action({ icon, text }: { icon: ReactElement; text: string }) {
	return (
		<div className="flex items-center gap-4">
			<span className="flex items-center justify-center w-8 h-8 bg-iris-100 text-iris-950 rounded-full">
				{icon}
			</span>
			<span className="font-bold text-lg">{text}</span>
		</div>
	);
}

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
		<StyleProvider className="p-[12mm]">
			<ToggleButton
				className="react-aria-Button absolute top-8 left-8 opacity-0 data-[hovered]:opacity-100 transition-opacity duration-200 z-100"
				isSelected={printLayout}
				onChange={setPrintLayout}
			>
				{printLayout ? 'Column Layout' : 'Print Layout'}
			</ToggleButton>
			{/* Header */}
			<header className="mb-(--paragraph-spacing)">
				<div className="flex flex-col lg:flex-row justify-center items-center lg:gap-8 -mt-2 mb-4 text-center lg:text-left group-[.print]:mb-0">
					<IrisWord className="iris-rotate max-h-[4.5rem] -ml-8 -mr-4 group-[.print]:ml-0" />
					<h1 className="text-2xl leading-tight m-0 lg:mt-2 lg:whitespace-nowrap group-[.print]:mt-0 group-[.print]:text-[2rem]">
						A Content Management System{' '}
						<br className="hidden lg:inline group-[.print]:hidden" />
						Supporting Typography and Accessibility
					</h1>
					<QR className="hidden group-[.print]:inline-block h-16 mr-4" />
				</div>
				<div className="text-iris-900 text-center max-w-full leading-tight">
					Wong Zhao, Maryam Majedi • Embedded Ethics Lab • University of
					California, Santa Barbara
					<br />
					{'{'}wongzhao, majedi{'}'}@ucsb.edu
				</div>
			</header>

			{/* Body */}
			<main>
				<div className="section" style={{ gridArea: 'intro' }}>
					<h2 className="section__title">Introduction</h2>
					<p>
						Our project, Iris, is a course content management system that
						focuses on presentation (typography), interactivity, and
						customization, supporting accessibility.
					</p>
				</div>
				<div className="section" style={{ gridArea: 'background' }}>
					<h2 className="section__title">Background & Motivation</h2>
					<ul>
						<li>
							Students with disabilities in higher education continue to report
							difficulties accessing course content [1]
						</li>
						<li>
							Accessibility features improve usability for those with
							disabilities and can also improve the reading experience for
							everyone [2]
						</li>
						<li>
							Existing solutions (e.g., SensusAccess, integrated with Canvas)
							isolate those with accessibility needs
						</li>
					</ul>
				</div>
				<figure className="label-figure p-2 pt-1" style={{ gridArea: 'look' }}>
					<span className="label-figure__label">Look</span>
					<p className="bad text-left text-xs mx-auto mt-1!">
						<em>
							<strong>
								<u>
									This text contains several exaggerated typographical mistakes.
									Is it difficult for you to read? Can you point any of these
									mistakes out? How does the appearance of this section compare
									to the rest of this poster? Systems like Iris can prevent
									these mistakes through documentation, in-editor errors, and by
									making them impossible to begin with.
								</u>
							</strong>
						</em>
					</p>
				</figure>
				<figure
					className="label-figure px-2 py-1"
					style={{ gridArea: 'dyslexia' }}
				>
					<span className="label-figure__label">Dyslexia</span>
					<p id="dyslexia" className="text-left text-sm mt-1!">
						“But typography can enhance your writing. Typography can create a
						better first impression. Typography can reinforce your key points.
						Typography can extend reader attention. When you ignore typography,
						you’re ignoring an opportunity to improve the effectiveness of your
						writing.”
					</p>
					<figcaption>
						An <em>approximation</em> of dyslexia by Victor Widell [2016]. Text
						by Matthew Butterick [2010]. View animation in interactive poster.
					</figcaption>
				</figure>
				<figure
					className="label-figure px-2 py-1"
					style={{ gridArea: 'jargon' }}
				>
					<span className="label-figure__label">Jargon</span>
					<p className="text-left text-sm mt-1!">
						“Each node’s value is calculated by the{' '}
						<mark className="bg-iris-200 text-black px-0.5">weighted sum</mark>{' '}
						of the values of the previous layer nodes plus a{' '}
						<mark className="bg-iris-200 text-black px-0.5">
							bias followed by an activation
						</mark>
						.”
					</p>
					<figcaption>
						Would you understand this if you were unfamiliar with the topic or a
						non-native English speaker? Text from a CS 24 assignment&nbsp;[5].
					</figcaption>
				</figure>
				<div className="section" style={{ gridArea: 'features' }}>
					<h2 className="section__title">Features</h2>
					<ul>
						<li>Follows accessibility, typographical guidelines [2, 3]</li>
						<li>
							Minimal effort required from authors to make accessible content;
							features available across entire platform
						</li>
						<li>
							Universal design [4]: Features are designed to be part of all
							readers’ experience
						</li>
						<li>
							Rigid yet flexible document format and editor
							<ul>
								<li>
									Rigid: Many typographical mistakes, such as incorrect spacing,
									poor font/color choice, and semantic HTML errors, are
									impossible
								</li>
								<li>Flexible: New rich content types can be added easily</li>
							</ul>
						</li>
					</ul>
				</div>
				<figure className="p-2 bg-blue-100" style={{ gridArea: 'studio' }}>
					<div className="flex gap-13 mb-2 overflow-x-auto">
						<Action icon={<Right />} text="Migrate" />
						<Action icon={<Edit />} text="Edit" />
						<Action icon={<Braces />} text="Preview" />
					</div>
					<Image
						src={studio}
						alt="Screenshot of Iris Studio editing the “Typographical Guidelines” article."
					/>
					<figcaption>
						Author/instructor front: Iris Studio, Iris’s document editor.
					</figcaption>
				</figure>
				<figure className="p-2 bg-red-100" style={{ gridArea: 'frontend' }}>
					<div className="flex gap-6 mb-2 overflow-x-auto">
						<Action icon={<Accessibility />} text="Access" />
						<Action icon={<Navigate />} text="Navigate" />
						<Action icon={<Brush />} text="Customize" />
					</div>
					<Image
						src={frontend}
						alt="Screenshot of the Iris webpage showing the “Typographical Guidelines” article."
					/>
					<figcaption>
						Reader/student front: Iris’s frontend, showing the same document.
					</figcaption>
				</figure>
				<figure className="p-1 w-full" style={{ gridArea: 'diagram' }}>
					<Diagram />
					<figcaption>Block diagram of Iris.</figcaption>
				</figure>
				<div
					className="section text-settings px-2"
					style={{ gridArea: 'settings' }}
				>
					<TextSettings />
					<ul>
						{/*<li>
							Font: Includes options that may help readers with low vision,
							dyslexia
						</li>
						<li>
							Spacing: Compact, open, relaxed presets based on [NEEDSCITATION],
							may help readers with dyslexia
						</li>
						<li>
							Reading ruler: Based on [NEEDSCITATION], may help readers (esp.
							readers with dyslexia) focus on a part of the text
						</li>
						<li>
							Color: Light and dark theme, hue adjustment for personalization
						</li>*/}
						<li>
							Aim to help readers with low vision and dyslexia, and provide
							customization/personalization for everyone
						</li>
					</ul>
				</div>
				<div className="section" style={{ gridArea: 'llm' }}>
					<h2 className="section__title">LLM-Based Features</h2>
					<ul>
						<li>Allow students to query large language models from Iris</li>
						<li>For non-native English speakers, students new to topic</li>
						<li>
							Ethics: Supplement, not replace, course staff
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
						<li>Privacy: LLM is hosted at UCSB; data stays on campus</li>
					</ul>
				</div>
				<figure
					className="label-figure px-2 py-1 w-full"
					style={{ gridArea: 'selectprompt' }}
				>
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
									of the values of the previous layer nodes plus a bias followed
									by an activation.
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
									<sub>2</sub>) is multiplied by its corresponding weight and
									then summed up. This calculation also includes adding a bias
									term, which helps adjust the node&apos;s activation level
									independently of the inputs. The result of this weighted sum,
									along with the bias, is then passed through an activation
									function to determine the node’s final value in the hidden
									layer.
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
										weighted sum of the values of the previous layer nodes plus
										a bias followed by an activation.
									</mark>
								</p>
							</div>
							<ArrowRight className="text-iris-900 w-4 h-4 shrink-0" />
							<div className="react-aria-Popover text-black no-animation p-1 text-sm text-[0.7rem] min-w-[18ch]">
								<div className="font-bold">Simplify</div>
								<div className="max-h-14 overflow-y-auto">
									The value of each node is found by adding up the values from
									the nodes in the previous layer, using weights, then adding a
									bias. This total is then passed through an activation
									function.
								</div>
							</div>
						</div>
					</div>
				</figure>
				<figure
					className="label-figure px-2 py-1 w-full"
					style={{ gridArea: 'intextprompt' }}
				>
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
								Start by focusing on functions that help build and manipulate
								the graph structure, such as adding vertices and edges. These
								are often foundational and will make it easier to test and
								expand your implementation. Consider how each function should
								interact with the internal representation of the graph
								you&apos;ve chosen (e.g., adjacency list or matrix).
							</p>
						</div>
					</div>
				</figure>
				<div className="section" style={{ gridArea: 'eval' }}>
					<h2 className="section__title">Evaluation</h2>
					<ul>
						<li>
							Deployed in CS1/CS2 courses to show assignment instructions and
							conducted 3 surveys
						</li>
						<li>
							Fall 2025 survey: Compares Iris to the previous system used in the
							course (Jekyll, Markdown)
						</li>
						<li>
							Survey evaluates user experience using short User Experience
							Questionnaire (UEQ-S)
						</li>
						<li>
							Also included demographic questions and platform-specific Likert
							scale questions
						</li>
						<li>
							Similar survey will be repeated in current and future quarters
						</li>
					</ul>
				</div>
				<div className="section" style={{ gridArea: 'results' }}>
					<h2 className="section__title">Fall 2025 Results</h2>
					<ul>
						<li>127 respondents</li>
						<li>UEQ-S: Statistically significant preference for Iris</li>
						<li>
							Students with disabilities were underrepresented (0 with dyslexia,
							colorblindness)
						</li>
					</ul>
				</div>
				<figure className="p-2" style={{ gridArea: 'ueqs' }}>
					<Image src={ueqComparison} alt="" />
					<figcaption>
						Comparison of pragmatic, hedonic, and overall UEQ-S scores between
						Iris (left, blue) and Jekyll (right, red).
					</figcaption>
				</figure>
				<div className="section" style={{ gridArea: 'discussion' }}>
					<h2 className="section__title">Discussion</h2>
					<ul>
						<li>
							Underrepresentation of people with disabilities may be due to
							response bias or underrepresentation in overall course population
							<ul>
								<li>
									No conclusive evidence on Iris's effectiveness for students
									with disabilities
								</li>
								<li>
									We plan to conduct targeted research (e.g., by coordinating
									with our university Disabled Students Program) to address this
								</li>
							</ul>
						</li>
					</ul>
				</div>
				<div className="section group-[.print]:hidden">
					TODO:
					<ul>
						<li>
							make the text-like figures accessible using aria-hidden inside
							aria-label element
						</li>
						<li>new citations; update excalidraw</li>
						<li>manual column break so its not completely broken</li>
						<li>light mode screenshots</li>
					</ul>
				</div>
			</main>

			<footer>
				<div className="text-[0.7rem]">References</div>
				<div className="references text-[0.6rem] mb-2">
					<div className="break-inside-avoid">
						[1] Sheryl Burgstahler. 2021. What Higher Education Learned About
						the Accessibility of Online Opportunities During a Pandemic.{' '}
						<em>Journal of Higher Education Theory and Practice</em> 21, 7 (Aug.
						2021).{' '}
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
						.
					</div>
					<div className="break-inside-avoid">
						[3] Matthew Butterick. 2010. <em>Practical Typography</em>.
						Retrieved April 1, 2025 from{' '}
						<a href="https://practicaltypography.com/">
							https://practicaltypography.com/
						</a>
						.
					</div>
					<div>
						[4] Centre for Excellence in Universal Design. 2025. The 7
						Principles.{' '}
						<a href="https://universaldesign.ie/about-universal-design/the-7-principles">
							https://universaldesign.ie/about-universal-design/the-7-principles
						</a>
					</div>
					<div className="break-inside-avoid">
						[5] Victor Widell. 2016. Dsxyliea. Retrieved April 1, 2025 from{' '}
						<a href="https://geon.github.io/programming/2016/03/03/dsxyliea">
							https://geon.github.io/programming/2016/03/03/dsxyliea
						</a>
						.
					</div>
					<div className="break-inside-avoid">
						[6] Zackary Glazewski and Diba Mirza. 2024. Lab 7 Tutorial: A Gentle
						Introduction to Neural Networks. Retrieved April 2, 2025 from{' '}
						<a href="https://ucsb-cs24-f24.github.io/cs24-f24/lab/lab07-EXTRA/">
							https://ucsb-cs24-f24.github.io/cs24-f24/lab/lab07-EXTRA/
						</a>
						.
					</div>
					<div className="break-inside-avoid">
						[7] Tianle Yu and Maryam Majedi. 2024. Tailored Education: Using AI
						to Manage Large Classes and Support Individual Needs. In{' '}
						<em>AI Community of Practice Spring Symposium 2024</em>, May 20–24,
						2024, Santa Barbara, California. UCSB Office of Teaching & Learning,
						Santa Barbara, CA.
					</div>
				</div>
				<div className="text-[0.6em] group-[.print]:-mb-4">
					<strong>This poster was rendered using Iris.</strong> —{' '}
					<span className="text-iris-900">iris.3e.cs.ucsb.edu/poster</span>
				</div>
			</footer>
		</StyleProvider>
	);
}
