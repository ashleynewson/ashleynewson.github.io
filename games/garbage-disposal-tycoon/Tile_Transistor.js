function Tile_Transistor(world, x, y, z, on) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.transistor.off;
    this.conducts = true;
}
extend(Tile_Transistor, Tile);

Tile_Transistor.prototype.update_power = function() {
    this.powered = true;
    this.output_power = 0;

    switch(this.input_power) {
    case 0:
        this.powered = false;
        break;
    case 0x01:
    case 0x02:
    case 0x04:
        this.output_power = this.input_power << 4;
        break;
    case 0x10:
    case 0x20:
    case 0x40:
        this.output_power = this.input_power >> 4;
        break;
    default:
        break;
    }
    this.input_power = 0;
}

Tile_Transistor.prototype.update = function() {
    if (this.powered) {
        if (this.output_power) {
            this.graphic = assets.graphics.tiles.transistor.on;
        } else {
            this.graphic = assets.graphics.tiles.transistor.z;
        }
    } else {
        this.graphic = assets.graphics.tiles.transistor.off;
    }
};

Tile_Transistor.prototype.description = function() {return "Transistor"};
