const app = require('./server/server.js');
app.io = require('socket.io')(app.start());
require('./server/realtime/realtime')(app);
const { getRedisClient } = require('./common/modules/redis.js');
const { getQueueClient } = require('./common/modules/az-storage-queue');
const { getPrefetchDataContainer } = require('./common/modules/az-cosmos');

let redisClient = getRedisClient();
const queueClient = getQueueClient();
redisClient.on('error', function (err) {
	console.error(err);
	redisClient = getRedisClient();
});

app.redisClient = redisClient;
app.queueClient = queueClient;

const loadAsyncTasks = async () => {
	app.prefetchDataContainer = await getPrefetchDataContainer();
};
loadAsyncTasks();
