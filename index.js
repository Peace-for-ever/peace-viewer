const express = require('express')
const app = express()
const expressWs = require('express-ws')(app);
const eventsWs = expressWs.getWss('/');
const { Kafka } = require('kafkajs');
const { Database, aql } = require("arangojs");

const db = new Database({
	url: `http://${process.env.arangoHost}`,
	auth: { username: process.env.arangoUser, password: process.env.arangoPassword },
});
const collection = db.collection(process.env.kafkaRecordTopic);

const kafka = new Kafka({
	brokers: [`${process.env.kafkaHost}:${process.env.kafkaPort}`]
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
	await consumer.subscribe({ topic: process.env.kafkaRecordTopic, fromBeginning: false });

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
 
app.listen(process.env.PORT || 3001)