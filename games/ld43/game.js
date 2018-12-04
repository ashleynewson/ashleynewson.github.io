var scroll_x = 0;
var scroll_y = 0;
var scroll_z = 0;
var zoom = 2;
var animation_time = 0;

var world;

var test_guy = new StencilledGraphic(
    assets.graphics.human.walking,
    {
        "head": "#ffc080",
        "chest": "#606060",
        "l_arm": "#ffc080",
        "r_arm": "#ffc080",
        "l_leg": "#705020",
        "r_leg": "#806020",
    }
);

function game_init() {
    world = new World(2048, 2048);
    for( let i = 0; i < 1000; i ++ ) {
        world.add_entity( Math.random() * 2000, Math.random() * 2000, Human );
    }
    for( let i = 0; i < 200; i ++ ) {
        world.add_entity( Math.random() * 2000, Math.random() * 2000, Tree, Math.random()*60 );
    }
    for( let i = 0; i < 200; i ++ ) {
        world.add_entity( Math.random() * 2000, Math.random() * 2000, Bush, Math.random()*60 );
    }
}

function render() {
    /*canvas.width = 1600;
    canvas.height = (1600 * (window.innerHeight / window.innerWidth)) | 0;*/
    canvas_scale = (canvas.offsetWidth / canvas.width) || 1;
    /*ctx.imageSmoothingEnabled = false; // Auto enable from the above. Re-disable.

    ctx.resetTransform();
    // Clear screen
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, canvas.width, canvas.height);*/

    let view = new View(
        canvas, ctx, scroll_x, scroll_y, scroll_z, 0, 0, animation_time * 0.001, zoom, animation_time
    );

    ctx.resetTransform();
    renderer.paint();
    for( const entity of world.entities ) {
        const gr = entity.graphic;
        gr.render_sprite_at_angle( view, entity.x, entity.y, entity.rotation );
    }
    ctx_imgd.data.set( ctx_imgd_clamped );
    ctx.putImageData( ctx_imgd, 0, 0 );

    /*view.ctx.save();
    {
        view.ctx.translate(
            (view.canvas.width / 2) | 0,
            (view.canvas.height / 2) | 0
        );
        view.ctx.scale(
            view.zoom,
            view.zoom
        );

        // Render stuff
        assets.graphics.debug.render_at(view, 0, 0, 0, animation_time * 0.001, 1, 1);
        for (let i = 0; i < 4; i++) {
            test_guy.render_at(view, 32, 32*i, i, 0, 0.5, 1);
        }
    }
    view.ctx.restore();*/

    world.render(view);
    world.render_hud(view);
}


function update(delta) {
    world.update(delta);
    animation_time += delta;

    if( input_is_down( "scroll_left" ) ) {
        scroll_x -= delta * 0.2;
    }
    if( input_is_down( "scroll_right" ) ) {
        scroll_x += delta * 0.2;
    }
    if( input_is_down( "scroll_up" ) ) {
        scroll_y -= delta * 0.2;
    }
    if( input_is_down( "scroll_down" ) ) {
        scroll_y += delta * 0.2;
    }

    renderer.camera_x = scroll_x | 0;
    renderer.camera_y = scroll_y | 0;

    // Rain.
    if( mouse.down ) {
        var wvec = new Vec2D( 1.1, 1.1 );
        renderer.screen_to_world( mouse.x, mouse.y, wvec )

        for( var i = 0; i < 500; i ++ ) {
            wvec.x += Math.random() * 10 - 5;
            wvec.y += Math.random() * 10 - 5;
            
            renderer.terrain.rain( wvec.x | 0, wvec.y | 0 );
        }
    }
    renderer.terrain.process_rains();
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
