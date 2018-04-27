function Limb(spec) {
    this.graphic = spec.graphic;
    this.x = spec.x;
    this.y = spec.y;
    this.z = spec.z;
    this.ax = spec.ax;
    this.ay = spec.ay;
    this.az = spec.az;
    this.scale = spec.scale;
    this.rotation = spec.rotation;
    this.visible = typeof(spec.visible)!="undefined" ? spec.visible : true;
    this.under = spec.under || spec.graphic.join_under || [];
    this.over = spec.over || spec.graphic.join_over || [];
    this.limbs = spec.limbs || {};
}

Limb.prototype.render = function(view) {
    if (this.visible) {
        view.ctx.save();
        if (typeof(this.x) != "undefined" || typeof(this.y) != "undefined") {
            view.ctx.translate(this.x || 0, this.y || 0);
        }
        if (typeof(this.scale) != "undefined") {
            view.ctx.scale(this.scale, this.scale);
        }
        if (typeof(this.rotation) != "undefined") {
            view.ctx.rotate(this.rotation);
        }
        if (typeof(this.ax) != "undefined" || typeof(this.ay) != "undefined") {
            view.ctx.translate(this.ax || 0, this.ay || 0);
        }
        for (let sub_limb_name of this.under) {
            if (this.limbs.hasOwnProperty(sub_limb_name)) {
                let sub_limb = this.limbs[sub_limb_name];
                if (this.graphic.joints.hasOwnProperty(sub_limb_name)) {
                    let joint = this.graphic.joints[sub_limb_name];
                    view.ctx.save();
                    if (typeof(joint.x) != "undefined" || typeof(joint.y) != "undefined") {
                        view.ctx.translate(joint.x || 0, joint.y || 0);
                    }
                    sub_limb.render(view);
                    view.ctx.restore();
                }
            }
        }
        if (this.graphic) {
            this.graphic.render_at(view);
        }
        for (let sub_limb_name of this.over) {
            if (this.limbs.hasOwnProperty(sub_limb_name)) {
                let sub_limb = this.limbs[sub_limb_name];
                if (this.graphic.joints.hasOwnProperty(sub_limb_name)) {
                    let joint = this.graphic.joints[sub_limb_name];
                    view.ctx.save();
                    if (typeof(joint.x) != "undefined" || typeof(joint.y) != "undefined") {
                        view.ctx.translate(joint.x || 0, joint.y || 0);
                    }
                    sub_limb.render(view);
                    view.ctx.restore();
                }
            }
        }
        view.ctx.restore();
    }
};
