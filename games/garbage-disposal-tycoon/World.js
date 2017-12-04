function World(size_x, size_y, size_z) {
    this.set_size(size_x, size_y, size_z);
    this.time = 0;
    this.old_time = 0;
}

World.prototype.set_size = function(size_x, size_y, size_z) {
    this.size_x = size_x;
    this.size_y = size_y;
    this.size_z = size_z;

    this.layers = [];
    for (let z = 0; z < size_z; z++) {
        this.layers.push(new Layer(this, z, size_x, size_y));
    }
}

World.prototype.generate_flat = function(ground_level) {
    for (let z = 0; z < this.size_z; z++) {
        for (let y = 0; y < this.size_y; y++) {
            for (let x = 0; x < this.size_x; x++) {
                if (z === 0) {
                    this.emplace_tile(x, y, z, Tile_Bedrock);
                }
                else if (z <= ground_level) {
                    this.emplace_tile(x, y, z, Tile_Dirt);
                }
                else {
                    this.emplace_tile(x, y, z, Tile_Air);
                }
            }
        }
    }
}

World.prototype.generate_terrain = function(ground_level, noise, water_level) {
    console.log("Reticulating splines...");
    let terrain_height = RandomTools.smooth_surface(this.size_x, this.size_y, 2, (this.size_x * 0.25) | 0);
    for (let z = 0; z < this.size_z; z++) {
        for (let y = 0; y < this.size_y; y++) {
            for (let x = 0; x < this.size_x; x++) {
                if (z === 0) {
                    this.emplace_tile(x, y, z, Tile_Bedrock);
                }
                else if (z <= ground_level + terrain_height[x + y * this.size_x] * noise) {
                    this.emplace_tile(x, y, z, Tile_Dirt);
                }
                else if (z <= water_level) {
                    this.emplace_tile(x, y, z, Tile_Water);
                }
                else {
                    this.emplace_tile(x, y, z, Tile_Air);
                }
            }
        }
    }

    for (let y = 0; y < this.size_y; y++) {
        for (let x = 0; x < this.size_x; x++) {
            let z = this.ground_height(x, y);
            let tile = this.get_tile(x, y, z);
            if (tile instanceof Tile_Dirt) {
                if (z >= water_level && z <= water_level + 5) {
                    this.emplace_tile(x, y, z, Tile_Grass, 1 - ((z - water_level) / 5));
                }
            }
        }
    }
}


World.prototype.emplace_tile_at_ground = function(x, y, offset_z) {
    return this.emplace_tile(x, y, this.ground_height(x, y) + offset_z, ...Array.prototype.slice.call(arguments, 3));
}


World.prototype.ground_height = function(x, y) {
    let z;

    for (z = this.size_z - 1;
         z >= 0 && this.get_tile(x, y, z) instanceof Tile_Air;
         z--);

    return z;
}


World.prototype.emplace_tile = function(x, y, z, constructor) {
    let tile = new constructor(this, x, y, z, ...Array.prototype.slice.call(arguments, 4));

    this.set_tile(x, y, z, tile);

    return tile;
}

/// Bounds checked.
World.prototype.set_tile = function(x, y, z, tile) {
    if (   x >= 0 && x < this.size_x
        && y >= 0 && y < this.size_y
        && z >= 0 && z < this.size_z) {
        this.layers[z].set_tile(x, y, tile);
    }
}

/// Bounds checked.
World.prototype.get_tile = function(x, y, z) {
    if (   x < 0 || x >= this.size_x
        || y < 0 || y >= this.size_y
        || z < 0 || z >= this.size_z) {
        return new Tile_OutOfBounds(this, x, y, z);
    }
    return this.layers[z].get_tile(x, y);
}

/// Bounds checked.
World.prototype.swap_tiles = function(a, b) {
    let ax = a.x;
    let ay = a.y;
    let az = a.z;
    let bx = b.x;
    let by = b.y;
    let bz = b.z;
    a.x = bx;
    a.y = by;
    a.z = bz;
    b.x = ax;
    b.y = ay;
    b.z = az;
    this.set_tile(a.x, a.y, a.z, a);
    this.set_tile(b.x, b.y, b.z, b);
}



World.prototype.time_tick = function(interval) {
    return ((this.time / interval) | 0) != ((this.old_time / interval) | 0);
}

World.prototype.update = function(time_delta) {
    this.old_time = this.time;
    this.time += time_delta;

    if (world.time_tick(100)) {
        // Reset
        for (let z = 0; z < this.size_z; z++) {
            for (let y = 0; y < this.size_y; y++) {
                for (let x = 0; x < this.size_x; x++) {
                    this.get_tile(x, y, z).reset();
                }
            }
        }

        // Power
        for (let z = 0; z < this.size_z; z++) {
            for (let y = 0; y < this.size_y; y++) {
                for (let x = 0; x < this.size_x; x++) {
                    this.get_tile(x, y, z).share_power();
                }
            }
        }

        for (let z = 0; z < this.size_z; z++) {
            for (let y = 0; y < this.size_y; y++) {
                for (let x = 0; x < this.size_x; x++) {
                    this.get_tile(x, y, z).update_power();
                }
            }
        }

        // Main update
        for (let z = 0; z < this.size_z; z++) {
            for (let y = 0; y < this.size_y; y++) {
                for (let x = 0; x < this.size_x; x++) {
                    this.get_tile(x, y, z).update();
                }
            }
        }

        // Physics
        let world = this;
        let physics_at = function(x, y, z) {
            let tile = world.get_tile(x, y, z);
            if (tile.physical) {
                tile.physics_step();
            }
        }
        for (let z = 0; z < this.size_z; z++) {
            for (let y = 0; y < this.size_y; y++) {
                for (let x = 0; x < this.size_x; x++) {
                    physics_at(x, y, z);
                }
                for (let x = this.size_x-1; x >= 0; x--) {
                    physics_at(x, y, z);
                }
            }
            for (let y = this.size_y-1; y >= 0; y--) {
                for (let x = 0; x < this.size_x; x++) {
                    physics_at(x, y, z);
                }
                for (let x = this.size_x-1; x >= 0; x--) {
                    physics_at(x, y, z);
                }
            }
        }
    }
}



World.prototype.render = function(view) {
    view.ctx.save();

    view.ctx.translate(
        -view.scroll_x + ((view.canvas.width / 2) | 0),
        -(view.scroll_y - view.scroll_z * 4) + ((view.canvas.height / 2) | 0)
    );

    view.ctx.scale(
        view.zoom,
        view.zoom
    );

    for (let z = 0; z < this.size_z; z++) {
        for (let y = 0; y < this.size_y; y++) {
            for (let x = 0; x < this.size_x; x++) {
                this.get_tile(x, y, z).render(view);
            }
        }
        // this.layers[y].render(view)
    }

    view.ctx.restore();
}

World.prototype.mouse_to_tiles = function() {
    let cursor_x = ((mouse.x - canvas.width / 2) + scroll_x) / zoom;
    let cursor_y = ((mouse.y - canvas.height / 2) + scroll_y) / zoom;

    let trace_x = ( cursor_x / 32 + cursor_y / 16) - 0.5;
    let trace_y = (-cursor_x / 32 + cursor_y / 16) + 0.5 + 0.005; // Hack: helps break ties
    let trace_z = scroll_z + 0.01; // Hack: helps break ties

    let dx = 1 / 16;
    let dy = 1 / 16;
    let dz = 1 / 4;

    let inner = this.get_tile(trace_x|0, trace_y|0, trace_z|0);
    let outer = this.get_tile(trace_x|0, trace_y|0, trace_z|0);
    while (!inner.visible
           && trace_x >= 0
           && trace_y >= 0
           && trace_z >= 0
          ) {
        outer = inner;
        // Determine which edge is exitted first
        let req_x = (trace_x - (Math.ceil(trace_x)-1)) / dx;
        let req_y = (trace_y - (Math.ceil(trace_y)-1)) / dy;
        let req_z = (trace_z - (Math.ceil(trace_z)-1)) / dz;
        let req = Math.min(req_x, req_y, req_z);

        // Precision paranoia
        if (req_x === req) {
            trace_x = Math.ceil(trace_x) - 1;
            trace_y -= req * dy;
            trace_z -= req * dz;
        }
        else if (req_y === req) {
            trace_x -= req * dx;
            trace_y = Math.ceil(trace_y) - 1;
            trace_z -= req * dz;
        }
        else if (req_z === req) {
            trace_x -= req * dx;
            trace_y -= req * dy;
            trace_z = Math.ceil(trace_z) - 1;
        }
        inner = this.get_tile(trace_x|0, trace_y|0, trace_z|0);
    }

    return {
        inner: {
            tile: inner,
            x: inner.x,
            y: inner.y,
            z: inner.z,
            render: null,
        },
        outer: {
            tile: outer,
            x: outer.x,
            y: outer.y,
            z: outer.z,
            render: null,
        },
    };
}
