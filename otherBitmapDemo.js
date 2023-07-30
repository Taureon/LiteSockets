const Bitmap = require('./otherBitmap.js');

const effects = ["SPEED", "SLOWNESS", "DEFENCE", "VULNERABILITY", "ATTACK", "WEAKNESS"],
	activeEffects = new Bitmap(effects);

activeEffects.set("SLOWNESS", true);
activeEffects.set("DEFENCE", true);
activeEffects.set("ATTACK", true);

console.log('');
activeEffects.forEach((field, isTrue) => console.log(field, isTrue));

activeEffects.set("SLOWNESS", false);
activeEffects.set("SPEED", true);

console.log('');
activeEffects.forEach((field, isTrue) => console.log(field, isTrue));

console.log('\n' + activeEffects.store.toString(2).padStart(6, '0'), activeEffects.store);