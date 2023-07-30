class Bitmap {
	constructor (...args) {
		this.store = 0n;

		let fields = args.flat();
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

if (typeof module !== 'undefined') module.exports = Bitmap;
else window.Bitmap = Bitmap;