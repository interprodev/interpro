const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');
const { shark, primary, success, info, warning, danger, red, gray, black } = require('./src/theme/base/_palettes');

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'), ...createGlobPatternsForDependencies(__dirname)],
	theme: {
		colors: {
			shark,
			primary,
			success,
			info,
			warning,
			danger,
			redbanner: '#990f02db',
			white: '#fff',
			transparent: 'transparent',
			red,
			gray,
			black
		},
		textColor: {
			primary: 'var(--color-primary-500)',
			white: '#fff',
			shark,
			primary,
			success,
			info,
			warning,
			danger,
			red,
			gray,
			black
		},
		extend: {
			borderWidth: {
				'1': '1px',
				'0.3': '0.3px'
			},
			fontSize: {
				'2xs': '0.625rem'
			},
		}
	},
	prefix: 'tw-',
	plugins: [],
	important: true
};
