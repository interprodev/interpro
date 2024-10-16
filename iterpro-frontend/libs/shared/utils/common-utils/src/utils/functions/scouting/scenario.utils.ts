/* eslint-disable no-empty-pattern */
//#region Scouting Scenarios

import {
	Player,
	PlayerScouting,
	ScoutingLineup,
	ScoutingLineupPlayerData,
	ScoutingLineupRoleData,
	ScoutingMapping
} from '@iterpro/shared/data-access/sdk';
import { max } from 'lodash';
import { SelectItem } from 'primeng/api';

export function extractPlayerScenarios(
	scenarios: ScoutingLineup[],
	scenarioRoles: boolean,
	playerId: string
): ScoutingLineup[] {
	return scenarios.filter(({ _players, _roles }) =>
		(scenarioRoles ? _roles : _players).some(({ mappings }) =>
			(mappings || []).map(({ associatedScoutingId }) => String(associatedScoutingId)).includes(String(playerId))
		)
	);
}

export function getMappingDropdownList(
	scenario: ScoutingLineup,
	scenarioRoles: boolean,
	clubPlayers: Player[]
): SelectItem[] {
	const playersInScenario = scenario._players.map(({ playerId }) => playerId);
	const rolesInScenario = scenario._roles.map(({ role }) => role);
	return scenarioRoles
		? rolesInScenario.map(role => ({
				value: role,
				label: role
		  }))
		: clubPlayers
				.filter(({ id }) => playersInScenario.includes(id))
				.map(player => ({
					value: player,
					label: `${player.position} - ${player.displayName}`
				}));
}

export function getMappingRole(scenario: ScoutingLineup, player: PlayerScouting): string | null {
	const roleData = getMappedRoleData(scenario, player);
	return roleData ? roleData.role : null;
}

export function getMappingPlayer(
	scenario: ScoutingLineup,
	players: Player[],
	player: PlayerScouting
): Player | undefined | null {
	const playerData = getMappedPlayerData(scenario, player);
	return playerData ? players.find(({ id }) => String(id) === String(playerData.playerId)) : null;
}

export function getMappedPlayerData(scenario: ScoutingLineup, scouting: PlayerScouting): ScoutingLineupPlayerData {
	return scenario._players.find(({ mappings }) =>
		mappings.map(({ associatedScoutingId }) => String(associatedScoutingId)).includes(String(scouting.id))
	);
}

export function getMappedRoleData(scenario: ScoutingLineup, scouting: PlayerScouting): ScoutingLineupRoleData {
	return scenario._roles.find(({ mappings }) =>
		mappings.map(({ associatedScoutingId }) => String(associatedScoutingId)).includes(String(scouting.id))
	);
}

export function getRecommendedOptions(scenario: ScoutingLineup, scenarioRoles: boolean, player: PlayerScouting) {
	const recommendedOptions: SelectItem[] = [
		{ value: 1, label: '1' },
		{ value: 2, label: '2' },
		{ value: 3, label: '3' }
	];
	let options = recommendedOptions;
	const mappedData = scenarioRoles ? getMappedRoleData(scenario, player) : getMappedPlayerData(scenario, player);
	if (mappedData) {
		const maxPosition: number | undefined = max(
			mappedData.mappings.map(({ associatedPosition }) => associatedPosition)
		);
		if (maxPosition && maxPosition >= 3) {
			options = Array.from(Array(maxPosition + 1).keys()).map(({}, index) => ({
				value: index + 1,
				label: String(index + 1)
			})) as SelectItem[];
		}
	}
	return [{ value: null, label: 'None' }, ...options];
}

export function getMappingPosition(
	scenario: ScoutingLineup,
	scenarioRoles: boolean,
	player: PlayerScouting
): number | null {
	const data = scenarioRoles ? getMappedRoleData(scenario, player) : getMappedPlayerData(scenario, player);
	const mapping = data ? getMapping(data, player) : null;
	return mapping ? mapping.associatedPosition : null;
}

export function getMapping(
	data: ScoutingLineupPlayerData | ScoutingLineupRoleData,
	scouting: PlayerScouting
): ScoutingMapping | undefined {
	return data.mappings.find(({ associatedScoutingId }) => String(associatedScoutingId) === String(scouting.id));
}

export function getPlayerLatestScenarioInfo(
	scenarios: ScoutingLineup[],
	scenarioRoles: boolean,
	clubPlayers: Player[],
	playerScouting: PlayerScouting
): { associatedPlayerName: string | null; associatedPosition: number | null } {
	const playerScenarios = extractPlayerScenarios(scenarios, scenarioRoles, playerScouting.id);
	const mappedAssociablesFromPlayerScenarios = playerScenarios.map(scenario =>
		scenarioRoles ? getMappingRole(scenario, playerScouting) : getMappingPlayer(scenario, clubPlayers, playerScouting)
	);
	const associatedPlayerName = mappedAssociablesFromPlayerScenarios
		? (mappedAssociablesFromPlayerScenarios[0] as Player)?.displayName
		: null;
	const mappedPositionsFromPlayerScenarios = playerScenarios.map(scenario =>
		getMappingPosition(scenario, scenarioRoles, playerScouting)
	);
	const associatedPosition = mappedPositionsFromPlayerScenarios ? mappedPositionsFromPlayerScenarios[0] : null;
	return { associatedPlayerName, associatedPosition };
}

//endregion
