function Tile_Hopper(world, x, y, z) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.hopper.generic;
}
extend(Tile_Hopper, Tile);

Tile_Hopper.prototype.onconsume = function(tile) {
};

Tile_Hopper.prototype.attempt_merge = function(other, destination) {
    if (this === destination) {
        this.onconsume(other);
        return this;
    } else {
        return null;
    }
};

Tile_Hopper.prototype.description = function() {return "Hopper"};
