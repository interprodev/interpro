const { pick, mean } = require('lodash');

module.exports = {
	getMappedReportData: async function (item, reportTemplates) {
		const { templateId, templateVersion, reportData } = item;
		if (!reportData) return item;
		const template = reportTemplates.find(
			({ _key, version }) => String(templateId) === String(_key) && templateVersion === version
		);
		if (template) {
			let mappedReportData = [];
			template.sections.forEach(sectionTemplate => {
				const reportPropertiesKeys = getOrderedProperties(
					reportDataToArray(Object.keys(sectionTemplate.schema.properties)),
					orderedPropertiesToArray(sectionTemplate.schema.metadata.order)
				);
				for (const propertyKeyName of reportPropertiesKeys) {
					const propertyKey = propertyKeyName.name;
					const templateProperty = sectionTemplate.schema.properties[propertyKey];
					const reportDataValue = reportData[sectionTemplate.id]?.[propertyKey];
					const sectionProperties = propertiesToArray(sectionTemplate.schema.properties);
					const reportDataProperties = reportData[sectionTemplate.id];
					mappedReportData.push({
						sectionId: sectionTemplate.id,
						sectionLabel: sectionTemplate.title,
						key: propertyKey,
						label: sectionTemplate.schema.properties[propertyKey].metadata.label,
						value: getPropertyValueFromProperty(
							templateProperty,
							reportDataValue,
							sectionProperties,
							reportDataProperties
						),
						color: getGenericStyle(templateProperty, reportDataValue, sectionProperties, reportDataProperties),
						type: getType(templateProperty),
						comment: reportData[sectionTemplate.id]?.['comment' + propertyKey]
					});
				}
				item.reportData[sectionTemplate.id] = mappedReportData;
				mappedReportData = [];
			});
			return item;
		}
	},

	/* // Output example
reportDataAvg {
	Performance: 20
	Potential: C
} */
	getReportDataAvg: async function (mappedReportsData, clubTemplates, isSwiss, isWatford) {
		const swissTotal = [];
		if (mappedReportsData.length === 0) return [];
		let mappedReportDataSkeleton = [];
		const reportDataAvg = [];
		for (const mappedReportData of mappedReportsData) {
			const { templateId, templateVersion, reportData, completed } = mappedReportData || {};
			if (!completed || !reportData) continue;
			const template = clubTemplates.find(({ _key, version }) => templateId === _key && templateVersion === version);
			if (template) {
				template.sections.forEach(sectionTemplate => {
					const reportPropertiesKeys = getOrderedProperties(
						reportDataToArray(Object.keys(sectionTemplate.schema.properties)),
						orderedPropertiesToArray(sectionTemplate.schema.metadata.order)
					);
					for (const propertyKeyName of reportPropertiesKeys) {
						const propertyKey = propertyKeyName.name;
						const reportProperty = mappedReportData.reportData[sectionTemplate.id]?.find(
							({ key, sectionId }) => key === propertyKey && sectionId === sectionTemplate.id
						);
						if (reportProperty?.value || typeof reportProperty?.value === 'boolean') {
							const alreadyExist =
								mappedReportDataSkeleton.length > 0 &&
								mappedReportDataSkeleton.find(
									item => item?.key === propertyKey && item?.sectionId === sectionTemplate.id
								);
							const isOccurrenceFunction =
								sectionTemplate.schema.properties[propertyKey]?.ref === 'Function' &&
								sectionTemplate.schema.properties[propertyKey]?.metadata.operation.name === 'occurrence';
							let occurrenceResult;
							if (isOccurrenceFunction) {
								const flattedReportData = {};
								for (const data of reportData[sectionTemplate.id]) {
									if (data.value) {
										flattedReportData[data.key] = data.value;
									}
								}
								occurrenceResult = getComputedValue(
									flattedReportData,
									sectionTemplate.schema.properties[propertyKey].metadata
								);
							}
							if (alreadyExist) {
								mappedReportDataSkeleton = mappedReportDataSkeleton.map(item => {
									if (item.key === propertyKey && item.sectionId === sectionTemplate.id) {
										return {
											...item,
											values: [...item.values, isOccurrenceFunction ? occurrenceResult.true : reportProperty.value],
											colors: [...item.colors, reportProperty.color]
										};
									}
									return item;
								});
							} else {
								mappedReportDataSkeleton.push({
									sectionId: sectionTemplate.id,
									key: propertyKey,
									templateProperty: sectionTemplate.schema.properties[propertyKey],
									label: sectionTemplate.schema.properties[propertyKey].metadata.label,
									schemaProperties: sectionTemplate.schema.properties,
									values: [isOccurrenceFunction ? occurrenceResult.true : reportProperty.value],
									colors: [reportProperty.color]
								});
							}
						}
					}
				});
			}
			// #region Swiss Customization
			if (isSwiss) {
				let total = 0;
				const swissTotalProperties = ['Technique', 'Insight', 'Personality', 'Speed'];
				const performanceSection = reportData['performance'];
				for (const item of performanceSection) {
					if (swissTotalProperties.includes(item.key)) {
						total += item.value;
					}
				}
				if (!isNaN(total)) {
					swissTotal.push(total);
				}
			}
			// endregion
		}

		for (const item of mappedReportDataSkeleton) {
			let avg = undefined;
			let color = undefined;
			let tooltip = undefined;
			if (item.values.length > 0) {
				const isStringsOrBooleanArray =
					item.values.every(i => typeof i === 'string') || item.values.every(i => typeof i === 'boolean');
				avg = isStringsOrBooleanArray ? mostOccurringElement(item.values) : Number(mean(item.values).toFixed(1));
				const roundedAvg = isStringsOrBooleanArray ? avg : Math.round(avg);
				color = getGenericStyle(item.templateProperty, roundedAvg, propertiesToArray(item.schemaProperties), undefined);
				if (isSwiss && item.key === 'Potential') {
					avg = convertPotentialToABC(roundedAvg);
					color = getPotentialColor(avg);
				}
				if (isWatford) {
					tooltip = getTooltipOption(item.values);
				}
			}
			reportDataAvg.push({
				sectionId: item.sectionId,
				key: item.key,
				label: item.label,
				avg,
				color,
				tooltip,
				max: item.templateProperty.metadata?.range[1],
				description: item.templateProperty.metadata?.description
			});
		}
		// #region Swiss Customization
		if (isSwiss) {
			reportDataAvg.push({
				sectionId: 'performance',
				key: 'Total',
				label: 'Total',
				avg: Number(mean(swissTotal).toFixed(2)),
				color: 'transparent'
			});
		}
		// endregion
		return reportDataAvg;
	},
	getScoutingTemplates: async function (clubId, Club) {
		return await Club.getGameReportTemplates(String(clubId));
	},
	getGameReportTemplates: async function (teamId, Team) {
		return await Team.getGameReportTemplates(String(teamId));
	},
	getTrainingReportTemplates: async function (teamId, Team) {
		return await Team.getTrainingReportTemplates(String(teamId));
	}
};

function getTooltipOption(attributeMap) {
	const result = attributeMap.reduce((acc, curr) => ((acc[curr] = (acc[curr] || 0) + 1), acc), {});
	return Object.keys(result)
		.map(key => key + ': ' + result[key])
		.join('\n');
}

function mostOccurringElement(array) {
	let max = array[0];
	const counter = {};
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

function convertPotentialToABC(avgPotential) {
	if (!avgPotential) return '-';
	return ['C', 'C', 'C', 'B', 'B', 'A', 'A'][avgPotential];
}
function getPotentialColor(avgPotential) {
	const levelIndex = ['-', 'C', 'B', 'A'].indexOf(avgPotential);
	return levelIndex > -1 ? ['#dddddd', '#de1414', '#fff700', '#2c7317'][levelIndex] : '#dddddd';
}

function reportDataToArray(properties) {
	const newArray = [];
	Object.keys(properties).forEach(key => {
		newArray.push({ name: properties[key] });
	});
	return newArray;
}

function orderedPropertiesToArray(order) {
	const newArray = [];
	Object.keys(order).forEach(key => {
		newArray.push(order[key]);
	});
	return newArray;
}

function getOrderedProperties(properties, order) {
	if (!order) return properties;
	return properties.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}

function getType(templateProperty) {
	if (templateProperty?.ref === 'Function') {
		if (templateProperty?.metadata?.operation?.name === 'sum') {
			return 'pointType';
		}
		return 'colorType';
	}
	if (templateProperty?.type === 'boolean') return 'booleanType';
	return 'pointType';
}

function getGenericStyle(templateProperty, reportDataValue, sectionProperties, reportDataProperties) {
	if (templateProperty?.ref === 'Function') {
		return getStyleForFunction(
			sectionProperties,
			templateProperty.metadata,
			getComputedValue(reportDataProperties, templateProperty.metadata)
		).color;
	}
	return getStyle(templateProperty.metadata, reportDataValue).color;
}

function getPropertyValueFromProperty(templateProperty, reportDataValue, sectionProperties, reportDataProperties) {
	if (templateProperty?.ref === 'Function') {
		return getStyleForFunction(
			sectionProperties,
			templateProperty.metadata,
			getComputedValue(reportDataProperties, templateProperty.metadata)
		).label;
	}
	return reportDataValue;
}

function propertiesToArray(properties) {
	const result = [];
	Object.keys(properties).forEach(key => {
		result.push(properties[key]);
	});
	return result;
}

function getComputedValue(data, property) {
	const { name, parameters } = property.operation;
	// @ts-ignore
	const values = Object.values(pick(data, parameters));
	switch (name) {
		case 'sum': {
			return values.reduce((a, b) => a + b, 0);
		}
		case 'average': {
			return mean(values);
		}
		case 'occurrence': {
			const result = values.reduce((acc, curr) => {
				// ~ will add 1 and flip the sign
				// but I don't understand really well what happens here
				acc[curr] = -~acc[curr];
				return acc;
			}, {});
			return result;
		}
	}
}

function getStyleForFunction(sectionProperties, property, computedValue) {
	const otherPropertiesType = sectionProperties.filter(({ type }) => type !== 'Function')[0].type;
	const color = '#ffffff';
	let value;
	if (otherPropertiesType === 'boolean') {
		value = computedValue?.true ? computedValue.true : computedValue?.false > 0 ? 1 : undefined;
	} else {
		// TODO HANDLE CASE WITH DISCRIMINANT
		value = computedValue;
	}
	const found = getStyle(property, value);
	if (found) return found;
	return {
		color: color,
		label: '-'
	};
}

function getStyle(property, value) {
	const color = '#000';
	if (value) {
		const found =
			typeof value === 'number'
				? property.colorMapping.find(({ min, max }) => value >= min && value <= max)
				: property.colorMapping.find(({ values }) => values.includes(value));

		return {
			color: found?.color,
			label: found?.label || value
		};
	}
	return {
		color: color,
		label: undefined
	};
}
