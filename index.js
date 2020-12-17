const express = require('express')
const app = express()
const expressWs = require('express-ws')(app);
const eventsWs = expressWs.getWss('/');
const { Kafka } = require('kafkajs')

const kafka = new Kafka({
	brokers: [process.env.kafkaHost || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'default' })

app.use(express.static('public'));

app.ws('/events', function(ws, req) {

});

const data = new Map();

const run = async () => {
	await consumer.connect();
	await consumer.subscribe({ topic: process.env.kafkaTopic || 'records', fromBeginning: false });

	await consumer.run({
		eachBatch: async ({ batch }) => {

			batch.messages.forEach((msg) => {
				const json = JSON.parse(msg.value.toString());
				if(data.has(json.country)) {
					data[json.country].push(json);
				}
				else {
					data[json.country] = [json];
				}

			});

			eventsWs.clients.forEach((ws) => {
				ws.send(data);
			});
		}
	})
};

run().catch(console.error);
 
app.listen(process.env.PORT || 3000)