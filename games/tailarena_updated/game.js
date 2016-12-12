// HClone
// Copyright Ashley Newson 2016

var version_string = "1.0.0"

var arena_width = 160;
var arena_height = 90;
var text_scale = 0.1;

var aspect = arena_width / arena_height;

var canvas = document.getElementById("display");
var help = document.getElementById("help");
var touch_motion = document.getElementById("touch_motion");
var touch_action = document.getElementById("touch_action");

var audios_per_sound = 4;
var sound_volume = 0.25;
var sound_enabled = true;
var sound_format = ".mp3";

var circle_caching_enabled = false;
var circle_cache = {};
var cache_canvas = document.createElement("canvas");
var cache_ctx = cache_canvas.getContext("2d");

var action_will_restart = false;

var sounds = {
    hits: [
        load_sound("hit_c"),
        load_sound("hit_d"),
        load_sound("hit_e"),
        load_sound("hit_f"),
        load_sound("hit_g"),
        load_sound("hit_a"),
        load_sound("hit_b"),
        load_sound("hit_c2"),
        load_sound("hit_d2"),
        load_sound("hit_e2"),
        load_sound("hit_f2"),
        load_sound("hit_g2"),
        load_sound("hit_a2"),
        load_sound("hit_b2"),
        load_sound("hit_c3"),
        load_sound("hit_d3"),
        load_sound("hit_e3"),
        load_sound("hit_f3"),
        load_sound("hit_g3"),
    ],
}

var ctx;
var now;
var then;
var time_delta;
var max_time_delta = 1/60;
var game_speed = 1.0;
var running;
var scale;
var full_render = true;
var full_update = true;
var update_loops = 0;
var announcement = "";
var extra_announcement = "";
var announcement_lifetime = 0;
var score = 0;
var was_alive = false;

var mouse = {x:0, y:0};
var mouse_start = {x:0, y:0};
var mouse_down = false;
var mouse_click = false;
var analog = {x:0, y:0, press:false, click:false, active:false};
var digital = {x:0, y:0, press:false, active:false};

var keys_down = {};

var key_bindings = {
    press : 16,
    left  : 37,
    up    : 38,
    right : 39,
    down  : 40,
    alt_left  : 65,
    alt_up    : 87,
    alt_right : 68,
    alt_down  : 83,
    start : 190,
    stop  : 188,
    reset : 82,
};

var modifiers = {
};

// Transform from a canvas dimension to a world dimension
function to_world(x) {
    return x / scale;
}

function normalise(a, length) {
    if (!length) {
        length = 1.0;
    }
    return scale_vector(a, length/Math.hypot(a.x, a.y));
}

function add_vectors(a, b) {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
    };
}

function displacement(a, b) {
    return {
        x: b.x - a.x,
        y: b.y - a.y,
    };
}

function displacement_with_length(a, b) {
    var d = displacement(a, b);
    d.length = Math.hypot(d.x, d.y);
    return d;
}

function displacement_normalised(a, b, length) {
    var d = displacement_with_length(a, b);
    if (!length) {
        length = 1.0;
    }
    d.x *= length / d.length;
    d.y *= length / d.length;
    return d;
}

function scale_vector(a, f) {
    return {
        x: a.x * f,
        y: a.y * f,
    };
}

function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

// 2d vector product - magnitude only
function vector_product(a, b) {
    return a.x * b.y - a.y * b.x;
}

function load_sound(filename) {
    var sound = {
        rotation:0,
        ready:false,
        unready:audios_per_sound,
        sound:[]
    };

    var i;
    for (i = 0; i < audios_per_sound; i++) {
        var audio = document.createElement('audio');
        sound.sound[i] = audio;
        audio.addEventListener('canplay', function(){
            if (!sound.ready) {
                sound.unready--;
                sound.ready = (sound.unready == 0);
            }
        }, false);
        audio.volume = sound_volume;
        audio.src    = "sound/" + filename + sound_format;
    }

    return sound;
}

function play_sound(sound) {
    if (sound.ready && sound_enabled) {
        sound.sound[sound.rotation].play();
        sound.rotation = (sound.rotation + 1) % audios_per_sound;
    }
}

function cache_draw_circle(x, y, radius, lineWidth, fillStyle, strokeStyle) {
    var cached = circle_cache[radius];
    cached = cached ? cached[lineWidth] : (circle_cache[radius] = {}, null);
    cached = cached ? cached[fillStyle] : (circle_cache[radius][lineWidth] = {}, null);
    cached = cached ? cached[strokeStyle] : (circle_cache[radius][lineWidth][fillStyle] = {}, null);
    var size = 2*radius + lineWidth;
    var offset = size * 0.5;
    if (!cached) {
        cached = document.createElement("img");
        circle_cache[radius][lineWidth][fillStyle][strokeStyle] = cached;

        cache_canvas.width = size * scale + 1;
        cache_canvas.height = size * scale + 1;
        cache_ctx.clearRect(0, 0, cache_canvas.width, cache_canvas.height);
        cache_ctx.setTransform(scale, 0, 0, scale, 0, 0);
        cache_ctx.beginPath();
        cache_ctx.arc(offset, offset, radius, 0, 2 * Math.PI, false);
        cache_ctx.fillStyle = fillStyle;
        cache_ctx.fill();
        cache_ctx.strokeStyle = strokeStyle;
        cache_ctx.lineWidth = lineWidth;
        cache_ctx.stroke();
        cached.src = cache_canvas.toDataURL();
        console.log("Cached: " + radius + " " + lineWidth + " " + fillStyle + " " + strokeStyle);
    }
    ctx.save();
    ctx.translate((x - offset), (y - offset));
    ctx.scale(1/scale, 1/scale);
    ctx.drawImage(cached, 0, 0);
    ctx.restore();
}


var player;
var objects = new Set();
var remove_objects = new Set();

function add_object(object) {
    objects.add(object);
    if (object.managed) {
        for (let subobject of object.managed) {
            subobject.manager = object;
            add_object(subobject);
        }
    }
}

function remove_object(object) {
    remove_objects.add(object);
}

function do_remove_object(object) {
    objects.delete(object);
    if (object.managed) {
        for (let subobject of object.managed) {
            do_remove_object(subobject);
        }
    }
}


// ========================================================================

function TailFish(length, p) {
    this.speed = 50;
    this.managed = new Set();
    this.separation = 2.0;
    this.length = length * this.separation;
    this.tail_parts = length;

    this.head = new Particle(2, p);
    this.head.fillStyle = "rgba(0, 255, 255, 1)";
    this.head.strokeStyle = "rgba(0, 128, 128, 1)";
    this.head.mass = 10;
    this.head.attributes.solid = 1;
    this.head.on_collide.add(function (a, b) {
        if (!modifiers.invulnerable && b.attributes.damages && !b.attributes.player_owned) {
            remove_object(a.manager);
            extra_announcement = "You were shot.";
        }
        if (b.manager instanceof Powerup) {
            score += 1;
            b.manager.payload(a, b);
            remove_object(b.manager);
        }
    });

    this.managed.add(this.head);

    {
        var configure_tail = function(tail) {
            tail.fillStyle = "rgba(0, 128, 128, 1)";
            tail.strokeStyle = "rgba(0, 64, 64, 1)";
            tail.attributes.solid = 1;
            tail.mass = 10;
        };

        var tail = new Particle(1, p);
        configure_tail(tail);
        this.head.next = tail;
        tail.prev = this.head;
        this.managed.add(tail);
        for (var i = 1; i < length; i++) {
            var addTail = new Particle(1, p);
            configure_tail(addTail);
            tail.next = addTail;
            addTail.prev = tail;
            tail.normal = function(self, other) {
                var disp = displacement(other, self);
                var ht = normalise(displacement(self.next, self.prev));
                var co = scale_vector(ht, dot(ht, disp));
                return normalise(displacement(co, disp));
            }
            tail = addTail;
            this.managed.add(tail);
        }
        this.tail = tail;
    }
}

TailFish.prototype.render = function() {
}

TailFish.prototype.update = function() {
    var drag;
    if (analog.active) {
        drag = scale_vector(analog, 1.5);
        drag.length = Math.hypot(drag.x, drag.y);
        if (drag.length > 1.0) {
            drag.strength = this.speed / drag.length;
        } else {
            drag.strength = this.speed;
        }
        this.head.d.x = drag.strength * drag.x;
        this.head.d.y = drag.strength * drag.y;
    } else {
        drag = displacement_with_length(this.head, mouse);
        if (drag.length > (this.speed * max_time_delta)) {
            drag.strength = this.speed / drag.length;
        } else {
            drag.strength = this.speed / (this.speed * max_time_delta);
        }
        this.head.d.x = drag.strength * drag.x;
        this.head.d.y = drag.strength * drag.y;
    }

    var separation = this.separation;
    if (modifiers.shorten) {
        separation /= 2.0;
    }

    var tail_mode = "trail";
    if (modifiers.use_ability) {
        if (!modifiers.use_guard) {
            if (modifiers.shoot) {
                if (modifiers.use_now) {
                    var spit = new Bullet(this.head, normalise(this.head.d, 75));
                    spit.bullet.strokeStyle = "blue";
                    spit.bullet.attributes.player_owned = true;
                    add_object(spit);
                }
            } else if (modifiers.wall) {
                if (displacement_with_length(this.head, this.head.next).length > separation) {
                    var poop = new Particle(1.5, this.tail);
                    poop.strokeStyle = "rgba(0, 0, 128, 1)";
                    poop.fillStyle = "blue";
                    poop.on_collide.add(function (a, b) {
                        if (b.attributes.solid) {
                            a.bounce_off(b);
                        }
                    });
                    poop.attributes.solid = true;
                    poop.mass = 10;
                    poop.drag = 30;
                    add_object(poop);
                    modifiers.wall--;
                    if (!modifiers.wall) {
                        modifiers.use_guard = true;
                    }
                }
            } else {
                tail_mode = "rigid";
            }
        }
    } else {
        modifiers.use_guard = false;
    }
    if (tail_mode === "rigid") {
        // Rigid mode

        var tail;
        var com = {x:0, y:0};
        for (tail = this.head.next; tail != null; tail = tail.next) {
            com = add_vectors(com, tail);
        }
        com = scale_vector(com, 1/this.tail_parts);
        com = add_vectors(scale_vector(this.head, 0.5), scale_vector(com, 0.5)); // Bias towards head

        var new_head = add_vectors(this.head, scale_vector(this.head.d, time_delta));
        var com_disp = displacement_with_length(this.head, com);
        var new_com_disp = displacement_normalised(new_head, com, com_disp.length);
        var new_d = displacement(com_disp, new_com_disp);

        var sine = vector_product(com_disp, new_com_disp) / (com_disp.length*com_disp.length);
        // Hack to ensure spin isn't too violent
        var max_rad = 3*time_delta;
        if (sine > 0 && sine > max_rad) {
            sine = max_rad;
        } else if (sine < 0 && sine < -max_rad) {
            sine = -max_rad;
        }
        var angle = Math.asin(sine);
        sine = Math.sin(angle);
        var cosine = Math.sqrt(1 - sine*sine); // Assume small angle

        var rotate = function(v) {
            return {
                x: v.x * cosine - v.y * sine,
                y: v.x * sine   + v.y * cosine,
            }
        }

        for (tail = this.head.next; tail != null; tail = tail.next) {
            var disp = rotate(displacement(this.head, tail));
            var nt = add_vectors(new_head, disp);
            tail.d = scale_vector(displacement(tail, nt), 1/time_delta);
        }

    } else {
        // Trail mode
        if (displacement_with_length(this.head, this.head.next).length > separation) {
            var tail;
            for (tail = this.tail; tail != this.head; tail = tail.prev) {
                tail.x = tail.prev.x;
                tail.y = tail.prev.y;
            }
        }
        for (tail = this.tail; tail != this.head; tail = tail.prev) {
            tail.d.x = 0;
            tail.d.y = 0;
        }
    }

    {
        var tailnum = 0;
        for (var tail = this.head; tail != null; tail = tail.next) {
            var over_stroke = (!modifiers.flash || (game_time % 0.2 < 0.1))
                ? (
                    modifiers.invulnerable ? "orange"
                        : modifiers.shoot ? "blue"
                        : (modifiers.wall && this.tail_parts - tailnum < modifiers.wall) ? "blue"
                        : null
                )
                : null;
            tail.attributes.invulnerable = modifiers.invulnerable;
            tail.overStrokeStyle = over_stroke;
            tailnum++;
        }
    }
}

// ========================================================================

function Bullet(p, d) {
    this.bullet = new Particle(1, p);
    this.bullet.d.x = d.x;
    this.bullet.d.y = d.y;
    this.bullet.fillStyle = "grey";
    this.bullet.attributes.damages = 1;
    this.bullet.attributes.solid = 1;

    this.bullet.on_collide.add(function (a, b) {
        if (b.attributes.solid) {
            a.bounce_off(b);
        }
    });

    this.managed = new Set([this.bullet]);
}

Bullet.prototype.render = function() {
}

Bullet.prototype.update = function() {
}

// ========================================================================

function Powerup(p, payload) {
    this.head = new Particle(2, p);
    this.head.fillStyle = "blue";
    this.head.strokeStyle = "orange";
    this.head.attributes.solid = 1;
    this.payload = payload;

    this.head.on_collide.add(function (a, b) {
        if (b.attributes.solid) {
            a.bounce_off(b);
        }
    });

    this.managed = new Set([this.head]);
}

Powerup.prototype.render = function() {
}

Powerup.prototype.update = function() {
}

var powerups = {
    faster:function(a, b) {
        game_speed *= 1.5;
        add_timeout(function(){game_speed /= 1.5}, 10);
        announce("FASTER!", 2, true);
    },
    slower:function(a, b) {
        game_speed /= 2;
        add_timeout(function(){game_speed *= 2}, 5);
        announce("Slooowwerrrr...", 1, true);
    },
    invulnerability:function(a, b) {
        modifiers.invulnerable = true;
        add_timeout(function(){modifiers.flash = true;}, 8);
        add_timeout(function(){modifiers.invulnerable = false; modifiers.flash = false;}, 10);
        announce("GOD MODE!", 2, true);
    },
    distraction:function(a, b) {
        announce("DISTRACTING TEXT!", 10, true);
    },
    shorten:function(a, b) {
        modifiers.shorten = true;
        add_timeout(function(){modifiers.shorten = false;}, 10);
        announce("SHORTER!", 2, true);
    },
    // shoot:function(a, b) {
    //     modifiers.shoot = true;
    //     add_timeout(function(){modifiers.flash = true;}, 8);
    //     add_timeout(function(){modifiers.shoot = false; modifiers.flash = false;}, 10);
    //     announce("PEW! PEW! PEW!", 2);
    // },
    wall:function(a, b) {
        modifiers.wall = 24;
        announce("GOOD SECRETIONS!", 2, true);
    },
    point:function(a, b) {
        announce(score, 1, true);
    },
};

// ========================================================================

function Timeout(payload, time) {
    this.time = time;
    this.payload = payload;
}

Timeout.prototype.render = function() {
}

Timeout.prototype.update = function() {
    this.time -= time_delta;
    if (this.time < 0) {
        this.payload();
        remove_object(this);
    }
}

// ========================================================================

function Pending(p, pending, time) {
    this.x = p.x;
    this.y = p.y;
    this.time = time;
    this.pending = pending;
    // Do not manage
}

Pending.prototype.render = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "red";
    ctx.stroke();
}

Pending.prototype.update = function() {
    this.time -= time_delta;
    if (this.time < 0) {
        add_object(this.pending);
        remove_object(this);
    }
}

// ========================================================================

function Blackhole(p) {
    this.head = new Particle(5, p);
    this.head.fillStyle = "black";
    this.head.strokeStyle = "grey";
    this.head.drag = 0;
    this.head.mass = 50;

    this.head.on_collide.add(function (a, b) {
        if (!b.attributes.invulnerable) {
            a.force(scale_vector(b.d, b.mass));
            remove_object(b.manager);
            if (b.manager === player) {
                extra_announcement = "You were eaten.";
            }
        }
    });

    this.managed = new Set([this.head]);
}

Blackhole.prototype.render = function() {
}

Blackhole.prototype.update = function() {
}

// ========================================================================

function Thrower(p) {
    this.head = new Particle(2, p);
    this.head.drag = 0;
    this.head.mass = 5;
    this.head.fillStyle = "rgba(0, 128, 0, 1)";
    this.head.strokeStyle = "rgba(0, 225, 0, 1)";
    this.head.attributes.solid = 1;
    this.head.on_collide.add(function (a, b) {
        if (b.attributes.solid) {
            a.bounce_off(b);
        }
    });

    this.reload_speed = 2;
    this.reload = 3;
    this.managed = new Set([this.head]);
}

Thrower.prototype.render = function() {
}

Thrower.prototype.update = function() {
    this.reload -= time_delta;
    var eject_force = 50;
    if (this.reload < 0) {
        to_player = displacement_normalised(this.head, player.head);
        to_player_s = scale_vector(to_player, 0.1);
        to_player_v = scale_vector(to_player, eject_force);
        var bullet = new Bullet(add_vectors(this.head, to_player_s), to_player_v);
        add_object(bullet);
        this.head.force(scale_vector(to_player, -eject_force));
        this.reload = this.reload_speed;
    }
}

// ========================================================================

function Particle(radius, p) {
    this.x = p.x;
    this.y = p.y;
    this.d = {x:0, y:0};
    this.old_d = {x:0, y:0};
    this.mass = 1;
    this.drag = 0.1;
    this.radius = radius;
    this.fillStyle = "red";
    this.strokeStyle = "white";
    this.overStrokeStyle = null;
    this.lineWidth = 1;
    this.on_collide = new Set();
    this.attributes = {};
    this.normal =
        function(self, other) {
            return normalise(displacement(other, self)); // Points towards surface from other
        };
    this.bounced = false;
    this.position_managed = false;

    this.manager = this;
}

Particle.prototype.render = function() {
    var strokeStyle = this.overStrokeStyle ? this.overStrokeStyle : this.strokeStyle;
    if (circle_caching_enabled) {
        cache_draw_circle(this.x, this.y, this.radius, this.lineWidth, this.fillStyle, strokeStyle);
    } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.fillStyle;
        ctx.fill();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();
    }
}

Particle.prototype.update = function() {
    if (this.position_managed) {
        return;
    }
    this.x += this.d.x * time_delta;
    this.y += this.d.y * time_delta;
    // Apply drag
    // Framerate dependent :(
    this.force(scale_vector(this.d, -this.drag*time_delta));

    if (this.x < 0) {
        this.x = -this.x;
        this.d.x = -this.d.x; // Assume it's going into wall
    } else if (this.x > arena_width) {
        this.x = 2*arena_width - this.x;
        this.d.x = -this.d.x; // Assume it's going into wall
    }
    if (this.y < 0) {
        this.y = -this.y;
        this.d.y = -this.d.y; // Assume it's going into wall
    } else if (this.y > arena_height) {
        this.y = 2*arena_height - this.y;
        this.d.y = -this.d.y; // Assume it's going into wall
    }
    this.d.length = Math.hypot(this.d.x, this.d.y);
    if (this.d.length * max_time_delta > 1) {
        this.d = normalise(this.d, 1/max_time_delta);
    }
    this.old_d = {x:this.d.x, y:this.d.y};
    this.bounced = false;
}

Particle.prototype.force = function(f) {
    this.add_velocity(scale_vector(f, 1/this.mass));
}

Particle.prototype.add_velocity = function(v) {
    this.d.x += v.x;
    this.d.y += v.y;
}

Particle.prototype.collide = function(other) {
    for (let callback of this.on_collide) {
        callback(this, other);
    }
}

Particle.prototype.elastic_pull_to = function(other, threshold, coefficient) {
    var disp = displacement_with_length(this, other);

    if (disp.length > threshold) {
        var strength = coefficient * (disp.length - threshold);
        var force = {
            x:disp.x * strength,
            y:disp.y * strength,
        }
        this.force(scale_vector(disp, strength));
        return force;
    }
    return {x:0, y:0};
}

Particle.prototype.bounce_off = function(b) {
    if (this.bounced) {
        // Avoid double bouncing
        return;
    }
    var a = this;
    var av = dot(a.old_d, b.normal(b, a));
    var bv = dot(b.old_d, b.normal(b, a));
    if (av - bv <= 0) {
        // They are moving away!
    } else {
        var m = av * a.mass + bv * b.mass;
        var fv = m / (a.mass + b.mass);
        var rav = 2*fv - av;
        // Only do a, not b
        a.add_velocity(scale_vector(b.normal(b, a), rav-av));
        this.bounced = true;
        if (!b.bounced) {
            // var pitch = 0 | ((av - bv) * game_speed / 4);
            var pitch = 0 | 3.5 * Math.log(((av - bv) * game_speed));
            if (pitch >= sounds.hits.length) {
                pitch = sounds.hits.length-1;
            }
            if (pitch >= 0) {
                play_sound(sounds.hits[pitch]);
            }
        }
    }
}


// ========================================================================


// requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
requestAnimationFrame = window.requestAnimationFrame;

function clear_screen() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function fade_screen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function render() {
    if (full_render) {
        clear_screen();
        full_render = false;
    } else {
        fade_screen();
    }

    // Stretch to fill game area.
    ctx.setTransform(scale, 0.0, 0.0, scale, 0.0, 0.0);

    for (let object of objects) {
        object.render();
    }

    // Normalise for text.
    ctx.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);

    if (announcement_lifetime > 0) {
        if (!announcement_crazy || game_time % 0.2 < 0.1) {
            ctx.fillStyle = "cyan";
        } else {
            ctx.fillStyle = "red";
        }
        ctx.textAlign = "center";
        ctx.font = "" + text_scale * canvas.height + "px PressStart2P";
        ctx.fillText(announcement, canvas.width * 0.5, (canvas.height-text_scale) * 0.5);
    }

    if (action_will_restart) {
        if (game_time % 2 < 1) {
            ctx.fillStyle = "cyan";
            ctx.textAlign = "center";
            ctx.font = "" + text_scale * 0.5 * canvas.height + "px PressStart2P";
            ctx.fillText("Click to play again...", canvas.width * 0.5, (canvas.height) * 0.75);
        }
    }
}

function update() {
    if (keys_down[key_bindings.press]) {
        digital.press = true;
    } else {
        digital.press = false;
    }
    digital.x = 0;
    digital.y = 0;
    if (keys_down[key_bindings.left] || keys_down[key_bindings.alt_left]) {
        digital.active = true;
        digital.x -= 1;
    }
    if (keys_down[key_bindings.right] || keys_down[key_bindings.alt_right]) {
        digital.active = true;
        digital.x += 1;
    }
    if (keys_down[key_bindings.down] || keys_down[key_bindings.alt_down]) {
        digital.active = true;
        digital.y += 1;
    }
    if (keys_down[key_bindings.up] || keys_down[key_bindings.alt_up]) {
        digital.active = true;
        digital.y -= 1;
    }
    if (digital.active === true) {
        analog.active = true;
        analog.click = !analog.press && digital.press;
        analog.press = digital.press;
        analog.x = digital.x;
        analog.y = digital.y;
    }

    if (mouse_down || analog.press || digital.press) {
        modifiers.use_ability = true;
    } else {
        modifiers.use_ability = false;
    }
    if (mouse_click || analog.click) {
        modifiers.use_now = true;
    } else {
        modifiers.use_now = false;
    }

    remove_objects = new Set();

    var bullet_count = 0;
    var blackhole_count = 0;
    var enemy_count = 0;
    var powerup_count = 0;
    var pending_count = 0;

    for (let object of objects) {
        if (object instanceof Particle) {
            for (let object2 of objects) {
                if (object2 instanceof Particle) {
                    if (object != object2) {
                        if (displacement_with_length(object, object2).length < object.radius + object2.radius) {
                            object.collide(object2);
                        }
                    }
                }
            }
        }
    }
    for (let object of objects) {
        object.update();
        var primary = object;

        if (object instanceof Pending) {
            pending_count++;
            primary = object.pending;
        }

        if (primary instanceof Bullet) {
            bullet_count++;
        }
        if (primary instanceof Blackhole) {
            blackhole_count++;
        }
        if (primary instanceof Thrower) {
            enemy_count++;
        }
        if (primary instanceof Powerup) {
            powerup_count++;
        }
    }

    if (pending_count < 2) {
        var x = arena_width * Math.random();
        var y = arena_height * Math.random();
        var p = {x:x, y:y};
        var object;

        if (bullet_count / blackhole_count > 24.0) {
            object = new Blackhole(p);
        } else if (enemy_count < 2) {
            object = new Thrower(p);
        } else {
            var payload;
            var r = Math.random();
            if (r < 0.05) {
                payload = powerups.faster;
            } else if (r < 0.10) {
                payload = powerups.slower;
            } else if (r < 0.15) {
                payload = powerups.invulnerability;
            } else if (r < 0.20) {
                payload = powerups.distraction;
            } else if (r < 0.25) {
                payload = powerups.shorten;
            } else if (r < 0.30) {
                payload = powerups.wall;
            } else {
                payload = powerups.point;
            }
            object = new Powerup(p, payload);
        }
        var pending = new Pending(p, object, 5 + Math.random() * 4);

        add_object(pending);
    }

    for (let object of remove_objects) {
        do_remove_object(object);
    }

    if (!objects.has(player)) {
        if (was_alive) {
            add_timeout(function(){action_will_restart=true;}, 2);
            was_alive = false;
        }
        announce("Final Score: " + score, 1);
    }

    mouse_click = false;
    analog.click = false;
}

function message(message) {
    messageNode = document.getElementById("message");
    messageNode.replaceChild(document.createTextNode(message), messageNode.childNodes[0]);
}

function add_timeout(payload, time) {
    var timeout = new Timeout(payload, time);
    add_object(timeout);
}

function announce(message, lifetime, crazy) {
    announcement = message;
    announcement_lifetime = lifetime;
    announcement_crazy = !!crazy;
}

var main_loop = function() {
    if (action_will_restart && (mouse_click || analog.click || digital.press)) {
        reset();
    }

    if (running) {
        then = now;
        now = Date.now();

        time_delta = (now - then) * 0.001;
        time_delta *= game_speed;

        var updates_per_frame = 2;
        time_delta /= updates_per_frame;
        if (time_delta > max_time_delta) {
            time_delta = max_time_delta;
        }
        for (var i = 0; i < updates_per_frame; i++) {
            game_time += time_delta;
            update();
            announcement_lifetime -= time_delta;
        }
        render();

        requestAnimationFrame(main_loop);

        update_loops++;
        message("Update: " + update_loops);
    } else {
        full_render = true;
        render();
        message("Stopped");
    }
}

function initialise_world() {
    objects = new Set();

    player = new TailFish(24, {x:32, y:32});
    add_object(player);
    was_alive = true;

    console.log("World initialised.");
}

function stop() {
    running = false;
    update_loops = 0;
    announce("PAUSED", 1);
    message("Stopping...");
}

function start() {
    if (!running) {
        help.style.display = "none";
        running = true;
        now = Date.now();
        then = now;
        announce("LET'S GO!", 1, true);
        message("Started.");
        main_loop();
    }
}

function reset() {
    action_will_restart = false;
    full_render = true;
    render();
    full_update = true;
    stop();
    help.style.display = "block";
    initialise_world();
    game_speed = 1.0;
    game_time = 0;
    score = 0;
    modifiers = {};
    extra_announcement = ""
}    

addEventListener("keydown", function (e) {
    if (keys_down[e.keyCode]) {
        return;
    }
    console.log("keydown: " + e.keyCode);
    keys_down[e.keyCode] = true;
    if (e.keyCode === key_bindings.start) {
        start();
    } else if (e.keyCode === key_bindings.stop) {
        stop();
    } else if (e.keyCode === key_bindings.reset) {
        reset();
    }
    if (e.keyCode >= 37 && e.keyCode <= 40) {
        e.preventDefault();
    }
}, false);

addEventListener("keyup", function (e) {
    delete keys_down[e.keyCode];
}, false);

addEventListener("mousedown", function (e) {
    if (e.target == canvas && e.button === 0) {
        mouse_down = true;
        mouse_click = true;
        var rect = canvas.getBoundingClientRect();
        mouse_start.x = to_world(e.clientX - rect.left);
        mouse_start.y = to_world(e.clientY - rect.top);
        digital.active = false;
        e.preventDefault();
    }
}, false);

addEventListener("mousemove", function (e) {
    if (e.target == canvas) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = to_world(e.clientX - rect.left);
        mouse.y = to_world(e.clientY - rect.top);
        analog.active = false;
        e.preventDefault();
    }
}, false);

addEventListener("mouseup", function (e) {
    mouse_down = false;
    if (e.target == canvas && e.button === 0) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = to_world(e.clientX - rect.left);
        mouse.y = to_world(e.clientY - rect.top);
        e.preventDefault();
    }
}, false);

touch_motion.addEventListener("touchmove", function(e) {
    var rect = touch_motion.getBoundingClientRect();
    var x = (e.targetTouches[0].clientX - rect.left) / touch_motion.width;
    var y = (e.targetTouches[0].clientY - rect.top) / touch_motion.height;
    analog.x = x*2 - 1;
    analog.y = y*2 - 1;
    analog.active = true;
    e.preventDefault();
}, false);

touch_motion.addEventListener("touchstart", function(e) {
    var rect = touch_motion.getBoundingClientRect();
    var x = (e.targetTouches[0].clientX - rect.left) / touch_motion.width;
    var y = (e.targetTouches[0].clientY - rect.top) / touch_motion.height;
    analog.x = x*2 - 1;
    analog.y = y*2 - 1;
    analog.active = true;
    digital.active = false;
    if (!running) {
        start();
    }
    e.preventDefault();
}, false);

touch_motion.addEventListener("touchend", function(e) {
    if (e.targetTouches.length === 0) {
        analog.x = 0;
        analog.y = 0;
    }
    e.preventDefault();
}, false);

touch_action.addEventListener("touchstart", function(e) {
    analog.active = true;
    analog.press = true;
    analog.click = true;
    e.preventDefault();
}, false);

touch_action.addEventListener("touchend", function(e) {
    if (e.targetTouches.length === 0) {
        analog.press = false;
    }
    e.preventDefault();
}, false);

function check_sound_enabled() {
    sound_enabled = document.getElementById("sound_enabler").checked;
}

function check_touch_enabled() {
    var touch_enabled = document.getElementById("touch_enabler").checked;
    document.getElementById("touch_area").style.display = touch_enabled ? "block" : "none";
}

function check_circle_caching_enabled() {
    circle_caching_enabled = document.getElementById("circle_caching_enabler").checked;
}

function initialise_canvas () {
    resize_canvas();
    resize_canvas(); // Twice in case of scroll bars mucking it up.
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    clear_screen();
}

function resize_canvas () {
    console.log("Resizing display.");
    var width = document.documentElement.clientWidth;
    var height = document.documentElement.clientHeight;
    if (width < height * aspect) {
        height = 0 | (width / aspect);
    } else {
        width = 0 | (height * aspect);
    }

    scale = width / arena_width;

    canvas.width = width;
    canvas.height = height;
    help.width = width;
    help.height = height;
    touch_motion.width = height * 0.9;
    touch_motion.height = height * 0.9;
    touch_action.width = (width - height)  * 0.9;
    touch_action.height = height * 0.9;
    circle_cache = {};
}


function after_body_loaded() {
    document.getElementById("version").innerHTML = "Version: " + version_string;
    initialise_canvas();
    reset();
    check_sound_enabled()
}
