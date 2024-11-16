import path from 'path';
import fs from 'fs';
import * as checker from 'license-checker-rseidelsohn';

function makeListItem(pkg, info, comment) {
	let note = ' ';

	if (info.publisher) {
		note += 'by ' + info.publisher;
	}

	if (info.licenses) {
		note += `, ${info.licenses} License`;
	}

	if (comment) {
		note += ': ' + comment;
	}

	return {
		type: 'list_item',
		content: [
			{
				type: 'paragraph',
				content: [
					{
						type: 'text',
						marks: [
							...(info.repository
								? [
										{
											type: 'link',
											attrs: {
												href: info.repository
											}
										}
									]
								: []),
							{
								type: 'code'
							}
						],
						text: pkg
					},
					{
						type: 'text',
						text: note
					}
				]
			}
		]
	};
}

function makeAttributionsFile(special, other) {
	return {
		version: 1,
		data: {
			type: 'doc',
			content: [
				{
					type: 'frontmatter',
					content: [
						{
							type: 'title',
							content: [
								{
									type: 'text',
									text: 'Open Source Attributions'
								}
							]
						},
						{
							type: 'frontmatter_attributes',
							attrs: {
								data: null
							}
						}
					]
				},
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							text: 'Iris owes much of its functionality to the open source community. Thank you!'
						}
					]
				},
				{
					type: 'heading',
					attrs: {
						level: 2
					},
					content: [
						{
							type: 'text',
							text: 'Special thanks'
						}
					]
				},
				{
					type: 'bullet_list',
					content: special
				},
				{
					type: 'heading',
					attrs: {
						level: 2
					},
					content: [
						{
							type: 'text',
							text: 'Other packages'
						}
					]
				},
				{
					type: 'bullet_list',
					content: other
				}
			]
		}
	};
}

const specialPackages = {
	'prosemirror-view': 'The WYSIWYM editor framework that makes Iris possible',
	katex: "The typesetting system for Iris's math",
	'license-checker-rseidelsohn':
		'The package license finder that helped create this page',
	react: "User interface library for Iris's frontend and editor"
};

checker.init(
	{
		start: path.join(import.meta.dirname, '..')
	},
	(err, packages) => {
		if (err) {
			console.error(err);
			return;
		}

		const specialList = [];
		const otherList = [];

		for (const [pkg, info] of Object.entries(packages)) {
			const pkgName = pkg.split('@').slice(0, -1).join('@');

			const specialComment = specialPackages[pkgName];
			const listItem = makeListItem(pkg, info, specialComment);

			if (specialComment) {
				specialList.push(listItem);
			} else {
				otherList.push(listItem);
			}
		}

		fs.writeFileSync(
			path.join(
				import.meta.dirname,
				'../docs/iris-user-manual/credits/oss-attributions.iris'
			),
			JSON.stringify(makeAttributionsFile(specialList, otherList))
		);
	}
);
