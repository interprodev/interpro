module.exports = Attachment => {
	Attachment.observe('before delete', (ctx, next) => {
		console.log('[ATTACHMENT] deleting attachment');
	});

	Attachment.observe('after delete', (ctx, next) => {
		console.log('[ATTACHMENT] deleted attachment');
	});
};
