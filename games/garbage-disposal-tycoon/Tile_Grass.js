function Tile_Grass(world, x, y, z, health) {
    Tile.call(this, world, x, y, z);
    this.health = health;
    this.graphic = assets.graphics.tiles.grass.alive;
}
extend(Tile_Grass, Tile_Dirt);

Tile_Grass.prototype.update = function() {
    if (this.world.time_tick(200)) {
        if (this.health > 0) {
            let above = this.world.get_tile(this.x, this.y, this.z + 1);
            if (above instanceof Tile_Air) {
                // this.health = Math.min(this.health + 0.05, 1);
            } else {
                this.health -= 0.1;
            }
        }
        if (this.health > 0.5) {
            this.graphic = assets.graphics.tiles.grass.alive;
        }
        else if (this.health > 0.0) {
            this.graphic = assets.graphics.tiles.grass.dying;
        }
        else {
            this.graphic = assets.graphics.tiles.grass.dead;
        }
    }
}
