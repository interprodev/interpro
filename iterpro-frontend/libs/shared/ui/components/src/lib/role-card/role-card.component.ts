import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ScoutingLineup, ScoutingLineupRoleData } from '@iterpro/shared/data-access/sdk';
import { ClickOutsideDirective } from '@iterpro/shared/ui/directives';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateService } from '@ngx-translate/core';

@Component({
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModule, ClickOutsideDirective],
	selector: 'iterpro-role-card',
	templateUrl: './role-card.component.html',
	styleUrls: ['./role-card.component.scss']
})
export class RoleCardComponent {
	@Input() role!: string;
	@Input() tactic!: ScoutingLineupRoleData;
	@Input() x!: number;
	@Input() y!: number;
	@Input() isSelected = false;
	@Input() disabled = false;
	@Input() highlighted = false;
	@Input() injuryMapObj!: Map<string, any>;
	@Input() scoutingPlayers: any[] = [];
	@Input() index!: number;
	@Input() scenario!: ScoutingLineup;
	@Input() showBadge = true;

	@Output() showShortlist: EventEmitter<string> = new EventEmitter<string>();
	@Output() changeRoleNameEmitter: EventEmitter<any> = new EventEmitter<any>();

	active!: boolean;

	constructor(private sanitizer: DomSanitizer, public translate: TranslateService) {
		this.translate.getTranslation(this.translate.currentLang).subscribe((x: any) => (this.translate = translate));
	}

	getClass(): string {
		let playerClass = 'player-card';
		const rowClass: string = this.x !== undefined ? 'player-row-' + String(this.x) : '';
		const colClass: string = this.y !== undefined ? 'player-col-' + String(this.y) : '';

		if (rowClass !== '' && colClass !== '') {
			playerClass = `${playerClass} on-field-player-card ${rowClass} ${colClass}`;
		}
		if (this.isSelected) {
			playerClass = `${playerClass} player-card-selected`;
		}
		if (this.disabled) {
			playerClass = `${playerClass} player-card-disabled`;
		}
		if (this.highlighted) {
			playerClass = `${playerClass} player-card-highlighted`;
		}

		return playerClass;
	}

	onShowShortlist(role: string) {
		this.showShortlist.emit(role);
	}

	getMappedPlayersNumber(tactic: ScoutingLineupRoleData): number {
		return tactic.mappings.length;
	}

	changeRoleName() {
		if (this.active) {
			this.changeRoleNameEmitter.emit({ name: this.tactic, index: this.index });
		}
		this.active = false;
	}

	stopClick(e) {
		e.stopPropagation();
		this.active = true;
	}
}
