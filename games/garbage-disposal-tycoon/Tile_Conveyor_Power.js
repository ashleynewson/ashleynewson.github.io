function Tile_Conveyor_Power(world, x, y, z, rotation) {
    Tile_Conveyor.call(this, world, x, y, z, rotation);
    this.graphic = assets.graphics.tiles.conveyor.off;
    this.rotation = rotation;
}
extend(Tile_Conveyor_Power, Tile_Conveyor);

Tile_Conveyor_Power.prototype.update = function() {
    if (this.powered) {
        this.graphic = assets.graphics.tiles.conveyor.on;
        Tile_Conveyor.prototype.update.call(this);
    } else {
        this.graphic = assets.graphics.tiles.conveyor.off;
    }
}

Tile_Conveyor_Power.prototype.description = function() {return "Smart conveyor belt"};
