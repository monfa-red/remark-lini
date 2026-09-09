#!/usr/bin/env node
/**
 * Check that Docusaurus' build accepted the markup the plugin emitted.
 *
 * `tests/pipeline.test.mjs` proves the plugin draws what the compiler draws.
 * This proves the other half: that a real framework carries the emitted HTML to
 * a real page intact. The two failures worth a whole fixture site are both
 * silent and both total.
 *
 * A blank line ends an HTML block in CommonMark, and idiomatic Lini is full of
 * them. A listing carrying one literally would spill the rest of the page out
 * of the figure and strand the closing tags at the foot of it — no error from
 * anything, and a site that still builds.
 *
 * And MDX re-parses what it is handed as MDX: smart punctuation would turn the
 * `--lini-*` custom properties inside each SVG's own stylesheet into en dashes
 * and its font names into curly quotes, landing the figure on the page as
 * unstyled text. That is why the main fixture page is `.mdx`, and why the check
 * is paired with a control — the prose must show the smart punctuation the
 * figures must not, or it passes on a page where nothing was transformed.
 *
 * Usage: node verify.mjs <the site's build directory>
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];

/** Collect rather than throw, so one run reports every failure it found. */
function want(condition, what) {
	if (!condition) failures.push(what);
}

function count(haystack, needle) {
	return haystack.split(needle).length - 1;
}

/**
 * The page, twice.
 *
 * `counted` has the `<style>` blocks taken out: the stylesheet rides along on
 * every page with a figure and names every class the counts below look for, so
 * left in it poisons all of them. `html` keeps them, because one of those
 * blocks is each SVG's own — the very thing the smart-punctuation check reads.
 */
function page(build, route) {
	const html = readFileSync(join(build, route, 'index.html'), 'utf8');
	return { html, counted: html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '') };
}

/** The prose is smart-punctuated; nothing inside a figure may be. */
const SMART = ['–', '—', '‘', '’', '“', '”'];

/** Every figure on the page, from its wrapper to the end of the SVG inside it. */
function figures(html) {
	return html.match(/<div class="lini-figure"[^>]*>[\s\S]*?<\/svg>/g) ?? [];
}

const build = process.argv[2];
if (!build) {
	console.error('usage: node verify.mjs <build dir>');
	process.exit(2);
}

const good = page(build, 'figures');
const broken = page(build, 'broken');

// Six fences draw; `code-only` is the one that never reaches the compiler.
want(count(good.counted, '<div class="lini-figure"') === 5, 'expected 5 figures');
want(count(good.counted, '<div class="lini-source">') === 5, 'expected 5 listings');
want(count(good.counted, 'class="lini-view-toggle"') === 2, 'expected 2 toggles');
want(count(good.counted, '<div class="lini-figure-block lini-open">') === 2, 'expected 2 compound blocks');

// The compiler ran on every block that draws and none of them failed. Paired
// with the error box on `broken`, which proves the box is still emitted at all
// — without that, this passes on a build that lost the ability to say so.
want(count(good.counted, 'lini-error') === 0, 'an error box on the good page');
want(count(broken.counted, 'lini-error') === 1, 'no error box on the broken page');

// The SVG is *in* the page — not an <img>, not a placeholder — and carries real
// geometry rather than an empty shell.
want(count(good.counted, '<svg xmlns="http://www.w3.org/2000/svg"') === 5, 'expected 5 inline SVGs');
want(/<path |<rect |<ellipse |<polygon /.test(good.counted), 'the figures have no geometry');

// The local image reached the compiler: its gradient is inside the page.
want(good.counted.includes('linearGradient'), 'the local image did not embed');

// A blank line inside a listing did not end the HTML block and spill the page.
want(count(good.counted, '</div>') >= count(good.counted, '<div class="lini-'), 'a figure block was not closed');

// The control, and the thing it controls for.
want(SMART.some((c) => good.html.includes(c)), 'the prose was not smart-punctuated — the control is dead');
for (const svg of figures(good.html)) {
	for (const c of SMART) want(!svg.includes(c), `a figure carries smart punctuation (${c})`);
}
want(good.html.includes('--lini-'), 'the SVG stylesheet lost its custom properties');

if (failures.length) {
	console.error('verify: %d failure(s)', failures.length);
	for (const f of failures) console.error('  - ' + f);
	process.exit(1);
}
console.log('verify: the built pages carry every figure intact');
