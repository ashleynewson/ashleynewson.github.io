function Tile_Wall(world, x, y, z) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.concrete;
    this.solid = true;
    this.transmit_light = false;
}
extend(Tile_Wall, Tile);

Tile_Wall.prototype.description = function() {return "Wall"};
