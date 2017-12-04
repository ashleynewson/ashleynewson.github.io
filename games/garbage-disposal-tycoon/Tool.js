function Tool() {
    this.graphic = assets.graphics.tiles.debug;
}

Tool.prototype.render_icon = function(view, x, y) {
    this.graphic.render_at(view, x, y, 0);
};

Tool.prototype.select = function() {
};

Tool.prototype.action = function(inner, outer) {
    panic("Tool without action");
};

Tool.prototype.get_inner_cursor_renderer = function() {
    return null;
}

Tool.prototype.get_outer_cursor_renderer = function() {
    return null;
}
