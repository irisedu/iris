import { useEffect } from 'react';

// Dyslexia approximation
// https://raw.githubusercontent.com/geon/geon.github.com/refs/heads/master/_posts/2016-03-03-dsxyliea.md
// Provided under MIT/Public Domain: https://github.com/geon/geon.github.com/issues/7
export default function (simulate?: boolean) {
	useEffect(() => {
		if (simulate === false) return;

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
	}, [simulate]);
}
