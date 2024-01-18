let textDecoder = new TextDecoder();

class Reader {
	constructor (buffer) {
		this.buffer = buffer;
		this.dataView = new DataView(buffer);
		this.index = 0;
	}
	Index (n) {
		let toWalk = parseInt(n);
		if (isNaN(toWalk)) throw new Error(`Trying to walk a non-integer amount!\nto walk: ${toWalk}`);
		let old = this.index;
		this.index += toWalk;
		if (this.index > this.buffer.length) throw new Error('Walked past the buffer length!');
		return old;
	}

	BigInt64 () { return this.dataView.getBigInt64(this.Index(8)); }
	BigUint64 () { return this.dataView.getBigUint64(this.Index(8)); }
	Float32 () { return this.dataView.getFloat32(this.Index(4)); }
	Float64 () { return this.dataView.getFloat64(this.Index(8)); }
	Int8 () { return this.dataView.getInt8(this.Index(1)); }
	Int16 () { return this.dataView.getInt16(this.Index(2)); }
	Int32 () { return this.dataView.getInt32(this.Index(4)); }
	Uint8 () { return this.dataView.getUint8(this.Index(1)); }
	Uint16 () { return this.dataView.getUint16(this.Index(2)); }
	Uint32 () { return this.dataView.getUint32(this.Index(4)); }

	Buffer (length) { return this.buffer.slice(this.Index(length), this.index); }
	String (length) { return textDecoder.decode(this.Buffer(length)); }

	Buffer8 () { return this.Buffer(this.Uint8()); }
	Buffer16 () { return this.Buffer(this.Uint16()); }
	Buffer32 () { return this.Buffer(this.Uint32()); }
	Buffer64 () { return this.Buffer(this.BigUint64()); }
	String8 () { return this.String(this.Uint8()); }
	String16 () { return this.String(this.Uint16()); }
	String32 () { return this.String(this.Uint32()); }
	String64 () { return this.String(this.BigUint64()); }

	Array (type, length, argument) {
		if ('number' != typeof length || length < 0) throw new Error(`Invalid length in array!\nlength: ${length}`);
		if ('function' != typeof this[type]) throw new Error(`Nonexistant type in array!\ntype: ${type}`);
		if (this[type].length && argument == null) throw new Error(`Missing argument in array!\ntype: ${type}`);
		let array = [];
		while (length--) array.push(this[type](...argument));
		return array;
	}

	Array8 (type, argument) { return this.Array(type, this.Uint8(), argument); }
	Array16 (type, argument) { return this.Array(type, this.Uint16(), argument); }
	Array32 (type, argument) { return this.Array(type, this.Uint32(), argument); }
	Array64 (type, argument) { return this.Array(type, this.BigUint64(), argument); }

	BufferRemaining () { return this.buffer.slice(this.Index(length - this.index), this.index); }
	StringRemaining () { return textDecoder.decode(this.BufferRemaining()); }

	ArrayRemaining (type, argument) {
		if ('function' != typeof this[type]) throw new Error(`Nonexistant type in array!\ntype: ${type}`);
		if (this[type].length && argument == null) throw new Error(`Missing argument in array!\ntype: ${type}`);
		let array = [];
		while (this.index < this.buffer.length) array.push(this[type](...argument));
		return array;
	}

	Struct (struct) {
		let result = {};
		for (let [key, type, ...argument] of struct) {
			if ('function' != typeof this[type]) throw new Error(`Nonexistant type in struct!\nkey: ${key}\ntype: ${type}\nstruct: ${struct}`);
			if (this[type].length && !argument) throw new Error(`Missing argument in struct!\nkey: ${key}\ntype: ${type}\nstruct: ${struct}`);
			result[key] = this[type](...argument);
		}
		return result;
	}
}

module.exports = Reader;