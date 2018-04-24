function Tile_Fence(world, x, y, z, rotation) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.fence;
    this.solid = true;
    this.rotation = rotation;
    this.transmit_light = true;
}
extend(Tile_Fence, Tile);

Tile_Fence.prototype.damage = function(damage, actor) {
    return false;
}

Tile_Fence.prototype.description = function() {return "Wire Fence"};
