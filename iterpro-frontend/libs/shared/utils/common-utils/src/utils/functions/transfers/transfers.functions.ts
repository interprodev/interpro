export const employmentContractPipeline = {
	include: [
		{
			relation: 'bonuses'
		},
		{
			relation: 'basicWages',
			scope: {
				where: {
					type: 'basicWage'
				}
			}
		},
		{
			relation: 'privateWriting',
			scope: {
				where: {
					type: 'privateWriting'
				}
			}
		},
		{
			relation: 'contributions',
			scope: {
				where: {
					type: 'contribution'
				}
			}
		},
		{
			relation: 'agentContracts',
			scope: {
				include: [
					{
						relation: 'bonuses'
					},
					{
						relation: 'fee'
					}
				]
			}
		}
	]
};

export const transferContractPipeline = {
	include: [
		{
			relation: 'bonuses'
		},
		{
			relation: 'sellOnFee'
		},
		{
			relation: 'buyBack'
		},
		{
			relation: 'loanOption'
		},
		{
			relation: 'agentContracts',
			scope: {
				include: [
					{
						relation: 'bonuses'
					},
					{
						relation: 'fee'
					}
				]
			}
		}
	]
};
