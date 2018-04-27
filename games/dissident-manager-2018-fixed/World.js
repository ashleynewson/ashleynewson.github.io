function World(size_x, size_y, size_z) {
    this.set_size(size_x, size_y, size_z);
    this.visual_effects = new Set();
    this.sound_effects = new Set();
    this.entities = new Set();
    this.active_tiles = new Set();
    this.time = 0;
    this.time_sec = 0;
    this.old_time = 0;
    this.old_time_sec = 0;
    this.time_delta = 0;
    this.time_delta_sec = 0;
    this.max_time_delta = 100;
    this.game_speed = 1.0;

    this.opacity_grid = new LightingOpacityGrid();
}

World.LIGHT_CHANNELS = ( function(channels) {
    const ret = {};
    let n = 0;
    for( let i in channels ) ret[channels[i]] = n ++;
    return ret;
} ) ( [
    "FRIEND",
    "FOE"
] );

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
                if (z <= ground_level) {
                    this.emplace_tile(x, y, z, Tile_Gravel);
                }
                else {
                    this.emplace_tile(x, y, z, Tile_Air);
                }
            }
        }
    }
}

World.prototype.generate_random = function(ground_level) {
    let sector_w = 5;
    let sector_h = 5;
    let closing = 2;
    let sectors_x = Math.ceil(this.size_x / sector_w);
    let sectors_y = Math.ceil(this.size_y / sector_h);

    let sectors = Array(sectors_y);
    for (let y = 0; y < sectors_y; y++) {
        sectors[y] = Array(sectors_x);
        for (let x = 0; x < sectors_x; x++) {
            let master = null;
            if (y > 0 && x > 0) {
                if (sectors[y-1][x-1].master != null
                    && sectors[y-1][x].master === sectors[y-1][x-1].master
                    && sectors[y][x-1].master === sectors[y-1][x-1].master
                   )
                {
                    master = sectors[y-1][x-1].master;
                }
            }
            if (Math.random() > 0.1) {
                if (Math.random() > 0.5) {
                    if (x > 0) {
                        if (y === 0 || sectors[y-1][x-1].master != sectors[y][x-1].master)
                        {
                            master = sectors[y][x-1].master;
                        }
                    }
                } else {
                    if (y > 0) {
                        if (x === 0 || sectors[y-1][x-1].master != sectors[y-1][x].master)
                        {
                            master = sectors[y-1][x].master;
                        }
                    }
                }
            }
            sectors[y][x] = {
                x: x,
                y: y,
                left: null,
                right: null,
                up: null,
                down: null,
                type: "interior",
                count: 0,
            };
            sectors[y][x].master = master || sectors[y][x];
        }
    }
    let debug = "";
    let masters = new Set();
    for (let y = 0; y < sectors_y; y++) {
        for (let x = 0; x < sectors_x; x++) {
            masters.add(sectors[y][x].master);
            if (sectors[y][x].master === sectors[y][x]) {
                debug+="+";
                if (x > 0) {
                    sectors[y][x].left = (sectors[y][x-1]);
                    sectors[y][x-1].right = (sectors[y][x]);
                }
                if (y > 0) {
                    sectors[y][x].up = (sectors[y-1][x]);
                    sectors[y-1][x].down = (sectors[y][x]);
                }
            } else if (x > 0 && y > 0 && sectors[y][x].master === sectors[y-1][x-1].master) {
                debug+=" ";
            } else if (x > 0 && sectors[y][x].master === sectors[y][x-1].master) {
                debug+="-";
                if (y > 0) {
                    sectors[y][x].up = (sectors[y-1][x]);
                    sectors[y-1][x].down = (sectors[y][x]);
                }
            } else if (y > 0 && sectors[y][x].master === sectors[y-1][x].master) {
                debug+="|";
                if (x > 0) {
                    sectors[y][x].left = (sectors[y][x-1]);
                    sectors[y][x-1].right = (sectors[y][x]);
                }
            } else {
                debug+="?";
            }
        }
        debug+="\n";
    }
    console.log(debug);
    console.log(masters.size + " raw sectors");

    let random_merges = masters.size / 4;
    for (let i = 0; i < random_merges; i++) {
        let masters_array = Array.from(masters);
        let a = masters_array[(Math.random() * masters_array.length)|0];
        let options = [];
        for (let y = 0; y < sectors_y; y++) {
            for (let x = 0; x < sectors_x; x++) {
                if (sectors[y][x].master === a) {
                    sectors[y][x].left && options.push(sectors[y][x].left);
                    sectors[y][x].right && options.push(sectors[y][x].right);
                    sectors[y][x].up && options.push(sectors[y][x].up);
                    sectors[y][x].down && options.push(sectors[y][x].down);
                }
            }
        }
        let b = options[(Math.random() * options.length)|0].master;
        for (let y = 0; y < sectors_y; y++) {
            for (let x = 0; x < sectors_x; x++) {
                if (sectors[y][x].master === b) {
                    sectors[y][x].master = a;
                    if (sectors[y][x].left && sectors[y][x].left.master === a) {
                        sectors[y][x].left = null;
                        sectors[y][x-1].right = null;
                    }
                    if (sectors[y][x].right && sectors[y][x].right.master === a) {
                        sectors[y][x].right = null;
                        sectors[y][x+1].left = null;
                    }
                    if (sectors[y][x].up && sectors[y][x].up.master === a) {
                        sectors[y][x].up = null;
                        sectors[y-1][x].down = null;
                    }
                    if (sectors[y][x].down && sectors[y][x].down.master === a) {
                        sectors[y][x].down = null;
                        sectors[y+1][x].up = null;
                    }
                }
            }
        }
        masters.delete(b);
    }

    for (let y = 0; y < sectors_y; y++) {
        for (let x = 0; x < sectors_x; x++) {
            sectors[y][x].master.count++;
        }
    }
    for (let master of masters) {
        if (master.count >= 8) {
            master.type = "exterior";
        }
    }

    for (let y = 0; y < sectors_y; y++) {
        for (let x = 0; x < sectors_x; x++) {
            let a = sectors[y][x];
            if (a.left && Math.random() < 0.5) {
                if (a.master.type == "interior" || a.left.master.type == "interior") {
                    a.join_left = "window";
                }
            }
            if (a.up && Math.random() < 0.5) {
                if (a.master.type == "interior" || a.up.master.type == "interior") {
                    a.join_up  = "window";
                }
            }
        }
    }

    let join_sets = new Set();
    for (let master of masters) {
        join_set = new Set([master]);
        master.join_set = join_set;
        join_sets.add(join_set);
    }
    // Bad - lacks guarantees
    while (join_sets.size > 1) {
        let x = (Math.random() * sectors_x) | 0;
        let y = (Math.random() * sectors_y) | 0;
        let d = (Math.random() * 2) | 0;
        let a = sectors[y][x];
        let b = null;
        if (d === 0 && a.left) {
            b = a.left;
            a.join_left = "open";
        }
        else if (d === 1 && a.up) {
            b = a.up;
            a.join_up  = "open";
        }
        if (b) {
            if (a.master.join_set != b.master.join_set) {
                let merge_set = a.master.join_set;
                let old_set = b.master.join_set;
                old_set.forEach((i)=>{
                    merge_set.add(i);
                    i.join_set = merge_set;
                });
                join_sets.delete(old_set);
            }
        }
    }

    for (let z = 0; z < this.size_z; z++) {
        for (let y = 0; y < this.size_y; y++) {
            for (let x = 0; x < this.size_x; x++) {
                if (z <= ground_level) {
                    let sector = sectors[(y/sector_h)|0][(x/sector_w)|0];
                    if (sector.master.type == "exterior") {
                        this.emplace_tile(x, y, z, Tile_Floor, assets.graphics.tiles.floor.grass);
                    } else {
                        this.emplace_tile(x, y, z, Tile_Floor, assets.graphics.tiles.floor.checker);
                    }
                }
                else {
                    this.emplace_tile(x, y, z, Tile_Air);
                }
            }
        }
    }
    {
        let z = ground_level+1;
        for (let y = 0; y < this.size_y; y++) {
            for (let x = 0; x < this.size_x; x++) {
                let sector = sectors[(y/sector_h)|0][(x/sector_w)|0];
                if (sector.master.type == "exterior") {
                    if (Math.random() < 0.05) {
                        this.emplace_tile(x, y, z, Tile_Bush);
                    }
                }
            }
        }
    }
    {
        let z = ground_level+1;
        for (let y = 0; y < sectors_y; y++) {
            for (let x = 0; x < sectors_x; x++) {
                sector = sectors[y][x];
                if (sector.left != null) {
                    for (let i = 0; i <= sector_h; i++) {
                        let jx = x*sector_w;
                        let jy = y*sector_h+i;
                        if (sector.master.type === "interior" || sector.left.master.type === "interior") {
                            this.emplace_tile(jx, jy, z-1, Tile_Floor, assets.graphics.tiles.floor.checker);
                            this.emplace_tile(jx, jy, z, Tile_Wall);
                        } else {
                            if (!(this.get_tile(jx, jy, z) instanceof Tile_Wall)) {
                                this.emplace_tile(jx, jy, z, Tile_Fence, 0);
                            }
                        }
                        if (sector.join_left && i >= closing && i <= sector_h - closing) {
                            if (sector.join_left === "open") {
                                this.emplace_tile(jx, jy, z, Tile_Air);
                            }
                            else if (sector.join_left === "window") {
                                this.emplace_tile(jx, jy, z-1, Tile_Floor, assets.graphics.tiles.floor.wood);
                                this.emplace_tile(jx, jy, z, Tile_Window, 0);
                            }
                        }
                    }
                }
                if (sector.up != null) {
                    for (let i = 0; i <= sector_w; i++) {
                        let jx = x*sector_w+i;
                        let jy = y*sector_h;
                        if (sector.master.type === "interior" || sector.up.master.type === "interior") {
                            this.emplace_tile(jx, jy, z-1, Tile_Floor, assets.graphics.tiles.floor.checker);
                            this.emplace_tile(jx, jy, z, Tile_Wall);
                        } else {
                            if (!(this.get_tile(jx, jy, z) instanceof Tile_Wall)) {
                                this.emplace_tile(jx, jy, z, Tile_Fence, 1);
                            }
                        }
                        if (sector.join_up && i >= closing && i <= sector_h - closing) {
                            if (sector.join_up === "open") {
                                this.emplace_tile(jx, jy, z, Tile_Air);
                            }
                            else if (sector.join_up === "window") {
                                this.emplace_tile(jx, jy, z-1, Tile_Floor, assets.graphics.tiles.floor.wood);
                                this.emplace_tile(jx, jy, z, Tile_Window, 1);
                            }
                        }
                    }
                }
            }
        }
    }
    {
        let z = ground_level+1;
        for (let y = 0; y < this.size_y; y++) {
            for (let x = 0; x < this.size_x; x++) {
                let sector = sectors[(y/sector_h)|0][(x/sector_w)|0];
                if (sector.master.type == "interior") {
                    if (this.get_tile(x, y, z) instanceof Tile_Air) {
                        if (Math.random() < 0.03) {
                            this.emplace_tile(x, y, z+1, Tile_CeilingLight, (Math.random()*2)|0, 100, 500, 1.5, 10);
                            this.active_tiles.add(this.get_tile(x, y, z+1));
                        }
                    }
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

World.prototype.add_entity = function(x, y, z, rotation, constructor) {
    let entity = new constructor(this, x, y, z, rotation, ...Array.prototype.slice.call(arguments, 5));

    this.entities.add(entity);

    return entity;
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
    time_delta = (time_delta * this.game_speed) | 0;
    if (time_delta > this.max_time_delta) {
        time_delta = this.max_time_delta; // Minimum 40 FPS
    }
    this.old_time = this.time;
    this.old_time_sec = this.time_sec;
    this.time += time_delta;
    this.time_sec = this.time / 1000;
    this.time_delta = time_delta;
    this.time_delta_sec = time_delta / 1000;

    if (world.time_tick(100)) {
        // Reset
        for (let z = 0; z < this.size_z; z++) {
            for (let y = 0; y < this.size_y; y++) {
                for (let x = 0; x < this.size_x; x++) {
                    this.get_tile(x, y, z).reset();
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
    }

    for (let entity of this.entities) {
        entity.reset();
    }
    for (let entity of this.entities) {
        entity.update();
    }
}



World.prototype.build_opacity_grid = function() {
    const opacity_grid = this.opacity_grid;

    // for (let z = 0; z < this.size_z; z++) {
    {
        let z = 1;
        for (let y = 0; y < this.size_y; y++) {
            for (let x = 0; x < this.size_x; x++) {
                if( !this.get_tile(x, y, z).transmit_light ) {
                    opacity_grid.set_opaque( x, y );
                }
            }
        }
    }
};

World.prototype.render = function(view) {
    const AMBIENT_LIGHT = 48;

    const opacity_grid = this.opacity_grid;

    const lights = [];

    for (let z = 0; z < 1; z++) { // Lower tiles
        for (let y = 0; y < this.size_y; y++) {
            for (let x = 0; x < this.size_x; x++) {
                this.get_tile(x, y, z).render(view);
                this.get_tile(x, y, z).gen_lighting(lights);
            }
        }
    }

    for (let effect of this.visual_effects) {
        if (effect.check_expired(view)) {
            this.visual_effects.delete(effect);
        } else {
            effect.render(view);
        }
    }

    for (let effect of this.sound_effects) {
        if (effect.check_expired(view)) {
            this.sound_effects.delete(effect);
        } else {
            effect.update(view);
        }
    }

    for (let entity of this.entities) {
        entity.render(view);
        entity.gen_lighting(lights);
    }

    for (let z = 1; z < this.size_z; z++) { // Upper tiles
        for (let y = 0; y < this.size_y; y++) {
            for (let x = 0; x < this.size_x; x++) {
                this.get_tile(x, y, z).render(view);
                this.get_tile(x, y, z).gen_lighting(lights);
            }
        }
    }

    // Render lights.
    const n_light_channels = ( function() {
        let n = 0;
        const lcs = World.LIGHT_CHANNELS;
        for (prop in lcs) if (lcs.hasOwnProperty(prop)) n ++;
        return n;
    } )();
    const lightbuf = new LightBuf(
        view.lighting_canvas.width, view.lighting_canvas.height, n_light_channels
    );
    for (let light of lights) {
        light.cast_rays( opacity_grid );
        light.shade();
        light.paint( lightbuf );
    }

    view.lighting_ctx = view.lighting_canvas.getContext("2d");
    view.lighting_ctx.putImageData( lightbuf.to_image_data( AMBIENT_LIGHT ), 0, 0 );
    view.ctx.globalCompositeOperation = "multiply";
    view.ctx.drawImage( view.lighting_canvas, 0, 0 );
    view.ctx.globalCompositeOperation = "source-over";
}

World.prototype.add_visual_effect = function(effect) {
    this.visual_effects.add(effect);
}

World.prototype.add_sound_effect = function(effect) {
    this.sound_effects.add(effect);
}

World.prototype.mouse_to_tiles = function() {
    let cursor_x = (mouse.x - canvas.width / 2) / zoom + scroll_x;
    let cursor_y = (mouse.y - canvas.height / 2) / zoom + scroll_y;

    let fx = cursor_x / assets.tile_w;
    let fy = cursor_y / assets.tile_h;
    let x = fx | 0;
    let y = fy | 0;
    let z = this.ground_height(x, y);

    let inner = this.get_tile(x, y, z);
    let outer = this.get_tile(x, y, z+1);

    return {
        inner: {
            tile: inner,
            x: x,
            y: y,
            z: z,
            render: null,
        },
        outer: {
            tile: outer,
            x: x,
            y: y,
            z: z+1,
            render: null,
        },
        floating: {
            x: fx,
            y: fy,
            z: z+1,
            render: null,
        },
    };
}
