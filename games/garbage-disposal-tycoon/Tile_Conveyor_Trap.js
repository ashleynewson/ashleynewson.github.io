function Tile_Conveyor_Trap(world, x, y, z, rotation) {
    Tile_Conveyor.call(this, world, x, y, z, rotation);
    this.graphic = assets.graphics.tiles.conveyor.closed;
    this.rotation = rotation;
}
extend(Tile_Conveyor_Trap, Tile_Conveyor);

Tile_Conveyor_Trap.prototype.update = function() {
    if (this.powered) {
        this.graphic = assets.graphics.tiles.conveyor.open;
        let above = this.world.get_tile(this.x, this.y, this.z + 1);
        if (above.physical) {
            above.apply_force(0.1, 0, 0, -2); // Skip over the trapdoor!
        }
    } else {
        this.graphic = assets.graphics.tiles.conveyor.closed;
        Tile_Conveyor.prototype.update.call(this);
    }
}

Tile_Conveyor_Trap.prototype.description = function() {return "Smart trap door (conveyor belt)"};
