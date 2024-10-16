module.exports = {
	ONE_YEAR_IN_SECONDS: 60 * 60 * 24 * 7 * 54,
	CURRENCY_SYMBOLS: {
		EUR: '€',
		BGN: 'лв',
		NZD: 'NZ$',
		ILS: '₪',
		RUB: '₽',
		CAD: 'CA$',
		USD: '$',
		PHP: '₱',
		CHF: 'CHF',
		ZAR: 'R',
		AUD: 'AU$',
		JPY: '¥',
		TRY: '₺',
		HKD: 'HK$',
		MYR: 'RM',
		THB: '฿',
		HRK: 'kn',
		NOK: 'kr',
		IDR: 'Rp',
		DKK: 'kr.',
		CZK: 'Kč',
		HUF: 'Ft',
		GBP: '£',
		MXN: '$',
		KRW: '₩',
		ISK: 'kr',
		SGD: 'S$',
		BRL: 'R$',
		PLN: 'zł',
		INR: '₹',
		RON: 'lei',
		CNY: '¥',
		SEK: 'kr',
		UAH: '₴'
	},
	playerAttributes: [
		{
			value: 'one_to_one_att',
			label: 'profile.attributes.one_to_one',
			custom: false,
			active: true,
			category: 'offensive',
			description: 'profile.attributes.one_to_oneAttacking.tooltip'
		},
		{
			value: 'one_to_one_def',
			label: 'profile.attributes.one_to_one',
			custom: false,
			active: true,
			category: 'defensive',
			description: 'profile.attributes.one_to_oneDefending.tooltip'
		},
		{
			value: 'determination',
			label: 'profile.attributes.determination',
			custom: false,
			active: true,
			category: 'attitude',
			description: 'profile.attributes.determination.tooltip'
		},
		{
			value: 'finishing',
			label: 'profile.attributes.finishing',
			custom: false,
			active: true,
			category: 'offensive',
			description: 'profile.attributes.finishing.tooltip'
		},
		{
			value: 'first_touch',
			label: 'profile.attributes.first_touch',
			custom: false,
			active: true,
			category: 'offensive',
			description: 'profile.attributes.first_touch.tooltip'
		},
		{
			value: 'heading',
			label: 'profile.attributes.heading',
			custom: false,
			active: true,
			category: 'offensive',
			description: 'profile.attributes.heading.tooltip'
		},
		{
			value: 'passing',
			label: 'profile.attributes.passing',
			custom: false,
			active: true,
			category: 'offensive',
			description: 'profile.attributes.passing.tooltip'
		},
		{
			value: 'long_throws',
			label: 'profile.attributes.long_throws',
			custom: false,
			active: true,
			category: 'offensive',
			description: 'profile.attributes.long_throws.tooltip'
		},
		{
			value: 'marking',
			label: 'profile.attributes.marking',
			custom: false,
			active: true,
			category: 'defensive',
			description: 'profile.attributes.marking.tooltip'
		},
		{
			value: 'tackling',
			label: 'profile.attributes.tackling',
			custom: false,
			active: true,
			category: 'defensive',
			description: 'profile.attributes.tackling.tooltip'
		},
		{
			value: 'headings',
			label: 'profile.attributes.heading',
			custom: false,
			active: true,
			category: 'defensive',
			description: 'profile.attributes.heading.tooltip'
		},
		{
			value: 'anticipation',
			label: 'profile.attributes.anticipation',
			custom: false,
			active: true,
			category: 'defensive',
			description: 'profile.attributes.anticipation.tooltip'
		},
		{
			value: 'positioning',
			label: 'profile.attributes.positioning',
			custom: false,
			active: true,
			category: 'defensive',
			description: 'profile.attributes.positioning.tooltip'
		},
		{
			value: 'bravery',
			label: 'profile.attributes.bravery',
			custom: false,
			active: true,
			category: 'attitude',
			description: 'profile.attributes.bravery.tooltip'
		},
		{
			value: 'leadership',
			label: 'profile.attributes.leadership',
			custom: false,
			active: true,
			category: 'attitude',
			description: 'profile.attributes.leadership.tooltip'
		},
		{
			value: 'teamwork',
			label: 'profile.attributes.teamwork',
			custom: false,
			active: true,
			category: 'attitude',
			description: 'profile.attributes.teamwork.tooltip'
		},
		{
			value: 'concentration',
			label: 'profile.attributes.concentration',
			custom: false,
			active: true,
			category: 'attitude',
			description: 'profile.attributes.concentration.tooltip'
		},
		{
			value: 'flair',
			label: 'profile.attributes.flair',
			custom: false,
			active: true,
			category: 'attitude',
			description: 'profile.attributes.flair.tooltip'
		},
		{
			value: 'technique',
			label: 'tipss.technique',
			custom: false,
			active: true,
			category: 'tipss'
			// description: 'profile.attributes.one_to_oneAttacking.tooltip'
		},
		{
			value: 'insight',
			label: 'tipss.insight',
			custom: false,
			active: true,
			category: 'tipss'
			// description: 'profile.attributes.one_to_oneAttacking.tooltip'
		},
		{
			value: 'personality',
			label: 'tipss.personality',
			custom: false,
			active: true,
			category: 'tipss'
			// description: 'profile.attributes.one_to_oneAttacking.tooltip'
		},
		{
			value: 'tipss_speed',
			label: 'tipss.speed',
			custom: false,
			active: true,
			category: 'tipss'
			// description: 'profile.attributes.one_to_oneAttacking.tooltip'
		},
		{
			value: 'structure',
			label: 'tipss.structure',
			custom: false,
			active: true,
			category: 'tipss'
			// des
		},
		{
			label: 'profile.attributes.quality',
			value: 'quality',
			description: 'profile.attributes.quality.tooltip',
			category: 'potential'
		},
		{
			label: 'profile.attributes.competitivity',
			value: 'competitivity',
			description: 'profile.attributes.competitivity.tooltip',
			category: 'potential'
		},
		{
			label: 'profile.attributes.character',
			value: 'character',
			description: 'profile.attributes.character.tooltip',
			category: 'potential'
		},
		{
			label: 'profile.attributes.speed',
			value: 'speed',
			description: 'profile.attributes.speed.tooltip',
			category: 'potential'
		},
		{
			label: 'profile.attributes.willpower',
			value: 'willpower',
			description: 'profile.attributes.willpower.tooltip',
			category: 'potential'
		},
		{
			label: 'profile.attributes.psychobalance',
			value: 'psychobalance',
			description: 'profile.attributes.psychobalance.tooltip',
			category: 'potential'
		}
	]
};
