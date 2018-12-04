function Human(world, x, y) {
    Entity.call(this, world, x, y);
    let skin_color = "#b08050"
    this.palette = {
        "head": skin_color,
        "chest": "rgba("+(Math.random()*50)+"%, "+(Math.random()*50)+"%, "+(Math.random()*50)+"%, 100%)",
        "l_arm": skin_color,
        "r_arm": skin_color,
        "l_leg": "#705020",
        "r_leg": "#806020",
    };

    this.graphics = {
        standing: new StencilledGraphic(assets.graphics.human.standing, this.palette),
        walking: new StencilledGraphic(assets.graphics.human.walking, this.palette),
    };
    this.graphic = this.graphics.standing;

    this.faith = 1;
    this.air = 2;
    this.food = 100;
    this.warmth = 1000;
    this.reproduction_time_sec = null;
    this.behave_idle();
}
extend(Human, Entity);

Human.prototype.schedule_reproduction = function() {
    this.reproduction_time_sec = this.world.time_sec + Math.random()*120 + 60;
}

Human.prototype.reproduce = function() {
    if (this.world.entities.size < 2000) {
        if (Math.random() < 0.1) {
            this.world.add_entity(this.x, this.y, Hovel);
        } else {
            this.world.add_entity(this.x, this.y, this.constructor);
        }
    }
    this.reproduction_time_sec = null;
}

Human.prototype.behave_idle = function() {
    this.behaviour = "idle";
    this.timeout = this.world.time_sec + Math.random()*5;
    this.graphic = this.graphics.standing;
};
Human.prototype.behave_panic = function() {
    this.behaviour = "panic";
    this.target = this.world.clamp(this.x + Math.random()*32-16, this.y + Math.random()*32-16);
    this.pace = 32;
    this.graphic = this.graphics.walking;
};
Human.prototype.behave_wonder = function() {
    this.behaviour = "wonder";
    this.target = this.world.clamp(this.x + Math.random()*64-32, this.y + Math.random()*64-32);
    if (!this.world.path_is_clear(this, this.target)) {
        this.behave_idle();
    }
    this.pace = 16;
    this.graphic = this.graphics.walking;
};

Human.prototype.behave = function() {
    let ground = this.world.get_ground(this.x, this.y);
    if (ground.hydrated) {
        if (this.behaviour != "panic") {
            this.behave_panic();
        }
    }
    switch (this.behaviour) {
    case "idle":
        if (this.world.time_sec > this.timeout) {
            this.behave_wonder();
        }
        break;
    case "walk":
    case "wonder":
    case "panic":
        {
            let step = this.world.time_delta_sec * this.pace;
            let dx = this.target.x - this.x;
            let dy = this.target.y - this.y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            if (distance <= step) {
                this.x = this.target.x;
                this.y = this.target.y;
                this.behave_idle();
            } else {
                let vx = dx / distance;
                let vy = dy / distance;
                this.rotation = xy_to_angle(dx, dy);
                this.x = this.x + (vx * step);
                this.y = this.y + (vy * step);
            }
        }
        break;
    }
}

Human.prototype.update = function() {
    this.behave();
    let ground = this.world.get_ground(this.x, this.y);
    if (ground.hydrated) {
        this.air -= this.world.time_delta_sec;
        this.warmth -= this.world.time_delta_sec * 10;
    } else {
        this.air += this.world.time_delta_sec;
        this.warmth -= this.world.time_delta_sec;
        if (this.air > 2) {
            this.air = 2;
        }
    }
    this.nutrition -= this.world.time_delta_sec;
    if (this.air <= 0) {
    // if (this.air <= 0 || this.nutrition <= 0 || this.warmth <= 0) {
        this.world.delete_entity(this);
    }
    let proximal = this.world.get_proximal(this.x, this.y, this.radius);
    for (let entity of proximal) {
        if (proximal instanceof Hovel) {
            this.warmth += this.world.time_delta * 100;
            break;
        }
    }
    if (this.reproduction_time_sec != null) {
        if (this.world.time_sec > this.reproduction_time_sec) {
            this.reproduce();
        }
    } else {
        this.schedule_reproduction();
    }
};
