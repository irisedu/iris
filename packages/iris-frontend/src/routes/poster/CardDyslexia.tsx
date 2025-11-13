import { useEffect, useState } from 'react';
import StyleProvider from '$components/StyleProvider';
import { useWidellSimulation } from './Index';
import { Switch } from 'iris-components';

export function Component() {
	const [simulate, setSimulate] = useState(true);

	useEffect(() => {
		document.title = 'Dyslexia Simulation Card • Iris Poster';
	}, []);

	useWidellSimulation(simulate);

	return (
		<StyleProvider className="flex flex-col w-[calc(4in-4mm)] h-[6in] bg-iris-100 p-[0.5cm] hyphens-none">
			<Switch isSelected={simulate} onChange={(val) => setSimulate(val)}>
				Enable simulation
			</Switch>

			<p
				id="dyslexia"
				className="text-left text-[1.2rem] shrink overflow-y-auto"
				key={simulate.toString()}
			>
				“But typography can enhance your writing. Typography can create a better
				first impression. Typography can reinforce your key points. Typography
				can extend reader attention. When you ignore typography, you’re ignoring
				an opportunity to improve the effectiveness of your writing.”
			</p>

			<div className="grow" />

			<div className="font-bold text-center text-[0.9rem]">
				<a href="https://geon.github.io/programming/2016/03/03/dsxyliea">
					Victor Widell’s
				</a>{' '}
				Dyslexia Simulation [3]
			</div>
			<div className="text-center text-xs">
				Text by Matthew Butterick [2010].
			</div>
			<div className="text-center text-iris-900 text-xs">
				iris.3e.cs.ucsb.edu/poster/card-dyslexia
			</div>
		</StyleProvider>
	);
}
