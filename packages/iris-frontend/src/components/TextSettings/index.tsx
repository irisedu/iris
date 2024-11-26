import { useState } from 'react';
import {
	RadioGroup,
	Label,
	Radio,
	Button,
	Slider,
	SliderOutput,
	SliderThumb,
	SliderTrack,
	Switch
} from 'iris-components';
import { Link } from 'react-router-dom';
import { greyBar, lightbox, shade, underline } from '$state/presets/ruler';
import { compact, open, relaxed } from '$state/presets/text';
import SpacingDialog from './SpacingDialog';
import RulerDialog from './RulerDialog';

import { useSelector } from 'react-redux';
import { useAppDispatch, type RootState } from '$state/store';
import {
	setFont,
	setFontSize,
	setSpacing,
	setHueShift,
	setRulerEnabled,
	setRulerSettings
} from '$state/prefsSlice';

function TextSettings() {
	const dispatch = useAppDispatch();

	const font = useSelector((state: RootState) => state.prefs.text.font);
	const fontSize = useSelector((state: RootState) => state.prefs.text.fontSize);

	const hueShift = useSelector((state: RootState) => state.prefs.hueShift);

	const rulerEnabled = useSelector(
		(state: RootState) => state.prefs.ruler.enabled
	);

	const [spacingOpen, setSpacingOpen] = useState(false);
	const [rulerOpen, setRulerOpen] = useState(false);

	return (
		<div className="font-sans">
			<SpacingDialog isOpen={spacingOpen} setIsOpen={setSpacingOpen} />
			<RulerDialog isOpen={rulerOpen} setIsOpen={setRulerOpen} />

			<h2 className="mt-0 mb-2">
				Text & Accessibility Settings{' '}
				<Link
					className="text-sm"
					to="/page/iris-user-manual/accessibility/accessibility-settings"
				>
					(info)
				</Link>
			</h2>

			<div className="flex flex-row flex-wrap gap-8">
				<div className="flex flex-col min-w-56">
					<RadioGroup
						className="react-aria-RadioGroup mb-2"
						value={font}
						onChange={(val) => dispatch(setFont(val))}
					>
						<Label className="text-lg font-bold">Font</Label>
						<Radio
							value="Vollkorn"
							className="react-aria-Radio font-['Vollkorn']"
						>
							Vollkorn
						</Radio>
						<Radio
							value="Atkinson Hyperlegible"
							className="react-aria-Radio font-['Atkinson_Hyperlegible']"
						>
							Atkinson Hyperlegible
						</Radio>
						<Radio value="Lexend" className="react-aria-Radio font-['Lexend']">
							Lexend
						</Radio>
						<Radio
							value="Comic Sans MS, Comic Neue"
							className="react-aria-Radio"
							style={{ fontFamily: 'Comic Sans MS, Comic Neue' }}
						>
							Comic Sans
						</Radio>
						<Radio
							value="OpenDyslexic"
							className="react-aria-Radio font-['OpenDyslexic']"
						>
							OpenDyslexic
						</Radio>
						<Radio
							value="system-ui"
							className="react-aria-Radio font-[system-ui]"
						>
							System UI
						</Radio>
					</RadioGroup>

					<Slider
						minValue={100}
						maxValue={200}
						step={1}
						value={fontSize}
						onChange={(val) => dispatch(setFontSize(val))}
					>
						<Label>Font Size</Label>
						<SliderOutput className="react-aria-SliderOutput after:content-['%']" />
						<SliderTrack>
							<SliderThumb />
						</SliderTrack>
					</Slider>
				</div>

				<div className="flex flex-col max-w-72">
					<span className="text-lg font-bold">Spacing</span>

					<div className="flex flex-row flex-wrap gap-2">
						{/* Based on https://dl.acm.org/action/downloadSupplement?doi=10.1145%2F3613904.3642108&file=pn3179-supplemental-material-1.pdf */}
						<Button
							className="react-aria-Button bg-iris-200 border-iris-400"
							onPress={() => dispatch(setSpacing(compact))}
						>
							Compact
						</Button>
						<Button
							className="react-aria-Button bg-iris-200 border-iris-400"
							onPress={() => dispatch(setSpacing(open))}
						>
							Open
						</Button>
						<Button
							className="react-aria-Button bg-iris-200 border-iris-400"
							onPress={() => dispatch(setSpacing(relaxed))}
						>
							Relaxed
						</Button>
						<Button
							className="react-aria-Button bg-iris-200 border-iris-400"
							onPress={() => setSpacingOpen(true)}
						>
							Customize
						</Button>
					</div>
				</div>

				<div className="flex flex-col min-w-56">
					<span className="text-lg font-bold">Color</span>

					<Slider
						minValue={0}
						maxValue={360}
						step={1}
						value={hueShift}
						onChange={(val) => dispatch(setHueShift(val))}
					>
						<Label>Interface Hue Shift</Label>
						<SliderOutput />
						<SliderTrack>
							<SliderThumb />
						</SliderTrack>
					</Slider>
				</div>

				<div className="flex flex-col w-56">
					<span className="text-lg font-bold">Reading Ruler</span>

					<Switch
						className="react-aria-Switch mb-1"
						isSelected={rulerEnabled}
						onChange={(val) => dispatch(setRulerEnabled(val))}
					>
						Enable Reading Ruler
					</Switch>

					<div className="flex flex-row flex-wrap gap-2 mb-2">
						{/* Based on https://dl.acm.org/doi/pdf/10.1145/3544548.3581367 */}
						<Button
							className="react-aria-Button bg-iris-200 border-iris-400"
							onPress={() => dispatch(setRulerSettings(lightbox))}
						>
							Lightbox
						</Button>
						<Button
							className="react-aria-Button bg-iris-200 border-iris-400"
							onPress={() => dispatch(setRulerSettings(greyBar))}
						>
							Gray Bar
						</Button>
						<Button
							className="react-aria-Button bg-iris-200 border-iris-400"
							onPress={() => dispatch(setRulerSettings(shade))}
						>
							Shade
						</Button>
						<Button
							className="react-aria-Button bg-iris-200 border-iris-400"
							onPress={() => dispatch(setRulerSettings(underline))}
						>
							Underline
						</Button>
						<Button
							className="react-aria-Button bg-iris-200 border-iris-400"
							onPress={() => setRulerOpen(true)}
						>
							Customize
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default TextSettings;
