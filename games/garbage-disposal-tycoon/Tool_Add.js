function Tool_Add(cost, constructor) {
    Tool.call(this);
    this.cost = cost;
    this.creates = {
        constructor: constructor,
        args: Array.prototype.slice.call(arguments, 2),
    }
    this.example = new this.creates.constructor(null, 0, 0, 0, ...this.creates.args);
}
extend(Tool_Add, Tool);

Tool_Add.prototype.render_icon = function(view, x, y) {
    this.example.graphic.render_at(view, x, y, this.example.rotation | 0);
};

Tool_Add.prototype.action = function(inner, outer) {
    if (player.withdraw(this.cost)) {
        world.emplace_tile(outer.x, outer.y, outer.z, this.creates.constructor, ...this.creates.args);
    }
};

Tool_Add.prototype.get_outer_cursor_renderer = function() {
    let tool = this;
    return function(view, x, y) {
        tool.example.graphic.render_at(view, x, y, tool.example.rotation | 0);
    };
}
