const wrap = style => `
<style>
  ${style}
</style>
`;

export default (id, zones) =>
	wrap(
		zones.map(zone => {
			if (zone.id === 'general' || zone.id === 'none') {
				return `
					#bck_0 > * {
						stroke: darkslateblue
					}
				`;
			} else {
				return `
					#${id} .${zone.id} {
						fill: ${zone.color} !important;
					}
					#${id} .${zone.id} path {
						fill: ${zone.color} !important;
					}
					`;
			}
		}).join(`
`)
	);
