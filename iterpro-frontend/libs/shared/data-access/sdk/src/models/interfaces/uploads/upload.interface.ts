import { Attachment } from '../../../lib';

export interface ExtendedAttachment extends Attachment {
	type: string;
	name: string;
	url: string;
}

export interface FileAttachment {
	file: File;
	attachment: ExtendedAttachment;
}

export interface CommentAttachment {
	type: string;
	name: string;
	url: string;
}

export interface Comment {
	id?: string;
	user: string;
	userId: string;
	img: string;
	time: Date;
	content: string;
	attachments: CommentAttachment[];
	parent?: Comment;
	notesThreads?: Comment[];
}
