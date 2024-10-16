var path = require('path');
const conf = require('dotenv').config({ path: path.join(__dirname, '../', '.env.test') });

console.log(process.env.APP_ENV);
console.log(process.env.DB_URL);
