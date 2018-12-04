function Bush(world, x, y, health) {
    Plant.call(this, world, x, y, health, assets.graphics.plants.bush1);
    this.radius = 8;
    this.reproduction_time_sec = null;
}
extend(Bush, Plant);
