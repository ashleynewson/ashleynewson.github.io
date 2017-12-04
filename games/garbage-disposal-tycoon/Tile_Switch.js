function Tile_Switch(world, x, y, z, on) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles['switch'].off; // Well, f***...
    this.on = on;
}
extend(Tile_Switch, Tile);

Tile_Switch.prototype.interact = function() {
    this.on = !this.on;
};

Tile_Switch.prototype.update_power = function() {
    if (this.on) {
        this.powered = true;
        this.output_power = 0x77;
    } else {
        this.powered = false;
        this.output_power = 0;
    }
    this.input_power = 0;
};

Tile_Switch.prototype.update = function() {
    if (this.on) {
        this.graphic = assets.graphics.tiles['switch'].on;
        // this.world.get_tile(this.x + 1, this.y, this.z).powered = true;
        // this.world.get_tile(this.x - 1, this.y, this.z).powered = true;
        // this.world.get_tile(this.x, this.y + 1, this.z).powered = true;
        // this.world.get_tile(this.x, this.y - 1, this.z).powered = true;
        // this.world.get_tile(this.x, this.y, this.z + 1).powered = true;
        // this.world.get_tile(this.x, this.y, this.z - 1).powered = true;
    } else {
        this.graphic = assets.graphics.tiles['switch'].off;
    }
};

Tile_Switch.prototype.description = function() {return "Switch"};
