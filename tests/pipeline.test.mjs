/**
 * The plugin in a bare unified pipeline, held against the `lini` binary.
 *
 * The claim this package makes is that a fence draws what the compiler draws —
 * so the test compiles the same source both ways and demands the same figure,
 * the proof `tests/wasm.rs` already runs one level down between the WebAssembly
 * artifact and the binary. Anything this package does to the source on the way
 * past — the line padding, the asset table — has to survive that comparison.
 *
 * It compares trees rather than bytes, and the difference is not a loosening.
 * The plugin hands its markup to the host as parsed elements, because MDX has
 * no raw HTML; serialising a tree writes `<defs></defs>` where the compiler
 * wrote `<defs/>`. Same element, same attributes, same DOM. So both sides go
 * through the one parser and the one serialiser, and any difference left is a
 * real one.
 *
 * The binary is found at `LINI_BIN`, or the sibling checkout's release build.
 * Without one the comparisons skip, unless `LINI_BIN_REQUIRED=1` says a missing
 * binary is a failure rather than a quiet pass — the same switch
 * `LINI_WASM_REQUIRED` throws in the compiler's own suite.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { remarkLini } from '../dist/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, 'fixtures');
const BIN = process.env.LINI_BIN ?? join(HERE, '../../lini/target/release/lini');
const REQUIRED = process.env.LINI_BIN_REQUIRED === '1';

/** Render Markdown through the plugin, as a site's own pipeline would. */
function render(markdown, path) {
	return unified()
		.use(remarkParse)
		.use(remarkLini)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeStringify, { allowDangerousHtml: true })
		.processSync({ value: markdown, path })
		.toString();
}

/**
 * The compiled figure in a rendered page.
 *
 * The wrapper's toggle carries an inline icon, so "the first `<svg>`" is the
 * chevron, not the figure. Only the compiler's own output is a standalone
 * document with an `xmlns`.
 */
function svgOf(html) {
	const at = html.indexOf('<svg xmlns=');
	const end = html.lastIndexOf('</svg>');
	assert.ok(at !== -1 && end !== -1, 'the page has no figure');
	return html.slice(at, end + '</svg>'.length);
}

/** One spelling for both sides: parsed, then serialised the same way. */
function normalise(svg) {
	return toHtml(fromHtml(svg, { fragment: true }));
}

/**
 * What the binary draws for `source`, compiled in `dir` so a local `src:`
 * resolves against the same directory the Markdown file gave the plugin.
 */
function binary(source, dir) {
	const file = join(dir ?? mkdtempSync(join(tmpdir(), 'remark-lini-')), 'fence.lini');
	writeFileSync(file, source);
	return execFileSync(BIN, [file], { encoding: 'utf8' });
}

const available = existsSync(BIN);
if (!available && REQUIRED) throw new Error(`LINI_BIN_REQUIRED=1 but no binary at ${BIN}`);
const compare = { skip: available ? false : `no lini binary at ${BIN}` };

// A fence on line 1 means the source starts on line 2, so the plugin pads it
// with one blank line to keep diagnostics pointing at the .md. The binary is
// handed that same padded source: the padding is part of what must not change
// the figure.
const FENCE = 'a -> b\n';
const PAGE = '```lini\n' + FENCE + '```\n';
const PADDED = '\n' + FENCE;

test('a fence draws what the binary draws', compare, () => {
	assert.equal(normalise(svgOf(render(PAGE, 'page.md'))), normalise(binary(PADDED).trimEnd()));
});

test('a local image reaches the compiler as bytes', compare, () => {
	const fence = '|image| { src: "logo.svg"; width: 40; height: 40 }\n';
	const page = '```lini\n' + fence + '```\n';
	const html = render(page, join(FIXTURES, 'page.md'));
	const svg = svgOf(html);
	assert.match(svg, /data:image\/svg\+xml|<svg/, 'the image did not embed');
	assert.equal(normalise(svg), normalise(binary('\n' + fence, FIXTURES).trimEnd()));
});

test('an unreadable image is the compiler\'s own error, not a thrown build', () => {
	const page = '```lini\n|image| { src: "nope.svg"; width: 10; height: 10 }\n```\n';
	const html = render(page, join(FIXTURES, 'page.md'));
	assert.match(html, /lini-error/, 'a failed figure should render an error box');
	assert.match(html, /nope\.svg/, 'the message should name the file');
});

// Every compiled figure carries a `<style>` of its own — the scoped defaults
// the SVG travels with — so the bundled sheet is counted by the one line only
// it declares: the layer order `liniCss` fixes up front.
const SHEET = /@layer lini\.defaults,\s*remark-lini;/g;

test('a page without a fence gets no stylesheet', () => {
	const html = render('# Just prose\n', 'page.md');
	assert.equal(html.match(SHEET), null, 'style should ride only on pages with a figure');
});

test('a page with two fences carries the stylesheet once', () => {
	const html = render(PAGE + '\n' + PAGE, 'page.md');
	assert.equal(html.match(SHEET)?.length, 1, 'one bundled sheet per page');
});
