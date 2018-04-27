var resources_list = {
    "graphics": [
        {
            "name" : "tiles.debug",
            "spec" : {
                "filename" : "tiles/debug.png",
                "transparent" : true,
                "frame_size_x" : 16,
                "frame_size_y" : 16
            }
        },
        {
            "name" : "tiles.grid_lines",
            "spec" : {
                "filename" : "tiles/grid.png",
                "transparent" : true,
                "frame_size_x" : 16,
                "frame_size_y" : 16
            }
        },
        {
            "name" : "tiles.cursor",
            "spec" : {
                "filename" : "tiles/cursor.png",
                "transparent" : true,
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "animation_period" : 0.5
            }
        },
        {
            "name" : "tiles.cursor.floating",
            "spec" : {
                "filename" : "tiles/cursor.png",
                "transparent" : true,
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "offset_x" : 8,
                "offset_y" : 8,
                "animation_period" : 0.5
            }
        },

        {
            "name" : "tiles.floor.gravel",
            "spec" : {
                "filename" : "tiles/gravel.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16
            }
        },
        {
            "name" : "tiles.floor.checker",
            "spec" : {
                "filename" : "tiles/floor_tiles.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16
            }
        },
        {
            "name" : "tiles.floor.wood",
            "spec" : {
                "filename" : "tiles/wood.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16
            }
        },
        {
            "name" : "tiles.floor.grass",
            "spec" : {
                "filename" : "tiles/grass.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16
            }
        },
        {
            "name" : "tiles.concrete",
            "spec" : {
                "filename" : "tiles/concrete.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16
            }
        },
        {
            "name" : "tiles.light.ceiling.on",
            "spec" : {
                "filename" : "tiles/ceiling_light_on.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16
            }
        },
        {
            "name" : "tiles.light.ceiling.off",
            "spec" : {
                "filename" : "tiles/ceiling_light_off.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16
            }
        },
        {
            "name" : "tiles.window",
            "spec" : {
                "filename" : "tiles/window.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "transparent" : true
            }
        },
        {
            "name" : "tiles.window.broken",
            "spec" : {
                "filename" : "tiles/window_broken.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "transparent" : true
            }
        },
        {
            "name" : "tiles.broken_glass",
            "spec" : {
                "filename" : "tiles/broken_glass.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "transparent" : true
            }
        },
        {
            "name" : "tiles.fence",
            "spec" : {
                "filename" : "tiles/fence.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "transparent" : true
            }
        },
        {
            "name" : "tiles.bush",
            "spec" : {
                "filename" : "tiles/bush.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "transparent" : true
            }
        },

        {
            "name" : "entities.enemy.head",
            "spec" : {
                "filename" : "entities/head_enemy.png",
                "frame_size_x" : 8,
                "frame_size_y" : 8,
                "offset_x" : 4,
                "offset_y" : 4
            }
        },
        {
            "name" : "entities.enemy.torso",
            "spec" : {
                "filename" : "entities/torso_enemy.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "offset_x" : 8,
                "offset_y" : 8,
                "joints" : {
                    "left_foot" : {"x": 0, "y": -2},
                    "right_foot" : {"x": 0, "y": 2},
                    "head" : {"x": 0, "y": 0},
                    "gun" : {"x": 3, "y": 2}
                },
                "join_under": ["left_foot", "right_foot"],
                "join_over": ["gun", "head"]
            }
        },
        {
            "name" : "entities.enemy.hand.left",
            "spec" : {
                "filename" : "entities/hand_enemy.png",
                "frame_size_x" : 5,
                "frame_size_y" : 5,
                "offset_x" : 2,
                "offset_y" : 3
            }
        },
        {
            "name" : "entities.enemy.hand.right",
            "spec" : {
                "filename" : "entities/hand_enemy.png",
                "frame_size_x" : 5,
                "frame_size_y" : 5,
                "offset_x" : 2,
                "offset_y" : 2
            }
        },
        {
            "name" : "entities.enemy.foot.left",
            "spec" : {
                "filename" : "entities/foot_enemy.png",
                "frame_size_x" : 8,
                "frame_size_y" : 4,
                "offset_x" : 3,
                "offset_y" : 2
            }
        },
        {
            "name" : "entities.enemy.foot.right",
            "spec" : {
                "filename" : "entities/foot_enemy.png",
                "frame_size_x" : 8,
                "frame_size_y" : 4,
                "offset_x" : 3,
                "offset_y" : 2
            }
        },
        {
            "name" : "entities.gun",
            "spec" : {
                "filename" : "entities/gun.png",
                "frame_size_x" : 13,
                "frame_size_y" : 3,
                "offset_x" : 1,
                "offset_y" : 1,
                "joints" : {
                    "left_hand" : {"x": 6, "y": 0},
                    "right_hand" : {"x": 2, "y": 1},
                    "muzzle" : {"x": 12, "y": 0}
                },
                "join_under": ["left_hand", "right_hand"],
                "join_over": ["muzzle"]
            }
        },
        {
            "name" : "entities.muzzle_flash",
            "spec" : {
                "filename" : "entities/muzzle_flash.png",
                "frame_size_x" : 8,
                "frame_size_y" : 5,
                "offset_x" : 0,
                "offset_y" : 2
            }
        },
        {
            "name" : "entities.tracer",
            "spec" : {
                "filename" : "entities/tracer.png",
                "frame_size_x" : 12,
                "frame_size_y" : 1,
                "offset_x" : 11,
                "offset_y" : 0
            }
        },
        {
            "name" : "entities.friendly.head",
            "spec" : {
                "filename" : "entities/head_friendly.png",
                "frame_size_x" : 8,
                "frame_size_y" : 8,
                "offset_x" : 4,
                "offset_y" : 4
            }
        },
        {
            "name" : "entities.friendly.torso",
            "spec" : {
                "filename" : "entities/torso_friendly.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "offset_x" : 8,
                "offset_y" : 8,
                "joints" : {
                    "left_foot" : {"x": 0, "y": -2},
                    "right_foot" : {"x": 0, "y": 2},
                    "head" : {"x": 0, "y": 0},
                    "gun" : {"x": 3, "y": 2}
                },
                "join_under": ["left_foot", "right_foot"],
                "join_over": ["gun", "head"]
            }
        },
        {
            "name" : "entities.friendly.hand.left",
            "spec" : {
                "filename" : "entities/hand_friendly.png",
                "frame_size_x" : 5,
                "frame_size_y" : 5,
                "offset_x" : 2,
                "offset_y" : 3
            }
        },
        {
            "name" : "entities.friendly.hand.right",
            "spec" : {
                "filename" : "entities/hand_friendly.png",
                "frame_size_x" : 5,
                "frame_size_y" : 5,
                "offset_x" : 2,
                "offset_y" : 2
            }
        },
        {
            "name" : "entities.friendly.foot.left",
            "spec" : {
                "filename" : "entities/foot_friendly.png",
                "frame_size_x" : 8,
                "frame_size_y" : 4,
                "offset_x" : 3,
                "offset_y" : 2
            }
        },
        {
            "name" : "entities.friendly.foot.right",
            "spec" : {
                "filename" : "entities/foot_friendly.png",
                "frame_size_x" : 8,
                "frame_size_y" : 4,
                "offset_x" : 3,
                "offset_y" : 2
            }
        },
        {
            "name" : "entities.blood.splat",
            "spec" : {
                "filename" : "entities/blood_splat.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "offset_x" : 8,
                "offset_y" : 8
            }
        },
        {
            "name" : "entities.blood.drip",
            "spec" : {
                "filename" : "entities/blood_drip.png",
                "frame_size_x" : 16,
                "frame_size_y" : 16,
                "offset_x" : 8,
                "offset_y" : 8
            }
        },
        {
            "name" : "entities.blood.pool",
            "spec" : {
                "filename" : "entities/blood_pool.png",
                "frame_size_x" : 48,
                "frame_size_y" : 48,
                "offset_x" : 24,
                "offset_y" : 24
            }
        },
        {
            "name" : "entities.corpse.friendly",
            "spec" : {
                "filename" : "entities/corpse_friendly.png",
                "frame_size_x" : 38,
                "frame_size_y" : 19,
                "offset_x" : 19,
                "offset_y" : 9
            }
        }
    ],
    "sounds": [
        {
            "name" : "debug",
            "spec" : {
                "filename" : "debug.mp3"
            }
        },
        {
            "name" : "gunshot",
            "spec" : {
                "filename" : "gunshot.mp3",
                "volume" : 0.1
            }
        },
        {
            "name" : "death",
            "spec" : {
                "filename" : "death.mp3",
                "volume" : 0.5
            }
        }
    ]
};
