import test from 'ava';



const anonymityRule = require("../src/rules/anonymity-rule");
const lengthRule = require("../src/rules/message-length-rule");
const muteRule = require("../src/rules/mute-rule");

test('Anonymity rule - createNickname', t => {
    const aR = new anonymityRule.AnonymityRule();
    const createdName = aR.createNickname(undefined);
    t.true(createdName === '***');
})

test('Generic rule - toJSON functions', t => {
    const aR = new anonymityRule.AnonymityRule();
    aR.toJSON();
    t.pass();
})

test('Message Max Length Rule - isValidMessage - too long', t => {
    const mlR = new lengthRule.MessageMaxLengthRule();
    const message = {textContent: "1234567890"};
    const params = {length: 5};
    const bool = mlR.isValidMessage(params, message, undefined);
    t.false(bool);
})

test('Message Max Length Rule - isValidMessage - correct size', t => {
    const mlR = new lengthRule.MessageMaxLengthRule();
    const message = {textContent: "1234567890"};
    const params = {length: 11};
    const bool = mlR.isValidMessage(params, message, undefined);
    t.true(bool);
})

test('Message Min Length Rule - isValidMessage - too short', t => {
    const mlR = new lengthRule.MessageMinLengthRule();
    const message = {textContent: "1234567890"};
    const params = {length: 12};
    const bool = mlR.isValidMessage(params, message, undefined);
    t.false(bool);
})

test('Message Min Length Rule - isValidMessage - correct size', t => {
    const mlR = new lengthRule.MessageMinLengthRule();
    const message = {textContent: "1234567890"};
    const params = {length: 5};
    const bool = mlR.isValidMessage(params, message, undefined);
    t.true(bool);
})

test('Mute Rule - isValidMessage - muted sender', t => {
    const mR = new muteRule.MuteRule();
    const message = {textContent: "message"};
    const params = {target: 'testikohde'};
    const sender = {id: 'testikohde'};
    const bool = mR.isValidMessage(params, message, sender);
    t.false(bool);
})

test('Mute Rule - isValidMessage - different sender', t => {
    const mR = new muteRule.MuteRule();
    const message = {textContent: "message"};
    const params = {target: 'erikohde'};
    const sender = {id: 'testikohde'};
    const bool = mR.isValidMessage(params, message, sender);
    t.true(bool);
})