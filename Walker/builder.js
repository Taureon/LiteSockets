let textEncoder = new TextEncoder(),

typeToArrayConstructor = {
	BigInt64: BigInt64Array,
	BigUint64: BigUint64Array,
	Float32: Float32Array,
	Float64: Float64Array,
	Int8: Int8Array,
	Int16: Int16Array,
	Int32: Int32Array,
	Uint8: Uint8Array,
	Uint16: Uint16Array,
	Uint32: Uint32Array
};

class Builder {
	constructor () {
		this.data = [];
	}

	BigInt64 (bigInt) { this.data.push(["BigInt64", bigInt]); }
	BigUint64 (bigUint) { this.data.push(["BigUint64", bigUint]); }
	Float32 (float) { this.data.push(["Float32", float]); }
	Float64 (float) { this.data.push(["Float64", float]); }
	Int8 (int) { this.data.push(["Int8", int]); }
	Int16 (int) { this.data.push(["Int16", int]); }
	Int32 (int) { this.data.push(["Int32", int]); }
	Uint8 (uint) { this.data.push(["Uint8", uint]); }
	Uint16 (uint) { this.data.push(["Uint16", uint]); }
	Uint32 (uint) { this.data.push(["Uint32", uint]); }

	Buffer (buffer) { this.data.push(["Buffer", buffer]); }
	String (string) { this.Buffer(textEncoder.encode(string)); }

	Buffer8 (buffer) { this.Int8(buffer.length); this.Buffer(buffer); }
	Buffer16 (buffer) { this.Int16(buffer.length); this.Buffer(buffer); }
	Buffer32 (buffer) { this.Int32(buffer.length); this.Buffer(buffer); }
	Buffer64 (buffer) { this.BigInt64(BigInt(buffer.length)); this.Buffer(buffer); }
	String8 (string) { this.Buffer8(textEncoder.encode(string)); }
	String16 (string) { this.Buffer16(textEncoder.encode(string)); }
	String32 (string) { this.Buffer32(textEncoder.encode(string)); }
	String64 (string) { this.Buffer64(textEncoder.encode(string)); }

	Array (array, type, ...argument) {
		if ('function' != typeof this[type]) throw new Error(`Nonexistant type in array!\ntype: ${type}`);
		if (this[type].length && argument == null) throw new Error(`Missing argument in array!\ntype: ${type}`);
		for (let item of array) this[type](item, ...argument);
	}

	Array8 (array, type, ...argument) { this.Int8(array.length); this.Array(array, type, ...argument); }
	Array16 (array, type, ...argument) { this.Int16(array.length); this.Array(array, type, ...argument); }
	Array32 (array, type, ...argument) { this.Int32(array.length); this.Array(array, type, ...argument); }
	Array64 (array, type, ...argument) { this.BigInt64(BigInt(array.length)); this.Array(array, type, ...argument); }

	Struct (object, struct) {
		for (let [key, type, ...argument] of struct) {
			if ('function' != typeof this[type]) throw new Error(`Nonexistant type in struct!\nkey: ${key}\ntype: ${type}\nstruct: ${struct}`);
			if (this[type].length && !argument) throw new Error(`Missing argument in struct!\nkey: ${key}\ntype: ${type}\nstruct: ${struct}`);
			if (!(key in object)) throw new Error(`Missing property in object!\nmissing property: ${key}\nexpected type: ${type}`);
			this[type](object[key], ...argument);
		}
	}

	finish () {
		let buffers = [];
		for (let [type, data] of this.data) {
			let buffer;
			if (type in typeToArrayConstructor) {
				buffer = new typeToArrayConstructor[type](1);
				let dataView = new DataView(buffer.buffer);
				dataView['set' + type](0, data);
			} else if (type == 'Buffer') {
				buffer = data;
			} else {
				throw new Error('Unknown type: ' + type);
			}
			buffers.push(buffer);
		}

		let final = new Uint8Array(buffers.reduce((a, b) => a + b.byteLength, 0)),
			i = 0;
		for (let buffer of buffers) {
			final.set(new Uint8Array(buffer.buffer), i);
			i += buffer.byteLength;
		}
		return final;
	}
}

if (typeof module !== 'undefined') module.exports = Builder;
else window.Builder = Builder;