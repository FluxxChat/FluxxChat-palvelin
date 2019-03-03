import test from 'ava';

const Localize = require("localize");
const localize = new Localize('./i18n/');
localize.setLocale('fi');
global._ = localize.translate;

const anonymityRule = require("../dist/rules/anonymity-rule");
const maxLengthRule = require("../dist/rules/message-max-length-rule");
const minLengthRule = require("../dist/rules/message-min-length-rule");
const muteRule = require("../dist/rules/mute-rule");
const pseudonymeRule = require("../dist/rules/pseudonyme-rule");
const formattingRule = require("../dist/rules/formatting-rule");

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
    const mlR = new maxLengthRule.MessageMaxLengthRule();
    const message = {textContent: "1234567890"};
    const params = {length: 5};
    const bool = mlR.isValidMessage(params, message, undefined);
    t.false(bool);
})

test('Message Max Length Rule - isValidMessage - correct size', t => {
    const mlR = new maxLengthRule.MessageMaxLengthRule();
    const message = {textContent: "1234567890"};
    const params = {length: 11};
    const bool = mlR.isValidMessage(params, message, undefined);
    t.true(bool);
})

test('Message Min Length Rule - isValidMessage - too short', t => {
    const mlR = new minLengthRule.MessageMinLengthRule();
    const message = {textContent: "1234567890"};
    const params = {length: 12};
    const bool = mlR.isValidMessage(params, message, undefined);
    t.false(bool);
})

test('Message Min Length Rule - isValidMessage - correct size', t => {
    const mlR = new minLengthRule.MessageMinLengthRule();
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

test('Pseudonyme Rule - createNickname', t => {
    const pR = new pseudonymeRule.PseudonymeRule();
    let name = "";
    name = pR.createNickname(undefined);
    t.false("" === name);
})

test('Pseudonyme Rule - getNickname enabled', t => {
    const pR = new pseudonymeRule.PseudonymeRule();
    const room = {id: "secretid"};
    const id = "testinimi";
    const connection = {room, id};
    pR.ruleEnabled(room);
    const pseudonyme = pR.getNickname(connection);
    const test = pR.getNickname(connection);
    t.true((id !== pseudonyme) && (pseudonyme === test));
})

test('Pseudonyme Rule - getNickname disabled', t => {
    const pR = new pseudonymeRule.PseudonymeRule();
    const room = {id: "secretid"};
    const id = "testinimi";
    const connection = {room, id};
    pR.ruleEnabled(room);
    const pseudonyme = pR.getNickname(connection);
    pR.ruleDisabled(room);
    const bool = pR.nicknameStore[room.id] === undefined;
    t.true((id !== pseudonyme) && bool);
})

test('Pseudonyme Rule - applyTextMessage', t => {
    const pR = new pseudonymeRule.PseudonymeRule();
    const room = {id: "secretid"};
    const id = "testinimi";
    const connection = {room, id};
    const message = {textContent: "message"};
    pR.ruleEnabled(room);
    const pseudonyme = pR.getNickname(connection);
    const newMessage = pR.applyTextMessage(undefined, message, connection);
    t.true(newMessage.textContent === message.textContent && newMessage.senderNickname === pseudonyme);
})

test('Formatting Rule - applyTextMessage', t => {
    const fR = new formattingRule.MarkdownRule();
    const message = {textConect: 'text', markdown: false};
    fR.applyMessage(undefined, message, undefined, undefined);
    t.true(message.markdown === true);
})