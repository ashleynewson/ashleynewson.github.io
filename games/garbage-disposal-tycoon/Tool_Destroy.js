function Tool_Destroy() {
    Tool.call(this);
    this.graphic = assets.graphics.tiles.destroy;
}
extend(Tool_Destroy, Tool);

Tool_Destroy.prototype.action = function(inner, outer) {
    if (!world.get_tile(inner.x, inner.y, inner.z).permanent) {
        world.emplace_tile(inner.x, inner.y, inner.z, Tile_Air);
    }
};

Tool_Destroy.prototype.get_inner_cursor_renderer = function() {
    return function(view, x, y) {
        assets.graphics.tiles.inner_cursor.render_at(view, x, y, 0);
    };
}
