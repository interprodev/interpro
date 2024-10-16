const utils = require('../../server/models/thirdparty-connectors/shared');
const moment = require('moment');
const timezone = require('moment-timezone');

const RawMetricType = {
	number: 'number',
	duration: 'duration',
	date: 'date',
	string: 'string'
};

const EtlDateType = {
	MICROSOFT_TIME: 0,
	UNIX_TIME: 1,
	DDMMYYYY: 2,
	DDMMYY: 3,
	MICROSOFT_TIME_FLOAT: 4,
	HHMMSS_NODATE: 5,
	YYYYMMDDHHMMSS: 6,
	DDMMYYYYHHMMSS: 7,
	MMDDYYYY: 8
};

const EtlDurationType = {
	SECONDS: 0,
	HHMMSS: 1,
	MMSS: 4,
	MINUTES: 2,
	MINUTESFLOAT: 3,
	EXCELDECIMALSECONDS: 5
};

module.exports = function (Sessionplayerdata) {
	Sessionplayerdata.calculateWorkload = async function (session) {
		try {
			console.log(`\t[SESSION PLAYER DATA] Calculating workload for player ${session.playerId}...`);
			const player = await Sessionplayerdata.app.models.Player.findOne({
				where: { id: session.playerId },
				fields: { _thresholds: 1 }
			});
			if (!player) {
				throw Error('[SESSION PLAYER DATA] Player not found!');
			}
			let perceived = 0;
			let cardio = 0;
			let kinematic = 0;
			let metabolic = 0;
			let mechanical = 0;
			let intensity = 0;

			let countParams = 0;

			// perceived
			if (isValid(session.rpe)) {
				const normalizedRpe = (session.rpe / Sessionplayerdata.getPlayerThresholdValue(player, 'rpe')) * 100;
				const normalizedRpeTl = (session.rpeTl / Sessionplayerdata.getPlayerThresholdValue(player, 'rpeTl')) * 100;
				const perceivedSum = Math.pow(normalizedRpe, 2) + Math.pow(normalizedRpeTl, 2);
				perceived = Math.sqrt(perceivedSum / 2);
				countParams = countParams + 1;
			}

			// kinematic
			if (
				isValid(session.totalDistance) ||
				isValid(session.sprintDistance) ||
				isValid(session.highspeedRunningDistance)
			) {
				let kineNumber = 0;
				let kineSum = 0;
				if (isValid(session.totalDistance)) {
					const normalizedTotDist =
						(session.totalDistance / Sessionplayerdata.getPlayerThresholdValue(player, 'totalDistance')) * 100;
					kineSum = kineSum + Math.pow(normalizedTotDist, 2);
					kineNumber++;
				}
				if (isValid(session.sprintDistance)) {
					const normalizedSprintDistance =
						(session.sprintDistance / Sessionplayerdata.getPlayerThresholdValue(player, 'sprintDistance')) * 100;
					kineSum = kineSum + Math.pow(normalizedSprintDistance, 2);
					kineNumber++;
				}
				if (isValid(session.highspeedRunningDistance)) {
					const normalizedHsrDist =
						(session.highspeedRunningDistance /
							Sessionplayerdata.getPlayerThresholdValue(player, 'highspeedRunningDistance')) *
						100;
					kineSum = kineSum + Math.pow(normalizedHsrDist, 2);
					kineNumber++;
				}
				kinematic = kineNumber > 0 ? Math.sqrt(kineSum / kineNumber) : 0;
				countParams = countParams + 1;
			}

			// metabolic
			if (isValid(session.powerDistance) || isValid(session.highPowerDistance) || isValid(session.powerPlays)) {
				let metaSum = 0;
				let metaNumber = 0;
				if (isValid(session.powerDistance)) {
					const normalizedPowerDist =
						(session.powerDistance / Sessionplayerdata.getPlayerThresholdValue(player, 'powerDistance')) * 100;
					metaSum = metaSum + Math.pow(normalizedPowerDist, 2);
					metaNumber++;
				}
				if (isValid(session.highPowerDistance)) {
					const normalizedHpDist =
						(session.highPowerDistance / Sessionplayerdata.getPlayerThresholdValue(player, 'highPowerDistance')) * 100;
					metaSum = metaSum + Math.pow(normalizedHpDist, 2);
					metaNumber++;
				}
				if (isValid(session.powerPlays)) {
					const normalizedCalculatedPowerPlays =
						(session.powerPlays / Sessionplayerdata.getPlayerThresholdValue(player, 'powerPlays')) * 100;
					metaSum = metaSum + Math.pow(normalizedCalculatedPowerPlays, 2);
					metaNumber++;
				}
				metabolic = metaNumber > 0 ? Math.sqrt(metaSum / metaNumber) : 0;
				countParams = countParams + 1;
			}

			// cardio
			if (isValid(session.heartRate85to90) || isValid(session.heartRateGr90)) {
				let cardioNumber = 0;
				let cardioSum = 0;
				if (isValid(session.heartRate85to90)) {
					const normalizedHr85 =
						(session.heartRate85to90 / Sessionplayerdata.getPlayerThresholdValue(player, 'heartRate85to90')) * 100;
					cardioSum = cardioSum + Math.pow(normalizedHr85, 2);
					cardioNumber++;
				}
				if (isValid(session.heartRateGr90)) {
					const normalizedHrGr90 =
						(session.heartRateGr90 / Sessionplayerdata.getPlayerThresholdValue(player, 'heartRateGr90')) * 100;
					cardioSum = cardioSum + Math.pow(normalizedHrGr90, 2);
					cardioNumber++;
				}
				cardio = cardioNumber > 0 ? Math.sqrt(cardioSum / cardioNumber) : 0;
				countParams = countParams + 1;
			}

			// mechanical
			if (
				isValid(session.highIntensityAcceleration) ||
				isValid(session.highIntensityDeceleration) ||
				isValid(session.explosiveDistance)
			) {
				let mechSum = 0;
				let mechNumber = 0;
				if (isValid(session.highIntensityAcceleration)) {
					const normalizedAccels =
						(session.highIntensityAcceleration /
							Sessionplayerdata.getPlayerThresholdValue(player, 'highIntensityAcceleration')) *
						100;
					mechSum = mechSum + Math.pow(normalizedAccels, 2);
					mechNumber++;
				}
				if (isValid(session.highIntensityDeceleration)) {
					const normalizedDecels =
						(session.highIntensityDeceleration /
							Sessionplayerdata.getPlayerThresholdValue(player, 'highIntensityDeceleration')) *
						100;
					mechSum = mechSum + Math.pow(normalizedDecels, 2);
					mechNumber++;
				}
				if (isValid(session.explosiveDistance)) {
					const normalizedExplDist =
						(session.explosiveDistance / Sessionplayerdata.getPlayerThresholdValue(player, 'explosiveDistance')) * 100;
					mechSum = mechSum + Math.pow(normalizedExplDist, 2);
					mechNumber++;
				}
				mechanical = mechNumber > 0 ? Math.sqrt(mechSum / mechNumber) : 0;
				countParams = countParams + 1;
			}

			// intensity
			if (isValid(session.averageMetabolicPower) || isValid(session.distancePerMinute)) {
				let intenSum = 0;
				let intenNumber = 0;
				if (isValid(session.averageMetabolicPower)) {
					const normalizedMetaPower =
						(session.averageMetabolicPower /
							Sessionplayerdata.getPlayerThresholdValue(player, 'averageMetabolicPower')) *
						100;
					intenSum = intenSum + Math.pow(normalizedMetaPower, 2);
					intenNumber++;
				}
				if (isValid(session.distancePerMinute)) {
					const normalizedDistPerMin =
						(session.distancePerMinute / Sessionplayerdata.getPlayerThresholdValue(player, 'distancePerMinute')) * 100;
					intenSum = intenSum + Math.pow(normalizedDistPerMin, 2);
					intenNumber++;
				}
				intensity = intenNumber > 0 ? Math.sqrt(intenSum / intenNumber) : 0;
			}

			const scoreSum =
				Math.pow(perceived, 2) +
				Math.pow(kinematic, 2) +
				Math.pow(metabolic, 2) +
				Math.pow(cardio, 2) +
				Math.pow(mechanical, 2);

			const scoreTotal = countParams > 0 ? Math.sqrt(scoreSum / countParams) : 0;

			const scoreFinal = (scoreTotal / 100) * 5;

			const resultScore = {
				workload: Number(Number(scoreFinal).toFixed(1)),
				perceived: Number(Number(perceived).toFixed(1)),
				kinematic: Number(Number(kinematic).toFixed(1)),
				metabolic: Number(Number(metabolic).toFixed(1)),
				mechanical: Number(Number(mechanical).toFixed(1)),
				cardio: Number(Number(cardio).toFixed(1)),
				intensity: Number(Number(intensity).toFixed(1))
			};

			session.workload = resultScore.workload;
			session.perceivedWorkload = resultScore.perceived;
			session.kinematicWorkload = resultScore.kinematic;
			session.metabolicWorkload = resultScore.metabolic;
			session.mechanicalWorkload = resultScore.mechanical;
			session.cardioWorkload = resultScore.cardio;
			session.intensity = resultScore.intensity;

			return session;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Sessionplayerdata.calculateDefaultMetrics = function (session, event, team, includeRawMetrics) {
		try {
			if (!session) {
				throw new Error('[SESSION PLAYER DATA] No session provided!');
			} else if (!team) {
				throw new Error('[SESSION PLAYER DATA] No team provided!');
			} else if (!event) {
				throw new Error('[SESSION PLAYER DATA] No event provided!');
			}
			console.log(`\t[SESSION PLAYER DATA] Calculating default metrics for player ${session.playerId}...`);
			if (team._gpsProviderMapping?._gpsMetricsMapping) {
				for (const field in session) {
					if (includeRawMetrics) {
						const rawMetric = team._gpsProviderMapping.rawMetrics.find(
							({ name }) => name.replace(/\./g, '_') === field
						);
						if (rawMetric) {
							session[field] = parseField(field, session, rawMetric);
						}
					}
				}

				const scope = getObjectForMathEval(session, team._gpsProviderMapping.rawMetrics);
				for (const defaultMetric of team._gpsProviderMapping._gpsMetricsMapping) {
					session = evaluateDefaultMetricWithRpe(defaultMetric, session, scope, event);
				}

				return session;
			} else {
				throw new Error(`[SESSION PLAYER DATA] GPS Provider Mapping not found for ${team.id}!`);
			}
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Sessionplayerdata.getPlayerThresholdValue = function (player, metric) {
		return Sessionplayerdata.app.models.Player.getThresholdValue(player, metric) || 1;
	};
};

function evaluateDefaultMetricWithRpe(defaultMetric, session, scope, event) {
	switch (defaultMetric.columnName) {
		case 'rpe':
			if (defaultMetric.expression && session[defaultMetric.columnName] !== null)
				session[defaultMetric.columnLabel] = session[defaultMetric.columnName];
			break;
		case 'rpeTl':
			if (utils.isCustomRpeTl(defaultMetric, scope)) {
				session[defaultMetric.columnName] = utils.evaluateDefaultMetric(defaultMetric, scope);
			} else {
				if (event.format === 'game' || event.format === 'clubGame') {
					const linkedPlayerMatchStat = event._playerMatchStats.find(
						({ enabled, playerId, minutesPlayed }) =>
							enabled && playerId.toString() === session.playerId.toString() && minutesPlayed
					);
					if (linkedPlayerMatchStat) {
						session[defaultMetric.columnName] = session.rpe * linkedPlayerMatchStat.minutesPlayed;
					}
				} else {
					session[defaultMetric.columnName] = session.rpe * session.duration;
				}
			}
			break;
		default:
			session[defaultMetric.columnName] = utils.evaluateDefaultMetric(defaultMetric, scope);
			break;
	}
	return session;
}

function getObjectForMathEval(session, rawMetrics) {
	const scope = Object.assign({}, session);
	for (const rawMetric of rawMetrics) {
		const metricName = rawMetric.name.replace(/\./g, '_');
		const metricLabel = rawMetric.label.replace(/\./g, '_');
		if (metricName in scope) {
			scope[rawMetric.label] = scope[metricName];
			scope[metricLabel] = scope[metricName];
			const renamedMet = metricName.replace(/[\s{([\]²)}/:%.\-<>]+/g, '_');
			const renamedLabel = metricName.replace(/[\s{([\]²)}/:%.\-<>]+/g, '_');
			scope[renamedMet] = scope[metricName];
			scope[renamedLabel] = scope[metricName];
		}
	}
	return scope;
}

function parseField(field, session, rawMetric) {
	let value = null;
	switch (rawMetric.type) {
		case RawMetricType.duration:
			value = getDurationFromEtlFormat(session[field], getEtlDurationTypeFromDurationFormat(rawMetric.format));
			break;
		case RawMetricType.number:
			value = parseFloat(Number(session[field]).toString().replace(',', '.'));
			break;
		case RawMetricType.date:
			value = getDateFromEtlFormat(session[field], getEtlDateTypeFromDateFormat(rawMetric.format));
			break;
		default:
			value = session[field];
			break;
	}
	return value;
}

function isValidDate(date) {
	return date && date.toString() !== 'Invalid Date';
}

function getDateFromEtlFormat(fieldValue, type, timezoneName, baseDate = null) {
	let date;
	const timezoneOffset = timezone.tz(timezoneName).format('Z');
	const timezoneOffsetMinutes = moment.duration(timezoneOffset, 'hours').asMinutes();
	switch (type) {
		case EtlDateType.MICROSOFT_TIME: {
			const days = parseInt(fieldValue, 10);
			const unixTime = (days - 25569) * 86400;
			date = moment.unix(unixTime).subtract(timezoneOffsetMinutes, 'minutes').toDate();
			break;
		}
		case EtlDateType.MICROSOFT_TIME_FLOAT: {
			const daysFloat = parseFloat(fieldValue);
			const unixTimeFloat = (daysFloat - 25569) * 86400;
			date = moment.unix(unixTimeFloat).subtract(timezoneOffsetMinutes, 'minutes').toDate();
			break;
		}
		case EtlDateType.DDMMYYYY:
			date = moment.utc(fieldValue, 'DD/MM/YYYY').subtract(timezoneOffsetMinutes, 'minutes').toDate();
			break;
		case EtlDateType.DDMMYY:
			date = moment.utc(fieldValue, 'DD/MM/YY').subtract(timezoneOffsetMinutes, 'minutes').toDate();
			break;
		case EtlDateType.YYYYMMDDHHMMSS:
			date = moment.utc(fieldValue).subtract(timezoneOffsetMinutes, 'minutes').toDate();
			break;
		case EtlDateType.HHMMSS_NODATE: {
			const seconds = moment.duration(fieldValue).asSeconds();
			if (seconds && seconds !== 0) date = moment(baseDate).add(seconds, 'seconds').toDate();
			break;
		}
		case EtlDateType.DDMMYYYYHHMMSS: {
			const secs = moment.duration(moment.utc(fieldValue, 'DD/MM/YYYY HH:mm:SS').format('HH:mm:SS')).asSeconds();
			if (secs && secs !== 0) date = moment(baseDate).add(secs, 'seconds').toDate();
			break;
		}
		case EtlDateType.MMDDYYYY:
			date = moment.utc(fieldValue, 'MM/DD/YYYY').subtract(timezoneOffsetMinutes, 'minutes').toDate();
			break;
	}

	const baseDateString = moment(baseDate).format('DD/MM/YYYY');

	return isValidDate(date) ? date : moment(baseDateString, 'DD/MM/YYYY').utc().toDate();
}

function getDurationFromEtlFormat(fieldValue, type) {
	let minutes;
	switch (type) {
		case EtlDurationType.SECONDS: {
			const seconds = parseInt(fieldValue, 10);
			minutes = seconds / 60;
			break;
		}
		case EtlDurationType.MINUTES:
			minutes = parseInt(fieldValue, 10);
			break;
		case EtlDurationType.MINUTESFLOAT:
			minutes = parseFloat(fieldValue);
			break;
		case EtlDurationType.HHMMSS:
		case EtlDurationType.MMSS:
			minutes = moment.duration(fieldValue).asSeconds() / 60;
			break;
		case EtlDurationType.EXCELDECIMALSECONDS: {
			const decimalValueSeconds = parseFloat(fieldValue);
			const secondsValue = decimalValueSeconds * 86400;
			minutes = secondsValue / 60;
			break;
		}
	}
	return minutes;
}

function getEtlDurationTypeFromDurationFormat(format) {
	switch (format) {
		case 'hhmmss': {
			return EtlDurationType.HHMMSS;
		}
		case 'mmss': {
			return EtlDurationType.MMSS;
		}
		case 'seconds': {
			return EtlDurationType.SECONDS;
		}
		case 'minutes': {
			return EtlDurationType.MINUTES;
		}
		case 'minutesFloat': {
			return EtlDurationType.MINUTESFLOAT;
		}
		case 'decimalExcelSeconds': {
			return EtlDurationType.EXCELDECIMALSECONDS;
		}
	}
}

function getEtlDateTypeFromDateFormat(format) {
	switch (format) {
		case 'microsoftTime': {
			return EtlDateType.MICROSOFT_TIME;
		}
		case 'microsoftTimeFloat': {
			return EtlDateType.MICROSOFT_TIME_FLOAT;
		}
		case 'unixTime': {
			return EtlDateType.UNIX_TIME;
		}
		case 'ddmmyyyy': {
			return EtlDateType.DDMMYYYY;
		}
		case 'ddmmyy': {
			return EtlDateType.DDMMYY;
		}
		case 'yyyyddhhmmss': {
			return EtlDateType.YYYYMMDDHHMMSS;
		}
		case 'mmddyyyy': {
			return EtlDateType.MMDDYYYY;
		}
	}
}

function isValid(value) {
	return value === 0 || (value !== null && value !== undefined && !isNaN(value) && value !== Infinity);
}
