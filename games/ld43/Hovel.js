function Hovel(world, x, y) {
    Entity.call(this, world, x, y);
    this.health = 10;
    this.graphic = assets.graphics.structures.hovel;
}
extend(Hovel, Entity);

Hovel.prototype.update = function() {
    if (this.world.get_ground(this.x, this.y).hydrated) {
        this.health -= this.world.time_delta_sec;
    } else {
        this.health += this.world.time_delta_sec * 0.1;
    }
    if (this.health <= 0) {
        this.world.delete_entity(this);
    } else if (this.health > 10) {
        this.health = 10;
    }
};
