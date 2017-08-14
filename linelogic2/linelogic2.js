// LineLogic 2
// Copyright Ashley Newson 2017

var version_string = "0.9"

var canvas;
var ctx;
var now;
var then;
var running;
var width;
var height;
var scale;
var full_render = true;
var full_update = true;
var cells = null;
var new_cells = null;
var readonly = null;
var goals = Array(0);
var clipboard_cells = Array(0);
var clipboard_width = 0;
var clipboard_height = 0;
var update_count = 0;
var update_guard;
var update_x;
var update_y;
var new_update_count = 0;
var new_update_guard;
var new_update_x;
var new_update_y;
var speed = 0;
var slow_count = 0;

var input_speed;

var mode_wire;
var mode_protect;
var mode_wire_force;
var mode_goal;

var goal_ignore;
var goal_all;
var goal_any;
var goal_change;
var goal_mode;

var executionStatus;
var it_acc;

var mouse = {x:0, y:0};
var mouse_start = {x:0, y:0};
var keys_down = {};

function ascii (a) { return a.charCodeAt(0); }

var key_bindings = {
    guard : ascii("G"), // used to guard dangerous actions.

    reset : ascii("R"),

    pause : ascii(" "),
    slower : 219,
    faster : 221,

    mode_wire : ascii("1"),
    mode_protect : ascii("2"),
    mode_wire_force : ascii("3"),
    mode_goal : ascii("4"),

    subtract : ascii("D"),
    copy : ascii("C"),
    cut : ascii("X"),
    erase : ascii("E"),
    paste : ascii("V"),
    additive_paste : ascii("B"),
    flip_v : ascii("I"),
    flip_h : ascii("K"),
    rotate_ccw : ascii("J"),
    rotate_cw : ascii("L"),
};


requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;


function render() {
    if (full_render) {
        // Clear screen
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var x;
        var y;
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                if (((x % 2) ^ (y % 2)) === 1) {
                    if (readonly[y][x] === 1) {
                        ctx.fillStyle = "rgb(32, 128, 32)";
                    } else {
                        ctx.fillStyle = "rgb(32, 32, 32)";
                    }
                    ctx.fillRect(x, y, 1, 1);
                } else {
                    if (readonly[y][x] === 1) {
                        ctx.fillStyle = "rgb(0, 128, 0)";
                    } else {
                        ctx.fillStyle = "rgb(0, 0, 0)";
                    }
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        full_render = false;
    }

    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            if (cells[y][x] & 1) {
                if (cells[y][x] & 30) {
                    ctx.fillStyle = "rgb(255, " + (readonly[y][x] === 1 ? '255' : '128') + ", " + (cells[y][x] >> 1) + ")";
                    ctx.fillRect(x, y, 1, 1);
                } else {
                    ctx.fillStyle = "rgb(0, " + (readonly[y][x] === 1 ? '255' : '128') + ", 255)";
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    var i;
    for (i = 0; i < goals.length; i++) {
        var x = goals[i].x;
        var y = goals[i].y;
        if (cells[y][x] & 30) {
            ctx.fillStyle = "rgb(255, 0, " + (cells[y][x] >> 1) + ")";
            ctx.fillRect(x, y, 1, 1);
        } else {
            ctx.fillStyle = "rgb(128, 0, 0)";
            ctx.fillRect(x, y, 1, 1);
        }
    }

    if (keys_down[key_bindings.paste] || keys_down[key_bindings.additive_paste]) {
        for (y = 0; y < clipboard_height; y++) {
            for (x = 0; x < clipboard_width; x++) {
                if (clipboard_cells[y][x] & 1) {
                    if (clipboard_cells[y][x] & 30) {
                        ctx.fillStyle = "rgb(255, " + (readonly[y][x] === 1 ? '255' : '192') + ", " + (cells[y][x] >> 1) + ")";
                        ctx.fillRect(x + mouse.x, y + mouse.y, 1, 1);
                    } else {
                        ctx.fillStyle = "rgb(64, " + (readonly[y][x] === 1 ? '255' : '192') + ", 255)";
                        ctx.fillRect(x + mouse.x, y + mouse.y, 1, 1);
                    }
                } else if (keys_down[key_bindings.paste]) {
                    ctx.fillStyle = "rgb(64, 64, 64)";
                    ctx.fillRect(x + mouse.x, y + mouse.y, 1, 1);
                }
            }
        }
        full_render = true;
    }
}



function update_cell(x, y) {
    if (cells[y][x] & 1) {
        var inv_x;
        var inv_y;
        inv_x = (cells[y][x-1] & 1) === (cells[y][x+1] & 1);
        inv_y = (cells[y-1][x] & 1) === (cells[y+1][x] & 1);
        new_cells[y][x] = 1;

        if (cells[y][x-1] & 2) {
            new_cells[y][x] |= 2;
        }
        if (cells[y-1][x] & 4) {
            new_cells[y][x] |= 4;
        }
        if (cells[y][x+1] & 8) {
            new_cells[y][x] |= 8;
        }
        if (cells[y+1][x] & 16) {
            new_cells[y][x] |= 16;
        }

        if (!(cells[y][x+1] & 1) && (cells[y][x-1] & 1) && (!(cells[y][x] &  2) === inv_y)) {
            if (cells[y+1][x] & 1) {new_cells[y][x] |=  4;}
            if (cells[y-1][x] & 1) {new_cells[y][x] |= 16;}
        }
        if (!(cells[y+1][x] & 1) && (cells[y-1][x] & 1) && (!(cells[y][x] &  4) === inv_x)) {
            if (cells[y][x+1] & 1) {new_cells[y][x] |=  2;}
            if (cells[y][x-1] & 1) {new_cells[y][x] |=  8;}
        }
        if (!(cells[y][x-1] & 1) && (cells[y][x+1] & 1) && (!(cells[y][x] &  8) === inv_y)) {
            if (cells[y+1][x] & 1) {new_cells[y][x] |=  4;}
            if (cells[y-1][x] & 1) {new_cells[y][x] |= 16;}
        }
        if (!(cells[y-1][x] & 1) && (cells[y+1][x] & 1) && (!(cells[y][x] & 16) === inv_x)) {
            if (cells[y][x+1] & 1) {new_cells[y][x] |=  2;}
            if (cells[y][x-1] & 1) {new_cells[y][x] |=  8;}
        }
    }
}

function queue_update(x, y) {
    if (new_update_guard[y][x] === 0) {
        new_update_guard[y][x] = 1;
        new_update_x[new_update_count] = x;
        new_update_y[new_update_count] = y;
        new_update_count++;
    }
}

function queue_update_plus(x, y) {
    queue_update(x, y);
    queue_update(x-1, y);
    queue_update(x+1, y);
    queue_update(x, y-1);
    queue_update(x, y+1);
}

function update() {
    var max_iterations = 1;
    if (speed < 0) {
        if (speed > -120) {
            max_iterations = parseInt(120 / (parseInt(speed)+120));
        } else {
            max_iterations = -1;
        }
    } else {
        if (slow_count < speed) {
            slow_count++;
            return;
        } else {
            slow_count = 0;
        }
    }

    var achieved = false;

    if (goal_ignore.checked) {
        goal_mode = "ignore";
    } else if (goal_all.checked) {
        goal_mode = "all";
    } else if (goal_any.checked) {
        goal_mode = "any";
    } else if (goal_change.checked) {
        goal_mode = "change";
    }

    var it;
    var start_time = Date.now();
    for (it = 0; it != max_iterations; it++) {
        var tmp;
        var x;
        var y;
        if (full_update) {
            update_count = 0;
            new_update_count = 0;
            update_x = Array(0);
            update_y = Array(0);
            new_update_x = Array(0);
            new_update_y = Array(0);
            for (y = 0; y < height; y++) {
                for (x = 0; x < width; x++) {
                    update_guard[y][x] = 0;
                    new_update_guard[y][x] = 0;
                }
            }
            for (y = 1; y < height-1; y++) {
                for (x = 1; x < width-1; x++) {
                    update_cell(x, y);
                    if (cells[y][x] & 1) {
                        queue_update(x, y);
                    }
                }
            }
            full_update = false;
        } else {
            var i;
            new_update_count = 0;
            for (i = 0; i < update_count; i++) {
                x = update_x[i];
                y = update_y[i];
                update_guard[y][x] = 0;
                update_cell(x, y);
            }
            for (i = 0; i < update_count; i++) {
                x = update_x[i];
                y = update_y[i];
                if (cells[y][x] != new_cells[y][x]) {
                    queue_update_plus(x, y);
                }
            }
        }
        tmp = new_cells;
        new_cells = cells;
        cells = tmp;

        tmp = new_update_guard;
        new_update_guard = update_guard;
        update_guard = tmp;
        tmp = new_update_x;
        new_update_x = update_x;
        update_x = tmp;
        tmp = new_update_y;
        new_update_y = update_y;
        update_y = tmp;
        tmp = new_update_count;
        new_update_count = update_count;
        update_count = tmp;

        {
            var i;
            if (goal_mode === "all") {
                achieved = (goals.length > 0);
                for (i = 0; i < goals.length; i++) {
                    if ((cells[goals[i].y][goals[i].x] & 30) === 0) {
                        achieved = false;
                        break;
                    }
                }
            } else if (goal_mode === "any") {
                var i;
                achieved = false
                for (i = 0; i < goals.length; i++) {
                    if ((cells[goals[i].y][goals[i].x] & 30)) {
                        achieved = true;
                        break;
                    }
                }
            } else if (goal_mode === "change") {
                var i;
                achieved = false
                for (i = 0; i < goals.length; i++) {
                    if (cells[goals[i].y][goals[i].x] != (goals[i].last || 1)) {
                        achieved = true;
                        break;
                    }
                }
            }

            for (i = 0; i < goals.length; i++) {
                goals[i].last = cells[goals[i].y][goals[i].x];
            }
        }
        if (achieved) {
            it++; // For it counting.
            break;
        }

        var current_time = Date.now();
        if (current_time - start_time > 1) {
            it++; // For it counting.
            break;
        }
    }
    render();

    it_acc += it;
    if (achieved === true) {
        executionStatus.innerHTML = "Complete:<br>Iteration count: " + it_acc;
        stop();
    } else {
        executionStatus.innerHTML = "Running:<br>Cycles per frame: " + it + "<br>out of target: " + max_iterations + "<br>Iteration count: " + it_acc;
    }
}


var main_loop = function() {
    if (running) {

        update();

        then = now;

        requestAnimationFrame(main_loop);
    } else {
        executionStatus.innerHTML = "Stopped" + "<br>Iteration count: " + it_acc;
    }
}

var display_loop = function() {
    if (!running && (keys_down[key_bindings.paste] || keys_down[key_bindings.additive_paste])) {
        render();
        requestAnimationFrame(display_loop);
    }
}


function toggle_cell(x, y, force) {
    if (x >= 1 && x < width-1 && y >= 1 && y < height-1) {
        if (readonly[y][x] === 0) {
            if (cells[y][x] === 0) {
                cells[y][x] = 1;
                new_cells[y][x] = 1;
            } else {
                cells[y][x] = 0;
                new_cells[y][x] = 0;

                cells[y][x-1] = new_cells[y][x-1] & ~2;
                cells[y-1][x] = new_cells[y-1][x] & ~4;
                cells[y][x+1] = new_cells[y][x+1] & ~8;
                cells[y+1][x] = new_cells[y+1][x] & ~16;
            }
            full_render = true;
            render();
            full_update = true;
        } else if (force) {
            if (cells[y][x] === 0) {
                cells[y][x] = 1;
                new_cells[y][x] = 1;
            } else {
                cells[y][x] = 0;
                new_cells[y][x] = 0;
                var i;
                for (i = 0; i < goals.length; i++) {
                    if (goals[i].x === x && goals[i].y === y) {
                        goals.splice(i, 1);
                        break;
                    }
                }

                cells[y][x-1] = new_cells[y][x-1] & ~2;
                cells[y-1][x] = new_cells[y-1][x] & ~4;
                cells[y][x+1] = new_cells[y][x+1] & ~8;
                cells[y+1][x] = new_cells[y+1][x] & ~16;
            }
            full_render = true;
            render();
            full_update = true;
        }
    }
}

function line_cell(x1, y1, x2, y2, set_to, force) {
    if (x1 >= 1 && x1 < width-1 && y1 >= 1 && y1 < height-1 &&
        x2 >= 1 && x2 < width-1 && y2 >= 1 && y2 < height-1) {
        var mx = Math.abs(x2 - x1);
        var my = Math.abs(y2 - y1);
        var ox1 = (x1 < x2) ? x1 : x2;
        var ox2 = (x1 < x2) ? x2 : x1;
        var oy1 = (y1 < y2) ? y1 : y2;
        var oy2 = (y1 < y2) ? y2 : y1;
        if (mx >= my) {
            for (var x = ox1; x <= ox2; x++) {
                set_cell(x, y1, set_to, force);
            }
            for (var y = oy1; y <= oy2; y++) {
                set_cell(x2, y, set_to, force);
            }
        } else {
            for (var y = oy1; y <= oy2; y++) {
                set_cell(x1, y, set_to, force);
            }
            for (var x = ox1; x <= ox2; x++) {
                set_cell(x, y2, set_to, force);
            }
        }
    }
}

function set_cell(x, y, set_to, force) {
    if (readonly[y][x] === 0 || force) {
        if (set_to) {
            cells[y][x] = 1;
            new_cells[y][x] = 1;
        } else {
            cells[y][x] = 0;
            new_cells[y][x] = 0;

            cells[y][x-1] = new_cells[y][x-1] & ~2;
            cells[y-1][x] = new_cells[y-1][x] & ~4;
            cells[y][x+1] = new_cells[y][x+1] & ~8;
            cells[y+1][x] = new_cells[y+1][x] & ~16;
        }
    }
    if (readonly[y][x] === 1 && force && set_to === false) {
        var i;
        for (i = 0; i < goals.length; i++) {
            if (goals[i].x === x && goals[i].y === y) {
                goals.splice(i, 1);
                break;
            }
        }
    }
    full_render = true;
    full_update = true;
}

function toggle_protect(x, y) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
        for (i = 0; i < goals.length; i++) {
            if (goals[i].x === x && goals[i].y === y) {
                break;
            }
        }
        if (i === goals.length) { // If not a goal.
            if (readonly[y][x] === 0) {
                readonly[y][x] = 1;
            } else {
                readonly[y][x] = 0;
            }
        }
        full_render = true;
    }
}

function box_protect(x1, y1, x2, y2, set_to) {
    if (x1 >= 0 && x1 < width && y1 >= 0 && y1 < height &&
        x2 >= 0 && x2 < width && y2 >= 0 && y2 < height) {
        if (x1 > x2) {
            var tmp = x1; x1 = x2; x2 = tmp;
        }
        if (y1 > y2) {
            var tmp = y1; y1 = y2; y2 = tmp;
        }
        for (var y = y1; y <= y2; y++) {
            for (var x = x1; x <= x2; x++) {
                var i;
                for (i = 0; i < goals.length; i++) {
                    if (goals[i].x === x && goals[i].y === y) {
                        break;
                    }
                }
                if (i === goals.length) { // If not a goal.
                    console.log(set_to);
                    readonly[y][x] = set_to ? 1 : 0;
                }
            }
        }
        full_render = true;
    }
}

function box_copy(x1, y1, x2, y2) {
    if (x1 >= 0 && x1 < width && y1 >= 0 && y1 < height &&
        x2 >= 0 && x2 < width && y2 >= 0 && y2 < height) {
        if (x1 > x2) {
            var tmp = x1; x1 = x2; x2 = tmp;
        }
        if (y1 > y2) {
            var tmp = y1; y1 = y2; y2 = tmp;
        }
        resize_2d(clipboard_cells, clipboard_width, clipboard_height, x2 - x1 + 1, y2 - y1 + 1);
        clipboard_width = x2 - x1 + 1;
        clipboard_height = y2 - y1 + 1;
        for (var y = y1; y <= y2; y++) {
            for (var x = x1; x <= x2; x++) {
                clipboard_cells[y - y1][x - x1] = cells[y][x];
            }
        }
        full_render = true;
    }
}

function box_erase(x1, y1, x2, y2) {
    if (x1 >= 0 && x1 < width && y1 >= 0 && y1 < height &&
        x2 >= 0 && x2 < width && y2 >= 0 && y2 < height) {
        if (x1 > x2) {
            var tmp = x1; x1 = x2; x2 = tmp;
        }
        if (y1 > y2) {
            var tmp = y1; y1 = y2; y2 = tmp;
        }
        for (var y = y1; y <= y2; y++) {
            for (var x = x1; x <= x2; x++) {
                set_cell(x, y, false, mode_wire_force.checked);
            }
        }
        full_render = true;
        full_update = true;
    }
}

function box_paste(x1, y1, additive) {
    if (x1 >= 1 && x1 < width && y1 >= 1 && y1 < height) {
        var x2 = x1 + clipboard_width - 1;
        var y2 = y1 + clipboard_height - 1;
        for (var y = y1; y <= y2; y++) {
            for (var x = x1; x <= x2; x++) {
                if (x < width - 1 && y < height - 1) {
                    if (additive) {
                        if (keys_down[key_bindings.subtract]) {
                            if (clipboard_cells[y - y1][x - x1] != 0) {
                                set_cell(x, y, false, mode_wire_force.checked);
                            }
                        } else {
                            set_cell(x, y, cells[y][x] === 1 || clipboard_cells[y - y1][x - x1], mode_wire_force.checked);
                        }
                    } else {
                        set_cell(x, y, clipboard_cells[y - y1][x - x1], mode_wire_force.checked);
                    }
                }
            }
        }
        full_render = true;
        full_update = true;
    }
}

function copy_2d(original) {
    var copy = Array(0);
    var height = original.length;
    var width = (height > 0) ? original[0].length : 0;
    resize_2d(copy, 0, 0, width, height);
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            copy[y][x] = original[y][x];
        }
    }
    return copy;
}

function clipboard_flip_h() {
    var old_clipboard_cells = copy_2d(clipboard_cells);
    for (var y = 0; y < clipboard_height; y++) {
        for (var x = 0; x < clipboard_width; x++) {
            clipboard_cells[y][x] = old_clipboard_cells[y][clipboard_width - x - 1];
        }
    }
}

function clipboard_flip_v() {
    var old_clipboard_cells = copy_2d(clipboard_cells);
    for (var y = 0; y < clipboard_height; y++) {
        for (var x = 0; x < clipboard_width; x++) {
            clipboard_cells[y][x] = old_clipboard_cells[clipboard_height - y - 1][x];
        }
    }
}

function clipboard_rotate_ccw() {
    var old_clipboard_cells = copy_2d(clipboard_cells);
    var old_clipboard_width = clipboard_width;
    var old_clipboard_height = clipboard_height;
    clipboard_width = old_clipboard_height;
    clipboard_height = old_clipboard_width;
    resize_2d(clipboard_cells, old_clipboard_width, old_clipboard_height, clipboard_width, clipboard_height);
    for (var y = 0; y < clipboard_height; y++) {
        for (var x = 0; x < clipboard_width; x++) {
            clipboard_cells[y][x] = old_clipboard_cells[x][old_clipboard_width - y - 1];
        }
    }
}

function clipboard_rotate_cw() {
    var old_clipboard_cells = copy_2d(clipboard_cells);
    var old_clipboard_width = clipboard_width;
    var old_clipboard_height = clipboard_height;
    clipboard_width = old_clipboard_height;
    clipboard_height = old_clipboard_width;
    resize_2d(clipboard_cells, old_clipboard_width, old_clipboard_height, clipboard_width, clipboard_height);
    for (var y = 0; y < clipboard_height; y++) {
        for (var x = 0; x < clipboard_width; x++) {
            clipboard_cells[y][x] = old_clipboard_cells[old_clipboard_height - x - 1][y];
        }
    }
}

function toggle_goal(x, y) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
        var i;
        for (i = 0; i < goals.length; i++) {
            if (goals[i].x === x && goals[i].y === y) {
                break;
            }
        }
        if (i === goals.length) {
            // Place
            readonly[y][x] = 1;
            cells[y][x] = 1;
            new_cells[y][x] = 1;
            goals.push({x: x, y: y});
        } else {
            // Remove
            goals.splice(i, 1);
        }
        full_render = true;
        render();
        full_update = true;
    }
}


function stop() {
    running = false;
}

function start() {
    if (!running) {
        running = true;
        now = Date.now();
        then = now;
        for (i = 0; i < goals.length; i++) {
            goals[i].last = cells[goals[i].y][goals[i].x];
        }
        main_loop();
    }
}

function reset() {
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            cells[y][x] &= 1;
        }
    }
    for (i = 0; i < goals.length; i++) {
        goals[i].last = cells[goals[i].y][goals[i].x];
    }
    full_render = true;
    render();
    full_update = true;
    it_acc = 0;
    executionStatus.innerHTML = "Reset";
}

function clear(mode) {
    var protection = false;
    if (mode === "protection") {
        protection = true;
    } else if (mode === "goal") {
        goals = Array(0);
        render();
        full_update = true;
        return;
    }

    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            if (protection) {
                readonly[y][x] = 0;
            } else if (readonly[y][x] === 0) {
                cells[y][x] = 0;
                new_cells[y][x] = 0;
            }
        }
    }

    if (protection) {
        for (i = 0; i < goals.length; i++) {
            readonly[goals[i].y][goals[i].x] = 1;
        }
    }

    full_render = true;
    render();
    full_update = true;
}



function resize_2d(array, old_width, old_height, width, height) {
    var x;
    var y;
    if (height < old_height) {
        array.splice(height, old_height - height);
    } else if (height > old_height) {
        for (y = old_height; y < height; y++) {
            array[y] = Array(width);
        }
    }
    if (width < old_width) {
        for (y = 0; y < height; y++) {
            array[y].splice(width, old_width - width);
        }
    }

    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            if (typeof(array[y][x]) === "undefined") {
                array[y][x] = 0;
            }
        }
    }
}

function set_size() {
    var input_width = document.getElementById("input_width");
    var input_height = document.getElementById("input_height");
    var old_width  = width;
    var old_height = height;

    canvas.width = width = parseInt(input_width.value);
    canvas.height = height = parseInt(input_height.value);
    scale = parseInt(input_scale.value);
    canvas.style.width = canvas.width * scale + "px";
    canvas.style.height= canvas.height * scale + "px";

    if (cells === null) {
        old_width  = 0;
        old_height = 0;
        cells = Array(0);
        new_cells = Array(0);
        readonly = Array(0);
        update_guard = Array(0);
        new_update_guard = Array(0);
    }
    resize_2d(cells, old_width, old_height, width, height);
    resize_2d(new_cells, old_width, old_height, width, height);
    resize_2d(readonly, old_width, old_height, width, height);
    resize_2d(update_guard, old_width, old_height, width, height);
    resize_2d(new_update_guard, old_width, old_height, width, height);

    var i;
    var new_goals = Array(0);
    for (i = 0; i < goals.length; i++) {
        if (goals[i].x < canvas.width - 1 && goals[i].y < canvas.height - 1) {
            new_goals.push(goals[i]);
        }
    }
    goals = new_goals;

    full_render = true;
    render();
    full_update = true;
}

function set_speed() {
    speed = input_speed.value;
}


addEventListener("keydown", function (e) {
    // These are exceptions to the anti-repeat guard.
    if (e.keyCode === key_bindings.faster) {
        input_speed.stepDown();
        set_speed();
    }
    if (e.keyCode === key_bindings.slower) {
        input_speed.stepUp();
        set_speed();
    }

    if (keys_down[e.keyCode]) {
        return;
    }

    if (e.keyCode === key_bindings.mode_wire) {
        mode_wire.checked = true;
    }
    if (e.keyCode === key_bindings.mode_protect) {
        mode_protect.checked = true;
    }
    if (e.keyCode === key_bindings.mode_wire_force) {
        mode_wire_force.checked = true;
    }
    if (e.keyCode === key_bindings.mode_goal) {
        mode_goal.checked = true;
    }

    keys_down[e.keyCode] = true;
    if (e.keyCode === key_bindings.pause) {
        if (running) {
            stop();
        } else {
            start();
        }
        e.preventDefault();
    }
    if (keys_down[key_bindings.guard]) {
        if (e.keyCode === key_bindings.reset) {
            reset();
            e.preventDefault();
        }
    }
    if (e.keyCode === key_bindings.flip_v) {
        clipboard_flip_v();
        e.preventDefault();
    } else if (e.keyCode === key_bindings.flip_h) {
        clipboard_flip_h();
        e.preventDefault();
    } else if (e.keyCode === key_bindings.rotate_cw) {
        clipboard_rotate_cw();
        e.preventDefault();
    } else if (e.keyCode === key_bindings.rotate_ccw) {
        clipboard_rotate_ccw();
        e.preventDefault();
    }
    if (e.keyCode === key_bindings.paste ||
        e.keyCode === key_bindings.additive_paste) {
        display_loop();
        e.preventDefault();
    }

    if (full_render == true) {
        render();
    }
}, false);

addEventListener("keyup", function (e) {
    delete keys_down[e.keyCode];
    if (e.keyCode === key_bindings.paste ||
        e.keyCode === key_bindings.additive_paste) {
        render();
        e.preventDefault();
    }
}, false);

addEventListener("click", function (e) {
    if (e.target == canvas && e.button === 0) {
        e.preventDefault();
    }
}, false);

addEventListener("mousedown", function (e) {
    if (e.target == canvas && e.button === 0) {
        var rect = canvas.getBoundingClientRect();
        mouse_start.x = parseInt((e.clientX - rect.left) / scale);
        mouse_start.y = parseInt((e.clientY - rect.top ) / scale);
        e.preventDefault();
    }
}, false);

addEventListener("mousemove", function (e) {
    if (e.target == canvas) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = parseInt((e.clientX - rect.left) / scale);
        mouse.y = parseInt((e.clientY - rect.top ) / scale);
        e.preventDefault();
    }
}, false);

addEventListener("mouseup", function (e) {
    if (e.target == canvas && e.button === 0) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = parseInt((e.clientX - rect.left) / scale);
        mouse.y = parseInt((e.clientY - rect.top ) / scale);
        if (mouse.x === mouse_start.x && mouse.y === mouse_start.y) {
            if (keys_down[key_bindings.paste]) {
                box_paste(mouse.x, mouse.y, false);
            } else if (keys_down[key_bindings.additive_paste]) {
                box_paste(mouse.x, mouse.y, true);
            } else {
                if (mode_wire.checked) {
                    toggle_cell(mouse.x, mouse.y, false);
                } else if (mode_protect.checked) {
                    toggle_protect(mouse.x, mouse.y);
                } else if (mode_wire_force.checked) {
                    toggle_cell(mouse.x, mouse.y, true);
                } else if (mode_goal.checked) {
                    toggle_goal(mouse.x, mouse.y);
                }
            }
        } else {
            if (keys_down[key_bindings.copy]) {
                box_copy(mouse_start.x, mouse_start.y, mouse.x, mouse.y);
            } else if (keys_down[key_bindings.cut]) {
                box_copy(mouse_start.x, mouse_start.y, mouse.x, mouse.y);
                box_erase(mouse_start.x, mouse_start.y, mouse.x, mouse.y);
            } else if (keys_down[key_bindings.erase]) {
                box_erase(mouse_start.x, mouse_start.y, mouse.x, mouse.y);
            } else {
                var set_to = !keys_down[key_bindings.subtract]
                if (mode_wire.checked) {
                    line_cell(mouse_start.x, mouse_start.y, mouse.x, mouse.y, set_to, false);
                } else if (mode_protect.checked) {
                    box_protect(mouse_start.x, mouse_start.y, mouse.x, mouse.y, set_to);
                } else if (mode_wire_force.checked) {
                    line_cell(mouse_start.x, mouse_start.y, mouse.x, mouse.y, set_to, true);
                } else if (mode_goal.checked) {
                    toggle_goal(mouse.x, mouse.y);
                }
            }
        }
        e.preventDefault();

        if (full_render == true) {
            render();
        }
    }
}, false);


function load_from_image() {
    var img = document.getElementById('loaded-img');
    var input_width = document.getElementById("input_width");
    var input_height = document.getElementById("input_height");
    input_width.value = img.width;
    input_height.value = img.height;
    set_size();
    goals = Array(0);

    ctx.drawImage(img, 0, 0, img.width, img.height);
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            var data = ctx.getImageData(x, y, 1, 1).data;
            if (data[2] === 255) { // Off, not goal
                cells[y][x] = new_cells[y][x] = 1;
            } else if (data[0] === 255 && data[1] >= 128) { // On, not goal
                cells[y][x] = new_cells[y][x] = 1 | (data[2] << 1);
            } else if (data[0] >= 128 && data[1] === 0) { // Goal
                cells[y][x] = new_cells[y][x] = 1 | (data[2] << 1);
                goals.push({x: x, y: y});
            } else { // Blank
                cells[y][x] = new_cells[y][x] = 0;
            }
            if (data[1] === 255 || (data[0] <= 32 && data[2] <= 32 && data[1] === 128) || (data[0] >= 128 && data[1] === 0)) { // Fixed cell
                readonly[y][x] = 1;
            } else {
                readonly[y][x] = 0;
            }
        }
    }
    it_acc = 0;
    executionStatus.innerHTML = "Loaded from image";
    full_render = true;
    render();
    full_update = true;
}

document.getElementById('loaded-img').onload = function () {
    load_from_image();
}


document.getElementById('img-loader').onchange = function (e) {
    var target = e.target || window.event.srcElement,
        files = target.files;

    if (FileReader && files && files.length) {
        var file_reader = new FileReader();
        file_reader.onload = function () {
            document.getElementById('loaded-img').src = file_reader.result;
        }
        file_reader.readAsDataURL(files[0]);
    }
}


$(function () {
    input_speed = document.getElementById('input_speed');

    mode_wire = document.getElementById("mode_wire");
    mode_protect = document.getElementById("mode_protect");
    mode_wire_force = document.getElementById("mode_wire_force");
    mode_goal = document.getElementById("mode_goal");

    goal_ignore = document.getElementById("goal_ignore");
    goal_all = document.getElementById("goal_all");
    goal_any = document.getElementById("goal_any");
    goal_change = document.getElementById("goal_change");

    document.getElementById("version").innerHTML = "Version: " + version_string;
    var logic_div = document.getElementById("logic-area");
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    set_size();
    set_speed();
    logic_div.appendChild(canvas);

    it_acc = 0;
    executionStatus = document.getElementById("status");
});
