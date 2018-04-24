function Tile_CeilingLight(world, x, y, z, rotation, max_dist, intensity, pir_range, timeout) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.light.ceiling.off;
    this.rotation = rotation;
    this.solid = false;
    this.transmit_light = true;
    this.pir_range = pir_range;
    this.max_dist = max_dist;
    this.intensity = intensity;
    this.timeout = timeout;
    this.expires = 0;
}
extend(Tile_CeilingLight, Tile);

Tile_CeilingLight.prototype.set_on = function(on) {
    this.on = on;
    if (on) {
        this.expires = this.world.time_sec + this.timeout;
    }
    this.graphic = on ? assets.graphics.tiles.light.ceiling.on
                      : assets.graphics.tiles.light.ceiling.off;
}

Tile_CeilingLight.prototype.update = function() {
    if (this.on) {
        if (this.timeout && this.world.time_sec >= this.expires) {
            this.set_on(false);
        }
    }
    for (let entity of this.world.entities) {
        let max_distance = (this.pir_range + entity.radius)**2;
        if ((entity.x - (this.x+0.5))**2 + (entity.y - (this.y+0.5))**2 < max_distance) {
            if (entity instanceof Entity_Friendly) {
                this.set_on(true);
            }
        }
    }
}

Tile_CeilingLight.prototype.gen_lighting = function(lights) {
    if (this.on) {
        lights.push( new Light(
            (this.x+0.5) * assets.tile_w, (this.y+0.5) * assets.tile_h, 0, Math.PI * 2,
            this.max_dist, this.intensity,
            World.LIGHT_CHANNELS.FRIEND
        ) );
    }
};

Tile_CeilingLight.prototype.description = function() {return "Ceiling Light"};
