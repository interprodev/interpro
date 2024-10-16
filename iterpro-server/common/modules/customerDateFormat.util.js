module.exports = {
	getDateFormatConfig: function (customerCurrentDateFormat) {
		const europeanConfig = 'DD/MM/YY';
		switch (customerCurrentDateFormat) {
			case 1: // UserDateFormatSetting.EuropeanFormat
				return europeanConfig;
			case 2: // UserDateFormatSetting.AmericanFormat
				return 'MM/DD/YY';
			case 3: // UserDateFormatSetting.GermanFormat
				return 'DD.MM.YY';
			case 4: // UserDateFormatSetting.ISO8601Format
				return 'YY-MM-DD';
			default:
				return europeanConfig;
		}
	}
};
