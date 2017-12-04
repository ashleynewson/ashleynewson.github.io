function Tool_Cursor() {
    Tool.call(this);
    this.graphic = assets.graphics.tiles.outer_cursor;
}
extend(Tool_Cursor, Tool);

Tool_Cursor.prototype.action = function(inner, outer) {
    inner.tile.interact();
};

Tool_Cursor.prototype.get_inner_cursor_renderer = function() {
    return function(view, x, y) {
        assets.graphics.tiles.outer_cursor.render_at(view, x, y, 0);
    };
}
