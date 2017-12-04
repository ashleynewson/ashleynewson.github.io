function Tile_Magnet(world, x, y, z, rotation) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.magnet.off;
}
extend(Tile_Magnet, Tile);

Tile_Magnet.prototype.attempt_pull = function(ox, oy, oz) {
    let target = this.world.get_tile(this.x + ox, this.y + oy, this.z + oz);
    target.apply_magnetic_force(4/Math.abs(ox+oy+oz), -Math.sign(ox), -Math.sign(oy), -Math.sign(oz));
}

Tile_Magnet.prototype.update = function() {
    if (this.powered) {
        this.graphic = assets.graphics.tiles.magnet.on;
        for (let oz = -3; oz <= 3; oz++) {
            for (let oy = -3; oy <= 3; oy++) {
                for (let ox = -3; ox <= 3; ox++) {
                    if (!(ox || oy || oz)) {
                        // Do not pull self.
                        continue;
                    }
                    if ((ox && oy) || (oy && oz) || (oz && ox)) {
                        // Do not pull diagonally.
                        continue;
                    }
                    this.attempt_pull(ox, oy, oz);
                }
            }
        }
    } else {
        this.graphic = assets.graphics.tiles.magnet.off;
    }
}

Tile_Magnet.prototype.description = function() {return "Smart magnet"};
