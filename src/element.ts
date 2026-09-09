/**
 * The emitted markup, as a tree.
 *
 * A remark plugin's obvious move is to swap the fence for a raw `html` node,
 * and it is the wrong one twice over. MDX has no raw HTML — Docusaurus compiles
 * even `.md` through MDX — so such a node arrives as an unhandled `raw` and
 * fails the build outright. And where raw HTML *is* allowed, it is re-parsed as
 * whatever the page is: under MDX that means smart punctuation turning the
 * `--lini-*` custom properties inside each SVG's own stylesheet into en dashes
 * and its font names into curly quotes, landing the figure on the page as
 * unstyled text.
 *
 * So the HTML is parsed here, once, and handed over as elements.
 * `mdast-util-to-hast` honours `data.hName` / `hProperties` / `hChildren` on any
 * node, and MDX runs that same converter, so the tree passes through both
 * unchanged — and a host needs no `allowDangerousHtml` to accept it.
 */

import { fromHtml } from 'hast-util-from-html';

import type { ElementNode } from './mdast.js';

/** A hast element, as `fromHtml` builds it. */
interface HastElement {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: unknown[];
}

/**
 * Parse a fragment into one mdast node per top-level element.
 *
 * `renderFence` returns exactly one element, and the stylesheet — when it
 * rides along — is a second: keeping them as two nodes puts the same markup on
 * the page that the string held, with no wrapper invented to hold them.
 */
export function elements(html: string): ElementNode[] {
	const root = fromHtml(html, { fragment: true }) as { children?: HastElement[] };
	const out: ElementNode[] = [];
	for (const node of root.children ?? []) {
		if (node.type !== 'element' || !node.tagName) continue;
		out.push({
			type: 'paragraph',
			children: [],
			data: {
				hName: node.tagName,
				hProperties: node.properties ?? {},
				hChildren: node.children ?? [],
			},
		});
	}
	return out;
}
