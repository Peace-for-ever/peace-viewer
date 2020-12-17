const express = require('express')
const app = express()
const expressWs = require('express-ws')(app);
const eventsWs = expressWs.getWss('/');
const { Kafka } = require('kafkajs');
const { Database, aql } = require("arangojs");

const topicName = process.env.kafkaTopic || 'records';

const db = new Database({
	url: "http://localhost:8529",
	auth: { username: "root", password: "scala" },
});
const collection = db.collection(topicName);

const kafka = new Kafka({
	brokers: [process.env.kafkaHost || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'default' })

app.use(express.static('public'));

app.ws('/events', function(ws, req) {
	sendData();
});

const data = new Map();
let max = 1;

function updateData({latitude, longitude})
{
	const id = `${latitude}:${longitude}`;
	const coo = [latitude, longitude];

	if(data.has(id)) {
		const el = data.get(id);
		el.push(coo);

		if(el.length > max) {
			max = el.length;
		}
	}
	else {
		data.set(id, [coo]);
	};
}

function sendData()
{
	const points = [];

	data.forEach((value) => {
		points.push(value[0][0], value[0][1], value.length / max);
	});

	eventsWs.clients.forEach((ws) => {
		ws.send(JSON.stringify(points));
	});
}

const run = async () => {

	const cursor = await db.query(aql`
		FOR doc IN ${collection}
		RETURN doc
	`);

	for await(const value of cursor) {
		updateData(value);
	}

	sendData();

	await consumer.connect();
	await consumer.subscribe({ topic: topicName, fromBeginning: false });

	await consumer.run({
		eachBatch: async ({ batch }) => {

			batch.messages.forEach((msg) => {
				const json = JSON.parse(msg.value.toString());
				updateData(json);
			});

			sendData();
		}
	})
};

run().catch(console.error);
 
app.listen(process.env.PORT || 3000)