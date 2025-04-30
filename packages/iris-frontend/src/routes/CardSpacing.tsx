import { CSSProperties, useEffect, useState } from 'react';
import StyleProvider from '$components/StyleProvider';
import { compact, open, relaxed } from '$state/presets/text';
import { Button } from 'iris-components';

import Pointer from '~icons/tabler/pointer-filled';

const presetMap: Record<string, typeof compact> = {
	compact,
	open,
	relaxed
};

export function Component() {
	const [preset, setPreset] = useState('compact');
	const presetObj = presetMap[preset];
	const style = {
		letterSpacing: presetObj.charSpacing + 'em',
		wordSpacing:
			presetObj.wordSpacing < 0 ? 'normal' : presetObj.wordSpacing + 'em',
		'--line-height': presetObj.lineSpacing.toString(),
		'--paragraph-spacing': presetObj.paragraphSpacing + 'em'
	} as CSSProperties;

	useEffect(() => {
		document.title = 'Spacing Customization Card • Iris Poster';
	}, []);

	return (
		<StyleProvider className="flex flex-col w-[4in] h-[6in] bg-iris-100 p-[0.5cm] hyphens-none">
			<div className="flex flex-row flex-wrap gap-2 mb-2">
				<Button
					onPress={() => setPreset('compact')}
					className="react-aria-Button relative"
				>
					Compact
					{preset === 'compact' && (
						<Pointer className="absolute text-black stroke-white stroke-3 w-4 h-4 bottom-0 right-0" />
					)}
				</Button>
				<Button
					onPress={() => setPreset('open')}
					className="react-aria-Button relative"
				>
					Open
					{preset === 'open' && (
						<Pointer className="absolute text-black stroke-white stroke-3 w-4 h-4 bottom-0 right-0" />
					)}
				</Button>
				<Button
					onPress={() => setPreset('relaxed')}
					className="react-aria-Button relative"
				>
					Relaxed
					{preset === 'relaxed' && (
						<Pointer className="absolute text-black stroke-white stroke-3 w-4 h-4 bottom-0 right-0" />
					)}
				</Button>
			</div>
			<div className="shrink overflow-y-auto" style={style}>
				<p className="text-sm font-bold leading-normal">
					Which spacing do you prefer?
				</p>

				<p className="text-sm leading-normal">
					Iris’s “Compact, Open, and Relaxed” spacing settings and reading ruler
					implementation are based on work by Adobe Research.
				</p>

				<ul className="text-[0.7rem] leading-normal">
					<li>
						Cai, T., Niklaus, A. G., Kerr, B., Kraley, M., and Bylinskii, Z. COR
						Themes for Readability from Iterative Feedback. In{' '}
						<em>
							Proceedings of the 2024 CHI Conference on Human Factors in
							Computing Systems
						</em>{' '}
						(New York, NY, USA, May 2024), CHI ’24, Association for Computing
						Machinery, pp. 1–23.
					</li>
					<li>
						Niklaus, A. G., Cai, T., Bylinskii, Z., and Wallace, S. Digital
						Reading Rulers: Evaluating Inclusively Designed Rulers for Readers
						With Dyslexia and Without. In{' '}
						<em>
							Proceedings of the 2023 CHI Conference on Human Factors in
							Computing Systems
						</em>{' '}
						(New York, NY, USA, Apr. 2023), CHI ’23, Association for Computing
						Machinery, pp. 1–17.
					</li>
				</ul>
			</div>

			<div className="grow" />

			<div className="font-bold text-center text-[0.9rem]">
				“Compact, Open, and Relaxed” spacing
			</div>
			<div className="text-center text-iris-900 text-xs">
				iris.3e.cs.ucsb.edu/poster/card-spacing
			</div>
		</StyleProvider>
	);
}
