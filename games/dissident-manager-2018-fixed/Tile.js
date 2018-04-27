tile_descriptions = {};

function Tile(world, x, y, z) {
    this.world = world;
    this.visible = true;
    this.graphic = assets.graphics.tiles.debug;
    this.rotation = 0;
    this.solid = true;
    this.transmit_light = false;
    this.x = x;
    this.y = y;
    this.z = z;
    this.reset();
}

Tile.prototype.reset = function() {
};

Tile.prototype.interact = function() {
};

Tile.prototype.opaque = function() {
    return this.visible && !this.graphic.transparent;
};

Tile.prototype.update = function() {
};

Tile.prototype.damage = function(damage, actor) {
    return true; // Damage accepted
}

Tile.prototype.gen_lighting = function(lights) {
    // No lighting by default.
};

// Should always be chained
Tile.prototype.render = function(view) {
    let disp_x = this.x * assets.tile_w;
    let disp_y = this.y * assets.tile_h;
    if (this === outer_cursor.tile) {
        if (outer_cursor.render) {
            outer_cursor.render(view, disp_x, disp_y);
        }
    }
    if (this.visible) {
        if (this.world.get_tile(this.x, this.y, this.z + 1).opaque()) {
            // Render optimisation.
            return;
        }
        this.graphic.render_at(view, disp_x, disp_y, this.rotation);
        if (view.show_grid) {
            let above = this.world.get_tile(this.x, this.y, this.z + 1);
            if (!above.visible) {
                assets.graphics.tiles.grid_lines.render_at(view, disp_x, disp_y, 0);
            }
        }
    }
    // if (this === inner_cursor.tile) {
    //     if (inner_cursor.render) {
    //         inner_cursor.render(view, disp_x, disp_y);
    //     }
    // }
};

Tile.prototype.description = function() {return "Something... but what?"};
