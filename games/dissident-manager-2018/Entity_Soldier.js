function Entity_Soldier(world, x, y, z, rotation) {
    Entity.call(this, world, x, y, z, rotation);
    this.limb = new Limb({
        graphic: assets.graphics.entities.enemy.torso,
        limbs: {
            head: new Limb({
                graphic: assets.graphics.entities.enemy.head,
            }),
            gun: new Limb({
                graphic: assets.graphics.entities.gun,
                limbs: {
                    left_hand: new Limb({
                        graphic: assets.graphics.entities.enemy.hand.left,
                    }),
                    right_hand: new Limb({
                        graphic: assets.graphics.entities.enemy.hand.right,
                    }),
                    muzzle: new Limb({
                        graphic: assets.graphics.entities.muzzle_flash,
                        scale: 0
                    }),
                },
                rotation: 0
            }),
            left_foot: new Limb({
                graphic: assets.graphics.entities.enemy.foot.left,
            }),
            right_foot: new Limb({
                graphic: assets.graphics.entities.enemy.foot.right,
            }),
        },
    });

    this.rotation = Math.PI * -0.4;

    this.walking = false;
    this.firing = false;
    this.aiming = false;
    this.speed = 0;
    this.strafe_angle = 0;

    this.mind = {
        action: null,
        action_time: -1,
        aiming_at: null,
        last_visual_time: 0,
        // Target moving anti-clockwise.
        target_direction: true,
        dash: false
    };

    this.avg_x = this.x;
    this.avg_y = this.y;
    this.highlight_avg = false;

    this.is_lit = true;
    this.light_beam_angle = Math.PI * 0.25;
    this.light_flavour = World.LIGHT_CHANNELS.FOE;
}
extend(Entity_Soldier, Entity);

Entity_Soldier.prototype.think = function() {
    const CLEAR_WALK_DIST = 5;

    const mind = this.mind;
    const last_seen_ago = this.world.time - mind.last_visual_time;

    if( mind.action !== null ) {
        this.rotation += mind.action.rotation_speed * this.world.time_delta_sec;
        if( ( mind.action.walking === false ) && ( mind.action.want_walk === true ) &&
            this.check_clear_path( CLEAR_WALK_DIST ) )
        {
            // We can now walk ahead, so stop turning soon.
            mind.action.want_walk = false;
            mind.action_time = 0.02;
        }
    }

    // Scan for friendlies.
    for( let entity of this.world.entities ) {
        if( ! ( entity instanceof Entity_Friendly ) ) {
            // Only care about friendlies.
            continue;
        }

        const dist_x = entity.x - this.x;
        const dist_y = entity.y - this.y;
        const dist = Math.sqrt( dist_x*dist_x + dist_y*dist_y );
        if( dist > 20 ) {
            // Can't see them this far away.
            continue;
        }

        // Check field of vision.
        //this.rotation = normalize_angle( this.rotation );
        const look_angle = normalize_angle( this.rotation ); // + this.limb.limbs.head.rotation;
        if( look_angle < -Math.PI ) debugger;
        let sight_angle = Math.atan2( ( entity.y - this.y ), ( entity.x - this.x ) ) - look_angle;
        sight_angle = normalize_angle( sight_angle );
        sight_angle = ( ( Math.PI + sight_angle ) % ( Math.PI * 2 ) ) - Math.PI;
        if( Math.abs( sight_angle ) > ( this.light_beam_angle * 0.5 ) ) {
            continue;
        }

        // Check visiblity.
        if( ! this.world.opacity_grid.check_visual( this.x, this.y, entity.x, entity.y ) ) {
            // No line of sight.
            continue;
        }

        // Look at them.
        this.aiming = true;
        mind.last_visual_time = this.world.time;
        mind.aiming_at = { x: entity.x, y: entity.y };
        mind.target_direction = sight_angle > 0;
        mind.dash = false;

        // Alert!
        mind.action_time = -1;
    }

    if( ! this.aiming ) {
        // Scan for lights.
        const closest_light = this.detect_light();
        if( closest_light !== null ) {
            this.aiming = true;
            // Subtract time, so that we don't shoot, and walk directly.
            mind.last_visual_time = this.world.time - 1001;
            mind.aiming_at = { x: closest_light.x, y: closest_light.y };
            mind.target_direction = true;
            mind.dash = false;
        }
    }

    if( this.aiming ) {
        const at = this.mind.aiming_at;
        const ideal_angle = Math.atan2( ( at.y - this.y ), ( at.x - this.x ) );
        // Aim at Pi radians per second.
        const max_angle_change = this.world.time_delta_sec * Math.PI;
        let angle_change = ideal_angle - normalize_angle( this.rotation );
        angle_change = normalize_angle( angle_change );
        angle_change = ( ( Math.PI + angle_change ) % ( Math.PI * 2 ) ) - Math.PI;
        if( Math.abs( angle_change ) > max_angle_change ) {
            if( Math.abs( angle_change ) > Math.PI ) debugger;
            angle_change = ( angle_change > 0 ) ? max_angle_change : -max_angle_change;
        }
        this.rotation += angle_change;
        if( last_seen_ago > 10000 ) {
        //if( ( this.mind.last_visual_time + 10000 ) < this.world.time ) {
            // Lost visual for too long, stop aiming.
            this.aiming = false;
            this.mind.aiming_at = null;
            this.mind.dash = false;
            console.log( "Must've been my imagination..." );
        } else if( last_seen_ago > 200 ) {
        //} else if( ( this.mind.last_visual_time + 200 ) < this.world.time ) {
            // Lost visual, attempt to dash to re-establish visual.
            this.mind.dash = true;
        }
    }

    if( mind.action_time > 0 ) {
        mind.action_time -= this.world.time_delta_sec;
        // No change to activity.
        return;
    }

    // Action expired, generate new:

    const strafe_dir = mind.dash ? mind.target_direciton : ( Math.random() < 0.5 );
    mind.action_time = 1;
    if( this.aiming ) {
        mind.action = {
            walking: ( Math.random() < 0.5 ) || mind.dash,
            want_walk: false,
            firing: ( last_seen_ago > 2000 ) ? false : ( Math.random() < 0.5 ),
            speed: mind.dash ? 4 : 1,
            rotation_speed: 0,
            strafe_angle: Math.PI * 0.4 * ( strafe_dir ? -1 : 1 )
        };
    } else {
        // Relaxed.
        if( mind.action === null ) {
            let walk = Math.random() < this.walk_probability();
            let want_walk = false; // Whether we cannot walk ahead, but want to walk.
            if( walk && ! this.check_clear_path( CLEAR_WALK_DIST ) ) {
                walk = false;
                want_walk = true;
            }

            mind.action = walk ? {
                // Walking.
                walking: true,
                firing: false,
                speed: 0.7,
                rotation_speed: 0
            } : {
                // Turning.
                walking: false,
                want_walk: want_walk,
                firing: false,
                speed: 0,
                rotation_speed: Math.PI * ( ( Math.random() < 0.5 ) ? -1 : 1 )
            };
            mind.action_time = ( 0.5 + 0.5 * Math.random() ) *
                ( walk ? 4 : 1 );
        } else {
            // Idle.
            mind.action = null;
            mind.action_time = 2;
        }
    }

    if( mind.action === null ) {
        // Idle state.
        this.walking = false;
        this.firing = false;
        this.aiming = false;
        this.speed = 0;
        return;
    }

    const action = mind.action;
    this.walking = action.walking;
    if( action.walking ) {
        this.speed = action.speed;
    } else {
        this.speed = 0;
    }
    this.firing = action.firing;
    if( this.aiming && ( last_seen_ago < 1000 ) ) {
        this.strafe_angle = action.strafe_angle;
    } else {
        this.strafe_angle = 0;
    }
};

// Compute the dot-product between two angles.
Entity_Soldier.prototype.angles_dot = function( a, b ) {
    return ( Math.sin(a) * Math.sin(b) ) + ( Math.cos(a) * Math.cos(b) );
}

Entity_Soldier.prototype.walk_probability = function() {
    const avg_angle = Math.atan2( ( this.avg_y - this.y ), ( this.avg_x - this.x ) );
    return 0.5 + 0.5 * this.angles_dot( this.rotation, avg_angle );
};

Entity_Soldier.prototype.update = function() {
    let time = this.world.time;

    const avg_portion = this.world.time_delta_sec * 0.01;
    this.avg_x = ( 1 - avg_portion ) * this.avg_x + avg_portion * this.x;
    this.avg_y = ( 1 - avg_portion ) * this.avg_y + avg_portion * this.y;

    this.think();

    if (this.walking) {
        let walk_offset = Math.sin(time / ( this.firing ? 80 : 250 )) * 6;
        if( this.firing ) {
            walk_offset *= 0.3;
            walk_offset -= 4;
        }
        this.limb.limbs.left_foot.x = walk_offset;
        this.limb.limbs.right_foot.x = -walk_offset;
    }

    if (this.firing) {
        // Head nearer gun.
        this.limb.limbs.head.x = 1.3;
        this.limb.limbs.head.y = 1.3;

        //this.limb.limbs.gun.rotation = Math.sin(time / 1000);
        let kick = Math.random();
        this.limb.limbs.gun.ax = -kick;
        this.limb.limbs.gun.limbs.muzzle.scale = kick;
        if (world.time_tick(100)) {
            let rotation = this.rotation + this.limb.limbs.gun.rotation;
            let x = this.x;
            let y = this.y;
            let dx = Math.cos(rotation);
            let dy = Math.sin(rotation);
            let bullet = this.world.add_entity(
                x + dx,
                y + dy,
                this.z,
                rotation,
                Entity_Bullet,
                1000,
                25 + 10 * Math.random(),
                this
            );
            bullet.check_hit();
            this.world.add_sound_effect(new SoundEffect(
                assets.sounds.gunshot, x, y, 1, 8
            ));
        }
    } else {
        // Re-centre head.
        this.limb.limbs.head.x = 0;
        this.limb.limbs.head.y = 0;
        // Disable muzzle flash.
        this.limb.limbs.gun.limbs.muzzle.scale = 0;
    }

    if( this.aiming ) {
        // Look straight ahead.
        this.limb.limbs.head.rotation = 0;
        //this.limb.limbs.gun.rotation = 0;
    } else {
        // Look side to side.
        const rotation = Math.sin(time / 1000);
        this.limb.limbs.head.rotation = rotation;
        this.limb.limbs.gun.rotation = rotation * 0.1;
    }

    if( this.speed !== 0 ) {
        // Move.
        const move_angle = this.rotation + ( this.aiming ? this.strafe_angle : 0 );
        this.dx = this.speed * Math.cos(move_angle);
        this.dy = this.speed * Math.sin(move_angle);
        this.move_blocking(this.dx, this.dy, true);
    }
};

Entity.prototype.gen_lighting = function(lights) {
    if (! this.is_lit) {
        return;
    }

    const light_rotation = this.rotation + this.limb.limbs.gun.rotation;

    const off_x = Math.cos( light_rotation );
    const off_y = Math.sin( light_rotation );
    const flashlight_offset = 0.5;

    const full_beam = this.light_beam_angle;
    const half_beam = full_beam * 0.5;

    const light_wiggle = this.firing ? 2 : 0.1;

    lights.push( new Light(
        ( this.x + off_x * flashlight_offset ) * assets.tile_w + Math.random() * light_wiggle,
        ( this.y + off_y * flashlight_offset ) * assets.tile_h + Math.random() * light_wiggle,
        // TODO: Calculate light direction properly.
        light_rotation - half_beam, full_beam,
        150, 500,
        this.light_flavour
    ) );

    const muzzle_flash = this.limb.limbs.gun.limbs.muzzle.scale;
    if( ( muzzle_flash > 0.5 ) ) { // && ( muzzle_flash < 0.8 ) ) {
        const flash_offset_x = 1.3;
        const flash_offset_y = 0.15;
        const flash_spread = 1.6;
        lights.push( new Light(
            ( this.x + off_x * flash_offset_x + off_y * flash_offset_y ) * assets.tile_w,
            ( this.y + off_y * flash_offset_x + off_x * flash_offset_y ) * assets.tile_h,
            // TODO: Calculate light direction properly.
            light_rotation - Math.PI * flash_spread * 0.5, Math.PI * flash_spread,
            100, 500 * muzzle_flash,
            this.light_flavour
        ) );
    }

    if( this.highlight_avg ) {
        // Highlight avg position.
        lights.push( new Light(
            this.avg_x * assets.tile_w,
            this.avg_y * assets.tile_h,
            // TODO: Calculate light direction properly.
            0, Math.PI * 2,
            20, 500,
            this.light_flavour
        ) );
    }
};

Entity_Soldier.prototype.description = function() {return "Enemy Soldier"};
