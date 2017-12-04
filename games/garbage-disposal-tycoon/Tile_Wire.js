function Tile_Wire(world, x, y, z, on) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.wire.off;
    this.conducts = true;
}
extend(Tile_Wire, Tile);

Tile_Wire.prototype.update = function() {
    if (this.powered) {
        this.graphic = assets.graphics.tiles.wire.on;
    } else {
        this.graphic = assets.graphics.tiles.wire.off;
    }
};

Tile_Wire.prototype.description = function() {return "Wire"};
