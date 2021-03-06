var assets = {
    graphics: {},
};

for (let i of resources_list.graphics) {
    store_resource_categorise(new Graphic(i.spec), assets.graphics, i.name);
}

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
