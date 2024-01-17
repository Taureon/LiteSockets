let textEncoder = new TextEncoder();

class Builder {
	constructor () {
		this.data = [];
	}

	BigInt64 (bitInt) { this.data.push(["BigInt64", bitInt]); }
	BigUint64 (bigUint) { this.data.push(["BigUint64", bigUint]); }
	Float32 (float) {}
	Float64 (float) {}
	Int8 (int) {}
	Int16 (int) {}
	Int32 (int) {}
	Uint8 (uint) {}
	Uint16 (uint) {}
	Uint32 (uint) {}

	Buffer (buffer) {}
	String (string) {}

	Buffer8 (buffer) {}
	Buffer16 (buffer) {}
	Buffer32 (buffer) {}
	Buffer64 (buffer) {}
	String8 (string) {}
	String16 (string) {}
	String32 (string) {}
	String64 (string) {}

	Array (array) {}

	Array8 (array) {}
	Array16 (array) {}
	Array32 (array) {}
	Array64 (array) {}

	Struct (object, struct) {}

	finish () {}
}
