function Tile_Window(world, x, y, z, rotation) {
    Tile.call(this, world, x, y, z);
    this.graphic = assets.graphics.tiles.window;
    this.solid = true;
    this.rotation = rotation;
    this.transmit_light = true;
    this.broken = false;
}
extend(Tile_Window, Tile);

Tile_Window.prototype.damage = function(damage, actor) {
    if (this.broken) {
        return false;
    }
    this.graphic = assets.graphics.tiles.window.broken;
    this.broken = true;
    return true;
}

Tile_Window.prototype.description = function() {return "Window"};
