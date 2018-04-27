function Layer (world, z, size_x, size_y) {
    this.world = world;
    this.z = z;
    this.size_x = size_x;
    this.size_y = size_y;
    this.tiles = [];

    for (let y = 0; y < size_y; y++) {
        for (let x = 0; x < size_x; x++) {
            this.tiles.push(new Tile(world, x, y, z));
        }
    }
}

/// Not bounds checked.
Layer.prototype.get_tile = function(x, y) {
    return this.tiles[x + y * this.size_x];
}

/// Not bounds checked.
Layer.prototype.set_tile = function(x, y, tile) {
    this.tiles[x + y * this.size_x] = tile;
}
