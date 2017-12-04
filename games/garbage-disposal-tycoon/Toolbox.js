function Toolbox(tools) {
    this.scroll = 0;
    this.tools = tools;
    this.display_x = 16;
    this.display_y = 96;
    this.tools_to_show = 10;
    this.margin = 16;
    this.tool_width = 32;
    this.tool_height = 19;
    this.tool_padding = 5;

    this.select(0);

    this.display_size_x = this.tool_width + this.margin * 2;
    this.display_size_y = this.tools_to_show * (this.tool_height + this.tool_padding) + this.margin * 2;
}

Toolbox.prototype.select = function(i) {
    this.selected = i;
    this.current_tool = this.tools[i];
    this.current_tool.select();
}

Toolbox.prototype.scroll_to_selection = function() {
    if (this.scroll < this.selected - this.tools_to_show + 1) {
        this.scroll = this.selected - this.tools_to_show + 1;
    }
    if (this.scroll > this.selected) {
        this.scroll = this.selected;
    }
}

// Not really cycling at the moment
Toolbox.prototype.cycle = function(d) {
    let s = (this.selected + d);
    if (s >= this.tools.length) {
        s = this.tools.length - 1;
    }
    if (s < 0) {
        s = 0;
    }
    this.select(s);
    this.scroll_to_selection();
}

Toolbox.prototype.catch_click = function(mouse) {
    let rel_mouse = {
        x: mouse.x - this.display_x,
        y: mouse.y - this.display_y,
    };
    if (   rel_mouse.x >= 0 && rel_mouse.x < this.display_size_x
        && rel_mouse.y >= 0 && rel_mouse.y < this.display_size_y
       )
    {
        let rel_mouse2 = {
            x: rel_mouse.x - this.margin,
            y: rel_mouse.y - this.margin,
        };
        if (rel_mouse2.x >= 0 && rel_mouse2.x < this.tool_width)
        {
            if (rel_mouse2.y >= 0 && rel_mouse2.y < (this.tool_height + this.tool_padding) * this.tools_to_show)
            {
                this.select(Math.min(
                    this.scroll + ((rel_mouse2.y / (this.tool_height + this.tool_padding)) | 0),
                    this.tools.length - 1
                ));
            } else {
                if (rel_mouse2.y < 0) {
                    this.scroll--;
                } else {
                    this.scroll++;
                }
            }
        }
        return true;
    } else {
        return false;
    }
}

Toolbox.prototype.render = function(view) {
    if (this.scroll > this.tools.length - this.tools_to_show) {
        this.scroll = this.tools.length - this.tools_to_show;
    } // Not else
    if (this.scroll < 0) {
        this.scroll = 0;
    }
    view.ctx.save();

    view.ctx.translate(this.display_x, this.display_y);

    view.ctx.strokeStyle = "white";
    view.ctx.fillStyle = "grey";
    view.ctx.fillRect(
        0,
        0,
        this.margin * 2 + this.tool_width,
        this.margin * 2 + this.tools_to_show * (this.tool_height + this.tool_padding)
    );
    view.ctx.strokeRect(
        0,
        0,
        this.margin * 2 + this.tool_width,
        this.margin * 2 + this.tools_to_show * (this.tool_height + this.tool_padding)
    );

    for (let i = 0; i < this.tools_to_show; i++) {
        let tooli = i + this.scroll;
        if (tooli >= this.tools.length) {
            break;
        }

        let tool = this.tools[tooli];

        view.ctx.save();
        view.ctx.translate(this.margin, this.margin + i * (this.tool_height + this.tool_padding));
        tool.render_icon(view, 0, 0);
        if (tooli === this.selected) {
            view.ctx.strokeRect(-2, -2, this.tool_width + 4, this.tool_height + 4);
        }
        view.ctx.restore();
    }

    view.ctx.restore();
}
