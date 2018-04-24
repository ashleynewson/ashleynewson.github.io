function View(
    canvas, ctx, lighting_canvas, lighting_ctx,
    x, y, z, zoom, rotation, animation_time)
{
    this.canvas = canvas;
    this.ctx = ctx;
    this.lighting_canvas = lighting_canvas;
    this.lighting_ctx = lighting_ctx;
    this.zoom = 1;
    this.scroll_x = x;
    this.scroll_y = y;
    this.scroll_z = z;
    this.zoom = zoom;
    this.rotation = 0;
    this.world_x = this.scroll_x / assets.tile_w;
    this.world_y = this.scroll_y / assets.tile_h;
    this.show_grid = false;
    this.volume = 1.0;
    this.animation_time = animation_time;
}
