import {
	RadioGroup,
	Label,
	Radio,
	Button,
	Slider,
	SliderOutput,
	SliderThumb,
	SliderTrack
} from 'react-aria-components';

import { useSelector } from 'react-redux';
import { useAppDispatch, type RootState } from '$state/store';
import {
	setFont,
	setFontSize,
	setCharSpacing,
	setWordSpacing,
	setLineSpacing
} from '$state/prefsSlice';

function TextSettings() {
	const dispatch = useAppDispatch();
	const font = useSelector((state: RootState) => state.prefs.text.font);
	const fontSize = useSelector((state: RootState) => state.prefs.text.fontSize);
	const charSpacing = useSelector(
		(state: RootState) => state.prefs.text.charSpacing
	);
	const wordSpacing = useSelector(
		(state: RootState) => state.prefs.text.wordSpacing
	);
	const lineSpacing = useSelector(
		(state: RootState) => state.prefs.text.lineSpacing
	);

	return (
		<div className="font-sans">
			<h2 className="my-0">Text & Accessibility Settings</h2>

			<div className="flex flex-row flex-wrap gap-8">
				<div className="flex flex-col gap-2">
					<RadioGroup
						className="react-aria-RadioGroup"
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

				<div className="flex flex-col">
					<span className="text-lg font-bold">Spacing</span>

					<span>Presets</span>

					<div className="flex flex-row flex-wrap gap-2 mb-2">
						{/* Based on https://dl.acm.org/action/downloadSupplement?doi=10.1145%2F3613904.3642108&file=pn3179-supplemental-material-1.pdf */}
						<Button
							className="react-aria-Button bg-iris-200 border-iris-400"
							onPress={() => {
								dispatch(setCharSpacing(0));
								dispatch(setWordSpacing(-0.01));
								dispatch(setLineSpacing(1.4));
							}}
						>
							Compact
						</Button>
						<Button
							className="react-aria-Button bg-iris-200 border-iris-400"
							onPress={() => {
								dispatch(setCharSpacing(0.02));
								dispatch(setWordSpacing(0.2));
								dispatch(setLineSpacing(2.2));
							}}
						>
							Open
						</Button>
						<Button
							className="react-aria-Button bg-iris-200 border-iris-400"
							onPress={() => {
								dispatch(setCharSpacing(0.04));
								dispatch(setWordSpacing(0.3));
								dispatch(setLineSpacing(4.5));
							}}
						>
							Relaxed
						</Button>
					</div>

					<span>Custom Spacing</span>

					<div className="flex flex-col gap-2">
						<Slider
							minValue={0}
							maxValue={0.1}
							step={0.005}
							value={charSpacing}
							onChange={(val) => dispatch(setCharSpacing(val))}
						>
							<Label>Character Spacing</Label>
							<SliderOutput className="react-aria-SliderOutput after:content-['em']" />
							<SliderTrack>
								<SliderThumb />
							</SliderTrack>
						</Slider>

						<Slider
							minValue={-0.01}
							maxValue={0.5}
							step={0.01}
							value={wordSpacing}
							onChange={(val) => dispatch(setWordSpacing(val))}
						>
							<Label>Word Spacing</Label>
							{wordSpacing < 0 ? (
								<span className="react-aria-SliderOutput">font default</span>
							) : (
								<SliderOutput className="react-aria-SliderOutput after:content-['em']" />
							)}
							<SliderTrack>
								<SliderThumb />
							</SliderTrack>
						</Slider>

						<Slider
							minValue={1}
							maxValue={5}
							step={0.1}
							value={lineSpacing}
							onChange={(val) => dispatch(setLineSpacing(val))}
						>
							<Label>Line Spacing</Label>
							<SliderOutput />
							<SliderTrack>
								<SliderThumb />
							</SliderTrack>
						</Slider>
					</div>
				</div>
			</div>
		</div>
	);
}

export default TextSettings;
