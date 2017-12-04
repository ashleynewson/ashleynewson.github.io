function Tile_Dirt(world, x, y, z) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.dirt;
}
extend(Tile_Dirt, Tile);

Tile_Dirt.prototype.description = function() {return "Dirt"};
