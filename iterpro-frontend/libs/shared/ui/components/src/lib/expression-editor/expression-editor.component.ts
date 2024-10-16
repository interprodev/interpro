import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CapitalizePipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import { evaluate, random } from 'mathjs';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, TranslateModule, FormsModule, CapitalizePipe],
	selector: 'iterpro-expression-editor',
	templateUrl: './expression-editor.component.html',
	styleUrls: ['./expression-editor.component.css']
})
export class ExpressionEditorComponent implements OnInit {
	@Input({required: true}) variables!: any[];
	@Input({required: true}) visible!: boolean;
	@Input({required: true}) title!: string;
	@Input({required: true}) expression!: string;
	@Output() expressionSaved: EventEmitter<string | null> = new EventEmitter<string | null>();

	varCounter = 0;
	isValid = true;
	error!: string | null;

	ngOnInit() {
		if (!this.expression) this.expression = '';
	}

	discard() {
		this.expressionSaved.emit(null);
	}

	save() {
		this.expressionSaved.emit(this.expression);
	}

	validate(event: string) {
		this.error = null;
		this.expression = event;
		const parsed = this.expression.replace(new RegExp(/{(.+?)}/, 'g'), 'a');
		const scope = { a: 0 };
		const scope1 = { a: 1 };
		const scope2 = { a: random(0, 100) };
		try {
			const res = evaluate(parsed, scope) && evaluate(parsed, scope1) && evaluate(parsed, scope2);
			if (isNaN(res)) {
				this.error = 'SemanticWarning: the expression contains a division. Be careful that the dividing would not equal to 0';
			}
			this.isValid = true;
		} catch (error) {
			this.error = error;
			this.isValid = false;
		}

		document.getElementById('editor')?.focus();
	}

	addOperator(char: string) {
		this.expression = this.insertTextAtCursor(document.getElementById('editor'), char);
		this.isValid = false;
		this.validate(this.expression);
	}

	addVariable(event: {value: string}) {
		if (event.value) {
			this.expression = this.insertTextAtCursor(document.getElementById('editor'), '{' + event.value + '}');
			this.varCounter += 1;
			this.validate(this.expression);
		}
	}

	clear() {
		this.varCounter = 0;
		this.expression = '';
		this.isValid = true;
		this.error = null;
	}

	insertTextAtCursor(el, text: string) {
		const val = el.value;
		let endIndex;
		let range;
		const doc = el.ownerDocument;
		if (typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number') {
			endIndex = el.selectionEnd;
			el.value = val.slice(0, endIndex) + text + val.slice(endIndex);
			el.selectionStart = el.selectionEnd = endIndex + text.length;
		} else if (doc.selection && doc.selection.createRange) {
			el.focus();
			range = doc.selection.createRange();
			range.collapse(false);
			range.text = text;
			range.select();
		}

		return el.value;
	}
}
