import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Comment, Customer, LoopBackAuth } from '@iterpro/shared/data-access/sdk';
import { TranslateModule } from '@ngx-translate/core';
import { v4 as uuid } from 'uuid';
import { CommentInputComponent } from '../comment-input/comment-input.component';
import { SingleCommentThreadedComponent } from '../single-comment-threaded/single-comment-threaded.component';
import { CommentComponent } from '../comment-component/comment.component';
import { InputTextModule } from 'primeng/inputtext';

const edit = (list, comment, content) => {
	return comment.length === 0
		? list.filter(c => c !== comment)
		: list.map(c => (c === comment ? { ...comment, content } : c));
};

@Component({
	standalone: true,
	imports: [CommonModule, FormsModule, TranslateModule, CommentInputComponent, SingleCommentThreadedComponent, CommentComponent, InputTextModule],
	selector: 'iterpro-comment-threaded',
	templateUrl: './comment-threaded.component.html',
	styleUrls: ['./comment-threaded.component.css']
})
export class CommentThreadedComponent implements OnInit, OnChanges {
	@Input() comments: Comment[];
	@Input() filteredComments: Comment[];
	@Input() editMode: boolean;
	@Output() onUpdate: EventEmitter<Comment[]> = new EventEmitter<Comment[]>();

	customer: Customer;
	searchstring = '';
	currentThread: any = null;

	readonly userService = inject(LoopBackAuth);

	ngOnInit() {
		this.updateComments([...this.comments]);
	}

	ngOnChanges(changes: SimpleChanges) {
		this.customer = this.userService.getCurrentUserData();
		if (changes.comments) {
			if (!changes.comments.currentValue) {
				this.comments = [];
				this.updateComments([]);
			} else this.updateComments([...this.comments]);
		}
	}

	updateComments(comments: Comment[]) {
		this.filteredComments = comments;
	}

	filter() {
		const re = new RegExp(this.searchstring, 'i');
		const match = comment => re.test(comment.content);
		const filtered = this.comments
			.map(comment => ({
				...comment,
				notesThreads: comment.notesThreads ? comment.notesThreads.filter(match) : []
			}))
			.filter(comment => match(comment) || comment.notesThreads.length);
		this.updateComments(filtered);
	}

	onReplyComment({ comment, parent }) {
		this.addComment(comment, parent);
	}

	onCommentEdited(comment: Comment) {
		const content = comment.content;
		const parent = comment.parent || null;
		let comments = this.comments;
		if (parent) {
			parent.notesThreads = edit(parent.notesThreads, comment, content);
		} else {
			comments = edit(this.comments, comment, content);
		}
		this.updateComments([...this.comments]);
		this.onUpdate.emit(comments);
	}

	onCommentDeleted({ comment, parent = null }) {
		let comments = this.comments;
		if (parent) {
			parent.notesThreads = parent.notesThreads.filter(c => c !== comment);
		} else {
			comments = this.comments.filter(c => c !== comment);
		}
		if (this.currentThread === comment) this.currentThread = null;
		this.updateComments([...this.comments]);
		this.onUpdate.emit(comments);
	}

	addComment(comment: Comment, parent = null) {
		comment.id = uuid();
		let comments: Comment[];
		if (parent) {
			parent.notesThreads = [comment, ...(parent.notesThreads || [])];
			comments = [...this.comments];
		} else comments = [comment, ...this.comments];
		this.onUpdate.emit(comments);
		this.updateComments([...this.comments]);
	}

	onViewThread(thread) {
		this.currentThread = thread === this.currentThread ? null : thread;
	}
}
