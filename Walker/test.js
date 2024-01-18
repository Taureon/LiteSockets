let assert = require('assert'),

Builder = require('./builder'),
Reader = require('./reader');



//direct set/get of properties
let player = {
	health: 7643,
	maxHealth: 10000,
	name: "Cowardius"
};

let builder = new Builder();
builder.Int16(player.health);
builder.Int16(player.maxHealth);
builder.String8(player.name);

let result = builder.finish();
console.log("finished:", Array.from(result).map(x => x.toString(16).padStart(2, '0')).join(' '));

let reader = new Reader(result.buffer);
assert.equal(reader.Int16(), player.health);
assert.equal(reader.Int16(), player.maxHealth);
assert.equal(reader.String8(), player.name);

console.log("passed direct set/get test");


//using structs
let structure = [
    ["health", "Int16"],
    ["maxHealth", "Int16"],
    ["name", "String8"]
];

builder = new Builder();
builder.Struct(player, structure);

result = builder.finish();
console.log(result);

reader = new Reader(result.buffer);
assert.deepStrictEqual(player, reader.Struct(structure));

console.log("passed struct test");


//simple arrays
let someData = Array(Math.ceil(Math.random() * 40)).fill(256).map(x => Math.floor(Math.random() * x));
console.log(someData);

builder = new Builder();
builder.Array8(someData, "Uint8");

result = builder.finish();
console.log(result);

reader = new Reader(result.buffer);
assert.deepStrictEqual(someData, reader.Array8("Uint8"));

console.log("passed simple array test");