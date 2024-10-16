import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Customer,
	CustomerTeamSettings,
	LoopBackAuth,
	Team,
	TeamTableFilterTemplate,
	TeamTableFilterTemplateApi
} from '@iterpro/shared/data-access/sdk';
import {
	ConfirmationDialogComponent,
	SaveEventEmitter,
	TableFilterTemplateSelectionComponent
} from '@iterpro/shared/ui/components';
import {
	AlertService,
	ErrorService, getTeamSettings,
	SupportedTableId,
	TeamTableFilterTemplateService
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { first, take } from 'rxjs/operators';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [TableFilterTemplateSelectionComponent],
	selector: 'iterpro-table-filter-template',
	templateUrl: './table-filter-template.component.html',
	styleUrls: ['./table-filter-template.component.scss']
})
export class TableFilterTemplateComponent implements OnInit {
	@Input() tableId: SupportedTableId;
	@Input() filters: Record<string, unknown>;
	@Input() visibility: Record<string, unknown>;
	@Output() templateChanged: EventEmitter<TeamTableFilterTemplate> = new EventEmitter<TeamTableFilterTemplate>();

	tableFilterTemplates: TeamTableFilterTemplate[];
	favoriteTableFilterTemplate: TeamTableFilterTemplate;
	selectedTableFilterTemplate: TeamTableFilterTemplate;
	editMode = false;
	defaultFilters: Record<string, unknown>;
	defaultVisibility: Record<string, unknown>;

	constructor(
		private auth: LoopBackAuth,
		private error: ErrorService,
		private translate: TranslateService,
		private dialogService: DialogService,
		private currentTeamService: CurrentTeamService,
		private notificationService: AlertService,
		private confirmationService: ConfirmationService,
		private tableFilterTemplateApi: TeamTableFilterTemplateApi,
		private tableFilterTemplateService: TeamTableFilterTemplateService
	) {}

	ngOnInit(): void {
		this.loadTableFilterTemplates();
	}

	private loadTableFilterTemplates() {
		const teamTemplates: TeamTableFilterTemplate[] =
			this.currentTeamService.getCurrentTeam()?.tableFilterTemplates || [];
		const tableFilterTemplates: TeamTableFilterTemplate[] = this.tableFilterTemplateService.getTeamTableFilterTemplates(
			this.tableId,
			teamTemplates
		);
		this.defaultFilters = cloneDeep(this.filters);
		this.defaultVisibility = cloneDeep(this.visibility);
		const defaultTemplate = this.getDefaultTemplate();
		this.tableFilterTemplates = [defaultTemplate, ...tableFilterTemplates];
		const userFavoriteTemplate = this.tableFilterTemplateService.getUserFavoriteTableFilterTemplates(
			this.tableFilterTemplates,
			this.getCurrentUserTeamSettings()
		);
		this.favoriteTableFilterTemplate = userFavoriteTemplate ? userFavoriteTemplate : defaultTemplate; // this.tableFilterTemplates[0];
		this.selectedTableFilterTemplate = cloneDeep(this.favoriteTableFilterTemplate);
		this.templateChanged.emit(this.favoriteTableFilterTemplate);
	}

	private getDefaultTemplate(): TeamTableFilterTemplate {
		// @ts-ignore
		return {
			id: 'default',
			tableId: this.tableId,
			filters: this.defaultFilters,
			visibility: this.defaultVisibility,
			templateName: 'Default',
			lastUpdateAuthorId: this.getCurrentUser().id
		};
	}

	private isDefaultTemplate(template: TeamTableFilterTemplate): boolean {
		return template.id === 'default';
	}

	onSelectTemplate(template: TeamTableFilterTemplate) {
		this.selectedTableFilterTemplate = template;
		this.templateChanged.emit(template);
	}

	onMarkAsFavoriteTemplate(event: TeamTableFilterTemplate) {
		const user: Customer = this.getCurrentUser();
		let obs$: Observable<CustomerTeamSettings>;
		if (this.isDefaultTemplate(event)) {
			obs$ = this.tableFilterTemplateService.resetFavoriteTemplate(
				this.getCurrentUserTeamSettings(),
				(this.tableFilterTemplates || []).map(({ id }) => id)
			);
		} else {
			obs$ = this.tableFilterTemplateService.setTemplateAsFavorite(
				event.id,
				this.getCurrentUserTeamSettings(),
				(this.tableFilterTemplates || []).map(({ id }) => id)
			);
		}
		obs$.pipe(first(), untilDestroyed(this)).subscribe({
			next: (updatedCustomerTeamSettings: CustomerTeamSettings) => {
				this.setCurrentUserInfoTeamTableFilterTemplates(event, user, updatedCustomerTeamSettings);
				this.notificationService.notify('success', 'Template List', 'alert.recordUpdated');
			},
			error: err => this.error.handleError(err)
		});
	}

	onSaveTemplateConfirm({ template, directlyUpdateCurrent }: SaveEventEmitter) {
		const templateToSave = cloneDeep(template);
		if (this.isDefaultTemplate(templateToSave)) {
			this.handleCreateNewTemplate(templateToSave);
			return;
		}
		if (directlyUpdateCurrent) {
			this.onSaveTemplate(templateToSave);
			return;
		}
		const ref = this.dialogService.open(ConfirmationDialogComponent, {
			data: {
				description: 'alert.saveFilterTemplate',
				actionTrueLabel: 'buttons.createAsNew',
				actionFalseLabel: 'buttons.updateCurrent'
			},
			closable: false
		});
		ref.onClose.pipe(take(1)).subscribe({
			next: (result: { choice: boolean }) => {
				if (result) {
					if (result.choice) {
						// create new choice
						this.handleCreateNewTemplate(templateToSave);
					} else {
						this.onSaveTemplate(templateToSave);
					}
				}
			}
		});
	}

	private handleCreateNewTemplate(template: TeamTableFilterTemplate) {
		// create new choice
		template = {
			...template,
			templateName: this.getNewTemplateName(template),
			creationDate: new Date(),
			lastUpdateDate: new Date(),
			lastUpdateAuthorId: this.getCurrentUser().id,
			teamId: this.getCurrentUser().currentTeamId
		};
		delete template.id;
		this.onSaveTemplate(template);
	}

	private getNewTemplateName(template: TeamTableFilterTemplate): string {
		if (this.isDefaultTemplate(template)) {
			template.templateName = this.translate.instant('buttons.newTemplate');
		}
		let nameAlreadyExists = (this.tableFilterTemplates || []).find(t => t.templateName === template.templateName);
		if (!nameAlreadyExists) {
			return template.templateName;
		}
		let newName = template.templateName;
		let counter = 1;

		while (nameAlreadyExists) {
			newName = `${template.templateName} (${counter})`;
			counter++;
			nameAlreadyExists = this.tableFilterTemplates.find(t => t.templateName === newName);
		}
		return newName;
	}

	private onSaveTemplate(template: TeamTableFilterTemplate) {
		template = {
			...template,
			filters: cloneDeep(this.filters),
			visibility: cloneDeep(this.visibility)
		};
		const isNew = !template?.id;
		const detailAlertLabel = isNew ? 'alert.recordCreated' : 'alert.recordUpdated';
		const obs$: Observable<TeamTableFilterTemplate> = isNew
			? this.tableFilterTemplateApi.create(template)
			: this.tableFilterTemplateApi.updateAttributes(template.id, template);
		obs$.pipe(first(), untilDestroyed(this)).subscribe({
			next: (result: TeamTableFilterTemplate) => {
				if (isNew) {
					this.tableFilterTemplates = [...(this.tableFilterTemplates || []), result];
					this.editMode = true;
				} else {
					this.tableFilterTemplates = this.tableFilterTemplates.map((t: TeamTableFilterTemplate) => {
						if (t.id === result.id) {
							return result;
						}
						return t;
					});
				}
				this.selectedTableFilterTemplate = result;
				this.setCurrentTeamTableFilterTemplates(this.tableFilterTemplates);
				this.notificationService.notify('success', 'Template List', detailAlertLabel);
			},
			error: err => this.error.handleError(err)
		});
	}

	onDeleteTemplateConfirm(template: TeamTableFilterTemplate) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.deleteTemplate'),
			header: 'Iterpro',
			accept: () => {
				this.onDeleteTemplate(template);
			}
		});
	}
	private onDeleteTemplate(template: TeamTableFilterTemplate) {
		this.tableFilterTemplateApi
			.deleteById(template.id)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.tableFilterTemplates = this.tableFilterTemplates.filter(
						(t: TeamTableFilterTemplate) => t.id !== template.id
					);
					if (this.favoriteTableFilterTemplate.id === template.id) {
						this.favoriteTableFilterTemplate = cloneDeep(this.getDefaultTemplate());
					}
					this.onSelectTemplate(cloneDeep(this.favoriteTableFilterTemplate));
					this.setCurrentTeamTableFilterTemplates(this.tableFilterTemplates);
					this.notificationService.notify('success', 'Template List', 'alert.recordDeleted');
				},
				error: err => this.error.handleError(err)
			});
	}

	private setCurrentTeamTableFilterTemplates(templates: TeamTableFilterTemplate[]) {
		const currentTeam: Team = this.currentTeamService.getCurrentTeam();
		const teamOtherTemplates: TeamTableFilterTemplate[] = (currentTeam?.tableFilterTemplates || []).filter(
			({ tableId }) => tableId !== this.tableId
		);
		this.currentTeamService.setCurrentTeam({
			...currentTeam,
			tableFilterTemplates: [...teamOtherTemplates, ...templates.filter(t => t.id !== 'default')]
		});
	}

	private setCurrentUserInfoTeamTableFilterTemplates(
		favoriteTemplate: TeamTableFilterTemplate,
		user: Customer,
		updatedCustomerTeamSettings: CustomerTeamSettings
	) {
		this.favoriteTableFilterTemplate = favoriteTemplate;
		this.auth.setUser({
			...user,
			teamSettings: user.teamSettings.map((info: CustomerTeamSettings) => {
				if (info.teamId === user.currentTeamId) {
					return updatedCustomerTeamSettings;
				}
				return info;
			})
		});
	}

	private getCurrentUserTeamSettings(): CustomerTeamSettings {
		const user: Customer = this.getCurrentUser();
		return getTeamSettings(user.teamSettings, user.currentTeamId);
	}

	private getCurrentUser(): Customer {
		return this.auth.getCurrentUserData();
	}
}
