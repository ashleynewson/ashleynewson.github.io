var key_bindings = {
    scroll_left  : 37,
    scroll_up    : 38,
    scroll_right : 39,
    scroll_down  : 40,
    zoom_in  : 187,
    zoom_out : 189,
};

var reverse_key_bindings = {};
for (const action in key_bindings) {
    if (key_bindings.hasOwnProperty(action)) {
        reverse_key_bindings[key_bindings[action]] = action;
    } 
}
