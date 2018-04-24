function Graphic(spec) {
    this.spec = spec;
    this.ready = false;
    this.image = null;
    this.offset_x = spec.offset_x || 0;
    this.offset_y = spec.offset_y || 0;
    this.frame_size_x = spec.frame_size_x || panic();
    this.frame_size_y = spec.frame_size_y || panic();
    this.animation_period = ((spec.animation_period || 1) * 1000) | 0;
    this.animation_frames = 1;
    this.rotation_frames = 1;
    this.transparent = spec.transparent || false;
    this.joints = spec.joints || {};
    this.join_over = spec.join_over || [];
    this.join_under = spec.join_under || [];

    this.download_image("assets/graphics/" + spec.filename);
}

Graphic.prototype.download_image = function(src) {
    this.ready = false;

    this.image = new Image();

    let graphic = this;
    this.image.onload = function () {
        graphic.ready = true;
        graphic.animation_frames = this.width / graphic.frame_size_x;
        graphic.rotation_frames = this.height / graphic.frame_size_y;
    };
    this.image.src = src;
}

Graphic.prototype.render_at = function(view, x, y, rotation_image_set, rotation_angle, scale, alpha) {
    if (!this.ready) {
        return;
    }

    let animation_frame = ((view.animation_time * this.animation_frames / this.animation_period) | 0) % this.animation_frames;
    let rotation_frame = (view.rotation + (rotation_image_set || 0)) % this.rotation_frames;

    view.ctx.save();
    {
        if (typeof(x) != "undefined" && typeof(y) != "undefined") {
            view.ctx.translate(x, y);
        }
        if (typeof(scale) != "undefined") {
            view.ctx.scale(scale, scale);
        }
        if (typeof(rotation_angle) != "undefined") {
            view.ctx.rotate(rotation_angle);
        }
        if (typeof(alpha) != "undefined") {
            view.ctx.globalAlpha = alpha;
        }

        view.ctx.drawImage(
            this.image,
            this.frame_size_x * animation_frame,
            this.frame_size_y * rotation_frame,
            this.frame_size_x,
            this.frame_size_y,
            -this.offset_x,
            -this.offset_y,
            this.frame_size_x,
            this.frame_size_y,
        );
    }
    view.ctx.restore();
}
