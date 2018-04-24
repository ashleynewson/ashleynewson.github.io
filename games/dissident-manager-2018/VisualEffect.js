// , dx = 0.0, dy = 0.0, drotation = 0.0, dscale = 0.0, dalpha = 0.0
function VisualEffect(ttl, graphic, x, y, rotation = 0.0, scale = 1.0, alpha = 1.0) {
    this.ttl = ttl * 1000;
    this.start = 0;
    this.expires = 0;
    this.graphic = graphic;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.scale = scale;
    this.alpha = alpha;
    // this.dx = dx;
    // this.dy = dy;
    // this.drotation = drotation;
    // this.dscale = dscale;
    // this.dalpha = dalpha;
}

VisualEffect.prototype.check_expired = function(view) {
    if (this.expires === 0) {
        this.start = view.animation_time;
        this.expires = view.animation_time + this.ttl;
    }
    if (this.expires <= view.animation_time) {
        return true;
    } else {
        return false;
    }
}

VisualEffect.prototype.render = function(view) {
    let time = (view.animation_time - this.start) / 1000;
    this.graphic.render_at(view,
                           (typeof(this.x)==="function" ? this.x(time) : this.x) * assets.tile_w,
                           (typeof(this.y)==="function" ? this.y(time) : this.y) * assets.tile_h,
                           0,
                           typeof(this.rotation)==="function" ? this.rotation(time) : this.rotation,
                           typeof(this.scale)==="function" ? this.scale(time) : this.scale,
                           typeof(this.alpha)==="function" ? this.alpha(time) : this.alpha
                          );
}
