import test from 'ava';

const room = require("../src/room");
const anonymityRule = require("../src/rules/anonymity-rule");

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