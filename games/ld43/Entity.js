function Entity(world, x, y) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.visible = true;
    this.graphic = assets.graphics.debug;
    //this.reset();
}

Entity.prototype.update = function() {
};

Entity.prototype.render = function(view) {
    if (this.visible) {
        //this.graphic.render_at_xyz(view, x, y, this.world.get_ground(x, y).altitude, this.rotation, 0, 1, 1);
    }
};
