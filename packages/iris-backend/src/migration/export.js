/* eslint-disable */
// Put this file at the root of the old-repo container:
// $ dokku enter old-repo
// $ cat <<EOF > export.js
// > ...
// > EOF
// and run it using
// $ dokku enter old-repo web node export.js
const db = require('./db');

(async function () {
	const questions = await db.query('SELECT * FROM repo_questions;');
	const questionHistory = await db.query(
		'SELECT * FROM repo_question_history;'
	);
	const worksheets = await db.query('SELECT * FROM repo_worksheets;');
	const worksheetHistory = await db.query(
		'SELECT * FROM repo_worksheet_history;'
	);
	const tags = await db.query('SELECT * FROM repo_question_tags;');
	const graphics = await db.query('SELECT * FROM repo_question_graphics;');

	console.log(
		JSON.stringify({
			questions,
			questionHistory,
			worksheets,
			worksheetHistory,
			tags,
			graphics: graphics.map((g) => ({
				...g,
				content: g.content ? g.content.toString('base64') : null
			}))
		})
	);
})();
