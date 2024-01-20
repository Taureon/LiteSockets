## function arguments

### length: Integer
How many bytes (`Buffer()`), characters (`String()`) or items (`Array()`) to read.

### type: String
What kind of data to expect. (`Float32`, `String16`, `Array`, etc...)

### ...argument: String/Integer
The arguments if you were calling the aforementioned `type` as a function.

### struct: Array\<structEntry>
An array of `structEntry`s, which is an Array that is formatted like this: `[ propertyName , type (, ...extra) ]`

`extra`: Depends on `type`. Most don't need extra, but here is a list for those who do:
- `Struct`: A `struct`.
- `Array[N]`: Another `type` followed by `...argument`.
- `Array`: Same as `Array[N]`, but with a `length` between the second `type` and `...argument`.

# Reader
### .BigInt64 ( ): BigInt
### .BigUint64 ( ): BigInt
### .Float32 ( ): Number
### .Float64 ( ): Number
### .Int8 ( ): Number
### .Int16 ( ): Number
### .Int32 ( ): Number
### .Uint8 ( ): Number
### .Uint16 ( ): Number
### .Uint32 ( ): Number
### .Buffer ( length )
### .Buffer8 ( ): Buffer
### .Buffer16 ( ): Buffer
### .Buffer32 ( ): Buffer
### .Buffer64 ( ): Buffer
### .String ( length ): String
### .String8 ( ): String
### .String16 ( ): String
### .String32 ( ): String
### .String64 ( ): String
### .Array ( type, length, ...argument ) : Array
### .Array8 ( type, ...argument ) : Array
### .Array16 ( type, ...argument ) : Array
### .Array32 ( type, ...argument ) : Array
### .Array64 ( type, ...argument ) : Array
### .BufferRemaining ( ): Buffer
### .StringRemaining ( ): String
### .ArrayRemaining ( type, ...argument ) : Array
### .Struct ( struct ): Object

# Writer
### .BigInt64 ( bitInt )
### .BigUint64 ( bigUint )
### .Float32 ( float )
### .Float64 ( float )
### .Int8 ( int )
### .Int16 ( int )
### .Int32 ( int )
### .Uint8 ( uint )
### .Uint16 ( uint )
### .Uint32 ( uint )
### .Buffer ( buffer )
### .String ( string )
### .Buffer8 ( buffer )
### .Buffer16 ( buffer )
### .Buffer32 ( buffer )
### .Buffer64 ( buffer )
### .String8 ( string )
### .String16 ( string )
### .String32 ( string )
### .String64 ( string )
### .Array ( array, type, ...argument )
### .Array8 ( array, type, ...argument )
### .Array16 ( array, type, ...argument )
### .Array32 ( array, type, ...argument )
### .Array64 ( array, type, ...argument )
### .Struct ( object, struct )
### .finish ( ): Uint8Array
Builds the complete buffer with the data that was given before using the other functions.