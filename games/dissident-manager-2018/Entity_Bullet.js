function Entity_Bullet(world, x, y, z, rotation, ttl, speed, origin) {
    Entity.call(this, world, x, y, z, rotation);
    this.limb = new Limb({
        graphic: assets.graphics.entities.tracer,
    });

    this.ttl = ttl;
    this.expires = this.world.time + ttl;
    this.speed = speed;
    this.origin = origin;
}
extend(Entity_Bullet, Entity);

Entity_Bullet.prototype.update = function() {
    if (this.world.time >= this.expires) {
        this.delete();
        return;
    }
    let dx = this.speed * Math.cos(this.rotation);
    let dy = this.speed * Math.sin(this.rotation);
    if (this.move_blocking(dx, dy, false, (tile)=>{return tile.solid && tile.damage(0, this)})) {
        this.delete();
    }
    this.check_hit()
}

Entity_Bullet.prototype.check_hit = function() {
    let tile = this.world.get_tile(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
    if (tile.solid) {
        if (tile.damage(1, this)) {
            this.delete();
        }
    }
    let entities = this.get_collisions();
    for (let entity of entities) {
        if (entity === this.origin) {
            continue;
        }
        if (entity.damage(1, this)) {
            this.delete();
        }
    }
}

Entity_Bullet.prototype.gen_lighting = function(lights) {
    lights.push( new Light(
        this.x * assets.tile_w, this.y * assets.tile_h, 0, Math.PI * 2,
        25, 25,
        World.LIGHT_CHANNELS.FOE
    ) );
};

Entity_Bullet.prototype.description = function() {return "High Velocity Metal"};
