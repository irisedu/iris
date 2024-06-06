import { visit } from 'unist-util-visit';
import { headingRank } from 'hast-util-heading-rank';
import { toHtml } from 'hast-util-to-html';
import { select } from 'hast-util-select';
import { VFile } from 'vfile';
import { location } from 'vfile-location';
import { retext } from 'retext';
import retextSmartypants from 'retext-smartypants';
import {
	compose as composeAnnotated,
	defaults as annotationDefaultOptions
} from 'annotatedtext';
import {
	vfileMessage,
	resolveInternalLink,
	internalLinkToPageLink,
	internalLinkToAssetTag,
	langtoolCheck
} from '../../utils.js';
import TeXFileProcessor from '../assets/TeXFileProcessor.js';

// citeOpts is the same options as rehype-citation
export function remarkSetNoCite({ renderer, citeOpts }) {
	return async (_, file) => {
		const frontmatter = file.data.frontmatter;

		if (frontmatter) {
			citeOpts.noCite =
				frontmatter[renderer.config.platform.markdown.noCiteKey];
		} else {
			delete citeOpts.noCite;
		}
	};
}

// Expects MarkdownRenderer as opts
export function remarkLanguageTool(opts) {
	return async (tree, file) => {
		const annotated = composeAnnotated(
			opts.fileContents.toString(),
			tree,
			Object.assign(annotationDefaultOptions, {
				// Based on:
				// - https://github.com/prosegrinder/annotatedtext/blob/main/src/index.ts
				// - https://github.com/prosegrinder/annotatedtext-remark/blob/main/src/index.ts
				// Copyright (c) 2018 David L. Day, MIT License
				annotatetextnode(node, text) {
					if (node.type === 'text' && node.position) {
						return {
							offset: {
								end: node.position.end.offset,
								start: node.position.start.offset
							},
							text: text
								.substring(node.position.start.offset, node.position.end.offset)
								.replace(/\n/g, ' ')
						};
					} else {
						return null;
					}
				},
				interpretmarkup(text) {
					return '\n'.repeat(Math.min(2, (text.match(/\n/g) || []).length));
				}
			})
		);

		let checkResponse;

		try {
			checkResponse = await langtoolCheck(opts.config.user.languagetool, {
				language: 'en-US',
				data: JSON.stringify(annotated)
			});
			if (checkResponse.status !== 200) {
				throw new Error();
			}
		} catch {
			vfileMessage(file, null, 'langtool-failed', 'LanguageTool check failed');
			return;
		}

		// https://languagetool.org/http-api/swagger-ui/#!/default/post_check
		const result = await checkResponse.json();
		if (!result.matches) {
			return;
		}

		const place = location(new VFile(opts.fileContents));

		for (const match of result.matches) {
			const start = place.toPoint(match.offset);
			const end = place.toPoint(match.offset + match.length);

			const msg = file.message(match.message, {
				source: 'languagetool',
				place: {
					start,
					end
				},
				ruleId: match.rule && match.rule.id
			});

			msg.name = `${start.line}:${start.column}-${end.line}:${end.column}`;
			msg.replacements = match.replacements;
			msg.rule = match.rule;
		}
	};
}

// Expects MarkdownRenderer as opts
export function remarkSmartypantsFrontmatter(opts) {
	return async (_, file) => {
		for (const key of opts.config.platform.markdown.smartypantsFrontmatter) {
			file.data.frontmatter[key] =
				file.data.frontmatter[key] &&
				(
					await retext()
						.use(retextSmartypants, opts.smartypantsOptions)
						.process(file.data.frontmatter[key])
				).value;
		}
	};
}

export function rehypeAddReferencesHeading() {
	return (tree) => {
		const references = select('div.references', tree);
		if (!references) {
			return;
		}

		references.children.unshift({
			type: 'element',
			tagName: 'h2',
			properties: {},
			children: [
				{
					type: 'text',
					value: 'References'
				}
			]
		});
	};
}

// Expects MarkdownRenderer as opts
export function rehypeTransformLinks(opts) {
	return (tree, file) => {
		visit(tree, (node) => {
			if (node.type !== 'element') {
				return;
			}

			const assetTags = {
				img: 'src'
			};

			if (node.tagName === 'a') {
				const href = node.properties.href;
				if (!href) {
					return;
				}

				const internalLink = resolveInternalLink(href, opts.filePath);
				if (internalLink) {
					const links = file.data.links || (file.data.links = []);
					const hashSplit = internalLink.slice(1).split('#');
					if (hashSplit.length > 1) {
						links.push(hashSplit.slice(0, -1).join('#'));
					} else {
						links.push(hashSplit[0]);
					}

					node.properties.href = internalLinkToPageLink(internalLink);
				}
			} else if (assetTags[node.tagName]) {
				// Replace asset links to make handling with web frameworks easier
				const linkProperty = assetTags[node.tagName];
				const link = node.properties[linkProperty];
				if (!link) {
					return;
				}

				let internalLink = resolveInternalLink(link, opts.filePath);

				if (internalLink) {
					if (new TeXFileProcessor(opts.config).handlesFile(internalLink)) {
						internalLink = TeXFileProcessor.getOutputPath(internalLink);
					}

					const assetTag = internalLinkToAssetTag(internalLink);
					node.properties[linkProperty] = `####${assetTag}####`;

					const assets = file.data.assets || (file.data.assets = {});
					assets[assetTag] = internalLink;
				}
			}
		});
	};
}

export function rehypeExternalLinkHandler() {
	return (tree) => {
		visit(tree, (node) => {
			if (node.type !== 'element' || node.tagName !== 'a') {
				return;
			}

			const href = node.properties.href;

			try {
				// eslint-disable-next-line no-new
				new URL(href);
				const className =
					node.properties.className || (node.properties.className = []);
				className.push('external');
			} catch {
				// Nothing
			}
		});
	};
}

export function rehypeImageLazyLoading() {
	return (tree) => {
		visit(tree, (node) => {
			if (node.type !== 'element' || node.tagName !== 'img') {
				return;
			}

			node.properties.loading = 'lazy';
		});
	};
}

export function rehypeExtractSummary() {
	return (tree, file) => {
		const summaryNode = select('#patchouli-summary', tree);
		if (!summaryNode) {
			return;
		}

		const summary = [];
		let section;

		function processList(listNode, children) {
			for (const li of listNode.children) {
				if (li.type !== 'element') {
					continue;
				}
				if (li.tagName !== 'li') {
					vfileMessage(
						file,
						li,
						'summary-invalid-element',
						`Unexpected element in summary list: '${li.tagName}'`
					);
				}

				let link;

				for (const liChild of li.children) {
					if (liChild.type !== 'element') {
						continue;
					}

					if (liChild.tagName === 'a') {
						if (link) {
							children.push(link);
						}

						link = {
							title: toHtml(liChild.children),
							href: liChild.properties.href
								? liChild.properties.href
								: undefined
						};
					} else if (liChild.tagName === 'ul') {
						if (!link) {
							vfileMessage(
								file,
								liChild,
								'summary-list-before-link',
								'Unexpected child list before any links in summary list item'
							);
						}

						const linkChildren = link.children || (link.children = []);
						processList(liChild, linkChildren);
					} else {
						vfileMessage(
							file,
							liChild,
							'summary-invalid-element',
							`Unexpected element in summary list item: '${liChild.tagName}'`
						);
					}
				}

				children.push(link);
			}
		}

		for (const child of summaryNode.children) {
			if (child.type !== 'element') {
				vfileMessage(
					file,
					child,
					'summary-invalid-child-type',
					`Invalid child type for summary directive: expected 'element', got '${child.type}'`
				);
				return;
			}

			if (child.tagName === 'h2') {
				if (section) {
					summary.push(section);
				}

				section = {
					title: toHtml(child.children)
				};
			} else if (child.tagName === 'ul') {
				if (!section) {
					section = {
						topLevel: true
					};
				}

				const children = section.children || (section.children = []);
				processList(child, children);
			} else {
				vfileMessage(
					file,
					child,
					'summary-invalid-element',
					`Unexpected element in summary directive: '${child.tagName}'`
				);
			}
		}

		summary.push(section);
		summaryNode.children = [];

		file.data.summary = summary;
	};
}

function isFootnote(node) {
	return (
		node.type === 'element' &&
		node.tagName === 'sup' &&
		node.children.some(
			(c) =>
				c.type === 'element' &&
				c.tagName === 'a' &&
				c.properties.dataFootnoteRef
		)
	);
}

export function rehypeExtractToc() {
	return (tree, file) => {
		const toc = [];
		const currentStack = [];

		visit(tree, (node) => {
			const rank = headingRank(node);
			if (!rank) {
				return;
			}

			const heading = {
				rank,
				data: {
					id: node.properties.id,
					value: toHtml(node.children.filter((c) => !isFootnote(c)))
				}
			};

			while (currentStack.length && currentStack.at(-1).rank >= rank) {
				currentStack.pop();
			}

			if (currentStack.length) {
				const children =
					currentStack.at(-1).data.children ||
					(currentStack.at(-1).data.children = []);
				children.push(heading.data);
			} else {
				toc.push(heading.data);
			}

			currentStack.push(heading);
		});

		file.data.toc = toc;
	};
}
