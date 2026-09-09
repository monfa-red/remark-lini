// The fixture site: a real Docusaurus build with the plugin registered the way
// the README tells a site to register it. Nothing here is decorative — every
// option is the minimum that lets `docusaurus build` produce pages.

import { remarkLini } from 'remark-lini-lang';

export default {
	title: 'remark-lini fixture',
	url: 'https://example.com',
	baseUrl: '/',
	onBrokenLinks: 'ignore',
	onBrokenMarkdownLinks: 'ignore',
	staticDirectories: [],
	presets: [
		[
			'classic',
			{
				docs: false,
				blog: false,
				pages: { remarkPlugins: [remarkLini] },
			},
		],
	],
};
