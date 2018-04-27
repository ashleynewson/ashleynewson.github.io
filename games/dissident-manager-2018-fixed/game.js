var world;
var player;

var game_over = false;
var game_over_time_sec = 0;
var game_over_survived_sec = 0;

var scroll_x = 0;
var scroll_y = 0;
var scroll_z = 0;
var zoom = 2;
var scroll_speed = 0.5;

// Cursor positioned in a tile
var inner_cursor = {x:0, y:0, z:0, tile:null, render:null};
// Cursor positioned just above a tile
var outer_cursor = {x:0, y:0, z:0, tile:null, render:null};
// Non-tile cursor
var floating_cursor = {x:0, y:0, z:0, render:null};


function mark_game_over() {
    game_over = true;
    game_over_time_sec = world.time_sec;
}

const WORLD_WIDTH = 50;
const WORLD_HEIGHT = 40;

function generate_world() {
    world = new World();
    world.set_size(WORLD_WIDTH, WORLD_HEIGHT, 4);

    let world_acceptable = false;
    while (!world_acceptable) {
        world.generate_random(0);
        let has_interior = false;
        let has_exterior = false;
        for (let y = 0; y < world.size_y; y++) {
            for (let x = 0; x < world.size_x; x++) {
                let tile = world.get_tile(x, y, 0);
                if (tile instanceof Tile_Floor) {
                    if (tile.graphic === assets.graphics.tiles.floor.grass) {
                        has_exterior = true;
                    } else if (tile.graphic === assets.graphics.tiles.floor.checker) {
                        has_interior = true;
                    }
                }
            }
        }
        world_acceptable = has_exterior && has_interior;
    }
    // world.generate_flat(0);
    world.build_opacity_grid();

    for (let i = 0; i < 6; i++) {
        while (true) {
            let friendly = world.add_entity(((Math.random()*10)|0)*5+2, ((Math.random()*8)|0)*5+2, 1, Math.random()*2*Math.PI, Entity_Friendly);
            let tile = world.get_tile(friendly.x|0, friendly.y|0, 0);
            if (tile instanceof Tile_Floor && tile.graphic === assets.graphics.tiles.floor.checker) {
                player.possessee = friendly;
                break;
            }
            friendly.delete();
        }
    }
    for (let i = 0; i < 8; i++) {
        while (true) {
            let soldier = world.add_entity(((Math.random()*10)|0)*5+2, ((Math.random()*8)|0)*5+2, 1, Math.random()*2*Math.PI, Entity_Soldier);
            let tile = world.get_tile(soldier.x|0, soldier.y|0, 0);
            if (tile instanceof Tile_Floor && tile.graphic === assets.graphics.tiles.floor.grass) {
                let safe = true;
                for (let entity of world.entities) {
                    if (entity instanceof Entity_Friendly && world.opacity_grid.check_visual(soldier.x, soldier.y, entity.x, entity.y)) {
                        safe = false;
                    }
                }
                if (safe) {
                    break;
                }
            }
            soldier.delete();
        }
    }
    // for (let i = 0; i < 7; i++) {
    //     world.add_entity(((Math.random()*10)|0)*5+2, ((Math.random()*8)|0)*5+2, 1, 0.0, Entity_Soldier);
    // }
    // for (let i = 0; i < 3; i++) {
    //     world.add_entity(((Math.random()*10)|0)*5+2, ((Math.random()*8)|0)*5+2, 1, 0.0, Entity_Friendly);
    // }
    // for (let i = 0; i < 3; i++) {
    //     world.emplace_tile_at_ground(8, 2+i, 1, Tile_Wall);
    //     world.emplace_tile_at_ground(5, 6+i, 1, Tile_Wall);
    // }
    // world.emplace_tile_at_ground(6, 0, 0, Tile_Floor, assets.graphics.tiles.floor.wood);
    // world.emplace_tile_at_ground(6, 1, 0, Tile_Floor, assets.graphics.tiles.floor.wood);
    // world.emplace_tile_at_ground(1, 7, 0, Tile_Floor, assets.graphics.tiles.floor.wood);
    // world.emplace_tile_at_ground(2, 7, 0, Tile_Floor, assets.graphics.tiles.floor.wood);
    // world.emplace_tile_at_ground(0, 11, 0, Tile_Floor, assets.graphics.tiles.floor.wood);
    // world.emplace_tile_at_ground(2, 11, 0, Tile_Floor, assets.graphics.tiles.floor.wood);
    // world.emplace_tile_at_ground(6, 0, 1, Tile_Window, 0);
    // world.emplace_tile_at_ground(6, 1, 1, Tile_Window, 0);
    // world.emplace_tile_at_ground(1, 7, 1, Tile_Window, 1);
    // world.emplace_tile_at_ground(2, 7, 1, Tile_Window, 1);
    // world.emplace_tile_at_ground(0, 11, 1, Tile_Window, 1);
    // world.emplace_tile_at_ground(2, 11, 1, Tile_Window, 1);
    // world.emplace_tile_at_ground(9, 6, 1, Tile_Bush);
    // world.emplace_tile_at_ground(8, 3, 0, Tile_Fence, 0);
}

function game_init() {
    player = new Player();

    generate_world();
    game_over = false;
    game_over_time_sec = 0;
    game_over_survived_sec = 0;
}


function render() {
    canvas.width = 800;
    canvas.height = (800 * (window.innerHeight / window.innerWidth)) | 0;
    canvas_scale = (canvas.offsetWidth / 800) || 1;
    ctx.imageSmoothingEnabled = false; // Auto enable from the above. Re-disable.

    // Both are canvas.
    lighting_canvas.width = WORLD_WIDTH * assets.tile_w;
    lighting_canvas.height = WORLD_HEIGHT * assets.tile_h;

    ctx.resetTransform();
    full_render = true;
    if (full_render) {
        // Clear screen
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        full_render = false;
    }

    let view = new View(
        canvas, ctx, lighting_canvas, lighting_ctx,
        scroll_x, scroll_y, scroll_z, zoom, 0, world.time
    );
    // view.show_grid = true;

    let game_over_duration = (world.time_sec - game_over_time_sec);

    if (game_over) {
        view.volume = game_over_duration < 10 ? (1.0 - game_over_duration*0.1) : 0;
    }

    floating_cursor.render = function(view, x, y) {
        assets.graphics.tiles.cursor.floating.render_at(view, x, y, 0);
    };

    view.ctx.save();
    {
        view.ctx.translate(
            (view.canvas.width / 2) | 0,
            (view.canvas.height / 2) | 0
        );
        view.ctx.scale(
            view.zoom,
            view.zoom
        );
        view.ctx.translate(
            -view.scroll_x | 0,
            -view.scroll_y | 0
        );

        world.render(view);

        floating_cursor.render(view, floating_cursor.x * assets.tile_w, floating_cursor.y * assets.tile_h);
    }
    view.ctx.restore();

    if (game_over) {
        view.ctx.fillStyle = "rgba(0,0,0," + (game_over_duration < 10 ? (game_over_duration)*0.1 : 1) + ")";
        view.ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (game_over_duration) {
            let text_scale = 0.2;
            view.ctx.textAlign = "center";

            view.ctx.fillStyle = "rgba(255,255,255," + (game_over_duration < 12 ? (game_over_duration-10)*0.5 : 1) + ")";
            view.ctx.font = "" + text_scale * 0.5 * canvas.height + "px Arial, Helvetica, sans-serif";
            view.ctx.fillText("Game Over", canvas.width * 0.5, (canvas.height) * 0.5);

            view.ctx.fillStyle = "rgba(255,255,255," + (game_over_duration < 14 ? (game_over_duration-12)*0.5 : 1) + ")";
            view.ctx.font = "" + text_scale * 0.25 * canvas.height + "px Arial, Helvetica, sans-serif";
            view.ctx.fillText("There were too many casualties", canvas.width * 0.5, (canvas.height) * 0.6);
            view.ctx.fillText("They survived: " + Math.round(game_over_survived_sec*100)/100 + " man seconds", canvas.width * 0.5, (canvas.height) * 0.7);
        }
    }
}


function update(delta) {
    if (player.possessee) {
        scroll_x = player.possessee.x * assets.tile_w;
        scroll_y = player.possessee.y * assets.tile_h;
    } else {
        if (input_is_down("scroll_left")) {
            scroll_x -= (delta * scroll_speed) | 0;
        }
        if (input_is_down("scroll_up")) {
            scroll_y -= (delta * scroll_speed) | 0;
        }
        if (input_is_down("scroll_right")) {
            scroll_x += (delta * scroll_speed) | 0;
        }
        if (input_is_down("scroll_down")) {
            scroll_y += (delta * scroll_speed) | 0;
        }
    }
    if (input_is_fall["zoom_in"]) {
        zoom *= 2;
    }
    if (input_is_fall["zoom_out"]) {
        zoom /= 2;
    }
    if (zoom < 2) {
        zoom = 2;
    }

    let cursors = world.mouse_to_tiles();
    
    inner_cursor = cursors.inner;
    outer_cursor = cursors.outer;
    floating_cursor = cursors.floating;

    if (mouse.down) {
        for (let entity of world.entities) {
            if ((entity.x - floating_cursor.x)**2 + (entity.y - floating_cursor.y)**2 < entity.radius) {
                entity.select();
            }
        }
    }
    let friendlies = [];
    let next_friendly = 1;
    for (let entity of world.entities) {
        if (entity instanceof Entity_Friendly) {
            friendlies.push(entity);
            if (entity === player.possessee) {
                next = friendlies.length;
            }
        }
    }
    if (friendlies.length <= 1) {
        if (!game_over) {
            mark_game_over();
        }
    } else {
        game_over_survived_sec += world.time_delta_sec * friendlies.length;
        if (input_is_fall("cycle")) {
            if (input_is_down("reverse_cycle")) {
                next += friendlies.length - 2;
            }
            friendlies[next % friendlies.length].select();
        }
    }

    world.update(now - then);
}


function main_loop() {
    if (running) {
        update(now - then);

        fps_element.textContent = "FPS: " + 1000/(now - then);

        then = now;
        now = Date.now();

        ui_acknowledge();

        requestAnimationFrame(main_loop);
    }
    render();
}
