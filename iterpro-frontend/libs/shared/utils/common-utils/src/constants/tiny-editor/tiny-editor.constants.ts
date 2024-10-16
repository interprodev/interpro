export const TINY_EDITOR_OPTIONS: Record<string, any> = {
	menubar: false,
	plugins: 'fullscreen lists link',
	toolbar: [
		{ name: 'fullscreen', items: ['fullscreen'] },
		{ name: 'h', items: ['H1', 'H2', 'H3'] },
		{ name: 'formatting', items: ['bold', 'italic', 'underline'] },
		{ name: 'list', items: ['bullist', 'numlist'] },
		{ name: 'alignment', items: ['alignleft', 'aligncenter', 'alignright', 'alignjustify'] },
		{ name: 'link', items: ['link'] }
	],
	skin: 'oxide-dark',
	content_css: 'dark',
	content_style: 'body { background-color: black; font-size: 0.9em; margin: 0 } p { margin: 0 !important }', // Replace with your desired color
	branding: false,
	height: '200px',
	statusbar: false
};
