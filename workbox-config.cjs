module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'**/*.{js,wasm,css,html,svg}'
	],
	swDest: 'dist/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	sourcemap: false,
};