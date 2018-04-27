var key_bindings = {
    scroll_left  : [37, "A".charCodeAt(0)],
    scroll_up    : [38, "W".charCodeAt(0)],
    scroll_right : [39, "D".charCodeAt(0)],
    scroll_down  : [40, "S".charCodeAt(0)],
    move_left  : [37, "A".charCodeAt(0)],
    move_up    : [38, "W".charCodeAt(0)],
    move_right : [39, "D".charCodeAt(0)],
    move_down  : [40, "S".charCodeAt(0)],
    sprint     : [16],
    cycle   : [32, "E".charCodeAt(0), "Q".charCodeAt(0)],
    reverse_cycle   : [16, "Q".charCodeAt(0)],
    zoom_in  : [187],
    zoom_out : [189],
};

var reverse_key_bindings = {};
for (const action in key_bindings) {
    if (key_bindings.hasOwnProperty(action)) {
        for (const key of key_bindings[action]) {
            if (typeof(reverse_key_bindings[key]) === "undefined") {
                reverse_key_bindings[key] = [];
            }
            reverse_key_bindings[key].push(action);
        }
    }
}
