/**
 * remark-lini — ```` ```lini ```` fences to inline SVG, at build time.
 *
 * [Lini](https://lini.rs) is one engine for every figure family: flowcharts,
 * charts, sequences, mindmaps, trees, schematics and technical drawings all come
 * out of the same fence. The compiler is linked as a WebAssembly module here,
 * not shelled out to — installing this package is the whole toolchain.
 *
 * ```js
 * import { remarkLini } from 'remark-lini';
 * unified().use(remarkParse).use(remarkLini).use(remarkRehype, { allowDangerousHtml: true });
 * ```
 *
 * Anywhere remark runs, this runs: Docusaurus, Next and MDX, Gatsby, Astro (via
 * `astro-lini`, which wraps this), or a plain `unified()` processor of your own.
 */

export { remarkLini } from './remark.js';
export { liniCss } from './css.js';
export type { LiniOptions } from './options.js';
