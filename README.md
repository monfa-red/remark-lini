# remark-lini

**` ```lini ` fences in Markdown and MDX, compiled to inline SVG at build time.**

> Published on npm as **`remark-lini-lang`** — npm rejects `remark-lini` as too
> close to `remark-lint`.

[Lini](https://lini.rs) is one small language for diagrams: flowcharts, charts,
sequences, mindmaps, trees, ER schemas, circuit schematics and dimensioned
technical drawings all come out of the same fence. This plugin draws them
wherever [remark](https://github.com/remarkjs/remark) runs.

```
npm install remark-lini-lang
```

The compiler is linked as a WebAssembly module, not shelled out to — installing
this package is the whole toolchain. No binary on `PATH`, no Docker, no network
at build time.

## Use it

````js
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkLini } from 'remark-lini-lang';

const html = await unified()
  .use(remarkParse)
  .use(remarkLini)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process('```lini\ncat -> dog -> bird\n```');
````

Each fence is replaced with parsed elements rather than a string of raw HTML, so
no `allowDangerousHtml` anywhere and nothing to re-parse. That is also what makes
it work under MDX, which has no raw HTML at all.

### Docusaurus

```js
// docusaurus.config.js
import { remarkLini } from 'remark-lini-lang';

export default {
  presets: [['classic', { docs: { remarkPlugins: [remarkLini] } }]],
};
```

### Next.js (MDX)

```js
// next.config.mjs
import createMDX from '@next/mdx';
import { remarkLini } from 'remark-lini-lang';

export default createMDX({ options: { remarkPlugins: [remarkLini] } })({
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
});
```

### Gatsby

```js
// gatsby-config.js
const { remarkLini } = require('remark-lini-lang');

module.exports = {
  plugins: [{ resolve: 'gatsby-plugin-mdx', options: { mdxOptions: { remarkPlugins: [remarkLini] } } }],
};
```

### Astro

Use [`astro-lini`](https://github.com/monfa-red/astro-lini) instead — it wraps
this package and registers it with whichever Markdown processor the site runs.

## What a fence becomes

A figure, and — unless you ask otherwise — a toggle that reveals the source that
drew it. The fence's info string chooses:

| Fence | You get |
|---|---|
| ` ```lini ` | the figure, with the source one click away |
| ` ```lini figure-only ` | the figure alone |
| ` ```lini code-only ` | the source alone, highlighted, never compiled |
| ` ```lini figure-code ` | both, stacked, no toggle |
| ` ```lini code-figure ` | both, source first, no toggle |

## Images

An `|image| { src: "…" }` naming a local file resolves against the **Markdown
file's own directory**, and the bytes are handed to the compiler — the same
embedding, the same output, as the `lini` binary would produce. `https://` URLs
and `data:` URIs are passed through untouched.

## Styling

The stylesheet rides along in a `<style>` block on each page that has a figure,
which is what makes the install one line. It sits in `@layer remark-lini`, so
any unlayered rule in your own CSS wins without `!important`.

To own the styling yourself:

```js
.use(remarkLini, { bundledCss: false })
```

…and ship the sheet — `remark-lini-lang/remark-lini.css` for the figure wrapper, plus
`liniCss()` if you want the syntax-highlighting palette bound to the same
compiler that draws the figures.

Every Lini colour is a `light-dark()` pair keyed on `color-scheme`, so binding
that property to your theme is the whole light/dark integration — no script, no
re-render on toggle.

## Errors

A block that fails to compile becomes a visible error box and the message goes
to stderr; the build still finishes, so one bad diagram never costs you the rest
of the site. Messages carry the real file, line and column of the `.md` — not an
offset into the fence.

## Options

| Option | Default | What it does |
|---|---|---|
| `bundledCss` | `true` | Ship the styling with the figures. `false` to provide it yourself. |

## The language

Six lines — a type define, a container, and two links Lini routes for you:

````
```lini
{ |svc::box| { fill: --teal-wash; stroke: --teal-ink } }

|group| "Services" [ |svc#api| "API"; |svc#auth| "Auth" ]
|svc#db| "Postgres"

api  -> db "read"
auth -> db "write"
```
````

The rest of the grammar is the [tour](https://lini.rs/docs/tour/language.html).

## Licence

MIT.
