// pnpx nodemon -r dotenv/config src/migration/mapping.ts
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const d = JSON.parse(
	fs.readFileSync(path.join(import.meta.dirname, 'dump.json'), 'utf-8')
);
const m = JSON.parse(
	fs.readFileSync(path.join(import.meta.dirname, 'mapping.json'), 'utf-8')
);
m.authorNames ||= {};
m.examWorksheets ||= {};
m.examQuestions ||= {};

const examCourses = ['Exams', 'EXAMS', 'CS16s24mt', 'CS16s24fn'];

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const courses = new Set<string>();
const authors = new Set<string>();

for (const q of d.questions) {
	courses.add(q.course);
	if (q.author) authors.add(q.author);
}

for (const q of d.questionHistory) {
	if (q.author) authors.add(q.author);
}

for (const w of d.worksheets) {
	courses.add(w.course);
}

for (const w of d.worksheetHistory) {
	if (w.author) authors.add(w.author);
}

(async function () {
	let changed = false;
	const unmappedAuthors = [...authors].filter((a) => !m.authorNames[a]);
	if (unmappedAuthors.length) {
		console.log('Mapping authors...');

		for (const username of unmappedAuthors) {
			process.stdout.write(`Name of ${username}? `);
			const it = rl[Symbol.asyncIterator]();
			const name = (await it.next()).value;

			if (name && name.length) {
				m.authorNames[username] = name;
				changed = true;
			} else {
				break;
			}
		}
	}

	const unmappedWorksheets = d.worksheets.filter(
		(w: any) => examCourses.includes(w.course) && !m.examWorksheets[w.id] // eslint-disable-line @typescript-eslint/no-explicit-any
	);
	if (unmappedWorksheets.length) {
		console.log('Mapping worksheets...');

		for (const worksheet of unmappedWorksheets) {
			process.stdout.write(`What course for ${worksheet.name}? `);

			const it = rl[Symbol.asyncIterator]();
			const course = (await it.next()).value;

			if (course && course.length) {
				m.examWorksheets[worksheet.id] = course;
				changed = true;
			} else {
				break;
			}
		}
	}

	const unmappedQuestions = d.questions.filter(
		(q: any) => examCourses.includes(q.course) && !m.examQuestions[q.id] // eslint-disable-line @typescript-eslint/no-explicit-any
	);
	if (unmappedQuestions.length) {
		console.log('Mapping questions...');

		for (const question of unmappedQuestions) {
			console.log(
				'================================================================================'
			);
			console.log(question.content);
			console.log(
				'================================================================================'
			);
			console.log(`#${question.id} in ${question.course}`);

			const worksheet = d.worksheets.find(
				(
					w: any // eslint-disable-line @typescript-eslint/no-explicit-any
				) =>
					JSON.parse(w.content).questions?.some(
						(q: any) => q.fileName == question.id // eslint-disable-line @typescript-eslint/no-explicit-any
					)
			);
			let approved = false;

			if (worksheet) {
				const guessCourse = m.examWorksheets[worksheet.id] ?? worksheet.course;
				// process.stdout.write(`Found course ${guessCourse}, OK? (y/n/Quit) `);
				console.log(`Found course ${guessCourse}`);

				// const it = rl[Symbol.asyncIterator]();
				// const ok = (await it.next()).value;
				// if (ok === 'y') {
				m.examQuestions[question.id] = guessCourse;
				approved = true;
				changed = true;
				// } else if (ok === '') {
				// 	break;
				// }
			}

			if (!approved) {
				process.stdout.write(`What course? `);

				const it = rl[Symbol.asyncIterator]();
				const course = (await it.next()).value;

				if (course && course.length) {
					m.examQuestions[question.id] = course;
					changed = true;
				} else {
					break;
				}
			}
		}
	}

	if (changed) {
		fs.writeFileSync(
			path.join(import.meta.dirname, 'mapping.json'),
			JSON.stringify(m)
		);
	}
})();
