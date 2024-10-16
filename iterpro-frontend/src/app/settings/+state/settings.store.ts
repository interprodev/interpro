import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject, InjectionToken } from '@angular/core';
import * as moment from 'moment/moment';
import {
	Customer,
	CustomerTeamSettings,
	JsonSchema,
	ScoutingSettings,
	Team,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import {
	IterproOrgType,
	IterproTeamModule,
	IterproUserPermission,
	PermissionsService
} from '@iterpro/shared/data-access/permissions';

type SettingsState = {
	clubId: string;
	isNationalClub: boolean;
	type: IterproOrgType;
	teams: Team[];
	currentTeamId: string; // The Team ID of the current team
	selectedTeamId: string; // The Team ID of the team that is selected from the dropdown
	currentCustomerId: string;
	scoutingSettings: ScoutingSettings;
	clubCustomers: CustomerTeam[];
	teamPlayerGameReportTemplates: JsonSchema[];
	teamTrainingReportTemplates: JsonSchema[];
};
const initialState: SettingsState = {
	clubId: null,
	isNationalClub: false,
	type: 'club',
	teams: [],
	currentTeamId: null,
	selectedTeamId: null,
	currentCustomerId: null,
	scoutingSettings: null,
	clubCustomers: [],
	teamPlayerGameReportTemplates: [],
	teamTrainingReportTemplates: []
};

const SETTINGS_STATE = new InjectionToken<SettingsState>('SettingsState', {
	factory: () => initialState
});

export const SettingsStore = signalStore(
	withState(() => inject(SETTINGS_STATE)),
	withMethods((store, permissionsService = inject(PermissionsService)) => ({
		setClubInfo(clubId: string, isNationalClub: boolean, type: IterproOrgType): void {
			patchState(store, state => ({ ...state, clubId, isNationalClub, type }));
		},
		setTeamList(teams: Team[]): void {
			patchState(store, state => ({ ...state, teams }));
		},
		setCurrentTeamId(teamId: string): void {
			patchState(store, state => ({ ...state, currentTeamId: teamId, selectedTeamId: teamId }));
		},
		setSelectedTeamId(teamId: string): void {
			patchState(store, state => ({ ...state, selectedTeamId: teamId }));
		},
		setTeamPlayerGameReportTemplates(gameTemplates: JsonSchema[]): void {
			patchState(store, state => ({
				...state,
				teamPlayerGameReportTemplates: gameTemplates
			}));
		},
		setTeamTrainingReportTemplates(trainingTemplates: JsonSchema[]): void {
			patchState(store, state => ({
				...state,
				teamTrainingReportTemplates: trainingTemplates
			}));
		},
		teamHasPermission(permission: IterproTeamModule): boolean {
			const selectedTeam = store.teams().find(({ id }) => id === store.selectedTeamId());
			if (!selectedTeam) return false;
			return permissionsService.canTeamAccessToModule(permission, selectedTeam).response;
		},
		userHasPermission(permission: IterproUserPermission): boolean {
			const selectedTeam = store.teams().find(({ id }) => id === store.selectedTeamId());
			if (!selectedTeam) return false;
			return permissionsService.canUserAccessToModule(permission, selectedTeam).response;
		},
		updateTeamById(teamId: string, team: Partial<Team>): void {
			patchState(store, state => {
				const teams = state.teams.map(t => (t.id === teamId ? { ...t, ...team } : t));
				return { ...state, teams };
			});
		},
		setTeamSeasons(teamId: string, teamSeasons: TeamSeason[]): void {
			patchState(store, state => {
				const teams = state.teams.map(t => (t.id === teamId ? { ...t, teamSeasons } : t));
				return { ...state, teams };
			});
		},
		updateClubCustomerSettingById(
			customerId: string,
			targetTeamId: string,
			teamSetting: Partial<CustomerTeamSettings>
		): void {
			patchState(store, state => {
				const clubCustomers = state.clubCustomers.map(c => {
					if (c.id === customerId) {
						return {
							...c,
							teamSettings: c.teamSettings.map(ts => (ts.teamId === targetTeamId ? { ...ts, ...teamSetting } : ts))
						};
					}
					return c;
				});
				return { ...state, clubCustomers };
			});
		},
		setCurrentCustomerId(customerId: string): void {
			patchState(store, state => ({ ...state, currentCustomerId: customerId }));
		},
		setScoutingSettings(scoutingSettings: ScoutingSettings): void {
			patchState(store, state => ({ ...state, scoutingSettings }));
		},
		setClubCustomers(customers: CustomerTeam[]): void {
			patchState(store, state => ({ ...state, clubCustomers: customers }));
		},
		updateClubCustomer(customer: Customer): void {
			patchState(store, state => {
				const clubCustomers = state.clubCustomers.map(c => (c.id === customer.id ? { ...c, ...customer } : c));
				return { ...state, clubCustomers };
			});
		}
	})),
	withComputed(
		({
			teams,
			selectedTeamId,
			currentTeamId,
			clubCustomers,
			currentCustomerId,
			teamPlayerGameReportTemplates,
			teamTrainingReportTemplates
		}) => ({
			currentTeam: computed(() => teams().find(({ id }) => id === currentTeamId())),
			selectedTeam: computed(() => teams().find(({ id }) => id === selectedTeamId())),
			selectedTeamName: computed(() => {
				const team = teams().find(({ id }) => id === selectedTeamId());
				return team ? team.name : '';
			}),
			isSelectedTeamTheCurrentTeam: computed(() => currentTeamId() === selectedTeamId()),
			getTeamOptions: computed(() => teams().map(({ id, name }) => ({ value: id, label: name }))),
			selectedTeamSeason: computed(() => {
				const selectedTeam = teams().find(({ id }) => id === selectedTeamId());
				if (!selectedTeam) return null;
				return (selectedTeam.teamSeasons || []).find(({ offseason, inseasonEnd }) =>
					moment().isBetween(moment(offseason), moment(inseasonEnd))
				);
			}),
			currentCustomer: computed(() => clubCustomers().find(({ id }) => id === currentCustomerId())),
			selectedTeamGameReportTemplates: computed(() =>
				teamPlayerGameReportTemplates().filter(({ teamId }) => teamId === selectedTeamId())
			),
			selectedTeamTrainingReportTemplates: computed(() =>
				teamTrainingReportTemplates().filter(({ teamId }) => teamId === selectedTeamId())
			)
		})
	)
);

export type CustomerTeam = Pick<
	Customer,
	'id' | 'firstName' | 'lastName' | 'downloadUrl' | 'teamSettings' | 'admin' | '_customPresets'
>;
