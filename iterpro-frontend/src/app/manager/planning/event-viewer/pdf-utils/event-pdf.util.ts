import {
	Event,
	JsonSchema,
	MixedType,
	PdfMixedTable,
	Player,
	PlayerGameReport,
	PlayerTrainingReport,
	PropertySchema,
	ReportDataColumn,
	Schema,
	SectionSchema,
	ThirdPartyLinkedPlayer
} from '@iterpro/shared/data-access/sdk';
import {
	SportType,
	getScoreIconTooltip,
	getMomentFormatFromStorage,
	getIconForBooleanType,
	getStyleFromReportRowType,
	getModeFromReportRowType,
	getComputedValue,
	getModeFromProperty,
	getStyle,
	convertPropertyTypeToMode,
	getStyleForFunction
} from '@iterpro/shared/utils/common-utils';
import moment from 'moment';
import { isEmpty } from 'lodash';

// TODO: add american football and ice hockey
export function getGameHeaders(t, sportType: SportType, isCurrentTeam: boolean): MixedType[] {
	const currentTeam: MixedType[] = [
		{ value: 'jersey', label: t('admin.evaluation.jersey'), mode: 'text' },
		{ value: 'name', label: t('profile.overview.name'), mode: 'text' },
		{ value: 'lastName', label: t('profile.overview.surname'), mode: 'text' },
		{ value: 'playerBirthDate', label: t('profile.overview.birth'), mode: 'text' },
		{ value: 'position', label: t('profile.position'), mode: 'text' }
	];
	const opponentTeam: MixedType[] = [
		{ value: 'displayName', label: t('profile.overview.displayName'), mode: 'text' },
		{ value: 'position', label: t('profile.position'), mode: 'text' }
	];
	let result: MixedType[] = isCurrentTeam ? currentTeam : opponentTeam;
	switch (sportType) {
		case 'football':
			result = [
				...result,
				{ value: 'minutesPlayed', label: t('admin.dashboard.minutesPlayed'), mode: 'text' },
				{ value: 'score', label: t(getScoreIconTooltip(sportType)), mode: 'text' },
				{
					value: 'yellowCard',
					label: t('yellowCards'),
					mode: 'div',
					cssClass: 'soccer-card yellow',
					alignment: 'center'
				},
				{
					value: 'doubleYellowCard',
					label: t('event.game.doubleYellow'),
					mode: 'div',
					cssClass: 'soccer-card double-yellow',
					alignment: 'center'
				},
				{
					value: 'redCard',
					label: t('Red Cards'),
					mode: 'div',
					cssClass: 'soccer-card red',
					alignment: 'center'
				}
			];
			break;
		case 'rugby':
		case 'rugbyLeague':
		case 'americanFootball':
			result = [
				...result,
				{ value: 'minutesPlayed', label: t('admin.dashboard.minutesPlayed'), mode: 'text' },
				{ value: 'score', label: t(getScoreIconTooltip(sportType)), mode: 'text' },
				{
					value: 'yellowCard',
					label: t('yellowCards'),
					mode: 'div',
					cssClass: 'soccer-card yellow',
					alignment: 'center'
				},
				{
					value: 'doubleYellowCard',
					label: t('event.game.doubleYellow'),
					mode: 'div',
					cssClass: 'soccer-card double-yellow',
					alignment: 'center'
				},
				{
					value: 'redCard',
					label: t('Red Cards'),
					mode: 'div',
					cssClass: 'soccer-card red',
					alignment: 'center'
				}
			];
			break;
		case 'volleyball':
			result = [
				...result,
				{ value: 'startingRoster', label: t('event.game.startingRoster'), mode: 'text' },
				{ value: 'scoreSet1', label: `${t(getScoreIconTooltip(sportType))} - 1`, mode: 'text' },
				{ value: 'scoreSet2', label: `${t(getScoreIconTooltip(sportType))} - 2`, mode: 'text' },
				{ value: 'scoreSet3', label: `${t(getScoreIconTooltip(sportType))} - 3`, mode: 'text' },
				{ value: 'scoreSet4', label: `${t(getScoreIconTooltip(sportType))} - 4`, mode: 'text' },
				{ value: 'scoreSet5', label: `${t(getScoreIconTooltip(sportType))} - 5`, mode: 'text' }
			];
			break;
		case 'basketball':
			result = [
				...result,
				{ value: 'startingRoster', label: t('event.game.startingRoster'), mode: 'text' },
				{ value: 'scoreSet1', label: `${t(getScoreIconTooltip(sportType))} - 1`, mode: 'text' },
				{ value: 'scoreSet2', label: `${t(getScoreIconTooltip(sportType))} - 2`, mode: 'text' },
				{ value: 'scoreSet3', label: `${t(getScoreIconTooltip(sportType))} - 3`, mode: 'text' },
				{ value: 'scoreSet4', label: `${t(getScoreIconTooltip(sportType))} - 4`, mode: 'text' }
			];
			break;
		default:
			console.log('Unknown sport type: ' + sportType);
	}
	return result;
}

export function getMixedValueTypeFromHeader(
	header: string,
	player: ThirdPartyLinkedPlayer,
	myTeamPlayers: Player[]
): MixedType {
	switch (header) {
		case 'jersey':
			return <MixedType>{
				label: getPlayerDetail(myTeamPlayers, player.playerStats.playerId)?.jersey,
				mode: 'text',
				alignment: 'left'
			};
		case 'name':
			return <MixedType>{
				label: getPlayerDetail(myTeamPlayers, player.playerStats.playerId)?.name,
				mode: 'text',
				alignment: 'left'
			};
		case 'lastName':
			return <MixedType>{
				label: getPlayerDetail(myTeamPlayers, player.playerStats.playerId)?.lastName,
				mode: 'text',
				alignment: 'left'
			};
		case 'playerBirthDate':
			return <MixedType>{
				label: formatDate(getPlayerDetail(myTeamPlayers, player.playerStats.playerId)?.birthDate),
				mode: 'text',
				alignment: 'left'
			};
		case 'displayName':
			return <MixedType>{
				label: player.playerStats.playerName,
				mode: 'text',
				alignment: 'left'
			};
		case 'position':
			return <MixedType>{
				label: player.playerStats.position,
				mode: 'text',
				alignment: 'left'
			};
		case 'minutesPlayed':
			return <MixedType>{
				label: player.playerStats.minutesPlayed,
				mode: 'text',
				alignment: 'left'
			};
		case 'score':
			return <MixedType>{
				label: player.playerStats.score,
				mode: 'text',
				alignment: 'left'
			};
		case 'yellowCard':
			return <MixedType>{
				mode: 'fa-icon',
				value: player.playerStats.yellowCard ? 'fas fa-check' : null,
				alignment: 'center'
			};
		case 'doubleYellowCard':
			return <MixedType>{
				mode: 'fa-icon',
				value: player.playerStats.doubleYellowCard ? 'fas fa-check' : null,
				alignment: 'center'
			};
		case 'redCard':
			return <MixedType>{
				mode: 'fa-icon',
				value: player.playerStats.redCard ? 'fas fa-check' : null,
				alignment: 'center'
			};
		default:
			console.log('Unknown header: ' + header);
			return <MixedType>{ label: '', mode: 'text', alignment: 'left' };
	}
}

function getPlayerDetail(players: Player[], playerId: string): Player {
	return (players || []).find(({ id }) => id === playerId);
}

const formatDate = (date: Date, format = getMomentFormatFromStorage()) => (date ? moment(date).format(format) : '');

export function getPlayerReportTableHeaders(t, schema: Schema): MixedType[] {
	const playerReportsHeaders: MixedType[] = [
		{ value: 'jersey', label: t('admin.evaluation.jersey'), mode: 'text' },
		{ value: 'displayName', label: t('profile.overview.displayName'), mode: 'text' }
	];
	const { sections } = schema;
	for (const section of sections) {
		const { properties } = section;
		for (const property of properties) {
			playerReportsHeaders.push({ value: property.name, label: property.label, mode: 'text', alignment: 'center' });
		}
	}
	return playerReportsHeaders;
}

export function getPlayerGameReportTableRows(stats: ThirdPartyLinkedPlayer, schema: Schema): MixedType[] {
	const result: MixedType[] = [
		{ label: stats?.jerseyNumber, mode: 'text' },
		{ label: stats?.playerStats.playerName, mode: 'text', alignment: 'left' }
	];
	const playerReport: PlayerGameReport = stats.gameReport;
	result.push(...reportToMixedType(playerReport, schema));
	return result;
}

export function getPlayerTrainingReportTableRows(
	trainingReport: PlayerTrainingReport,
	schema: Schema,
	playerDetail: Player
): MixedType[] {
	const result: MixedType[] = [
		{ label: playerDetail?.jersey, mode: 'text' },
		{ label: playerDetail?.displayName, mode: 'text', alignment: 'left' }
	];
	result.push(...reportToMixedType(trainingReport, schema));
	return result;
}

function reportToMixedType(playerReport: PlayerGameReport | PlayerTrainingReport, schema: Schema): MixedType[] {
	const result: MixedType[] = [];
	const { sections } = schema;
	for (const section of sections) {
		const { properties } = section;
		for (const property of properties) {
			const data = playerReport.reportData[section.id];
			const value = !isEmpty(data) ? data[property?.name] : null;
			result.push({
				label: getCurrentLabel(data, value, section, property),
				mode: getModeFromProperty(property),
				cssStyle: getCurrentStyle(value, section, property),
				alignment: 'center'
			});
		}
	}
	return result;
}

function getCurrentLabel(
	data: {},
	value: string | number | boolean,
	section: SectionSchema,
	property: PropertySchema
): string {
	if (property.type === 'Function') {
		const field = property.operation.name === 'sum' || property.operation.name === 'average' ? 'value' : 'label';
		return getStyleForFunction(section.properties, property, getComputedValue(data, property))[field];
	}
	switch (property.type) {
		case 'boolean':
			return getIconForBooleanType(value as boolean);
		default:
			return value?.toString() || '-';
	}
}

function getCurrentStyle(value: string | number | boolean, section: SectionSchema, property: PropertySchema): string {
	if (property.type === 'Function') {
		return 'color: ' + getStyleForFunction(section.properties, property, getComputedValue(section.id, property)).color;
	}
	if (value) {
		const color = getStyle(property, { value })?.color;
		return getStyleFromReportRowType(convertPropertyTypeToMode(property), value, color);
	}
	return undefined;
}
