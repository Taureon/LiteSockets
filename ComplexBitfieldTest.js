const Bitmap = require("./ComplexBitfield.js")

//Note: plz don't try and set properties using `bitmap.fields[fieldName]`, it will break things
//Will try and resolve this later but for now just don't do that

//Initialize a bitmap with two fields
var bitmap = new Bitmap("speed", "invincibility")
//Let's change the speed to 10
bitmap.set("speed", 10)
//Check value
console.log(bitmap.get("speed"))
//>> 10
//Now try changing it to a new data type (string)
bitmap.set("speed", "fast")
//This is to prevent bugs from being created (i.e. accidentally set to null, changed int to string, etc.):
//>> Warning: Setting bitmap field to different type than initital type (this warning will only appear once)
//Set invincibility as boolean (true)
bitmap.set("invincibility", true)
//You can also check bit allocation offsets, this is done dynamically by default and in order of field creation
console.log(bitmap.getOrderedAllocationOffsets())
