module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'**/*.{js,wasm,css,json,md,ts,txt,html,svg}'
	],
	swDest: 'dist/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	sourcemap: false,
};