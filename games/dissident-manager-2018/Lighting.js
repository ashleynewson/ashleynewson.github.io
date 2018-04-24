"use strict";

const LightingOpacityGrid = function() {
    this.width = 1000;
    this.height = 1000;
    this.mult_x = 1 / assets.tile_w;
    this.mult_y = 1 / assets.tile_h;
    this.buf = new Uint8Array( this.width * this.height );
};

LightingOpacityGrid.prototype.set_opaque = function( x, y ) {
    this.buf[ x + ( y * this.width ) ] = 1;
};

// Raytrace from point to point.
LightingOpacityGrid.prototype.check_visual = function( from_x, from_y, to_x, to_y ) {
    const width = this.width;
    const height = this.height;
    const buf = this.buf;
    // Not using mult_x / mult_y as incoming coordinates are in grid space.
    //const mult_x = this.mult_x;
    //const mult_y = this.mult_y;

    const delta_x = to_x - from_x;
    const delta_y = to_y - from_y;
    const dist = Math.sqrt( delta_x*delta_x + delta_y*delta_y );
    const x_step = delta_x / dist;
    const y_step = delta_y / dist;

    for( let i_march = 0; i_march <= dist; i_march ++ ) {
        const x = from_x + ( x_step * i_march );
        const y = from_y + ( y_step * i_march );
        const x_grid = x | 0;
        const y_grid = y | 0;
        if( ( x_grid < 0 ) || ( y_grid < 0 ) || ( x_grid >= width ) || ( y_grid >= height ) ) {
            return false;
        }
        if( buf[ x_grid + ( y_grid * width ) ] !== 0 ) {
            // Opaque.
            return false;
        }
    }

    return true;
};

const LightBuf = function( w, h, n_ch ) {
    this.width = w;
    this.height = h;
    this.n_channels = n_ch;

    const n_words = w * h * n_ch;
    // 16-bit levels should be plenty.
    this.buf = new Uint16Array( n_words );
};

LightBuf.prototype.to_image_data = function( l_ambient ) {
    const buf = this.buf;
    const w = this.width;
    const h = this.height;
    const n_ch = this.n_channels;

    const clamped = new Uint8ClampedArray( 4 * w * h );

    let p_buf = 0, p_clamped = 0;
    for( let y = 0; y < h; y ++ ) {
        for( let x = 0; x < w; x ++ ) {
            let acc = l_ambient;
            for( let i_ch = 0; i_ch < n_ch; i_ch ++ ) {
                acc += buf[ p_buf ++ ];
            }
            clamped[p_clamped] = clamped[ p_clamped + 1 ] =
                clamped[ p_clamped + 2 ] = acc;
            p_clamped += 3;
            // Full alpha.
            clamped[ p_clamped ++ ] = 255;
        }
    }

    return new ImageData( clamped, w, h );
};

// A projected light.
// Rendered in three phases.
//  -- Cast rays, to determine reachability.
//  -- Calculate intensity.
//  -- Transfer to 
const Light = function( x_centre, y_centre, ang_start, ang_width, max_dist, intensity, channel ) {
    this.max_dist = max_dist;
    // Don't be conservative with buffer size.
    this.off_x = ( max_dist - x_centre ) | 0;
    this.off_y = ( max_dist - y_centre ) | 0;
    var buf_w = this.buf_w = ( max_dist << 1 ) | 0;
    var buf_h = this.buf_h = ( max_dist << 1 ) | 0;
    this.buf = new Uint16Array( buf_w * buf_h );

    this.x_centre = x_centre;
    this.y_centre = y_centre;
    this.ang_start = ang_start;
    this.ang_width = ang_width;
    this.intensity = intensity;
    this.channel = channel;
};

Light.prototype.paint = function( light_buf ) {
    const buf = this.buf;
    const buf_w = this.buf_w;
    const buf_h = this.buf_h;
    const off_x = this.off_x;
    const off_y = this.off_y;

    const channel = this.channel;

    const lb_buf = light_buf.buf;
    const lb_w = light_buf.width;
    const lb_h = light_buf.height;
    const lb_n_ch = light_buf.n_channels;
    const lb_perline = lb_w * lb_n_ch;

    let p = 0;
    for( let y = 0; y < buf_h; y ++ ) {
        for( let x = 0; x < buf_w; ( x ++, p ++ ) ) {
            const lb_x = x - off_x;
            const lb_y = y - off_y;
            // Clip.
            if( ( lb_x < 0 ) || ( lb_y < 0 ) || ( lb_x >= lb_w ) || ( lb_y >= lb_h ) ) {
                continue;
            }
            if( buf[ p ] === 0 ) continue;
            lb_buf[ channel + ( lb_x * lb_n_ch ) + ( lb_perline * lb_y ) ]
                += ( buf[p] / 256 ) | 0;
        }
    }
};

Light.prototype.cast_rays = function( opacity_grid ) {
    const buf = this.buf;
    const buf_w = this.buf_w;
    const off_x = this.off_x;
    const off_y = this.off_y;

    const grid = opacity_grid.buf;
    const grid_perline = opacity_grid.width
    const grid_mult_x = opacity_grid.mult_x;
    const grid_mult_y = opacity_grid.mult_y;

    const x_start = this.x_centre;
    const y_start = this.y_centre;
    const ang_start = this.ang_start;
    const max_dist = this.max_dist;

    // n_rays is equal to the pixel length of the arc at the distance boundary.
    const n_rays = 2 * max_dist * this.ang_width;
    const ang_step = 0.5 / max_dist; // ( = ang_width / n_rays. )
    for( let i_rays = 0; i_rays < n_rays; i_rays ++ ) {
        const ang = ang_start + ( ang_step * i_rays );
        const x_step = Math.cos( ang );
        const y_step = Math.sin( ang );
        // Ray-march until it hits something, or reaches max_dist.
        for( let i_march = 0; i_march < max_dist; i_march ++ ) {
            const x = x_start + ( x_step * i_march );
            const y = y_start + ( y_step * i_march );
            const x_grid = ( x * grid_mult_x ) | 0;
            const y_grid = ( y * grid_mult_y ) | 0;
            if( grid[ x_grid + ( y_grid * grid_perline ) ] !== 0 ) {
                break;
            }
            buf[ ( ( x + off_x ) | 0 ) + ( ( ( y + off_y ) | 0 ) * buf_w ) ] = 200;
        }
    }
};

Light.prototype.random_sample = function( opacity_grid ) {
    const PIXELS_PER_STEP = 4;

    const grid = opacity_grid.buf;
    const grid_perline = opacity_grid.width
    const grid_mult_x = opacity_grid.mult_x;
    const grid_mult_y = opacity_grid.mult_y;

    const x_start = this.x_centre;
    const y_start = this.y_centre;

    const max_dist = this.max_dist;
    const ang = this.ang_start + ( this.ang_width * Math.random() );

    const x_step = Math.cos( ang );
    const y_step = Math.sin( ang );
    let i_march = 0;
    for( ; i_march < max_dist; i_march += PIXELS_PER_STEP ) {
        const x = x_start + ( x_step * i_march );
        const y = y_start + ( y_step * i_march );
        const x_grid = ( x * grid_mult_x ) | 0;
        const y_grid = ( y * grid_mult_y ) | 0;
        if( grid[ x_grid + ( y_grid * grid_perline ) ] !== 0 ) {
            break;
        }
    }

    i_march = ( i_march * Math.random() ) | 0;
    return {
        x: ( x_start + ( x_step * i_march ) ) * grid_mult_x,
        y: ( y_start + ( y_step * i_march ) ) * grid_mult_y
    };
};

Light.prototype.shade = function() {
    const buf = this.buf;
    const buf_w = this.buf_w;
    const buf_h = this.buf_h;
    const off_x = this.off_x;
    const off_y = this.off_y;

    const x_centre = this.x_centre;
    const y_centre = this.y_centre;
    const intensity = this.intensity;

    let p = 0;
    for( let y = 0; y < buf_h; y ++ ) {
        for( let x = 0; x < buf_w; ( x ++, p ++ ) ) {
            if( buf[p] === 0 ) {
                continue;
            }
            const dx = x - x_centre - off_x;
            const dy = y - y_centre - off_y;
            const r_sq = dx*dx + dy*dy;
            buf[p] = ( 65535 / ( 1 + r_sq / intensity ) ) & 65535;
        }
    }
};

/*LightProjection.prototype.triangle = function( ax, bx, cx, ay, by, cy ) {
    if( ay < by ) {
        if( ay < cy ) {
            // ay is min.
            if( by < cy ) {
                // a -- b -- c
                this.triangle_ordered( ax, bx, cx, ay, by, cy );
            } else {
                // a -- c -- b
                this.triangle_ordered( ax, cx, bx, ay, cy, by );
            }
        } else {
            // c -- a -- b
            this.triangle_ordered( cx, ax, bx, cy, ay, by );
        }
    } else {
        if( by < cy ) {
            // by is min.
            if( ay < cy ) {
                // b -- a -- c
                this.triangle_ordered( bx, ax, cx, by, ay, cy );
            } else {
                // b -- c -- a
                this.triangle_ordered( bx, cx, ax, by, cy, ay );
            }
        } else {
            // c -- b -- a
            this.triangle_ordered( cx, bx, ax, cy, by, ay );
        }
    }
};

LightProjection.prototype.triangle_ordered = function( ax, bx, cx, ay, by, cy ) {
    // Calculate dx. dy =def by.
    const dx = ( ( cx - ax ) * ( by - ay ) / ( cy - ay ) ) + ax;
    
};*/
