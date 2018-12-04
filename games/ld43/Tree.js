function Tree(world, x, y, health) {
    Plant.call(this, world, x, y, health, assets.graphics.plants.tree1);
    this.radius = 8;
    this.reproduction_time_sec = null;
}
extend(Tree, Plant);
