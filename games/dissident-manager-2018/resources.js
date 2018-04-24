var assets = {
    graphics: {},
    sounds: {},
};

for (let i of resources_list.graphics) {
    store_resource_categorise(new Graphic(i.spec), assets.graphics, i.name);
}

for (let i of resources_list.sounds) {
    store_resource_categorise(new Sound(i.spec), assets.sounds, i.name);
}

assets.tile_w = assets.graphics.tiles.debug.frame_size_x;
assets.tile_h = assets.graphics.tiles.debug.frame_size_y;

function store_resource_categorise(resource, category, path) {
    let parts = path.split('.');
    let name = parts.pop();
    let dest = category;
    for (let part of parts) {
        if (typeof(dest[part]) === "undefined") {
            dest[part] = {};
        }
        dest = dest[part];
    }
    dest[name] = resource;
}
