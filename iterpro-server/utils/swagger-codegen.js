const axios = require('axios');
const fs = require('fs');
const pathsJson = require('../server/middleware/paths.json');

async function genFile() {
	const swagJson = await axios.get('http://localhost:3000/explorer/swagger.json');
	const paths = [];
	const resp = swagJson.data;
	for (const keyPath in resp.paths) {
		const pathObj = { url: keyPath, paramToCheck: [] };
		paths.push(pathObj);
		if (!pathsJson.paths.find(x => x.url === keyPath)) delete resp.paths[keyPath];
	}
	// const content = { paths: paths };
	// fs.writeFileSync('./server/middleware/paths_new.json', JSON.stringify(content), { flag: 'w+' });
	fs.writeFileSync('./server/swagger.json', JSON.stringify(resp), { flag: 'w+' });
}

genFile();
