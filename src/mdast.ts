/**
 * The slice of mdast this package touches.
 *
 * Declared here rather than imported so the package carries no type dependency
 * of its own: the shapes below are the ones remark and Sätteri both build, and
 * a plugin only ever reads a fenced block's language, its text and its line.
 */

export interface Point {
	line: number;
	column: number;
}

export interface Position {
	start: Point;
	end: Point;
}

/** A fenced code block. */
export interface CodeNode {
	type: 'code';
	lang?: string | null | undefined;
	meta?: string | null | undefined;
	value: string;
	position?: Position | undefined;
}

/**
 * One element spliced into the document, as a tree rather than as a string.
 *
 * `mdast-util-to-hast` lets any node override what it converts to through
 * `data.hName` / `data.hProperties` / `data.hChildren`, and MDX runs the very
 * same converter — so an element handed over this way arrives intact on both
 * sides, while a raw `html` node reaches MDX as an unhandled `raw` and fails
 * the build. It is also what frees a host from `allowDangerousHtml`: nothing
 * here is ever a string to be re-parsed.
 */
export interface ElementNode {
	type: 'paragraph';
	children: never[];
	data: {
		hName: string;
		hProperties: Record<string, unknown>;
		hChildren: unknown[];
	};
}

export interface Node {
	type: string;
	children?: Node[] | undefined;
}

export interface Parent extends Node {
	children: Node[];
}
