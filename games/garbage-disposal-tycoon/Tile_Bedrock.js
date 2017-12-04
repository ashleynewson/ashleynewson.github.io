function Tile_Bedrock(world, x, y, z) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.bedrock;
    this.permanent = true;
}
extend(Tile_Bedrock, Tile);

Tile_Bedrock.prototype.description = function() {return "Bedrock"};
