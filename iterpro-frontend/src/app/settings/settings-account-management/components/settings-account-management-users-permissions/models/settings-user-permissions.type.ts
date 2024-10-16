import { Customer, CustomerTeamSettings, Team } from '@iterpro/shared/data-access/sdk';

export type AccountManagementUserPermission = CustomerPermission & {teamSettings: TeamSettingsPermission[]};

type CustomerPermission = Pick<Customer, 'id' | 'firstName' | 'lastName' | 'email' | 'currentTeamId' | 'username' | 'clubId' | 'downloadUrl' | 'admin'>;
export type TeamSettingsPermission = CustomerTeamSettings & {edited: boolean; removed?: boolean};

export type AccountManagementTeam = Pick<Team, 'id' | 'name' | 'customersLimit'>;
