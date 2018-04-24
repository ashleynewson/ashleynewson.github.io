function Tile_Bush(world, x, y, z) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.bush;
    this.solid = false;
    this.transmit_light = false;
}
extend(Tile_Bush, Tile);

Tile_Bush.prototype.damage = function(damage, actor) {
    return false;
}

Tile_Bush.prototype.description = function() {return "Bush"};
