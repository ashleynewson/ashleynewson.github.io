// Garbage Disposal Tycoon
// Copyright Ashley Newson 2017

var world;
var player;

var scroll_x = 0;
var scroll_y = 0;
var scroll_z = 0;
var zoom = 1;
var scroll_speed = 0.5;

var inner_cursor = {x:0, y:0, z:0, tile:null, render:null};
var outer_cursor = {x:0, y:0, z:0, tile:null, render:null};



function generate_world() {
    world = new World();
    world.set_size(32, 32, 32);
    world.generate_terrain(16, 16, 14);

    // world.emplace_tile(16, 16, 30, Tile_Garbage, {garbage: 1.0});

    // world.emplace_tile(17, 16, 31, Tile_Garbage, {garbage: 1.0});

    // world.emplace_tile(17, 16, 30, Tile_Conveyor, 0);
    // world.emplace_tile(16, 17, 30, Tile_Conveyor, 1);
    // world.emplace_tile(15, 16, 30, Tile_Conveyor, 2);
    // world.emplace_tile(16, 15, 30, Tile_Conveyor, 3);
    
    // world.emplace_tile(18, 16, 30, Tile_Conveyor, 0);
    // world.emplace_tile(19, 16, 30, Tile_Conveyor, 0);
    // world.emplace_tile(20, 16, 30, Tile_Conveyor, 0);

    // {
    //     // let tile = world.emplace_tile_at_ground(0, 0, 1, Tile_Conveyor_Power, 0);
    //     {
    //         let content = {garbage: 1.0};
    //         let tile = world.emplace_tile(0, 0, 31, Tile_Dispenser_Power, 1000, Tile_Garbage, content);
    //         tile.permanent = true;
    //         tile.ondispense = function(){
    //             player.fund(10);
    //         };
    //         // world.emplace_tile(tile.x, tile.y+1, tile.z, Tile_Switch, false);
    //     }
    //     // world.emplace_tile(tile.x, tile.y+1, tile.z, Tile_Switch, false);
    //     // world.emplace_tile(tile.x+1, tile.y, tile.z, Tile_Conveyor, 0);
    //     // world.emplace_tile(tile.x+2, tile.y, tile.z, Tile_Conveyor, 0);
    //     // world.emplace_tile(tile.x+3, tile.y, tile.z, Tile_Conveyor, 0);
    //     // world.emplace_tile(tile.x+4, tile.y, tile.z, Tile_Conveyor, 0);
    // }

    let recycle_fund = function(consumed, rewards) {
        if (consumed instanceof Tile_Garbage) {
            player.fund(
                dot_multiply_objects(
                    consumed.contents,
                    rewards,
                    -100
                )
            )
        } else {
            player.fund(-100 * consumed.mass);
        }
    }

    // Dispenser
    {
        let content = {
            garbage: 1.0,
            glass  : 1.0,
            metal  : 1.0,
            paper  : 1.0,
            plastic: 1.0,
        };
        let tile = world.emplace_tile(0, 0, 30, Tile_Dispenser_Power, 1000, Tile_Garbage, content);
        tile.permanent = true;
        tile.ondispense = function(){
            player.fund(10);
        };
    }
    // Metal
    {
        let tile = world.emplace_tile(1, 0, 24, Tile_Hopper);
        tile.permanent = true;
        tile.graphic = assets.graphics.tiles.hopper.metal;
        tile.onconsume = function(consumed){
            recycle_fund(consumed, {metal: 10});
        };
    }
    // Glass
    {
        let tile = world.emplace_tile(2, 0, 24, Tile_Hopper);
        tile.permanent = true;
        tile.graphic = assets.graphics.tiles.hopper.glass;
        tile.onconsume = function(consumed){
            recycle_fund(consumed, {glass: 10});
        };
    }
    // Plastic
    {
        let tile = world.emplace_tile(3, 0, 24, Tile_Hopper);
        tile.permanent = true;
        tile.graphic = assets.graphics.tiles.hopper.plastic;
        tile.onconsume = function(consumed){
            recycle_fund(consumed, {plastic: 10});
        };
    }
    // Paper
    {
        let tile = world.emplace_tile(4, 0, 24, Tile_Hopper);
        tile.permanent = true;
        tile.graphic = assets.graphics.tiles.hopper.paper;
        tile.onconsume = function(consumed){
            recycle_fund(consumed, {paper: 10});
        };
    }

}

function game_init() {
    player = new Player();
    player.fund(10000);
    toolbox = new Toolbox([
        new Tool_Cursor(),
        new Tool_Destroy(),
        new Tool_Add(10, Tile_Switch),
        new Tool_Add(10, Tile_Wire),
        new Tool_Add(10, Tile_Transistor),
        new Tool_Add(100, Tile_Hopper),
        new Tool_Add(500, Tile_Magnet),
        ...([0,1,2,3].map((r)=>{return new Tool_Add(20, Tile_Conveyor, r)})),
        ...([0,1,2,3].map((r)=>{return new Tool_Add(50, Tile_Conveyor_Power, r)})),
        ...([0,1,2,3].map((r)=>{return new Tool_Add(50, Tile_Conveyor_Trap, r)})),
        new Tool_Add(0, Tile_Dirt),
        new Tool_Add(0, Tile_Water),
        new Tool_Add(0, Tile_Garbage, {garbage:1}),
    ]);
    generate_world();
    // scroll_x = -world.size_y * 16 + 8;
    scroll_z = world.size_z;
}


function render() {
    canvas.width = 800;
    canvas.height = (800 * (window.innerHeight / window.innerWidth)) | 0;
    canvas_scale = (canvas.offsetWidth / 800) || 1;

    ctx.resetTransform();
    full_render = true;
    if (full_render) {
        // Clear screen
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        full_render = false;
    }

    let view = new View(canvas, ctx, scroll_x, scroll_y, scroll_z, zoom, 0, world.time);

    inner_cursor.render = toolbox.current_tool.get_inner_cursor_renderer();
    outer_cursor.render = toolbox.current_tool.get_outer_cursor_renderer();

    world.render(view);

    ctx.font = '24px sans';
    ctx.fillStyle = "white";

    ctx.fillText("$"+player.money, 10, 34);
    let tip = "";
    if (toolbox && toolbox.current_tool && toolbox.current_tool instanceof Tool_Add) {
        tip = toolbox.current_tool.example.description();
    }
    else if (inner_cursor.tile) {
        tip = inner_cursor.tile.description();
    }
    ctx.fillText(tip, 10, 66);

    toolbox.render(view);
}


function update(delta) {
    if (keys_down[key_bindings.scroll_left]) {
        scroll_x -= (delta * scroll_speed) | 0;
    }
    if (keys_down[key_bindings.scroll_up]) {
        scroll_y -= (delta * scroll_speed) | 0;
    }
    if (keys_down[key_bindings.scroll_right]) {
        scroll_x += (delta * scroll_speed) | 0;
    }
    if (keys_down[key_bindings.scroll_down]) {
        scroll_y += (delta * scroll_speed) | 0;
    }
    if (keys_fall[key_bindings.zoom_in]) {
        zoom *= 2;
    }
    if (keys_fall[key_bindings.zoom_out]) {
        zoom /= 2;
    }
    let cursors = world.mouse_to_tiles();
    
    inner_cursor = cursors.inner;
    outer_cursor = cursors.outer;

    if (mouse.click) {
        // Get one until it works.
        false
            || toolbox.catch_click(mouse)
            || toolbox.current_tool.action(inner_cursor, outer_cursor);
            // || inner_cursor.tile.interact();
    }
    if (mouse.scroll_y) {
        toolbox.cycle(mouse.scroll_y);
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
