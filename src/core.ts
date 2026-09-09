/**
 * The rendering core, for a front end that is not remark.
 *
 * A Markdown processor that walks its own tree — Astro 7's Sätteri, say — needs
 * the same fence to become the same figure, and the only way that stays true is
 * for it to call this rather than reimplement it. `astro-lini` is the one
 * consumer today; the surface is small and deliberately unopinionated about how
 * the fence was found.
 *
 * This is a subpath, not the package's face: everything here is engine, and a
 * site wiring up ```` ```lini ```` fences wants {@link remarkLini} instead.
 */

export { renderFence } from './figure.js';
export type { Fence } from './figure.js';
export { styleTag, bundledCss, liniCss } from './css.js';
export { fenceWords } from './fence.js';
export { locate, report } from './document.js';
export { diagnose, located } from './compiler.js';
export type { LiniDiagnostic } from './compiler.js';
export { collectAssets } from './assets.js';
export type { Assets } from './assets.js';
export type { CodeNode, Node, Parent } from './mdast.js';
export type { LiniOptions } from './options.js';
