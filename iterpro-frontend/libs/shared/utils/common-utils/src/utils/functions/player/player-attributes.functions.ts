import {
	AdditionalFieldEntry,
	AttributeCategory,
	ColorMapping,
	Customer,
	MixedAttributeCategory,
	PlayerAttribute,
	PlayerAttributesEntry,
	PlayerItem,
	PotentialLetter,
	ScoutingGameWithReport,
	ScoutingSettings,
	StandardAttributes,
	SwissAttributeCategory,
	Team,
	attributeCategories,
	swissAttributesCategories
} from '@iterpro/shared/data-access/sdk';
import { CustomerNamePipe } from '@iterpro/shared/ui/pipes';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { sortBy, uniq, uniqBy } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { ADVANCED_COLORS, advancedAnnotations } from '../../../constants/palette.constants';
import { playerRolesByPosition } from '../../../constants/profile/player-roles.constants';
import { playerAttributes as playerAttributesDefault } from '../../../services/constant.service';
import { getAge } from '../../dates/age.util';
import { getMomentFormatFromStorage } from '../../dates/date-format.util';
import { getDefaultCartesianConfig, getTimeseriesXAxis } from '../chart/chart.functions';
import { getCorrectTextColorUtil } from '../color.functions';

export function isPlayerDescriptionSetting(setting: 'tipss' | 'attributes', scoutingSettings: ScoutingSettings): boolean {
	return scoutingSettings?.playerDescription === setting;
}

export function getNumericalAvg(base: number, values: AdditionalFieldEntry[], scoutingSettings: ScoutingSettings): string {
	if (!scoutingSettings) return '-';
	const sum = values.map(({ value }) => value).reduce((total: number, a: number) => Number(total) + Math.pow(Number(a || 1), 2), 0);
	return values.length > 0 ? (Math.sqrt(sum / values.length) * base).toFixed(getRoundSize(scoutingSettings)) : '-';
}

export function getAvgValueForSpinner(
	isActiveAttributesDescriptionSettings: boolean,
	values: AdditionalFieldEntry[],
	scoutingSettings: ScoutingSettings
): number {
	const avg = Number(getNumericalAvg(isActiveAttributesDescriptionSettings ? 10 : 20, values, scoutingSettings));
	return isNaN(avg) ? 0 : avg;
}

export function getSpinnerColor(
	isActiveAttributesDescriptionSettings: boolean,
	values: AdditionalFieldEntry[],
	scoutingSettings: ScoutingSettings
): string {
	const num = getAvgValueForSpinner(isActiveAttributesDescriptionSettings, values, scoutingSettings);
	return getColorClass(num, isActiveAttributesDescriptionSettings ? 10 : 20, isActiveAttributesDescriptionSettings, scoutingSettings);
}

export function getColorClass(
	value: number,
	base: number,
	isActiveAttributesDescriptionSettings: boolean,
	scoutingSettings: ScoutingSettings,
	isFromScouting = false
): string {
	return isActiveAttributesDescriptionSettings
		? getStandardColorClass(value, base, isFromScouting)
		: getTipssColorClass(value, base, scoutingSettings.tipssSettings.colorsMapping);
}

export function getLetterColorClass(value: PotentialLetter): string {
	if (value === 'C') return 'crimson';
	if (value === 'B') return 'darkorange';
	if (value === 'A') return 'green';
	return '#dddddd';
}

function getLiteralAvgNumber(attributesEntry: PlayerAttributesEntry, attributeCategory: SwissAttributeCategory): number {
	return attributesEntry.values
		.filter(({ category }) => category === attributeCategory)
		.map(({ value }) => value)
		.reduce((total, a) => Number(total) + (a ? 1 : 0), 0);
}
export function getLiteralAvg(attributesEntry: PlayerAttributesEntry, attributeCategory: SwissAttributeCategory): PotentialLetter {
	const sum = getLiteralAvgNumber(attributesEntry, attributeCategory);
	return sum >= 5 ? 'A' : sum >= 3 ? 'B' : sum >= 1 ? 'C' : '-';
}

export function getStandardColorClass(value: number, base: number, isFromScouting = false): string {
	if (isFromScouting) {
		if (value <= 3 * base) return 'crimson';
		if (value <= 5 * base) return 'darkorange';
		if (value <= 7 * base) return '#f1c40f';
		return '#00cc6a';
	}
	if (value <= 4 * base) return 'crimson';
	if (value <= 7 * base) return 'darkorange';
	if (value <= 10 * base) return 'green';
	return '#dddddd';
}

export function getTipssColorClass(value: number, base: number, mappings: ColorMapping[]): string {
	value /= base;
	const mapping = mappings.find(({ min, max }) => value === min || (value >= min && value <= max));
	return mapping ? mapping.color : '';
}

export function getStyleForInputNumber(
	value: number,
	isActiveAttributesDescriptionSettings: boolean,
	scoutingSettings: ScoutingSettings,
	isFromScouting = false,
	editMode = false
): { [key: string]: string } {
	const backgroundColor = getColorClass(value, 1, isActiveAttributesDescriptionSettings, scoutingSettings, isFromScouting);
	return {
		'border-width': editMode ? '0 0 1px 0' : '0',
		'border-color': '#444',
		'font-size': 'small',
		'font-weight': 'bold',
		width: '25px',
		'text-align': 'center',
		padding: '0',
		color: getCorrectTextColorUtil(backgroundColor),
		'background-color': backgroundColor
	};
}

export function getRoundSize(scoutingSettings: ScoutingSettings): number {
	return scoutingSettings.tipssSettings.scale === 'fiveDouble' ? 1 : 0;
}

export function getMappedStandardAttributes(teamsPlayerAttributes: PlayerAttribute[]): StandardAttributes {
	const offensive = teamsPlayerAttributes.filter(({ active, category }) => active && category === 'offensive');
	const defensive = teamsPlayerAttributes.filter(({ active, category }) => active && category === 'defensive');
	const attitude = teamsPlayerAttributes.filter(({ active, category }) => active && category === 'attitude');
	return { offensive, defensive, attitude };
}

export function getTeamsPlayerAttributes(teams: Team[] | undefined): PlayerAttribute[] {
	return uniq((teams || []).map(({ playerAttributes }) => playerAttributes || playerAttributesDefault).reduce((a, b) => [...a, ...b], []));
}

export function getTipssAttributes(scoutingSettings: ScoutingSettings): PlayerAttribute[] {
	return playerAttributesDefault.filter(
		({ category, value }) =>
			(category === 'tipss' || category === 'potential' || category === 'prognosis') &&
			(scoutingSettings.tipssSettings.enabled.length === 0 || scoutingSettings.tipssSettings.enabled.includes(value))
	);
}

export function getMappedStandardAttributesForColumns(
	teamsPlayerAttributes: PlayerAttribute[],
	translate: TranslateService
): PlayerAttribute[] {
	return teamsPlayerAttributes
		.filter(({ active }) => active)
		.map(item => ({
			...item,
			label: `${translate.instant('profile.attributes.' + item.category)} - ${translate.instant(item.label)}`
		}));
}

export function getAttributesToMap(
	teamsPlayerAttributes: PlayerAttribute[],
	scoutingSettings: ScoutingSettings,
	isFromScoutingSection: boolean
): PlayerAttribute[] {
	if (isPlayerDescriptionSetting('attributes', scoutingSettings)) {
		const standardAttributes: StandardAttributes = getMappedStandardAttributes(teamsPlayerAttributes);
		return [...standardAttributes.offensive, ...standardAttributes.defensive, ...standardAttributes.attitude];
	} else {
		if (isFromScoutingSection) {
			return getTipssAttributes(scoutingSettings).filter(({ category }) => !isFromScoutingSection || category === 'prognosis');
		}
		return getTipssAttributes(scoutingSettings);
	}
}
export function getBasicDevelopmentChartData(
	playerAttributesEntries: PlayerAttributesEntry[],
	isActiveAttributesDescriptionSettings: boolean,
	scoutingSettings: ScoutingSettings,
	translateService: TranslateService
): { data: { labels: any[]; datasets: any[] }; options: ChartOptions } {
	const chartData = developmentAttributeChartDataset(playerAttributesEntries, isActiveAttributesDescriptionSettings, translateService);
	const chartOptions = getChartOptions(!isActiveAttributesDescriptionSettings, scoutingSettings);
	return {
		data: chartData,
		options: chartOptions
	};
}

export function developmentSwissChartDataset(
	games: ScoutingGameWithReport[],
	scoutingSettings: ScoutingSettings,
	authors: SelectItem[] = []
): { data: ChartData; options: ChartOptions } {
	const performances: number[] = [];
	const potentials: number[] = [];
	const labels: string[] = [];
	games.forEach(gameWithReport => {
		if (!!gameWithReport && checkSelectedChartAuthors(gameWithReport, authors)) {
			labels.push(
				gameWithReport.title ? gameWithReport.title : moment(gameWithReport.start).startOf('day').format(getMomentFormatFromStorage())
			);
			performances.push(gameWithReport?.reportData?.performance.find((item: any) => item?.key === 'Performance')?.value || null);
			const potentialValues = gameWithReport?.reportData?.potential.map((item: any) => item?.value) || [];
			const isStringsOrBooleanArray =
				potentialValues.every((i: any) => typeof i === 'string') || potentialValues.every((i: any) => typeof i === 'boolean');
			const potentialAVg = mostOccurringElement(potentialValues);
			const roundedAvg = isStringsOrBooleanArray ? potentialAVg : Math.round(potentialAVg);
			potentials.push(roundedAvg);
		}
	});

	const datasets = [
		{
			label: 'Performance',
			data: performances,
			pointRadius: 3,
			borderWidth: 2,
			borderColor: ADVANCED_COLORS[0],
			pointBorderColor: ADVANCED_COLORS[0],
			pointBackgroundColor: ADVANCED_COLORS[0],
			pointHoverBackgroundColor: ADVANCED_COLORS[0],
			pointHoverBorderColor: '#fff',
			backgroundColor: 'transparent',
			yAxisID: 'y'
		},
		{
			label: 'Potential',
			data: potentials,
			pointRadius: 3,
			borderWidth: 2,
			borderColor: ADVANCED_COLORS[1],
			pointBorderColor: ADVANCED_COLORS[1],
			pointBackgroundColor: ADVANCED_COLORS[1],
			pointHoverBackgroundColor: ADVANCED_COLORS[1],
			pointHoverBorderColor: '#fff',
			backgroundColor: 'transparent',
			yAxisID: 'yB'
		}
	];

	const chartData = {
		labels,
		datasets
	};

	const chartOptions = getChartOptions(true, scoutingSettings);
	return {
		data: chartData,
		options: chartOptions
	};
}

export function countTrueValues(values: any[]): number {
	return (values || []).filter(value => typeof value === 'boolean' && value).length;
}
export function mostOccurringElement(array: any[]): number {
	let max = array[0];
	const counter: any = {};
	let i = array.length;
	let element;

	while (i--) {
		element = array[i];
		if (!counter[element]) counter[element] = 0;
		counter[element]++;
		if (counter[max] < counter[element]) max = element;
	}
	return max;
}

function getChartOptions(isActiveTipssDescriptionSettings: boolean, scoutingSettings: ScoutingSettings) {
	const options = {
		...getDefaultCartesianConfig(),
		// maintainAspectRatio: true,
		responsive: true
	};
	options.scales.y.max = 100;
	options.scales.x = getTimeseriesXAxis(options.scales.x);

	if (isActiveTipssDescriptionSettings) {
		const max = getMaxScale(scoutingSettings);
		options.scales = {
			x: {
				grid: {
					display: false,
					color: '#333333'
				},
				ticks: {
					autoSkip: false,
					color: '#ddd'
				},
				stacked: false
			},
			y: {
				type: 'linear',
				position: 'left',
				beginAtZero: true,
				max,
				ticks: {
					color: '#ddd'
				}
			},
			yB: {
				type: 'category',
				position: 'right',
				labels: ['A', 'B', 'C', '-'],
				max: 3,
				ticks: {
					color: '#ddd'
				},
				grid: { drawOnChartArea: false }
			}
		};
		options.plugins.tooltip.callbacks = {
			label: (value: any) => {
				return `${value.dataset.label}: ${value.formattedValue}`;
			}
		};
	}
	return options;
}

function getAvgValueForTipssChart(label: 'Performance' | 'Potential' | 'Prognosis', value: any): number | PotentialLetter {
	if (label === 'Performance') return Number(value);
	if (label === 'Potential') {
		if (Number(value) >= 5) return 'A';
		if (Number(value) >= 3) return 'B';
		if (Number(value) >= 1) return 'C';
		return '-';
	}

	if (label === 'Prognosis') {
		if (Number(value) === 0) return '-';
		if (Number(value) === 1) return 'C';
		if (Number(value) === 2) return 'B';
		if (Number(value) === 3) return 'A';
	}

	return '-';
}

function developmentAttributeChartDataset(
	playerAttributesEntries: PlayerAttributesEntry[],
	isActiveAttributesDescriptionSettings: boolean,
	translateService: TranslateService
) {
	const categories = isActiveAttributesDescriptionSettings ? attributeCategories : swissAttributesCategories;
	const datasets = categories.map(({ title, category }, index) => {
		return {
			data: playerAttributesEntries.map((entry: PlayerAttributesEntry) => {
				const categoryPlayerAttributesEntries = getCategoryValues(entry, category);
				if (!isActiveAttributesDescriptionSettings) {
					if (category === 'potential') {
						return getLiteralAvgNumber(entry, 'potential');
					} else if (category === 'prognosis') {
						const value = getPlayerAttributesEntryValue(entry, 'prognosisScore');
						return value ? ['-', 'C', 'B', 'A'].indexOf(String(value)) : '-';
					}
				}
				return getNumericalAvgForChart(categoryPlayerAttributesEntries, isActiveAttributesDescriptionSettings);
			}),
			label: translateService.instant(title),
			pointRadius: 3,
			borderWidth: 2,
			borderColor: ADVANCED_COLORS[index],
			pointBorderColor: ADVANCED_COLORS[index],
			pointBackgroundColor: ADVANCED_COLORS[index],
			pointHoverBackgroundColor: ADVANCED_COLORS[index],
			pointHoverBorderColor: '#fff',
			backgroundColor: 'transparent',
			cubicInterpolationMode: 'monotone',
			yAxisID: 'y'
		};
	});
	return {
		labels: playerAttributesEntries.map(({ date }) => moment(date)),
		datasets
	};
}

export function getNumericalAvgForChart(
	categoryPlayerAttributesEntries: AdditionalFieldEntry[],
	isActiveAttributesDescriptionSettings: boolean
): number {
	const sum = categoryPlayerAttributesEntries
		.map(({ value }) => value)
		.reduce((total, a) => Number(total) + Math.pow(Number(a || 1), 2), 0);
	return Math.round(Math.sqrt(sum / categoryPlayerAttributesEntries.length) * (isActiveAttributesDescriptionSettings ? 10 : 1));
}

function checkSelectedChartAuthors({ author }: ScoutingGameWithReport, authors: SelectItem[]) {
	return authors.length === 0 || authors.some(({ value }) => value === author);
}

function getMaxScale(scoutingSettings: ScoutingSettings): number {
	return scoutingSettings.tipssSettings.scale === 'fiveDouble' ? 5 : 10;
}

export function getPreferredMovesSelectItems(component: any): {
	movOnBall: SelectItem[];
	movOffBall: SelectItem[];
	passing: SelectItem[];
	finishing: SelectItem[];
	defending: SelectItem[];
	technique: SelectItem[];
} {
	const movOnBall = playerRolesByPosition['movOnBall'].map(x => ({
		label: component.translate.instant(x.label),
		value: x.value,
		tooltip: component.translate.instant(x.tooltip)
	}));
	const movOffBall = playerRolesByPosition['movOffBall'].map(x => ({
		label: component.translate.instant(x.label),
		value: x.value,
		tooltip: component.translate.instant(x.tooltip)
	}));
	const passing = playerRolesByPosition['passing'].map(x => ({
		label: component.translate.instant(x.label),
		value: x.value,
		tooltip: component.translate.instant(x.tooltip)
	}));
	const finishing = playerRolesByPosition['finishing'].map(x => ({
		label: component.translate.instant(x.label),
		value: x.value,
		tooltip: component.translate.instant(x.tooltip)
	}));
	const defending = playerRolesByPosition['defending'].map(x => ({
		label: component.translate.instant(x.label),
		value: x.value,
		tooltip: component.translate.instant(x.tooltip)
	}));
	const technique = playerRolesByPosition['technique'].map(x => ({
		label: component.translate.instant(x.label),
		value: x.value,
		tooltip: component.translate.instant(x.tooltip)
	}));
	return { movOnBall, movOffBall, passing, finishing, defending, technique };
}

export function getPotentialScore(avg: PotentialLetter): number {
	return ['-', 'C', 'B', 'A'].indexOf(avg);
}
export function convertPotentialToABC(avgPotential: number): PotentialLetter {
	if (!avgPotential) return '-';
	return ['C', 'C', 'C', 'B', 'B', 'A', 'A'][avgPotential] as PotentialLetter;
}
export function getPlayerAttributesEntryValue(attribute: PlayerAttributesEntry, metric: string): number {
	return (attribute?.values || []).find(({ metric: m }) => m === metric)?.value;
}

export function getPlayerAttributesEntry(attribute: PlayerAttributesEntry, metric: string): { metric: string; value: number } {
	return (attribute?.values || []).find(({ metric: m }) => m === metric);
}

export function getCategoryValues(
	attributeEntry: PlayerAttributesEntry,
	attributeCategory: MixedAttributeCategory
): AdditionalFieldEntry[] {
	return attributeEntry.values.filter(({ category }) => category === attributeCategory);
}

export function getMetricsValues(
	attributeEntry: PlayerAttributesEntry,
	attributeCategory: MixedAttributeCategory,
	metrics: string[]
): AdditionalFieldEntry[] {
	return attributeEntry.values.filter(({ category, metric }) => category === attributeCategory && metrics.includes(metric));
}

export function completeWithAdditionalFields(
	entry: PlayerAttributesEntry,
	teamsPlayerAttributes: PlayerAttribute[],
	type: 'Player' | 'PlayerScouting',
	scoutingSettings: ScoutingSettings
): PlayerAttributesEntry {
	const attributes: PlayerAttribute[] = getAttributesToMap(teamsPlayerAttributes, scoutingSettings, type === 'PlayerScouting');
	return {
		...entry,
		values: attributes.map(item => {
			const existing = getPlayerAttributesEntry(entry, item.value);
			return <AdditionalFieldEntry>{
				metric: item.value,
				metricName: item.label,
				metricDescription: item.description,
				value: existing?.value || null,
				category: item.category
			};
		})
	};
}

export function getColorFromCategory(category: AttributeCategory): { primary: string; secondary: string } {
	switch (category) {
		case 'offensive':
			return {
				primary: ADVANCED_COLORS[0],
				secondary: advancedAnnotations[0]
			};
		case 'defensive':
			return {
				primary: ADVANCED_COLORS[1],
				secondary: advancedAnnotations[1]
			};
		case 'attitude':
			return {
				primary: ADVANCED_COLORS[2],
				secondary: advancedAnnotations[2]
			};
		default:
			console.warn('Category not found');
			return {
				primary: 'white',
				secondary: 'white'
			};
	}
}

export function loadAgeOptions(players: PlayerItem[]): SelectItem[] {
	return sortBy(
		uniqBy(
			players
				.filter(({ birthDate }) => !!birthDate)
				.map(({ birthDate }) => ({
					value: getAge(birthDate as Date),
					label: getAge(birthDate as Date).toString()
				})),
			'value'
		),
		'value'
	);
}

export function loadPositionOptions(players: PlayerItem[], translate: TranslateService): SelectItem[] {
	return sortBy(
		uniqBy(
			players
				.filter(({ position }) => !!position)
				.map(({ position }) => ({
					value: position,
					label: translate.instant(position as string)
				})),
			'value'
		),
		'value'
	);
}

export function loadCustomerOptions(customerIds: string[], customers: Customer[], customerNamePipe: CustomerNamePipe): SelectItem[] {
	return uniqBy(
		customerIds.map(customerId => ({
			value: customerId,
			label: customerNamePipe.transform(customerId, customers)
		})),
		'value'
	);
}
