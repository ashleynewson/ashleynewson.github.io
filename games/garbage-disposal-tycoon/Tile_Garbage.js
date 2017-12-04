function Tile_Garbage(world, x, y, z, contents) {
    Tile.call(this, world, x, y, z);
    this.physical = true;
    this.contents = {
        garbage: contents.garbage | 0,
        glass  : contents.glass   | 0,
        metal  : contents.metal   | 0,
        plastic: contents.plastic | 0,
        paper  : contents.paper   | 0,
    };
    this.mass = 0;
    for (let i in this.contents) {
        if (this.contents.hasOwnProperty(i)) {
            this.mass += this.contents[i];
        }
    }
    if (this.mass === 0) {
        panic("No contents in garbage");
    }
    // if (this.mass < 3) {
    //     this.graphic = assets.graphics.tiles.mixed_garbage['1'];
    // }
    // else if (this.mass < 6) {
    //     this.graphic = assets.graphics.tiles.mixed_garbage['2'];
    // }
    // else if (this.mass < 10) {
    //     this.graphic = assets.graphics.tiles.mixed_garbage['3'];
    // }
    // else {
    //     this.graphic = assets.graphics.tiles.mixed_garbage['4'];
    // }
    this.check_contents();
}
extend(Tile_Garbage, Tile);

Tile_Garbage.prototype.attempt_merge = function(other, dest) {
    if (other instanceof Tile_Garbage) {
        if (this.mass + other.mass <= 10) {
            // let contents = {
            //     garbage: this.contents.garbage + other.contents.garbage,
            // }
            let contents = vector_add_objects(this.contents, other.contents);
            let merged = new Tile_Garbage(this.world, dest.x, dest.y, dest.z, contents);
            merged.merge_in_general(this);
            merged.merge_in_general(other);
            return merged;
        }
    }
    return null;
}

Tile_Garbage.prototype.attempt_split = function(moving, dx, dy, dz) {
    let candidate = new Tile_Garbage(this.world, this.x + dx, this.y + dy, this.z + dz, moving);
    if (candidate.attempt_move(candidate.x, candidate.y, candidate.z, true)) {
        // Split worked! Commit changes.
        this.contents = vector_subtract_objects(this.contents, moving);
        // this.contents.garbage -= moving.garbage;
        // this.contents.metal   -= moving.metal;
        // this.contents.glass   -= moving.glass;
        // this.contents.paper   -= moving.paper;
        // this.contents.plastic -= moving.plastic;
    }
};

Tile_Garbage.prototype.apply_magnetic_force = function(force, dx, dy, dz) {
    if (this.contents.metal) {
        this.magnetic = true;
        if (this.contents.garbage || this.contents.glass || this.contents.paper || this.contents.plastic) {
            this.attempt_split({metal: this.contents.metal}, dx, dy, dz);
        } else {
            Tile.prototype.apply_magnetic_force.call(this, force, dx, dy, dz);
        }
    }
}

Tile_Garbage.prototype.check_contents = function() {
    this.garbage_mask = (this.contents.garbage && (1 << 0))
                      | (this.contents.glass   && (1 << 1))
                      | (this.contents.metal   && (1 << 2))
                      | (this.contents.paper   && (1 << 3))
                      | (this.contents.plastic && (1 << 4));

    let graphic_set;
    switch (this.garbage_mask) {
    case 0:
        panic("Garbage content ran out at some point!");
        break;
    case 1 << 0:
        graphic_set = assets.graphics.tiles.garbage;
        break;
    case 1 << 1:
        graphic_set = assets.graphics.tiles.glass;
        break;
    case 1 << 2:
        graphic_set = assets.graphics.tiles.metal;
        break;
    case 1 << 3:
        graphic_set = assets.graphics.tiles.paper;
        break;
    case 1 << 4:
        graphic_set = assets.graphics.tiles.plastic;
        break;
    default:
        graphic_set = assets.graphics.tiles.mixed_garbage;
        break;
    }
    
    if (this.mass < 3) {
        this.graphic = graphic_set['1'];
    }
    else if (this.mass < 6) {
        this.graphic = graphic_set['2'];
    }
    else if (this.mass < 10) {
        this.graphic = graphic_set['3'];
    }
    else {
        this.graphic = graphic_set['4'];
    }
}

Tile_Garbage.prototype.update = function() {
    this.check_contents();
};


Tile_Garbage.prototype.description = function() {
    switch (this.garbage_mask) {
    case 1 << 0:
        return "Pure garbage";
    case 1 << 1:
        return "Glass";
    case 1 << 2:
        return "Metal";
    case 1 << 3:
        return "Paper";
    case 1 << 4:
        return "Plastic";
    default:
        return "Mixed garbage";
    }
};
