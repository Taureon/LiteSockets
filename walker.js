let ERR_PAST_BUFFER_LENGTH = 0,

textDecoder = new TextDecoder();

class Walker {
	constructor (buffer) {
		this.buffer = buffer;
		this.dataView = new DataView(buffer);
		this.index = 0;
	}
	nextIndex (n) {
		let old = this.index;
		if (this.index += n >= this.buffer.length) throw new Error("Walker walked past the buffer length!");
		return old;
	}

	nextBigInt64 () { return this.dataView.getBigInt64(this.nextIndex(8)); }
	nextBigUint64 () { return this.dataView.getBigUint64(this.nextIndex(8)); }
	nextFloat32 () { return this.dataView.getFloat32(this.nextIndex(4)); }
	nextFloat64 () { return this.dataView.getFloat64(this.nextIndex(8)); }
	nextInt8 () { return this.dataView.getInt8(this.nextIndex(1)); }
	nextInt16 () { return this.dataView.getInt16(this.nextIndex(2)); }
	nextInt32 () { return this.dataView.getInt32(this.nextIndex(4)); }
	nextUint8 () { return this.dataView.getUint8(this.nextIndex(1)); }
	nextUint16 () { return this.dataView.getUint16(this.nextIndex(2)); }
	nextUint32 () { return this.dataView.getUint32(this.nextIndex(4)); }

	nextBuffer (length) {
		let start = this.index;
		this.nextIndex(length);
		return this.buffer.slice(start, this.index);
	}

	nextString (length) { return textDecoder.decode(this.nextBuffer(length)); }

	Buffer8 () { return this.nextBuffer(this.nextUint8()); }
	Buffer16 () { return this.nextBuffer(this.nextUint16()); }
	Buffer32 () { return this.nextBuffer(this.nextUint32()); }
	Buffer64 () { return this.nextBuffer(this.nextBigUint64()); }
	String8 () { return this.nextString(this.nextUint8()); }
	String16 () { return this.nextString(this.nextUint16()); }
	String32 () { return this.nextString(this.nextUint32()); }
	String64 () { return this.nextString(this.nextBigUint64()); }
}
