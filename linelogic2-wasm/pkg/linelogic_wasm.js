
let wasm;

const heap = new Array(32);

heap.fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
/**
*/
export function main() {
    wasm.main();
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
    if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory0;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let WASM_VECTOR_LEN = 0;

let cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}
/**
*/
export const CellBits = Object.freeze({ Wire:1,Protected:2,Goal:4,Queued:8,Right:16,Down:32,Left:64,Up:128,Design:7,Signal:240,Material:241,Horizontal:48,Vertical:192, });
/**
*/
export class Circuit {

    static __wrap(ptr) {
        const obj = Object.create(Circuit.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_circuit_free(ptr);
    }
    /**
    * @param {number} width
    * @param {number} height
    * @returns {Circuit}
    */
    static new(width, height) {
        var ret = wasm.circuit_new(width, height);
        return Circuit.__wrap(ret);
    }
    /**
    * @param {number} new_width
    * @param {number} new_height
    */
    resize(new_width, new_height) {
        wasm.circuit_resize(this.ptr, new_width, new_height);
    }
    /**
    * @returns {number}
    */
    get_width() {
        var ret = wasm.circuit_get_width(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    get_height() {
        var ret = wasm.circuit_get_height(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    cells_ptr() {
        var ret = wasm.circuit_cells_ptr(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    cells_mut_ptr() {
        var ret = wasm.circuit_cells_mut_ptr(this.ptr);
        return ret;
    }
    /**
    * @param {number} x
    * @param {number} y
    * @returns {number}
    */
    index(x, y) {
        var ret = wasm.circuit_index(this.ptr, x, y);
        return ret >>> 0;
    }
    /**
    * @param {number} x
    * @param {number} y
    * @returns {number | undefined}
    */
    strict_index(x, y) {
        wasm.circuit_strict_index(8, this.ptr, x, y);
        var r0 = getInt32Memory0()[8 / 4 + 0];
        var r1 = getInt32Memory0()[8 / 4 + 1];
        return r0 === 0 ? undefined : r1 >>> 0;
    }
    /**
    * @param {number} x
    * @param {number} y
    * @returns {number}
    */
    get_cell(x, y) {
        var ret = wasm.circuit_get_cell(this.ptr, x, y);
        return ret;
    }
    /**
    * @param {number} x
    * @param {number} y
    * @param {number} value
    */
    set_cell(x, y, value) {
        wasm.circuit_set_cell(this.ptr, x, y, value);
    }
    /**
    * @param {number} x
    * @param {number} y
    * @param {number} flags
    */
    add_to_cell(x, y, flags) {
        wasm.circuit_add_to_cell(this.ptr, x, y, flags);
    }
    /**
    * @param {number} x
    * @param {number} y
    * @param {number} flags
    */
    sub_from_cell(x, y, flags) {
        wasm.circuit_sub_from_cell(this.ptr, x, y, flags);
    }
    /**
    * @param {number} x
    * @param {number} y
    * @param {number} flags
    */
    toggle_in_cell(x, y, flags) {
        wasm.circuit_toggle_in_cell(this.ptr, x, y, flags);
    }
    /**
    * @param {number} x
    * @param {number} y
    * @param {number} flags
    * @param {boolean} value
    */
    set_in_cell(x, y, flags, value) {
        wasm.circuit_set_in_cell(this.ptr, x, y, flags, value);
    }
    /**
    */
    tick() {
        wasm.circuit_tick(this.ptr);
    }
    /**
    */
    force_full_update() {
        wasm.circuit_force_full_update(this.ptr);
    }
}

function init(module) {
    if (typeof module === 'undefined') {
        module = import.meta.url.replace(/\.js$/, '_bg.wasm');
    }
    let result;
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_new_59cb74e423758ede = function() {
        var ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stack_558ba5917b466edd = function(arg0, arg1) {
        var ret = getObject(arg1).stack;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_error_4bb6c2a97407129a = function(arg0, arg1) {
        try {
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(arg0, arg1);
        }
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    if ((typeof URL === 'function' && module instanceof URL) || typeof module === 'string' || (typeof Request === 'function' && module instanceof Request)) {

        const response = fetch(module);
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            result = WebAssembly.instantiateStreaming(response, imports)
            .catch(e => {
                return response
                .then(r => {
                    if (r.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
                        return r.arrayBuffer();
                    } else {
                        throw e;
                    }
                })
                .then(bytes => WebAssembly.instantiate(bytes, imports));
            });
        } else {
            result = response
            .then(r => r.arrayBuffer())
            .then(bytes => WebAssembly.instantiate(bytes, imports));
        }
    } else {

        result = WebAssembly.instantiate(module, imports)
        .then(result => {
            if (result instanceof WebAssembly.Instance) {
                return { instance: result, module };
            } else {
                return result;
            }
        });
    }
    return result.then(({instance, module}) => {
        wasm = instance.exports;
        init.__wbindgen_wasm_module = module;
        wasm.__wbindgen_start();
        return wasm;
    });
}

export default init;

