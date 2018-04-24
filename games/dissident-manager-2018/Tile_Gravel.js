function Tile_Gravel(world, x, y, z) {
    Tile_Floor.call(this, world, x, y, z, assets.graphics.tiles.floor.gravel);
}
extend(Tile_Gravel, Tile_Floor);

Tile_Gravel.prototype.description = function() {return "Gravel"};
