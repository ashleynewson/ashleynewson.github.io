function Plant(world, x, y, health, graphics_group) {
    Entity.call(this, world, x, y);
    this.health = health;
    this.radius = 8;
    this.reproduction_time_sec = null;
    this.graphics_group = graphics_group;
    this.graphic = this.graphics_group.heavy;
}
extend(Plant, Entity);

Plant.prototype.schedule_reproduction = function() {
    this.reproduction_time_sec = this.world.time_sec + Math.random()*10 + 10;
}

Plant.prototype.reproduce = function() {
    let nx = this.x + Math.random()*64-32;
    let ny = this.y + Math.random()*64-32;
    if (this.world.is_clear(nx, ny, 8)) {
        // Disabled for performance
        // this.world.add_entity(nx, ny, this.constructor, 10);
        this.reproduction_time_sec = null;
    }
}

Plant.prototype.consume = function() {
    if (this.health >= 50) {
        this.health -= 25;
        return true;
    } else {
        return false;
    }
}

Plant.prototype.update = function() {
    let ground = this.world.get_ground(this.x, this.y);
    if (ground.flooded) {
        this.health -= this.world.time_delta_sec;
    } else if (ground.hydrated) {
        this.health += this.world.time_delta_sec;
    } else {
        this.health -= this.world.time_delta_sec * 0.1;
    }
    if (this.health <= 0) {
        this.world.add_visual_effect(new VisualEffect(30, this.graphics_group.dead, this.x, this.y, ground.altitude, undefined, undefined, undefined));
        this.world.delete_entity(this);
    }
    else if (this.health < 50) {
        this.graphic = this.graphics_group.light;
    } else {
        this.graphic = this.graphics_group.heavy;
    }
    if (this.health > 100) {
        this.health = 100;
    }
    if (this.reproduction_time_sec != null) {
        if (this.health >= 80) {
            if (this.world.time_sec > this.reproduction_time_sec) {
                this.reproduce();
            }
        } else {
            this.reproduction_time_sec = null;
        }
    } else {
        if (this.health >= 90) {
            this.schedule_reproduction();
        }
    }
}
