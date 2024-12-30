interface FileMessage {
	id: string;
	message: string;
}

export default class FileInfo {
	readonly #path: string;
	#messages: FileMessage[] = [];

	constructor(path: string) {
		this.#path = path;
	}

	get path() {
		return this.#path;
	}

	message(msg: FileMessage) {
		this.#messages.push(msg);
	}

	toJSON() {
		return {
			path: this.#path,
			messages: this.#messages
		};
	}
}
