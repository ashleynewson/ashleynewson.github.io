function Entity_Friendly(world, x, y, z, rotation) {
    Entity.call(this, world, x, y, z, rotation);
    this.limb = new Limb({
        graphic: assets.graphics.entities.friendly.torso,
        limbs: {
            head: new Limb({
                graphic: assets.graphics.entities.friendly.head,
            }),
            left_hand: new Limb({
                graphic: assets.graphics.entities.friendly.hand.left,
            }),
            right_hand: new Limb({
                graphic: assets.graphics.entities.friendly.hand.right,
            }),
            left_foot: new Limb({
                graphic: assets.graphics.entities.friendly.foot.left,
            }),
            right_foot: new Limb({
                graphic: assets.graphics.entities.friendly.foot.right,
            }),
        },
    });

    this.walking = false;
    this.dx = 0;
    this.dy = 0;
    this.radius = 0.3;
    this.max_health = 5.0;
    this.health = this.max_health;

    this.wander = true;
    this.wander_action = null;
    this.wander_action_time = -1;
    this.wander_frantic = false;
}
extend(Entity_Friendly, Entity);

Entity_Friendly.prototype.update = function() {
    const time = this.world.time;

    if (player.possessee === this) {
        // Slaved to player controls
        this.wander = false;
        // Calm the friendly.
        this.wander_frantic = false;

        this.dx = 0;
        this.dy = 0;
        let player_speed = keys_down[key_bindings.sprint] ? 8 : 4;
        if (keys_down[key_bindings.move_left]) {
            this.dx -= player_speed;
        }
        if (keys_down[key_bindings.move_right]) {
            this.dx += player_speed;
        }
        if (keys_down[key_bindings.move_up]) {
            this.dy -= player_speed;
        }
        if (keys_down[key_bindings.move_down]) {
            this.dy += player_speed;
        }
        let d = Math.sqrt(this.dx**2 + this.dy**2);
        this.walking = true;
        if (d === 0) {
            this.walking = false;
            this.dx = 0;
            this.dy = 0;
            this.speed = 0;
        } else if (d > player_speed) {
            this.dx *= player_speed / d;
            this.dy *= player_speed / d;
            this.speed = player_speed;
        } else {
            this.speed = d;
        }
        let look_x = floating_cursor.x - this.x;
        let look_y = floating_cursor.y - this.y;
        if (look_x != 0 || look_y != 0) {
            this.rotation = Math.atan(look_y/look_x) + (look_x < 0 ? Math.PI : 0);
        }
    } else {
        this.wander = true;
    }

    if (this.health <= 0.0) {
        // Die :(
        this.delete();
        this.world.visual_effects.add(
            new VisualEffect(
                600,
                assets.graphics.entities.blood.pool,
                this.x + (Math.random()-0.5)*0.5,
                this.y + (Math.random()-0.5)*0.5,
                Math.PI * 2 * Math.random(),
                function(t){return t < 10 ? t * 0.1 : 1},
                function(t){return 59.5 - t * 0.1},
            )
        );
        this.world.visual_effects.add(
            new VisualEffect(
                300,
                assets.graphics.entities.corpse.friendly,
                this.x,
                this.y,
                this.rotation,
                1,
                function(t){return 29.5 - t * 0.1},
            )
        );
        this.world.sound_effects.add(
            new SoundEffect(
                assets.sounds.death,
                this.x,
                this.y,
                1,
                32,
            )
        );
    }
    else if (this.health < this.max_health) {
        if (this.world.time_tick(500)) {
            this.world.visual_effects.add(
                new VisualEffect(
                    20,
                    assets.graphics.entities.blood.drip,
                    this.x + (Math.random()-0.5)*0.5,
                    this.y + (Math.random()-0.5)*0.5,
                    Math.PI * 2 * Math.random(),
                    0.25 + 0.5 * Math.random(),
                    function(t){return 2.0 - t * 0.1},
                )
            );
        }
        this.health += this.world.time_delta_sec * 0.5;
    }
    if (this.health > this.max_health) {
        this.health = this.max_health;
    }

    if (this.wander) {
        this.wander_action_time -= this.world.time_delta_sec;
        if( this.wander_action_time < 0 ) {
            if( this.wander_action === null || this.wander_frantic ) {
                // Was waiting, now acting.
                if( Math.random() < ( this.wander_frantic ? 0.5 : 0.7 ) ) {
                    const rot_speed = this.wander_frantic ? 20 : 10;
                    this.wander_action = {
                        // Turning.
                        rotation_speed: ( Math.random() < 0.5 ) ? -rot_speed : rot_speed,
                        forward_speed: 0
                    };
                    this.wander_action_time = Math.random() * 0.15;
                } else {
                    this.wander_action = {
                        //rotation_speed: ( Math.random() < 0.5 ) ? -0.5 : 0.5,
                        rotation_speed: 0,
                        forward_speed: this.wander_frantic ? 6 : 2
                    };
                    this.wander_action_time = this.wander_frantic ? 0.2 : 1;
                }
            } else {
                // Was acting, now waiting.
                this.wander_action = null;
                this.wander_action_time = 0.5;
            }
        }

        if( this.wander_action !== null ) {
            const action = this.wander_action;
            this.walking = true;
            this.rotation += action.rotation_speed * this.world.time_delta_sec;
            this.speed = action.forward_speed;

            if( ( action.forward_speed > 0 ) && ! this.check_clear_path( 1.5 ) ) {
                // Road ahead not clear.
                // Cancel action.
                this.wander_action = null;
                this.wander_action_time = -1;
            }
        } else {
            this.walking = false;
            this.speed = 0;
        }

        if( this.speed !== 0 ) {
            this.dx = this.speed * Math.cos(this.rotation);
            this.dy = this.speed * Math.sin(this.rotation);
        }
    }

    if( this.speed !== 0 ) {
        this.move_blocking(this.dx, this.dy, true);
    }

    this.limb.limbs.head.rotation = Math.sin(time / 1000);
    if (this.walking) {
        this.limb.limbs.left_foot.x = Math.sin(time * this.speed / 250) * 6;
        this.limb.limbs.right_foot.x = -this.limb.limbs.left_foot.x;
    } else {
        this.limb.limbs.left_foot.x = 0;
        this.limb.limbs.right_foot.x = 0;
    }
}

Entity_Friendly.prototype.select = function() {
    player.possessee = this;
}

Entity_Friendly.prototype.damage = function(damage, actor) {
    this.health -= damage;

    let rotation = actor.rotation + Math.random()-0.5;
    let dx = Math.cos(rotation);
    let dy = Math.sin(rotation);
    this.world.visual_effects.add(
        new VisualEffect(
            20,
            assets.graphics.entities.blood.splat,
            this.x + dx,
            this.y + dy,
            rotation,
            0.5 + Math.random(),
            function(t){return 2.0 - t * 0.1},
        )
    );

    this.wander_frantic = true;
    return true;
}

Entity_Friendly.prototype.description = function() {return "Friendly"};
