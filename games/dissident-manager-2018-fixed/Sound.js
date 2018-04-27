function Sound(spec) {
    this.spec = spec;
    this.ready = false;
    this.audio = null;
    this.volume = typeof(spec.volume)!="undefined" ? spec.volume : 1.0;
    this.download_sound("assets/sounds/" + spec.filename);
}

Sound.prototype.download_sound = function(src) {
    this.ready = false;

    this.audio = new Audio();

    let sound = this;
    this.audio.onload = function () {
        sound.ready = true;
    };
    this.audio.src = src;
}

// Fire and forget sound
Sound.prototype.play = function(volume = 1.0) {
    let audio = this.audio.cloneNode();
    audio.volume = this.volume * volume;
    audio.play();
}
