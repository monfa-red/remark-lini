/**
 * Local `|image| { src: … }` paths, resolved against the Markdown file's own
 * directory and handed to the compiler as bytes.
 *
 * The compiler reads a local asset itself when it is a binary on your disk. In
 * WebAssembly it has no disk to read, so the host has to hand it the bytes —
 * which it takes as an asset table keyed by the `src:` exactly as written
 * [SPEC 7]. That table is consulted before any read and joins the same
 * embedding path a file read would, so a figure drawn here is the figure the
 * `lini` binary draws.
 *
 * This is a file lookup, not a second asset pipeline, and it stops the moment
 * the bytes are in hand: it does not sniff types, rewrite the source, or decide
 * what an unreadable path means. A path it cannot read is simply absent from
 * the table, and the compiler reports it at the `src:` span itself — one error,
 * from the engine that owns the question.
 */

import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

/** A `src:` declaration and its double-quoted value. Lini has no other string form. */
const SRC = /\bsrc\s*:\s*"([^"\n]*)"/g;

/** The asset table the compiler takes: the `src:` as written, to its bytes. */
export type Assets = Record<string, Uint8Array>;

/**
 * Read every local `src:` the source names, keyed by the path as written.
 *
 * The forms the compiler already resolves on its own — an HTTP(S) URL, an
 * authored `data:` URI — are left out: it never asks the table for those.
 */
export function collectAssets(source: string, baseDir: string | undefined): Assets {
	const assets: Assets = {};
	for (const [, src] of source.matchAll(SRC)) {
		if (src === undefined || src in assets || isPassThrough(src)) continue;
		try {
			assets[src] = readFileSync(baseDir ? resolvePath(baseDir, src) : src);
		} catch {
			// Absent from the table, and so the compiler's own error at the `src:`.
		}
	}
	return assets;
}

/** The forms the compiler emits unchanged [SPEC 7]: HTTP(S) URLs and `data:` URIs. */
function isPassThrough(src: string): boolean {
	return /^(https?:\/\/|data:)/i.test(src);
}
