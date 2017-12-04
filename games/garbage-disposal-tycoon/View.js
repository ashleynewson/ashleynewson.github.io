function View(canvas, ctx, x, y, z, zoom, rotation, animation_time) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.zoom = 1;
    this.scroll_x = x;
    this.scroll_y = y;
    this.scroll_z = z;
    this.zoom = zoom;
    this.rotation = 0;
    this.animation_time = animation_time;
}
