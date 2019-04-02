import test from 'ava';

const server = require("../src/server");
const rules = require("../src/rules/active-rules");

test('A rule without parameters passes', t => {
    const s = new server.FluxxChatServer();
    const anonymity = rules.RULES['anonymity'];
    s.validateRuleParameters(undefined, anonymity, { number: "asd" });
    t.pass();
})

test('Invalid parameter is refused', t => {
    t.throws(() => {
        const s = new server.FluxxChatServer();
        const anonymity = rules.RULES['message_min_length'];
        s.validateRuleParameters(undefined, anonymity, { length: 'asd' });
    });
})

test('Wrong parameter is refused', t => {
    t.throws(() => {
        const s = new server.FluxxChatServer();
        const anonymity = rules.RULES['message_min_length'];
        s.validateRuleParameters(undefined, anonymity, { number: 10 });
    });
})

test('Correct parameter is accepted', t => {
    const s = new server.FluxxChatServer();
    const anonymity = rules.RULES['message_min_length'];
    s.validateRuleParameters(undefined, anonymity, { length: 10 });
    t.pass();
})