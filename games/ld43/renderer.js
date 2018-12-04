'use strict';

function Vec2D( x_, y_ ) {
    this.x = x_;
    this.y = y_;
}

function fractal_noise( x, y, o ) {
    if( o === 0 ) return 0;

    return fractal_noise( x * 2, y * 2, o - 1 ) * 0.5 + noise.simplex3( x, y, o );
}

function terrain_func( x, y ) {
    var raw = fractal_noise( x, y, 8 ) * 4;

    var levelled = 0.05 + ( raw - 0.7 * Math.sin( raw ) ) * 0.125;

    if( levelled < 0 ) return levelled *= 0.5;
    return levelled;
}

/*
 * Terrain data is:
 *
 *  0            16    24      32
 *  +------------+------+-------+
 *  | altitude   |    HH| light |
 *  +------------+------+-------+
 *  HH = hydrated
 */
function Terrain( width_, height_ ) {
    this.width = width_;
    this.height = height_;

    // Two channels: altitude + light.
    this.data = new Uint16Array( width_ * height_ * 2 );

    this.rains = {};

    this.generate_sines();
    this.calculate_lighting();
    this.calculate_shadows();
}

Terrain.prototype.generate_sines = function() {
    var data = this.data;
    var width = this.width;
    var height = this.height;

    var x_scale = 1 / 600;
    var y_scale = 1 / 600;

    for( var x = 0; x < width; x ++ ) {
        for( var y = 0; y < height; y ++ ) {
            var alt = 32000 +
                ( 32000 * terrain_func( x * x_scale, y * y_scale ) ) | 0;
                //( 8000 * noise2d( 5000 + x * x_scale, 5000 + y * y_scale, 1 ) ) | 0 ;
                //( Math.sin( x * x_scale ) + Math.sin( y * y_scale ) );

            data[ ( ( y * width ) + x ) << 1 ] = alt;
            data[ ( ( ( y * width ) + x ) << 1 ) | 1 ] = ( alt < 32100 ) ? 768 : 0;
        }
    }
};

Terrain.prototype.calculate_lighting = function() {
    var data = this.data;
    var width = this.width;
    var height = this.height;

    var x_scale = 1 / ( 5 * Math.PI );
    var y_scale = 1 / ( 5 * Math.PI );

    for( var y = 1; y < height; y ++ ) {
        var over = data[ ( ( y * width ) + x - 1 ) << 1 ];
        for( var x = 1; x < width; x ++ ) {
            var left = over;
            over = data[ ( ( y * width ) + x ) << 1 ];
            var above = data[ ( ( ( y - 1 ) * width ) + x ) << 1 ];
            var dx = over - left;
            var dy = over - above;

            // Rough direct diffuse shader.
            var vec_len = Math.sqrt( dx*dx + dy*dy + 2000000 );
            var light = ( 96 + 128 * Math.abs( dx + dy ) / vec_len );
            // Slight dithering effect.
            light += ( Math.random() * 16 - 32 ) | 0;
            light >>= 3;
            light <<= 3;
            data[ ( ( ( y * width ) + x ) << 1 ) | 1 ] |= light & 255;
        }
    }
};

Terrain.prototype.calculate_shadows = function() {
    var data = this.data;
    var width = this.width;
    var height = this.height;

    for( var y = 1; y < height; y ++ ) {
        var shadow_alt = 0;
        for( var x = 1; x < width; x ++ ) {
            var alt = data[ ( ( y * width ) + x ) << 1 ];
            shadow_alt -= 100;
            if( alt <= shadow_alt ) {
                // Divide light by two.
                var light = data[ ( ( ( y * width ) + x ) << 1 ) | 1 ] & 255;
                data[ ( ( ( y * width ) + x ) << 1 ) | 1 ] ^= light ^ ( light - 32 );
            } else {
                shadow_alt = alt;
            }
        }
    }
};

Terrain.prototype.process_rains = function() {
    var data = this.data;
    var rains = this.rains;

    var ks = Object.keys( this.rains );
    var i, n = ks.length;
    for( i = 0; i < n; i ++ ) {
        //if( Math.random() > 0.1 ) continue;

        var key = ks[i];
        var rn = rains[key];

        var addr = ( ( rn.y * this.width ) + rn.x ) << 1;
        var wetness = ( data[ addr | 1 ] & 768 ) >> 8;
        /*if( Math.random() > 0.9 ) {
            wetness --;
        }*/

        // Rain onto adjacent space.
        var alt = data[addr];
        if( alt < 32100 ) {
            // In the sea.
            delete rains[key];
            continue;
        }
        for( var j = 0; j < 128; j ++ ) {
            var nx = ( ( ( j & 1 ) === 1 ) ? 1 : -1 );
            var ny = ( ( ( j & 2 ) === 2 ) ? 1 : -1 );

            nx += rn.x;
            ny += rn.y;

            var neigh_addr = ( ( ny * this.width ) + nx ) << 1;
            if( ( data[ neigh_addr | 1 ] & 768 ) !== 0 ) {
                continue;
            }
            var neigh_alt = data[ neigh_addr ];
            if( Math.random() < ( ( neigh_alt < alt ) ? 0.9 : 0.3 ) ) {
                this.rain( nx, ny );
                if( --wetness <= 0 ) {
                    data[ addr | 1 ] &= ~768;
                    delete rains[key];
                    break;
                }
            }
        }
        delete rains[key];
    }
}

Terrain.prototype.rain = function( x, y ) {
    var data = this.data;

    var addr = ( ( y * this.width ) + x ) << 1;
    if( data[addr] <= 32100 ) {
        // Below sea level.
        return;
    }
    var orig_rain = data[ addr | 1 ] & 768;
    var rain = orig_rain;
    rain += 256;
    rain &= 768;
    data[ addr | 1 ] ^= orig_rain ^ rain;

    var key = "x" + x + "y" + y;
    this.rains[key] = { x: x, y: y };

    /*for(;;) {
        var orig_rain = ( data[ addr | 1 ] & 768 ) >> 8;
        if( orig_rain !== 0 ) {
            var alt = data[addr];
            var best_addr = 1;
            for( var i = 0; i < 4; i ++ ) {
                var neigh_addr = ( ( ( y + ( ( ( i & 1 ) === 1 ) ? 1 : -1 ) ) * this.width )
                                   + x + ( ( ( i & 2 ) === 2 ) ? 1 : -1 ) ) << 1;
                if( data[neigh_addr] < alt && ( ( data[neigh_addr|1] & 768 ) === 0 ) ) {
                    alt = data[neigh_addr];
                    best_addr = neigh_addr;
                }
            }
            if( best_addr !== 1 ) {
                addr = best_addr;
                continue;
            }
        }
        var rain = orig_rain + 1;
        rain <<= 8;
        orig_rain <<= 8;
        data[ addr | 1 ] ^= orig_rain ^ rain;
        if( ( data[ addr | 1 ] & 768 ) === 0 ) debugger;
        break;
    };*/
};

function Renderer( screen_data_, width_, height_ ) {
    this.terrain = new Terrain( 2000, 2000 );

    this.screen_data = screen_data_;
    this.width = width_;
    this.height = height_;

    this.camera_x = 200;
    this.camera_y = 0;

    //this.y_scale = 1;
    //this.alt_scale = 1 / 256;
    this.y_scale = 0.8;
    this.alt_scale = 1 / 128;

    this.ybuf = new Uint16Array( width_ * height_ );
}

Renderer.prototype.paint = function() {
    var terrain = this.terrain;
    var ter_data = terrain.data;
    var ter_width = terrain.width;
    var ter_height = terrain.height;

    var data = this.screen_data;
    var ybuf = this.ybuf;
    var width = this.width;
    var height = this.height;

    var camera_x = this.camera_x;
    var camera_y = this.camera_y;

    var y_scale = this.y_scale;
    var alt_scale = this.alt_scale;
    var y_offset = -camera_y * y_scale + 32000 * alt_scale;

    var p = 0;
    for( var x = 0; x < width; x ++ ) {
        // Iterate through texture.
        // Orthographic projection.
        var bx = x + camera_x;
        var by = camera_y + height + 300;
        var ax = bx;
        var ay = camera_y;
        var dx_by_dy = ( bx - ax ) / ( by - ay );

        var y_prev = 0;

        // Start in sky (blue).
        var prev_r = 64;
        var prev_g = 64;
        var prev_b = 255;

        for( var ty = ay; ty < by; ty ++ ) {
            var tx = ( ax + ( ty - ay ) * dx_by_dy ) | 0;

            // Calculate texel y position on screen.
            var alt = ter_data[ ( ( ty * ter_width ) + tx ) << 1 ];
            var y = ( y_offset + ty * y_scale - alt * alt_scale ) | 0;
            y = Math.min( Math.max( y, 0 ), height );

            if( y < y_prev ) {
                y_prev = y;
            }

            var col_r = prev_r & 255;
            var col_g = prev_g & 255;
            var col_b = prev_b & 255;

            // Fill line segment from previous texel.
            var p_end = ( ( y * width ) + x ) << 2;
            // Depth buffer is stored in columns, not lines.
            var pz = x * height + y_prev;
            for( var p = ( ( y_prev * width ) + x ) << 2;
                 p < p_end;
                 p += width << 2, pz ++ ) {
                //if( p >= data.length ) throw 0;
                data[p] = col_r;
                data[p+1] = col_g;
                data[p+2] = col_b;
                data[p+3] = 255;

                // set depth buffer.
                ybuf[pz] = ty;
            }

            var wet = ( ter_data[ ( ( ( ty * ter_width ) + tx ) << 1 ) | 1 ] & 768 ) !== 0;
            var light = ( ter_data[ ( ( ( ty * ter_width ) + tx ) << 1 ) | 1 ] & 255 );
            var rock = 0.5 + 1 / ( 2 + Math.exp( 0.001 * ( 42000 - ( ter_data[ ( ( ( ty * ter_width ) + tx ) << 1 ) ]) ) ) );

            //var fog_mul = Math.exp( - 0.6 * ( 2 - ty / height ) );
            //var fog_add = ( 1 - fog_mul ) * 255;
            var fog_mul = 1;
            var fog_add = 0;

            if( alt < 32100 ) {
                prev_r = 1;
                prev_g = 1;
                prev_b = 1;
            } else {
                prev_r = rock;
                prev_g = 1;
                prev_b = rock;
            }
            prev_r *= light;
            prev_g *= light;
            prev_b *= light;
            if( wet ) {
                prev_r *= 0.6;
                prev_g *= 0.6;
                prev_b *= 0.6;
                prev_r += 16;
                prev_g += 16;
                prev_b += 64;
            }
            prev_r *= fog_mul; prev_g *= fog_mul; prev_b *= fog_mul;
            prev_r += fog_add; prev_g += fog_add; prev_b += fog_add;

            y_prev = y;
        }
    }
};

var tmp_vec = new Vec2D( 1.1, 1.1 );
Renderer.prototype.paint_sprite = function( wx, wy, buf, w, h, offset, scan ) {
    wx |= 0;
    wy |= 0;
    this.world_to_screen( wx, wy, tmp_vec );
    var x = tmp_vec.x | 0, y = tmp_vec.y | 0;

    if( ( wx < this.camera_x ) || ( wx > this.camera_x + this.width ) ||
        ( wy < this.camera_y ) || ( wy > this.camera_y + this.height + 400 ) ) {
        return;
    }

    var data = this.screen_data;
    var screen_width = this.width;
    var screen_height = this.height;

    var ybuf = this.ybuf;

    var wet = ( this.terrain.data[ ( ( ( ( wy | 0 ) * this.terrain.width ) + ( wx | 0 ) ) << 1 ) | 1 ] & 768 ) !== 0;

    y -= h;
    var p = ( ( y * screen_width ) + x ) << 2;
    var ps = offset << 2;
    for( var iy = 0; iy < h; ( iy ++, p += ( screen_width - w ) << 2, ps += scan << 2 ) ) {
        for( var ix = 0; ix < w; ( ix ++, p += 4, ps += 4 ) ) {
            if( ybuf[ ( ( x + ix ) * screen_height ) + ( y + iy ) ] >= wy ) continue;
            var alpha = buf[ps+3];
            if( alpha === 0 ) continue;
            var unalpha = 255 - alpha;
            data[p] = ( unalpha * data[p] + alpha * buf[ps] ) >> 8;
            data[p+1] = ( unalpha * data[p+1] + alpha * buf[ps+1] ) >> 8;
            data[p+2] = ( unalpha * data[p+2] + alpha * buf[ps+2] ) >> 8;
            if( wet ) {
                data[p] >>= 2;
                data[p+1] >>= 2;
                data[p+2] >>= 2;
                data[p] += 32;
                data[p+1] += 32;
                data[p+2] += 128;
            }
        }
    }
};

Renderer.prototype.screen_to_world = function( x, y, out ) {
    out.x = x + this.camera_x;
    out.y = this.ybuf[ ( x * this.height ) + y ];
};

Renderer.prototype.world_to_screen = function( x, y, out ) {
    out.x = x - this.camera_x;
    var alt = this.terrain.data[ ( ( y * this.terrain.width ) + x ) << 1 ];
    out.y = ( y - this.camera_y ) * this.y_scale - ( alt - 32000 ) * this.alt_scale;
};

/*( function() {
    var canv = document.createElement( "canvas" );
    canv.width = 1024;
    canv.height = 768;
    document.getElementsByTagName( 'body' )[0].appendChild( canv );
    var ctx = canv.getContext( '2d' );
    var imgd = ctx.createImageData( canv.width, canv.height );
    var img_bytes = canv.width * canv.height * 4;
    var data_clamped = new Uint8ClampedArray( img_bytes );
    var data_unclamped = new Uint8Array( data_clamped.buffer );

    var sprites = [];
    for( var i = 0; i < 2000; i ++ ) {
        sprites.push( new Vec2D(
            ( Math.random() * 2000 ) | 0, ( Math.random() * 2000 ) | 0
        ) );
    }
    var sprite_buf = new Uint8Array( 128 );
    for( i = 0; i < 128; i += 4 ) {
        sprite_buf[i] = 255;
        sprite_buf[i+1] = 192;
        sprite_buf[i+2] = 192;
    }

    var renderer = new Renderer( data_unclamped, canv.width, canv.height );
    function update() {
        renderer.paint();

        for( var i = 0; i < sprites.length; i ++ ) {
            var sp = sprites[i];
            sp.x += ( ( Math.random() * 3 ) | 0 ) - 1;
            sp.y += ( ( Math.random() * 3 ) | 0 ) - 1;

            renderer.paint_sprite( sp.x, sp.y, sprite_buf, 4, 8 );
        }

        imgd.data.set( data_clamped );
        ctx.putImageData( imgd, 0, 0 );

        // Nothing is changing, so don't animate for now.
        requestAnimationFrame( update );
    }
    update();
} )();*/
