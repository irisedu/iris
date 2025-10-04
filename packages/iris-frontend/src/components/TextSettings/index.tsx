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
	Switch,
	Tabs,
	TabList,
	Tab,
	TabPanel,
	Dropdown,
	ListBoxItem
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
	setTheme,
	setHueShift,
	setRulerEnabled,
	setRulerSettings
} from '$state/prefsSlice';

function TextSettings() {
	const dispatch = useAppDispatch();

	const font = useSelector((state: RootState) => state.prefs.text.font);
	const fontSize = useSelector((state: RootState) => state.prefs.text.fontSize);

	const theme = useSelector((state: RootState) => state.prefs.theme);
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

			<h2 className="m-0">
				Text & Accessibility Settings{' '}
				<Link
					className="text-sm"
					to="/page/iris-user-manual/accessibility/accessibility-settings"
				>
					(info)
				</Link>
			</h2>

			<Tabs className="link-tabs">
				<TabList>
					<Tab id="font">Font</Tab>
					<Tab id="spacing">Spacing</Tab>
					<Tab id="ruler">Reading Ruler</Tab>
					<Tab id="color">Color</Tab>
				</TabList>

				<TabPanel id="font" className="react-aria-TabPanel max-w-72">
					<RadioGroup
						className="react-aria-RadioGroup mb-2"
						aria-label="Font"
						value={font}
						onChange={(val) => dispatch(setFont(val))}
					>
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
				</TabPanel>

				<TabPanel id="spacing">
					<div className="mb-1">Presets</div>
					<div className="flex flex-row flex-wrap gap-2">
						{/* Based on https://dl.acm.org/action/downloadSupplement?doi=10.1145%2F3613904.3642108&file=pn3179-supplemental-material-1.pdf */}
						<Button onPress={() => dispatch(setSpacing(compact))}>
							Compact
						</Button>
						<Button onPress={() => dispatch(setSpacing(open))}>Open</Button>
						<Button onPress={() => dispatch(setSpacing(relaxed))}>
							Relaxed
						</Button>
						<Button onPress={() => setSpacingOpen(true)}>Customize</Button>
					</div>
				</TabPanel>

				<TabPanel id="color" className="react-aria-TabPanel max-w-72">
					<Dropdown
						label="Theme"
						selectedKey={theme}
						onSelectionChange={(key) => dispatch(setTheme(key as string))}
					>
						<ListBoxItem id="auto">Auto</ListBoxItem>
						<ListBoxItem id="light">Light</ListBoxItem>
						<ListBoxItem id="dark">Dark</ListBoxItem>
					</Dropdown>
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
				</TabPanel>

				<TabPanel id="ruler">
					<Switch
						className="react-aria-Switch mb-1"
						isSelected={rulerEnabled}
						onChange={(val) => dispatch(setRulerEnabled(val))}
					>
						Enable Reading Ruler
					</Switch>

					<div className="mb-1">Presets</div>
					<div className="flex flex-row flex-wrap gap-2 mb-2">
						{/* Based on https://dl.acm.org/doi/pdf/10.1145/3544548.3581367 */}
						<Button onPress={() => dispatch(setRulerSettings(lightbox))}>
							Lightbox
						</Button>
						<Button onPress={() => dispatch(setRulerSettings(greyBar))}>
							Gray Bar
						</Button>
						<Button onPress={() => dispatch(setRulerSettings(shade))}>
							Shade
						</Button>
						<Button onPress={() => dispatch(setRulerSettings(underline))}>
							Underline
						</Button>
						<Button onPress={() => setRulerOpen(true)}>Customize</Button>
					</div>
				</TabPanel>
			</Tabs>
		</div>
	);
}

export default TextSettings;
