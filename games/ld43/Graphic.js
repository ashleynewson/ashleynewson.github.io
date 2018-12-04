"use strict";

function Graphic(spec) {
    this.spec = spec;
    this.ready = false;
    this.stencil_ready = false;
    this.image = null;
    this.stencil_image = null;
    this.buf = null;
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
    this.stencil_map = spec.stencil_map || {};
    this.stencils = {};

    this.download_image(
        spec.file ? "assets/graphics/" + spec.file : null,
        spec.stencil_file ? "assets/graphics/" + spec.stencil_file : null
    );
}

Graphic.prototype.download_image = function(src, stencil_src) {
    this.ready = false;

    let graphic = this;
    if (src != null) {
        this.image = new Image();
        this.image.onload = function () {
            graphic.ready = true;
            graphic.render_buf();
            graphic.animation_frames = this.width / graphic.frame_size_x;
            graphic.rotation_frames = this.height / graphic.frame_size_y;
        };
        this.image.src = src;
    }
    if (stencil_src != null) {
        this.stencil_image = new Image();
        this.stencil_image.onload = function () {
            graphic.stencil_ready = true;
            graphic.extract_stencils();
        };
        this.stencil_image.src = stencil_src;
    }
}

Graphic.prototype.render_buf = function() {
    let canv = document.createElement( 'canvas' );
    let w = this.image.width;
    let h = this.image.height;
    canv.width = w;
    canv.height = h;
    let ctx = canv.getContext("2d");
    ctx.drawImage(this.image, 0, 0);
    this.buf = new Uint8Array( ctx.getImageData( 0, 0, w, h ).data.buffer );
};

Graphic.prototype.extract_stencils = function() {
    let imageCanvas = document.createElement("canvas");
    let width = this.stencil_image.width;
    let height = this.stencil_image.height;
    imageCanvas.width = width;
    imageCanvas.height = height;
    let imageCtx = imageCanvas.getContext("2d");
    imageCtx.globalCompositeOperation = 'source-over'; // Take colour/alpha

    imageCtx.drawImage(this.stencil_image, 0, 0);
    let imageData = imageCtx.getImageData(0, 0, width, height);

    for (let part in this.stencil_map) {
        if (this.stencil_map.hasOwnProperty(part)) {
            let color = this.stencil_map[part].match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/) || panic("Bad resource color format");
            color.length == 4 || panic();
            let r = parseInt(color[1], 16);
            let g = parseInt(color[2], 16);
            let b = parseInt(color[3], 16);
            let partImageData = imageCtx.createImageData(width, height);
            for (let i = 0; i < imageData.data.length; i += 4) {
                let bit =
                    (
                        imageData.data[i+0] == r
                            && imageData.data[i+1] == g
                            && imageData.data[i+2] == b
                    ) ? 255 : 0;
                partImageData.data[i+0] = 255;
                partImageData.data[i+1] = 255;
                partImageData.data[i+2] = 255;
                partImageData.data[i+3] = bit;
            }
            imageCtx.putImageData(partImageData, 0, 0);
            let partImage = new Image();
            partImage.src = imageCanvas.toDataURL();
            this.stencils[part] = partImage;
        }
    }
}

Graphic.prototype.render_at = function(view, x, y, rotation_image_set, rotation_angle, scale, alpha) {
    if (!this.ready) {
        return;
    }

    let animation_frame = ((view.animation_time * this.animation_frames / this.animation_period) | 0) % this.animation_frames;
    let rotation_frame = (rotation_image_set || 0) % this.rotation_frames;

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

Graphic.prototype.render_at_xyz = function(view, x, y, z, rotation, image_rotation, scale, alpha) {
    if (!this.ready) {
        return;
    }

    let animation_frame = ((view.animation_time * this.animation_frames / this.animation_period) | 0) % this.animation_frames;
    let rotation_frame = Math.round((view.yaw + rotation) * this.rotation_frames) % this.rotation_frames;

    view.ctx.save();
    {
        // Transform (using x, y, z) for draw
        // TODO

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

Graphic.prototype.render_sprite_at_angle = function( view, x, y, angle ) {
    let corrected_angle = positive_angle(-(angle-Math.PI*0.25)+Math.PI*0.25)
    this.render_sprite_at(view, x, y, (this.rotation_frames * corrected_angle / (Math.PI*2)) | 0);
}

Graphic.prototype.render_sprite_at = function( view, x, y, rotation_image_set ) {
    if (this.ready) {
        const animation_frame = ((view.animation_time * this.animation_frames / this.animation_period) | 0) % this.animation_frames;
        const rotation_frame = (rotation_image_set || 0) % this.rotation_frames;

        renderer.paint_sprite(
            x, y, this.buf, this.frame_size_x, this.frame_size_y,
            ( this.image.width * this.frame_size_y * rotation_frame ) + ( this.frame_size_x * animation_frame ),
            this.image.width - this.frame_size_x
        );
    }
}
