tile_descriptions = {};

function Tile(world, x, y, z) {
    this.world = world;
    this.visible = true;
    this.graphic = assets.graphics.tiles.debug;
    this.rotation = 0;
    this.solid = true;
    this.fluid = false;
    this.mass = 0;
    this.physics = false;
    this.conducts = false;
    this.magnetic = false;
    this.winning_force = 0;
    this.powered = false;
    this.output_power = 0x0; // Bitmask 0x01 0x02 0x04 0x10 0x20 0x40: +x +y +z -x -y -z
    this.input_power = 0x0;  // Bitmask "
    this.permanent = false;
    this.x = x;
    this.y = y;
    this.z = z;
    this.reset();
}

Tile.prototype.reset = function() {
    this.physics_done = false;
    this.dx = 0;
    this.dy = 0;
    this.dz = -1; // Gravity
    this.winning_force = 0;
};

Tile.prototype.merge_in_general = function(other) {
    this.apply_force(other.winning_force, other.dx, other.dy, other.dz);
}

Tile.prototype.interact = function() {
};

Tile.prototype.attempt_merge = function(other, destination) {
    return null;
}

Tile.prototype.update_power = function() {
    if (this.input_power) {
        this.powered = true;
        if (this.conducts) {
            this.output_power = this.input_power ^ 0x77;
        } else {
            this.output_power = 0;
        }
    } else {
        this.powered = false;
        this.output_power = 0;
    }
    this.input_power = 0;
}

Tile.prototype.receive_power = function(dir) {
    this.input_power |= dir;
}

Tile.prototype.share_power = function() {
    if (this.output_power) {
        if (this.output_power & 0x01) {
            this.world.get_tile(this.x + 1, this.y, this.z).receive_power(0x10);
        }
        if (this.output_power & 0x02) {
            this.world.get_tile(this.x, this.y + 1, this.z).receive_power(0x20);
        }
        if (this.output_power & 0x04) {
            this.world.get_tile(this.x, this.y, this.z + 1).receive_power(0x40);
        }
        if (this.output_power & 0x10) {
            this.world.get_tile(this.x - 1, this.y, this.z).receive_power(0x01);
        }
        if (this.output_power & 0x20) {
            this.world.get_tile(this.x, this.y - 1, this.z).receive_power(0x02);
        }
        if (this.output_power & 0x40) {
            this.world.get_tile(this.x, this.y, this.z - 1).receive_power(0x04);
        }
    }
}

Tile.prototype.apply_magnetic_force = function(force, dx, dy, dz) {
    if (this.magnetic) {
        this.apply_force(force, dx, dy, dz);
    }
}

Tile.prototype.apply_force = function(force, dx, dy, dz) {
    if (force > this.winning_force) {
        this.dx = dx;
        this.dy = dy;
        this.dz = dz;
        this.winning_force = force;
    }
}

Tile.prototype.physics_step = function() {
    if (this.physics_done || !this.physical) {
        return;
    }

    if (!(this.dx || this.dy || this.dz)) {
        this.physics_done = true;
        return;
    }

    let target_x = this.x + this.dx;
    let target_y = this.y + this.dy;
    let target_z = this.z + this.dz;

    this.attempt_move(target_x, target_y, target_z, false);
    // let occupier = this.world.get_tile(target_x, target_y, target_z);
    // let merged = 
    //     occupier.physics.done
    //        ? null
    //        : occupier.attempt_merge(this, occupier) || this.attempt_merge(occupier, occupier);
    // if (merged) {
    //     merged.x = occupier.x;
    //     merged.y = occupier.y;
    //     merged.z = occupier.z;
    //     this.world.emplace_tile(this.x, this.y, this.z, Tile_Air);
    //     this.world.set_tile(occupier.x, occupier.y, occupier.z, merged);
    // } else {
    //     if (occupier.fluid && occupier.mass < this.mass) {
    //         this.world.swap_tiles(this, occupier);
    //         // this.physics_done = true;
    //     }
    // }
};

Tile.prototype.attempt_move = function(target_x, target_y, target_z, from_nothing) {
    let occupier = this.world.get_tile(target_x, target_y, target_z);
    let merged = 
        occupier.physics_done
           ? null
           : occupier.attempt_merge(this, occupier) || this.attempt_merge(occupier, occupier);
    if (merged) {
        merged.x = occupier.x;
        merged.y = occupier.y;
        merged.z = occupier.z;
        this.world.emplace_tile(this.x, this.y, this.z, Tile_Air);
        this.world.set_tile(occupier.x, occupier.y, occupier.z, merged);
        occupier.physics_done = true;
        return true;
    } else {
        if (occupier.fluid && occupier.mass < this.mass) {
            if (from_nothing) {
                this.world.set_tile(target_x, target_y, target_z, this);
            } else {
                this.world.swap_tiles(this, occupier);
                occupier.physics_done = true;
            }
            this.physics_done = true;
            return true;
        }
    }
    return false;
}

Tile.prototype.opaque = function() {
    return this.visible && !this.graphic.transparent;
};

Tile.prototype.update = function() {
};

// Should always be chained
Tile.prototype.render = function(view) {
    let disp_x = this.x * 16 - this.y * 16;
    let disp_y = this.x *  8 + this.y *  8 - this.z * 4;
    if (this === outer_cursor.tile) {
        if (outer_cursor.render) {
            outer_cursor.render(view, disp_x, disp_y);
        // } else {
        //     assets.graphics.tiles.outer_cursor.render_at(view, disp_x, disp_y, 0);
        }
    }
    if (this.visible) {
        if (   this.world.get_tile(this.x, this.y, this.z + 1).opaque()
            && this.world.get_tile(this.x + 1, this.y, this.z).opaque()
            && this.world.get_tile(this.x, this.y + 1, this.z).opaque()
           ) {
            // Render optimisation.
            return;
        }
        this.graphic.render_at(view, disp_x, disp_y, this.rotation);
        let above = this.world.get_tile(this.x, this.y, this.z + 1);
        if (!above.visible) {
            assets.graphics.tiles.grid_lines.render_at(view, disp_x, disp_y, 0);
        }
    }
    if (this === inner_cursor.tile) {
        if (inner_cursor.render) {
            inner_cursor.render(view, disp_x, disp_y);
        // } else {
        //     assets.graphics.tiles.inner_cursor.render_at(view, disp_x, disp_y, 0);
        }
    }
};

Tile.prototype.description = function() {return "Something... but what?"};
