import test from 'ava';

const Localize = require("localize");
const localize = new Localize('./i18n/');
localize.setLocale('fi');
global._ = localize.translate;

const room = require("../dist/room");
const anonymityRule = require("../dist/rules/anonymity-rule");

test('Room initializes without rules', t => {
    const r = new room.Room();
    const isEmpty = r.enabledRules.length === 0;
    t.true(isEmpty);
})

test('Add connection works', t => {
    const r = new room.Room();
    const connection = {hand: [], room: undefined, sendMessage: () => {}};
    const isEmpty = r.connections.length === 0;
    r.addConnection(connection);
    t.true(isEmpty && r.connections[0] === connection);
})

test('Add rule works', t => {
    const r = new room.Room();
    const connection = {hand: [], room: undefined, sendMessage: () => {}, getCardsInHand: () => {}};
    r.addConnection(connection);
    const aR = new anonymityRule.AnonymityRule();
    const isEmpty = r.enabledRules.length === 0;
    r.addRule(aR);
    t.true(r.enabledRules[0].rule === aR && isEmpty);
})

test('Remove connection works', t => {
    const r = new room.Room();
    const connection = {hand: [], room: undefined, sendMessage: () => {}};
    const isEmpty = r.connections.length === 0;
    r.addConnection(connection);
    const isListed = r.connections[0] === connection;
    r.removeConnection(connection);
    t.true(isEmpty && r.connections.length === 0 && isListed);
})