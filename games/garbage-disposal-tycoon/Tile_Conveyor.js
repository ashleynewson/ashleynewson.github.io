function Tile_Conveyor(world, x, y, z, rotation) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.conveyor.normal;
    this.rotation = rotation;
}
extend(Tile_Conveyor, Tile);

Tile_Conveyor.prototype.update = function() {
    if (this.world.time_tick(200)) {
        let above = this.world.get_tile(this.x, this.y, this.z + 1);
        if (above.physical) {
            let dx = 0;
            let dy = 0;
            let dz = 0;
            switch (this.rotation) {
            case 0:
                dx = 1;
                break;
            case 1:
                dy = 1;
                break;
            case 2:
                dx = -1;
                break;
            case 3:
                dy = -1;
                break;
            }
            let target = this.world.get_tile(above.x + dx, above.y + dy, above.z + dz);
            if (target instanceof Tile_Conveyor) {
                dz = 1; // Try to move up hill.
            }
            above.apply_force(1, dx, dy, dz);
        }
    }
}

Tile_Conveyor.prototype.description = function() {return "Conveyor belt"};
