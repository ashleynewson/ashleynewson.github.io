"use strict";

function World(size_x, size_y) {
    this.size_x = size_x;
    this.size_y = size_y;
    this.generate();
    this.visual_effects = new Set();
    this.sound_effects = new Set();
    this.entities = new Set();
    this.time = 0;
    this.time_sec = 0;
    this.old_time = 0;
    this.old_time_sec = 0;
    this.time_delta = 0;
    this.time_delta_sec = 0;
    this.max_time_delta = 100;
    this.game_speed = 1.0;
    this.faith = 0.5;
    this.water = 50;
    this.graphics = {
        faith_bar: new StencilledGraphic(
            assets.graphics.ui.progress,
            {"color": "#ffc080"}
        ),
        water_bar: new StencilledGraphic(
            assets.graphics.ui.progress,
            {"color": "blue"}
        ),
    };
}

World.prototype.generate = function() {
    this.terrain = new Terrain(this.size_x, this.size_y);
    // this.update_path_graph();
}

World.prototype.add_entity = function(x, y, constructor) {
    let entity = new constructor(this, x, y, ...Array.prototype.slice.call(arguments, 3));

    this.entities.add(entity);

    return entity;
};

World.prototype.delete_entity = function(entity) {
    this.entities.delete(entity);
};

World.prototype.get_ground = function(rx, ry) {
    let p = this.clamp_reserved(rx, ry);
    let x=p.x|0;
    let y=p.y|0;

    let i = (y * this.size_x + x) * 2;
    return {
        altitude: this.terrain.data[i],
        light: this.terrain.data[i+1] & 0xff,
        hydrated: ( this.terrain.data[i+1] & 0x0300 ) !== 0,
        flooded: ( this.terrain.data[i+1] & 0x0300 ) > 0x0100,
    }
};

World.prototype.get_proximal = function(x, y, radius) {
    let proximal = [];
    for (let entity of this.entities) {
        let dx = entity.x - x;
        let dy = entity.y - y;
        let r = entity.radius + radius;
        let distance2 = dx*dx + dy*dy;
        if (distance2 <= r*r) {
            proximal.push(entity);
        }
    }
    return proximal;
};
World.prototype.is_clear = function(x, y, radius) {
    return this.get_proximal(x, y, radius).length == 0;
}

World.prototype.update_path_graph = function() { // Expects a power-of-2 map size.
    let minimum_sector_size = 8;
    let maximum_sector_size = 256;
    let map_w = this.size_x;
    let map_h = this.size_y;
    let terrain_data = this.terrain.data;
    let sectors = [];
    let sector_maps = [];

    let sectors_w = map_w / minimum_sector_size;
    let sectors_h = map_h / minimum_sector_size;
    let base_sector_map = new Uint8Array(sectors_w * sectors_h);
    let node_count = 0;
    for (let sy = 0; sy < sectors_h; sy++) {
        let by = sy*minimum_sector_size;
        sector:
        for (let sx = 0; sx < sectors_w; sx++) {
            // base_sector_map[sy*sectors_w+sx] = 0;
            let bx = sx*minimum_sector_size;
            for (let y = 0; y < minimum_sector_size; y++) {
                for (let x = 0; x < minimum_sector_size; x++) {
                    if (terrain_data[(((by+y)*map_w+(bx+x)) << 1)|1] & 0x0100) {
                        continue sector;
                    }
                }
            }
            base_sector_map[sy*sectors_w+sx] = 1;
            node_count++;
        }
    }
    sector_maps.push(base_sector_map);
    for (let sector_size = minimum_sector_size*2;
         sector_size <= maximum_sector_size;
         sector_size *= 2)
    {
        let parent_sector_map = sector_maps[sector_maps.length-1];
        let parent_sectors_w = sectors_w;
        let sector_map = new Uint8Array(sectors_w * sectors_h);
        sectors_w >>= 1;
        sectors_h >>= 1;
        for (let sy = 0; sy < sectors_h; sy++) {
            let log="";
            for (let sx = 0; sx < sectors_w; sx++) {
                let b = (sy*sectors_w*4)+sx*2;
                if (parent_sector_map[b]
                    && parent_sector_map[b+1]
                    && parent_sector_map[b+parent_sectors_w]
                    && parent_sector_map[b+parent_sectors_w+1]
                   )
                {
                    sector_map[sy*sectors_w+sx] = 1;
                    node_count -= 3; // 4 merge into 1
                    log=log+"<>";
                } else {
                    log=log+" .";
                }
            }
            console.log(log+sy+"\n");
        }
        console.log("~~~~");
        sector_maps.push(sector_map);
    }

    console.log("node count: "+node_count);
    let nodes = new Array(node_count);
    let node_i = 0;
    let prev_node_map = null;
    let node_map = [];
    let child_sector_map = null;
    let sector_map = null;
    for (let sector_size = maximum_sector_size; sector_size >= minimum_sector_size; sector_size /= 2) {
        prev_node_map = node_map;
        node_map = new Array(sectors_w*sectors_h);
        child_sector_map = sector_map;
        sector_map = sector_maps.pop();
        let child_sectors_w = sectors_w>>1;
        let child_sectors_h = sectors_h>>1;
        for (let sy = 0; sy < sectors_h; sy++) {
            let csy = sy>>1;
            for (let sx = 0; sx < sectors_w; sx++) {
                let csx = sx>>1;
                let cb = csy*child_sectors_w+csx;
                let b = sy*sectors_w+sx;
                if (child_sector_map != null && child_sector_map[cb]) {
                    node_map[b] = prev_node_map[cb];
                    continue; // Use bigger sector
                }
                if (!sector_map[sy*sectors_w+sx]) {
                    continue; // Not walkable
                }
                let connections = [];
                if (sx>0 && node_map[b-1] != null) { // -x
                    connections.push(node_map[b-1]);
                }
                if (sy>0 && sx>0 && node_map[b-sectors_w-1] != null) { // -x-y
                    connections.push(node_map[b-sectors_w-1]);
                }
                if (sy>0 && node_map[b-sectors_w] != null) { //   -y
                    connections.push(node_map[b-sectors_w]);
                }
                if (sy>0 && sx<(sectors_w-1) && node_map[b-sectors_w+1] != null) { // +x-y
                    connections.push(node_map[b-sectors_w+1]);
                }
                if (child_sector_map != null) {
                    if (sx & 1 && csx<(child_sectors_w-1)) {
                        if (child_sector_map[cb+1]) { // +x
                            connections.push(prev_node_map[cb+1]);
                        }
                        if (sy & 1 && csy<(child_sectors_h-1)) { // +x+y
                            if (child_sector_map[cb+child_sectors_w+1]) {
                                connections.push(prev_node_map[cb+child_sectors_w+1]);
                            }
                        }
                    }
                    if (sy & 1 && csy<(child_sectors_h-1)) {
                        if (child_sector_map[cb+child_sectors_w]) { //   +y
                            connections.push(prev_node_map[cb+child_sectors_w]);
                        }
                        if (sx & 0 && csx > 0) {
                            if (child_sector_map[cb+child_sectors_w-1]) { // -x+y
                                connections.push(prev_node_map[cb+child_sectors_w-1]);
                            }
                        }
                    }
                }
                let node = {
                    i: node_i,
                    x1: (sx+0)*sector_size,
                    y1: (sy+0)*sector_size,
                    x2: (sx+1)*sector_size,
                    y2: (sy+1)*sector_size,
                    x: (sx+0.5)*sector_size,
                    y: (sy+0.5)*sector_size,
                    w: sector_size,
                    c: connections,
                };
                for (let connected of connections) {
                    connected.c.push(node);
                }
                nodes[node_i++] = node;
                node_map[b] = node;
            }
        }
        sectors_w <<= 1;
        sectors_h <<= 1;
    }
    this.path_nodes = nodes;
    this.path_node_map = node_map;
    this.path_node_map_granularity = minimum_sector_size;
    this.path_node_map_width = this.size_x / minimum_sector_size;
};

World.prototype.get_path_node = function(x, y) {
    if (   x < 0 || x >= this.size_x
        || y < 0 || y >= this.size_y
       )
    {
        panic("Path finding location is out of map");
    }
    let mx = ((x|0) / this.path_node_map_granularity) | 0;
    let my = ((y|0) / this.path_node_map_granularity) | 0;
    return this.path_node_map[
        my * this.path_node_map_width + mx
    ] || null;
};

World.prototype.find_path = function(loc_a, loc_b) {
    let waypoints = [];

    let a = this.get_path_node(a.x, a.y);
    let b = this.get_path_node(b.x, b.y);

    let nodes = this.nodes;

    let weights = new Array(nodes.length);
    let best = new Array(nodes.length);

    let from = [a];
    // while() {
    //     let to = [];
    // }

    // SOME MAGIC HERE
    return waypoints;
};

World.prototype.path_is_clear = function(a, b) {
    let x1 = a.x | 0;
    let y1 = a.y | 0;
    let x2 = b.x | 0;
    let y2 = b.y | 0;
    let dx = x2 - x1;
    let dy = y2 - y1;
    let steps_x = dx >= 0 ? dx : -dx;
    let steps_y = dy >= 0 ? dy : -dy;
    let steps = steps_x > steps_y ? steps_x : steps_y;
    let terrain = this.terrain.data;
    let size_x = this.size_x;

    for (let step = 0; step <= steps; step++) {
        let x = x1 + ((dx * step / steps) | 0);
        let y = y1 + ((dy * step / steps) | 0);
        let i = (y*size_x + x)<<1;
        let alt = terrain[i];
        let hl = terrain[i|1];
        if (hl & 0x0200) {
            return false;
        }
    }

    return true;
};

World.prototype.clamp = function(x, y) {
    if (x < 0) {
        x = 0;
    } else if (x > this.size_x) {
        x = this.size_x;
    }
    if (y < 0) {
        y = 0;
    } else if (y > this.size_y) {
        y = this.size_y;
    }
    return {x: x, y: y};
};

World.prototype.clamp_reserved = function(x, y) {
    if (x < 0) {
        x = 0;
    } else if (x > this.size_x-1) {
        x = this.size_x-1;
    }
    if (y < 0) {
        y = 0;
    } else if (y > this.size_y-1) {
        y = this.size_y-1;
    }
    return {x: x, y: y};
};

World.prototype.add_visual_effect = function(effect) {
    this.visual_effects.add(effect);
};

World.prototype.add_sound_effect = function(effect) {
    this.sound_effects.add(effect);
};


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

    for (let entity of this.entities) {
        entity.update();
    }
}

World.prototype.render = function(view) {
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

    for (let entity of  Array.from(this.entities)) {
        entity.render(view);
    }
};

World.prototype.render_hud = function(view) {
    assets.graphics.ui.faith.render_at(view, 16, 16);
    assets.graphics.ui.water.render_at(view, 16, 48);
    {
        view.ctx.save();
        view.ctx.translate(48, 16);
        {
            view.ctx.save();
            view.ctx.scale(this.faith, 1);
            this.graphics.faith_bar.render_at(view);
            view.ctx.restore();
        }
        assets.graphics.ui.progress_overlay.render_at(view);
        view.ctx.restore();
    }
    {
        view.ctx.save();
        view.ctx.translate(48, 48);
        {
            view.ctx.save();
            view.ctx.scale(this.water * 0.01, 1);
            this.graphics.water_bar.render_at(view);
            view.ctx.restore();
        }
        assets.graphics.ui.progress_overlay.render_at(view);
        view.ctx.restore();
    }
};
