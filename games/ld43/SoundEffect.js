function SoundEffect(sound, x, y, volume = 1.0, range = 16.0) {
    this.sound = sound;
    this.x = x;
    this.y = y;
    this.volume = volume;
    this.range = range;
    this.audio = null;
}

SoundEffect.prototype.check_expired = function(view) {
    if (this.audio && this.audio.ended) {
        return true;
    } else {
        return false;
    }
}

SoundEffect.prototype.update = function(view) {
    if (this.audio === null) {
        this.audio = this.sound.audio.cloneNode();
        this.audio.volume = 0;
        this.audio.play();
    }
    let x = this.x - view.world_x;
    let y = this.y - view.world_y;
    let falloff = this.range**2 / (x**2+y**2);
    if (falloff > 1) {
        falloff = 1;
    }
    this.audio.volume = this.volume * this.sound.volume * view.volume * falloff;
}
