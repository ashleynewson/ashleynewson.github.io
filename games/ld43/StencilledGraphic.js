function StencilledGraphic(template, palette) {
    let new_spec = JSON.parse(JSON.stringify(template.spec));
    delete new_spec.file;
    delete new_spec.stencil_file;
    Graphic.call(this, new_spec);
    this.template = template;
    this.palette = palette;
    this.bake_stencil(); // if possible
}
extend(StencilledGraphic, Graphic);

StencilledGraphic.prototype.bake_stencil = function() {
    if (!this.template.ready || !this.template.stencil_ready) {
        return false;
    }
    if (this.ready) {
        return true;
    }

    let width = this.template.image.width;
    let height = this.template.image.height;

    let imageCanvas = document.createElement("canvas");
    imageCanvas.width = width;
    imageCanvas.height = height;
    // let imageCanvas = new OffscreenCanvas(width, height);
    let imageCtx = imageCanvas.getContext("2d");
    // imageCtx.globalCompositeOperation = 'source-over'; // Take colour/alpha
    // imageCtx.fillStyle = "red";
    // imageCtx.fillRect(0, 0, width, height);
    imageCtx.drawImage(this.template.image, 0, 0);
    imageCtx.globalCompositeOperation = 'multiply'; // Take the strength of the spray

    let stencilCanvas = document.createElement("canvas");
    stencilCanvas.width = width;
    stencilCanvas.height = height;
    let stencilCtx = stencilCanvas.getContext("2d");

    for (let part in this.palette) {
        if (this.template.stencils.hasOwnProperty(part)) {
            stencilCtx.globalCompositeOperation = 'copy'; // Take colour/alpha of fill
            stencilCtx.fillStyle = this.palette[part];
            stencilCtx.fillRect(0, 0, width, height);
            stencilCtx.globalCompositeOperation = 'destination-in';  // Take the alpha of the spray
            stencilCtx.drawImage(this.template.stencils[part], 0, 0);
            imageCtx.drawImage(stencilCanvas, 0, 0);
        }
    }

    this.buf = new Uint8Array( imageCtx.getImageData( 0, 0, width, height ).data.buffer );

    this.image = new Image();
    this.image.src = imageCanvas.toDataURL();
    // this.render_buf();
    this.ready = true;
    this.animation_frames = this.template.animation_frames;
    this.rotation_frames = this.template.rotation_frames;
};

StencilledGraphic.prototype.render_at = function(view, x, y, rotation_image_set, rotation_angle, scale, alpha) {
    if (this.bake_stencil()) {
        return Graphic.prototype.render_at.call(this, view, x, y, rotation_image_set, rotation_angle, scale, alpha);
    }
}

StencilledGraphic.prototype.render_sprite_at = function( view, x, y, rotation_image_set ) {
    if (this.bake_stencil()) {
        Graphic.prototype.render_sprite_at.call(this, view, x, y, rotation_image_set);
    }
}

StencilledGraphic.prototype.render_at_xyz = function(view, x, y, z, rotation, image_rotation, scale, alpha) {
    if (this.bake_stencil()) {
        return Graphic.prototype.render_at_xyz.call(this, view, x, y, z, rotation, image_rotation, scale, alpha);
    }
}
