function Entity(world, x, y, z, rotation) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.z = z;
    this.radius = 0.5;
    this.rotation = rotation;
    this.visible = true;
    this.limb = new Limb({
        graphic: assets.graphics.tiles.debug,
    });

    this.is_lit = false;
    this.light_beam_angle = 0;
    this.light_flavour = 0;

    this.reset();
}

Entity.prototype.reset = function() {
};

Entity.prototype.update = function() {
};

Entity.prototype.damage = function(damage, actor) {
    return true; // Damage accepted
}

Entity.prototype.move = function(dx, dy) {
    this.x += dx * this.world.time_delta_sec;
    this.y += dy * this.world.time_delta_sec;
}

// Begin horror.
Entity.prototype.move_blocking = function(dx, dy, slide, solid_test) {
    if (typeof(solid_test) === "undefined") {
        solid_test = function(tile) {return tile.solid};
    }
    if (dx === 0 && dy === 0) {
        return;
    }
    let tdx = dx * this.world.time_delta_sec; // Target
    let tdy = dy * this.world.time_delta_sec;
    let distance = Math.sqrt(tdx**2+tdy**2);
    let speed = Math.sqrt(dx**2+dy**2);
    let udx = dx / speed; // Unit
    let udy = dy / speed;
    let bx = Math.sign(udx) * this.radius; // Front offset
    let by = Math.sign(udy) * this.radius;
    let fx = this.x + bx; // Front
    let fy = this.y + by;
    let size = this.radius * 2;
    let was_blocked = false;
    stepper:
    while (distance > 0) { // Breaks or returns
        let x_blocked = false;
        let y_blocked = false;

        // Check if blocked
        if (fx === Math.round(fx) && udx != 0) {
            let cx = udx > 0 ? fx
                   : udx < 0 ? fx - 1
                   : panic("Bad maths");
            let miny;
            let maxy;
            if (udy < 0) {
                miny = Math.floor(fy);
                maxy = Math.ceil(fy + size);
            } else if (udy > 0) {
                maxy = Math.ceil(fy);
                miny = Math.floor(fy - size);
            } else {
                miny = Math.floor(fy - this.radius);
                maxy = Math.ceil(fy + this.radius);
            }

            for (let cy = miny; cy < maxy; cy++) {
                if (solid_test(this.world.get_tile(cx, cy, this.z))) {
                    x_blocked = true;
                }
            }
        }
        if (fy === Math.round(fy) && udy != 0) {
            let cy = udy > 0 ? fy
                   : udy < 0 ? fy - 1
                   : panic("Bad maths");
            let minx;
            let maxx;
            if (udx < 0) {
                minx = Math.floor(fx);
                maxx = Math.ceil(fx + size);
            } else if (udx > 0) {
                maxx = Math.ceil(fx);
                minx = Math.floor(fx - size);
            } else {
                minx = Math.floor(fx - this.radius);
                maxx = Math.ceil(fx + this.radius);
            }

            for (let cx = minx; cx < maxx; cx++) {
                if (solid_test(this.world.get_tile(cx, cy, this.z))) {
                    y_blocked = true;
                }
            }
        }
        // Special case for hitting an external corner directly.
        if (!x_blocked && !y_blocked && udx != 0 && udy != 0 && fx === Math.round(fx) && fy === Math.round(fy)) {
            let cy = udy > 0 ? fy
                   : udy < 0 ? fy - 1
                   : panic("Bad maths");
            let cx = udx > 0 ? fx
                   : udx < 0 ? fx - 1
                   : panic("Bad maths");
            if (solid_test(this.world.get_tile(cx, cy, this.z))) {
                if (Math.abs(udx) > Math.abs(udx)) {
                    y_blocked = true;
                } else {
                    x_blocked = true;
                }
            }
        }
        if (x_blocked || y_blocked) {
            was_blocked = true;
        }
        if (   slide && (x_blocked && y_blocked)
            || !slide && (x_blocked || y_blocked)
           )
        {
            break stepper;
        }

        let sx; // Step
        if (udx > 0) {
            sx = (Math.floor(fx+1) - fx) / udx;
        } else if (udx < 0) {
            sx = (Math.ceil(fx-1) - fx) / udx;
        } else if (udx === 0) {
            sx = Infinity;
        }
        let sy;
        if (udy > 0) {
            sy = (Math.floor(fy+1) - fy) / udy;
        } else if (udy < 0) {
            sy = (Math.ceil(fy-1) - fy) / udy;
        } else if (udy === 0) {
            sy = Infinity;
        }

        let s = (sx < sy) ? sx : sy;
        if (s > distance) {
            s = distance;
        }
        distance -= s;
        if (!x_blocked) {
            fx += udx * s;
        }
        if (!y_blocked) {
            fy += udy * s;
        }
        if (distance > 0) {
            if (sx < sy) {
                fx = Math.round(fx); // Eliminate rounding errors
            } else {
                fy = Math.round(fy);
            }
        }
    }
    this.x = fx - bx;
    this.y = fy - by;
    return was_blocked;
}
// End horror.

Entity.prototype.gen_lighting = function(lights) {
    // No lighting by default.
};

Entity.prototype.get_collisions = function() {
    let collisions = [];
    for (let entity of this.world.entities) {
        if (entity === this) {
            continue;
        }
        let max_distance = (this.radius + entity.radius)**2;
        if ((entity.x - this.x)**2 + (entity.y - this.y)**2 < max_distance) {
            collisions.push(entity);
        }
    }
    return collisions;
};

Entity.prototype.check_clear_path = function( dist ) {
    const to_x = this.x + ( dist * Math.cos( this.rotation ) );
    const to_y = this.y + ( dist * Math.sin( this.rotation ) );
    return this.world.opacity_grid.check_visual( this.x, this.y, to_x, to_y );
};

Entity.prototype.detect_light = function() {
    const opacity_grid = this.world.opacity_grid;

    let closest = null;
    let closest_dist;

    const combined_sources =
        new Set( [ ...(this.world.entities), ...(this.world.active_tiles) ] );
    for (let source of combined_sources ) {
        const diff_x = source.x - this.x;
        const diff_y = source.y - this.y;
        const dist = Math.sqrt( diff_x*diff_x + diff_y*diff_y );

        if( ( closest !== null ) && ( closest_dist < dist ) ) {
            continue;
        }

        // Attempt to generate lights from the entity.
        const lights = [];
        source.gen_lighting(lights);
        let found_light = false;
        for( let i in lights ) {
            const light = lights[i];
            if( light.channel === World.LIGHT_CHANNELS.FRIEND ) {
                found_light = true;
                break;
            }
        }
        if( ! found_light ) {
            continue;
        }

        // Check line of sight.
        if( ! opacity_grid.check_visual( this.x, this.y, source.x, source.y ) ) {
            continue;
        }

        closest_dist = dist;
        closest = source;
    }

    if( closest !== null ) {
        return closest;
    }

    for (let source of combined_sources) {
        // Attempt to generate lights from the entity.
        const lights = [];
        source.gen_lighting(lights);
        let found_light = false;
        for( let i in lights ) {
            const light = lights[i];
            if( light.channel === World.LIGHT_CHANNELS.FRIEND ) {
                found_light = true;
                break;
            }
        }
        if( ! found_light ) {
            continue;
        }

        for( let i in lights ) {
            const light = lights[i];
            if( light.channel !== World.LIGHT_CHANNELS.FRIEND ) {
                continue;
            }
            const sample = light.random_sample( opacity_grid );
            if( opacity_grid.check_visual( this.x, this.y, sample.x, sample.y ) ) {
                // Can see light.
                const diff_x = sample.x - this.x;
                const diff_y = sample.y - this.y;
                const dist = Math.sqrt( diff_x*diff_x + diff_y*diff_y );
                if( ( closest === null ) || ( dist < closest_dist ) ) {
                    closest = sample;
                    closest_dist = dist;
                }
            }
        }
    }

    return closest;
};

Entity.prototype.select = function() {
}

Entity.prototype.delete = function() {
    this.world.entities.delete(this);
};


// This does not need to be chained.
Entity.prototype.render = function(view) {
    if (this.visible) {
        view.ctx.save();
        let disp_x = this.x * assets.tile_w;
        let disp_y = this.y * assets.tile_h;
        view.ctx.translate(disp_x, disp_y);
        view.ctx.rotate(this.rotation);
        this.limb.render(view);
        view.ctx.restore();
    }
};

Entity.prototype.description = function() {return "Something... but what?"};
