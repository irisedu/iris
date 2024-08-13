import { useState } from 'react';

export default function useStorage(storage, key, defaultValue, parseFunc) {
	let storageValue = storage.getItem(key);
	if (storageValue === null) {
		storage.setItem(key, defaultValue);
		storageValue = defaultValue;
	} else if (parseFunc) {
		storageValue = parseFunc(storageValue);
	}

	const [state, setState] = useState(storageValue);

	function setStateWithStorage(value) {
		storage.setItem(key, value);
		setState(value);
	}

	return [state, setStateWithStorage];
}
