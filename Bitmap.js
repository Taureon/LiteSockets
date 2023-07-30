class Bitmap {
    //Why can't we do private instance variables like in Java :(
    //TODO: allow for loading in pre-existing bitmap schema with static allocations - new Bitmap().useSchema(schema)
    constructor() {
        this.fields = []
        for (let i = 0; i < arguments.length; i++) {
            let arg = arguments[i];
            this.initField(arg);
        }
        this.warned = false;
    }
    initField(field) {
        field = field.toUpperCase();
        switch (typeof field) {
            case "string":
                this.fields[field] = {
                    value: null,
                    type: null,
                    id: this.fields.length
                };
                break;
            case "object":
                if (!field.name) {
                    throw new BitmapError("Bitmap field must have a name");
                }
                this.fields[field.name] = {
                    value: field.value || null,
                    type: field.type || null,
                    id: field.id || this.fields.length
                };
                break;
            default:
                throw new BitmapError("Invalid bitmap field type");
        }
    }
    set(field, value) {
        field = field.toUpperCase();
        if (this.fields[field]) {
            if (typeof value != this.fields[field].type) {
                if (!this.warned && this.fields[field].type != null) {
                    console.warn("Warning: Setting bitmap field to different type than initital type (this warning will only appear once)");
                    this.warned = true;
                }
                this.fields[field].type = typeof value;
            }
            this.fields[field].value = value;
        }
        else
            this.initField(field);
    }
    get(field) {
        field = field.toUpperCase();
        if (this.fields[field])
            return this.fields[field].value;
        else
            return null;
    }
    getOrderedFieldNames() {
        return Object.keys(this.fields).sort((a, b) => this.fields[a].id - this.fields[b].id);
    }
    getOrderedAllocationOffsets() {
        let offsets = [];
        let lastOffset = 0;
        for (let field of this.getOrderedFieldNames()) {
            offsets.push([field, lastOffset]);
            lastOffset += this.getAllocationSize(field);
        }
        return offsets;
    }
    getAllocationSize(field) {
        field = field.toUpperCase();
        if (this.fields[field]) {
            switch (this.fields[field].type) {
                //TODO: allowing for 2 allocation modes (static user specified lengths and dynamic lengths)
                default:
                    return 1;
            }
        }
        else
            return 0;
    }
}

class BitmapError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
    }
}
BitmapError.prototype.name = 'BitmapError';

if (typeof module !== 'undefined') module.exports = Bitmap;
else window.Bitmap = Bitmap;
