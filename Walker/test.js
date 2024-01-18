let assert = require('assert'),

Builder = require('./builder'),
Reader = require('./reader');

let numToHex = (num, bytes = 1) => '0x' + num.toString(16).padStart(2 * bytes, '0'),
	hexifyArray = array => Array.from(array).map(x => numToHex(x)).join(' '),
	textEncoder = new TextEncoder();



let player = {
	health: Math.ceil(Math.random() * 8000),
	maxHealth: 500 * Math.ceil(Math.random() * 20),
	name: "Cowardius"
};
console.log("\ntest entity", { player });
console.log(numToHex(player.health, 2), ',' , numToHex(player.maxHealth, 2), ',' , numToHex(textEncoder.encode(player.name).length), ',' , hexifyArray(textEncoder.encode(player.name)));

// direct set/get of properties

console.log("\ndoing direct set/get test");

let builder = new Builder();
builder.Int16(player.health);
builder.Int16(player.maxHealth);
builder.String8(player.name);

let result = builder.finish();
console.log("finished:", hexifyArray(result));

let reader = new Reader(result.buffer);
assert.equal(reader.Int16(), player.health);
assert.equal(reader.Int16(), player.maxHealth);
assert.equal(reader.String8(), player.name);

console.log("passed direct set/get test");



// using structs

console.log("\ndoing struct test");

let structure = [
    ["health", "Int16"],
    ["maxHealth", "Int16"],
    ["name", "String8"]
];

builder = new Builder();
builder.Struct(player, structure);

result = builder.finish();
console.log("finished:", hexifyArray(result));

reader = new Reader(result.buffer);
assert.deepStrictEqual(player, reader.Struct(structure));

console.log("passed struct test");



// simple arrays

console.log("\ndoing simple array test");

let someData = Array(Math.ceil(Math.random() * 40)).fill(256).map(x => Math.floor(Math.random() * x));
console.log("test data:", hexifyArray(someData));
console.log("length:", numToHex(someData.length));

builder = new Builder();
builder.Array8(someData, "Uint8");

result = builder.finish();
console.log("finished:", hexifyArray(result));

reader = new Reader(result.buffer);
assert.deepStrictEqual(someData, reader.Array8("Uint8"));

console.log("passed simple array test");



// complicated arrays

console.log("\n doing complicated array test");

let items = [{
	name: "Air",
	description: "does nothing",
	amount: 1000,
	maxAmount: 1000,
	effects: []
}, {
	name: "Regeneration Potion",
	description: "Heals you over time",
	amount: 5,
	maxAmount: 20,
	effects: [{
		effectId: 30,
		duration: 18,
		maxDuration: 25
	}]
}, {
	name: "Rock",
	description: "Can be thrown",
	amount: 74,
	maxAmount: 100,
	effects: []
}, {
	name: "Giant",
	description: "Makes you very strong!",
	amount: 1,
	maxAmount: 3,
	effects: [{
		effectId: 10,
		duration: 15,
		maxDuration: 20
	},{
		effectId: 14,
		duration: 15,
		maxDuration: 20
	},{
		effectId: 15,
		duration: 15,
		maxDuration: 20
	}]
}, {
	name: "Insta-Health",
	description: "Heals you immediately",
	amount: 3,
	maxAmount: 10,
	effects: [{
		effectId: 41,
		duration: 1,
		maxDuration: 1
	}]
}];

structure = [
	["name", "String8"],
	["description", "String16"],
	["amount", "Uint32"],
	["maxAmount", "Uint32"],
	["effects", "Array16", "Struct", [
		["effectId", "Uint8"],
		["duration", "Uint16"],
		["maxDuration", "Uint16"]
	]]
];

builder = new Builder();
builder.Array8(items, "Struct", structure);

result = builder.finish();
console.log("finished:", hexifyArray(result));

reader = new Reader(result.buffer);
assert.deepStrictEqual(items, reader.Array8("Struct", structure));

console.log("passed complicated array test");