function Tile_BrokenGlass(world, x, y, z) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.broken_glass;
    this.solid = false;
    this.transmit_light = true;
}
extend(Tile_BrokenGlass, Tile);

Tile_BrokenGlass.prototype.description = function() {return "Broken Glass"};
