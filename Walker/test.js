let assert = require('assert'),

Builder = require('./builder'),
Reader = require('./reader');

let numToHex = (num, bytes = 1) => num.toString(16).padStart(2 * bytes, '0'),
textEncoder = new TextEncoder();



let player = {
	health: Math.ceil(Math.random() * 8000),
	maxHealth: 500 * Math.ceil(Math.random() * 20),
	name: "Cowardius"
};
console.log("test entity", { player });
console.log(numToHex(player.health, 2), ',' , numToHex(player.maxHealth, 2), ',' , numToHex(textEncoder.encode(player.name).length), ',' , Array.from(textEncoder.encode(player.name)).map(x => numToHex(x)).join(' '));

//direct set/get of properties

console.log("\ndoing direct set/get test");

let builder = new Builder();
builder.Int16(player.health);
builder.Int16(player.maxHealth);
builder.String8(player.name);

let result = builder.finish();
console.log("finished:", Array.from(result).map(x => numToHex(x)).join(' '));

let reader = new Reader(result.buffer);
assert.equal(reader.Int16(), player.health);
assert.equal(reader.Int16(), player.maxHealth);
assert.equal(reader.String8(), player.name);

console.log("passed direct set/get test");



//using structs

console.log("\ndoing struct test");

let structure = [
    ["health", "Int16"],
    ["maxHealth", "Int16"],
    ["name", "String8"]
];

builder = new Builder();
builder.Struct(player, structure);

result = builder.finish();
console.log("finished:", Array.from(result).map(x => numToHex(x)).join(' '));

reader = new Reader(result.buffer);
assert.deepStrictEqual(player, reader.Struct(structure));

console.log("passed struct test");



//simple arrays

console.log("\ndoing simple array test");

let someData = Array(Math.ceil(Math.random() * 40)).fill(256).map(x => Math.floor(Math.random() * x));
console.log("test data:", someData.map(x => numToHex(x)).join(' '));
console.log("length:", numToHex(someData.length));

builder = new Builder();
builder.Array8(someData, "Uint8");

result = builder.finish();
console.log("finished:", Array.from(result).map(x => x.toString(16).padStart(2, '0')).join(' '));

reader = new Reader(result.buffer);
assert.deepStrictEqual(someData, reader.Array8("Uint8"));

console.log("passed simple array test");