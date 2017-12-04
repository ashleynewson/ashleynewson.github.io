function Tile_Dispenser_Power(world, x, y, z, period, constructor) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.dispenser.off;
    this.period = period;
    this.creates = {
        constructor: constructor,
        args: Array.prototype.slice.call(arguments, 6),
    };
}
extend(Tile_Dispenser_Power, Tile);

Tile_Dispenser_Power.prototype.ondispense = function(tile) {
};

Tile_Dispenser_Power.prototype.update = function() {
    if (this.powered) {
        this.graphic = assets.graphics.tiles.dispenser.on;
        if (this.world.time_tick(this.period)) {
            let below = this.world.get_tile(this.x, this.y, this.z - 1);
            if (below instanceof Tile_Air) {
                let tile = this.world.emplace_tile(this.x, this.y, this.z - 1, this.creates.constructor, ...this.creates.args);
                this.ondispense(tile);
            }
        }
    } else {
        this.graphic = assets.graphics.tiles.dispenser.off;
    }
};

Tile_Dispenser_Power.prototype.description = function() {return "Smart Dispenser"};
