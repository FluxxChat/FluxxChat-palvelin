import test from 'ava';

const Localize = require("localize");
const localize = new Localize('./i18n/');
localize.setLocale('fi');
global._ = localize.translate;

const server = require("../dist/server");
const rules = require("../dist/rules/active-rules");

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