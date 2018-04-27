function Tile_Floor(world, x, y, z, graphic) {
    Tile.call(this, world, x, y, z);
    this.graphic = graphic;
    this.solid = true;
    this.transmit_light = false;
}
extend(Tile_Floor, Tile);

Tile_Floor.prototype.description = function() {return "Ground"};
