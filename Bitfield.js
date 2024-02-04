class Bitfield {
	constructor (fields, init = 0n) {
		this.store = init;
		this.fields = {};
		for (let i = 0n; i < fields.length; i++) {
			this.fields[fields[i]] = i;
		}
	}
	get (field) {
		return !!(this.store & (1n << this.fields[field]));
	}
	set (field, setTrue) {
		let bit = 1n << this.fields[field];
		if (setTrue) {
			this.store |= bit;
		} else {
			this.store &= ~bit;
		}
	}
	forEach (callback = (field, isTrue) => {}) {
		let fields = Object.keys(this.fields);
		for (let i = 0; i < fields.length; i++) {
			callback(fields[i], this.get(fields[i]));
		}
	}
}

export { Bitfield };