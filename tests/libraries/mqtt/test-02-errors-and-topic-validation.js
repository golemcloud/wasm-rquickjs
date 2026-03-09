import assert from 'assert';
import * as mqttNs from 'mqtt';

const mqtt = mqttNs.default && mqttNs.default.connect ? mqttNs.default : mqttNs;

export const run = () => {
  assert.throws(
    () => mqtt.connect('example.com', { manualConnect: true }),
    /Missing protocol/
  );

  assert.throws(
    () => mqtt.connect({ protocol: 'mqtt', host: 'localhost', clean: false, manualConnect: true }),
    /Missing clientId for unclean clients/
  );

  assert.strictEqual(mqtt.validateTopic('home/sensor/temperature'), true);
  assert.strictEqual(mqtt.validateTopic('home/+/temperature'), true);
  assert.strictEqual(mqtt.validateTopic('home/#'), true);
  assert.strictEqual(mqtt.validateTopic('home/#/bad'), false);
  assert.strictEqual(mqtt.validateTopic('home/bad+topic'), false);

  assert.strictEqual(mqtt.validateTopics([]), 'empty_topic_list');
  assert.strictEqual(mqtt.validateTopics(['home/good', 'home/#/bad']), 'home/#/bad');
  assert.strictEqual(mqtt.validateTopics(['a/+', 'b/#']), null);

  return 'PASS: connect errors and topic validation helpers work';
};
