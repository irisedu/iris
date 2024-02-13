export default class TaskRunner {
    #tasks = [];

    async run() {
        const all = (await Promise.all(this.#tasks.map(t => t.build()))).filter(vf => vf);
        const vfiles = all.reduce((acc, curr) => {
            if (Array.isArray(curr)) {
                return acc.concat(curr);
            } else {
                acc.push(curr);
                return acc;
            }
        }, []);

        return vfiles;
    }

    push(task) {
        this.#tasks.push(task);
    }

    count() {
        return this.#tasks.length;
    }
}
