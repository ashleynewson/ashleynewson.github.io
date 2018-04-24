function Tile_Air(world, x, y, z) {
    Tile.call(this, world, x, y, z);
    this.visible = false;
    this.solid = false;
    this.transmit_light = true;
}
extend(Tile_Air, Tile);

Tile_Air.prototype.description = function() {return "Air"};
