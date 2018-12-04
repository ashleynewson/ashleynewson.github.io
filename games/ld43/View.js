"use strict";

function View(
    canvas, ctx, x, y, z, pitch, yaw, roll, zoom, animation_time)
{
    this.canvas = canvas;
    this.ctx = ctx;
    this.zoom = 1;
    this.x = x;
    this.y = y;
    this.z = z;
    this.pitch = 0;
    this.yaw = 0;
    this.roll = 0;
    this.zoom = zoom;
    this.show_grid = false;
    this.volume = 1.0;
    this.animation_time = animation_time;
}
