'use strict';

var version_string = "0.0.0"

var canvas;
var ctx;
var ctx_imgd;
var ctx_imgd_clamped;
var renderer;

var fps_element;
var now;
var then;
var running;
var canvas_scale = 1;
var full_render = true;

var mouse = {x:0, y:0, down:false, click:false, scroll_y:0};
var mouse_start = {x:0, y:0};
var keys_down = {};
var keys_fall = {};



requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;

function panic(msg) {
    if (typeof(msg) === "undefined") {
        msg = "(No details provided)";
    }
    console.log("Panic!");
    console.log(msg);
    stop();
    alert("Panic:\n\n"+msg);
    undefined(); // Crash the program.
}

function extend(sub, sup) {
    sub.prototype = Object.create(sup.prototype);  
    sub.prototype.constructor = sub;
}

function dot_multiply_objects(a, b, fallback) {
    if (typeof(fallback) === "undefined") {
        fallback = 0;
    }
    let total = 0;
    for (let i in a) {
        if (a.hasOwnProperty(i)) {
            if (b.hasOwnProperty(i)) {
                total += a[i] * b[i];
            } else {
                total += a[i] * fallback;
            }
        }
    }
    return total;
}
function vector_add_objects(a, b) {
    let c = {};
    for (let i in a) {
        if (a.hasOwnProperty(i)) {
            c[i] = (c[i] || 0) + a[i];
        }
    }
    for (let i in b) {
        if (a.hasOwnProperty(i)) {
            c[i] = (c[i] || 0) + b[i];
        }
    }
    return c;
}
function vector_subtract_objects(a, b) {
    let c = {};
    for (let i in a) {
        if (a.hasOwnProperty(i)) {
            c[i] = (c[i] || 0) + a[i];
        }
    }
    for (let i in b) {
        if (a.hasOwnProperty(i)) {
            c[i] = (c[i] || 0) - b[i];
        }
    }
    return c;
}

function normalize_angle( ang ) {
    if( ang < 0 ) {
        return Math.PI - ( ( Math.PI - ang ) % ( Math.PI * 2 ) );
    } else {
        return ( Math.PI + ang ) % ( Math.PI * 2 ) - Math.PI;
    }
}

function positive_angle( ang ) {
    if( ang < 0 ) {
        return 2*Math.PI + ( ( ang ) % ( Math.PI * 2 ) );
    } else {
        return ( ang ) % ( Math.PI * 2 );
    }
}

function xy_to_angle(x, y) {
    if (x > 0) {
        return Math.atan(y/x);
    } else if (x < 0) {
        return y > 0 ? Math.PI-Math.atan(y/-x) : -Math.PI-Math.atan(y/-x);
    } else {
        return y == 0 ? 0 :
               y >  0 ? Math.PI*0.5 : -Math.PI*0.5
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
        main_loop();
    }
}

function reset() {
    full_render = true;
    game_init();
    render();
}


function input_is_down(binding) {
    for (let key of key_bindings[binding]) {
        if (keys_down[key]) {
            return true;
        }
    }
    return false;
}
function input_is_fall(binding) {
    for (let key of key_bindings[binding]) {
        if (keys_fall[key]) {
            return true;
        }
    }
    return false;
}


addEventListener("keydown", function (e) {
    if (typeof(reverse_key_bindings[e.keyCode]) != "undefined") {
        e.preventDefault();
    }
    if (keys_down[e.keyCode]) {
        return;
    }
    keys_down[e.keyCode] = true;
    keys_fall[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
    delete keys_down[e.keyCode];
}, false);

addEventListener("wheel", function (e) {
    if (e.target == canvas && e.button === 0) {
        e.preventDefault();
        mouse.scroll_y = e.deltaY > 0 ?  1
                       : e.deltaY < 0 ? -1
                       : 0;
    }
}, false);

addEventListener("mousedown", function (e) {
    if (e.target == canvas && e.button === 0) {
        var rect = canvas.getBoundingClientRect();
        mouse_start.x = parseInt((e.clientX - rect.left) / canvas_scale);
        mouse_start.y = parseInt((e.clientY - rect.top ) / canvas_scale);
        e.preventDefault();
        mouse.down = true;
    }
}, false);

addEventListener("mousemove", function (e) {
    if (e.target == canvas) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = parseInt((e.clientX - rect.left) / canvas_scale);
        mouse.y = parseInt((e.clientY - rect.top ) / canvas_scale);
        e.preventDefault();
    }
}, false);

addEventListener("mouseup", function (e) {
    if (e.target == canvas && e.button === 0) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = parseInt((e.clientX - rect.left) / canvas_scale);
        mouse.y = parseInt((e.clientY - rect.top ) / canvas_scale);
        mouse.down = false;
        if (Math.abs(mouse.x - mouse_start.x) + Math.abs(mouse.y - mouse_start.y) < 5) {
            mouse.click = true; // Cleared elsewhere
            // Click
        } else {
            // Drag
        }
        e.preventDefault();
    }
}, false);

function ui_acknowledge() {
    mouse.click = false;
    mouse.scroll_y = 0;
    keys_fall = {};
}

$(function () {
    document.getElementById("version").innerHTML = "Version: " + version_string;
    var game_div = document.getElementById("game-area");
    canvas = document.createElement("canvas");
    /*canvas.width = 800;
    canvas.height = 600;
    */
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.width = "100%";
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    game_div.appendChild(canvas);

    ctx_imgd = ctx.createImageData( canvas.width, canvas.height );
    var img_bytes = canvas.width * canvas.height * 4;
    ctx_imgd_clamped = new Uint8ClampedArray( img_bytes );
    var ctx_imgd_unclamped = new Uint8Array( ctx_imgd_clamped.buffer );

    /*var sprites = [];
    for( var i = 0; i < 2000; i ++ ) {
        sprites.push( new Vec2D(
            ( Math.random() * 2000 ) | 0, ( Math.random() * 2000 ) | 0
        ) );
    }
    var sprite_buf = new Uint8Array( 128 );
    for( i = 0; i < 128; i += 4 ) {
        sprite_buf[i] = 255;
        sprite_buf[i+1] = 192;
        sprite_buf[i+2] = 192;
    }*/

    renderer = new Renderer( ctx_imgd_unclamped, canvas.width, canvas.height );

    /*lighting_canvas = document.createElement("canvas");
    lighting_canvas.width = canvas.width;
    lighting_canvas.height = canvas.height;
    lighting_ctx = lighting_canvas.getContext("2d");*/

    fps_element = document.getElementById("fps");

    reset();
    start();
});
