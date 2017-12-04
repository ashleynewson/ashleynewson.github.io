function Tile_Water(world, x, y, z) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.water
    this.solid = false;
    this.fluid = true;
    this.physical = true;
    this.mass = 0.5;
}
extend(Tile_Water, Tile);

Tile_Water.prototype.description = function() {return "Water"};
