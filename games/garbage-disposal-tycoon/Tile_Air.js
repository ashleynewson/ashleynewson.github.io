function Tile_Air(world, x, y, z) {
    Tile.call(this, world, x, y, z);
    // this.graphic = assets.graphics.tiles.air;
    this.visible = false;
    this.solid = false;
    this.fluid = true;
}
extend(Tile_Air, Tile);

Tile_Air.prototype.description = function() {return "Air"};
