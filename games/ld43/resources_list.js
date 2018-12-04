var resources_list = {
    "graphics": [
        {
            "name" : "debug",
            "spec" : {
                "file" : "debug.png",
                "transparent" : false,
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "offset_x": 8,
                "offset_y": 8,
                "animation_period": 1.0,
            }
        },
        {
            "name" : "human.standing",
            "spec" : {
                "file" : "people/tones.png",
                "stencil_file" : "people/plan.png",
                "stencil_map" : {
                    "head" : "#ff0000",
                    "chest" : "#ffff00",
                    "l_arm" : "#ff00ff",
                    "r_arm" : "#00ffff",
                    "l_leg" : "#0000ff",
                    "r_leg" : "#00ff00",
                },
                "transparent" : true,
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "offset_x": 8,
                "offset_y": 16,
                "animation_period": 1.0,
            }
        },
        {
            "name" : "human.walking",
            "spec" : {
                "file" : "people/tones_walk.png",
                "stencil_file" : "people/plan_walk.png",
                "stencil_map" : {
                    "head" : "#ff0000",
                    "chest" : "#ffff00",
                    "l_arm" : "#ff00ff",
                    "r_arm" : "#00ffff",
                    "l_leg" : "#0000ff",
                    "r_leg" : "#00ff00",
                },
                "transparent" : true,
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "offset_x": 8,
                "offset_y": 16,
                "animation_period": 1.0,
            }
        },
        {
            "name" : "plants.tree1.dead",
            "spec" : {
                "file" : "plants/dead_tree1.png",
                "transparent" : true,
                "frame_size_x" : 16,
                "frame_size_y" : 32,
                "offset_x": 8,
                "offset_y": 32,
            }
        },
        {
            "name" : "plants.tree1.light",
            "spec" : {
                "file" : "plants/light_tree1.png",
                "transparent" : true,
                "frame_size_x" : 16,
                "frame_size_y" : 32,
                "offset_x": 8,
                "offset_y": 32,
            }
        },
        {
            "name" : "plants.tree1.heavy",
            "spec" : {
                "file" : "plants/heavy_tree1.png",
                "transparent" : true,
                "frame_size_x" : 16,
                "frame_size_y" : 32,
                "offset_x": 8,
                "offset_y": 32,
            }
        },
        {
            "name" : "plants.bush1.dead",
            "spec" : {
                "file" : "plants/dead_bush1.png",
                "transparent" : true,
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "offset_x": 8,
                "offset_y": 16,
            }
        },
        {
            "name" : "plants.bush1.light",
            "spec" : {
                "file" : "plants/light_bush1.png",
                "transparent" : true,
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "offset_x": 8,
                "offset_y": 16,
            }
        },
        {
            "name" : "plants.bush1.heavy",
            "spec" : {
                "file" : "plants/heavy_bush1.png",
                "transparent" : true,
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "offset_x": 8,
                "offset_y": 16,
            }
        },
        {
            "name" : "plants.field",
            "spec" : {
                "file" : "plants/field.png",
                "stencil_file" : "plants/field_stencil.png",
                "stencil_map" : {
                    "stem" : "#ffffff",
                },
                "transparent" : true,
                "frame_size_x" : 32,
                "frame_size_y" : 32,
                "offset_x": 16,
                "offset_y": 16,
                "animation_period": 1.0,
            }
        },
        {
            "name" : "structures.hovel",
            "spec" : {
                "file" : "structures/hovel_noisy.png",
                "transparent" : true,
                "frame_size_x" : 32,
                "frame_size_y" : 32,
                "offset_x": 16,
                "offset_y": 16,
            }
        },
        {
            "name" : "ui.faith",
            "spec" : {
                "file" : "interface/faith.png",
                "transparent" : false,
                "frame_size_x" : 32,
                "frame_size_y" : 32,
                "offset_x": 0,
                "offset_y": 0,
            }
        },
        {
            "name" : "ui.water",
            "spec" : {
                "file" : "interface/water.png",
                "transparent" : false,
                "frame_size_x" : 32,
                "frame_size_y" : 32,
                "offset_x": 0,
                "offset_y": 0,
            }
        },
        {
            "name" : "ui.progress_overlay",
            "spec" : {
                "file" : "interface/glass_bar.png",
                "transparent" : true,
                "frame_size_x" : 208,
                "frame_size_y" : 32,
                "offset_x": 0,
                "offset_y": 0,
            }
        },
        {
            "name" : "ui.progress",
            "spec" : {
                "file" : "interface/progress.png",
                "stencil_file" : "interface/progress.png",
                "stencil_map" : {
                    "color" : "#ffffff",
                },
                "transparent" : true,
                "frame_size_x" : 204,
                "frame_size_y" : 24,
                "offset_x": -4,
                "offset_y": -4,
            }
        },
    ],
    "sounds": [
    ],
};
