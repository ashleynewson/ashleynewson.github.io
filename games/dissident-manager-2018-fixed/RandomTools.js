var RandomTools = {
    smooth_surface: function(size_x, size_y, min_detail, max_detail) {
        let surface = [];
        for (let y = 0; y < size_y; y++) {
            for (let x = 0; x < size_x; x++) {
                surface.push(0.0);
            }
        }

        for (let detail = min_detail; detail <= max_detail; detail *= 2) {
            let weights = [];
            let weights_size_x = (((size_x+1) / detail) | 0) + 1;
            let weights_size_y = (((size_y+1) / detail) | 0) + 1;
            
            for (let y = 0; y < weights_size_y; y++) {
                for (let x = 0; x < weights_size_x; x++) {
                    weights.push(Math.random()*2 - 1); // Eww
                }
            }

            for (let y = 0; y < size_y; y++) {
                for (let x = 0; x < size_x; x++) {
                    let x1 =  (x / detail) | 0;
                    let x2 = ((x / detail) | 0) + 1;
                    let y1 =  (y / detail) | 0;
                    let y2 = ((y / detail) | 0) + 1;
                    let w11 = weights[x1 + y1 * weights_size_x];
                    let w12 = weights[x1 + y2 * weights_size_x];
                    let w21 = weights[x2 + y1 * weights_size_x];
                    let w22 = weights[x2 + y2 * weights_size_x];
                    let bx2 = x / detail - x1;
                    let bx1 = 1 - bx2;
                    let by2 = y / detail - y1;
                    let by1 = 1 - by2;

                    let w = w11 * bx1 * by1
                          + w12 * bx1 * by2
                          + w21 * bx2 * by1
                          + w22 * bx2 * by2;
                    surface[x + y * size_x] = (surface[x + y * size_x] * 0.5) + w * 0.5;
                }
            }
        }
        return surface;
    }
};
