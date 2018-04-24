function Tile_OutOfBounds(world, x, y, z) {
    Tile.call(this, world, x, y, z);
    this.visible = false;
    this.solid = true;
}
extend(Tile_OutOfBounds, Tile);

Tile_OutOfBounds.prototype.description = function() {return "Out of bounds"};
