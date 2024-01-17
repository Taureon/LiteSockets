let textEncoder = new TextEncoder();

class Constructor {
	constructor () {
		this.data = [];
	}

	BigInt64 (bitInt) { this.data.push(["BigInt64", bitInt]); }
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

	Array (array, type) {
		if ('function' != typeof this[type]) throw new Error(`Nonexistant type in array!\ntype: ${type}`);
		if (this[type].length && argument == null) throw new Error(`Missing argument in array!\ntype: ${type}`);
		for (let item of array) this[type](item, ...argument);
	}

	Array8 (array, type) { this.Int8(array.length); this.Array(array, type); }
	Array16 (array, type) { this.Int16(array.length); this.Array(array, type); }
	Array32 (array, type) { this.Int32(array.length); this.Array(array, type); }
	Array64 (array, type) { this.BigInt64(BigInt(array.length)); this.Array(array, type); }

	Struct (object, struct) {
		for (let [key, type, ...argument] of struct) {
			if ('function' != typeof this[type]) throw new Error(`Nonexistant type in struct!\nkey: ${key}\ntype: ${type}\nstruct: ${struct}`);
			if (this[type].length && !argument) throw new Error(`Missing argument in struct!\nkey: ${key}\ntype: ${type}\nstruct: ${struct}`);
			this[type](object[key], ...argument);
		}
	}

	finish () {
		let buffers = [];
		for (let [type, data] of this.data) {
			let buffer;
			switch (type) {
				case 'BigInt64':
					buffer = new BigInt64Array(1);
					break;
				case 'BigUint64':
					buffer = new BigUint64Array(1);
					break;
				case 'Float32':
					buffer = new Float32Array(1);
					break;
				case 'Float64':
					buffer = new Float64Array(1);
					break;
				case 'Int8':
					buffer = new Int8Array(1);
					break;
				case 'Int16':
					buffer = new Int16Array(1);
					break;
				case 'Int32':
					buffer = new Int32Array(1);
					break;
				case 'Uint8':
					buffer = new Uint8Array(1);
					break;
				case 'Uint16':
					buffer = new Uint16Array(1);
					break;
				case 'Uint32':
					buffer = new Uint32Array(1);
					break;
				case 'Buffer':
					buffer = data;
					break;
				default:
					throw new Error('Unknown type: ' + type);
			}
			if (type != 'Buffer') buffer.set(data);
			buffers.push(buffer);
		}

		let final = new ArrayBuffer(buffers.reduce((a, b) => a + b.byteLength, 0)),
			i = 0;
		for (let buffer of buffers) {
			final.set(buffer, i);
			i += buffer.byteLength;
		}
		return final;
	}
}