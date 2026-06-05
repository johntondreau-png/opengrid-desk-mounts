// ============================================
// Gridfinity Parametric Bin + Baseplate  v1
// 42mm modular storage system (spec by Zack Freedman)
//
// THIS IS GRIDFINITY (42mm grid, bins + baseplates for
// drawer / desktop organization) -- a DIFFERENT system
// from the OpenGrid (28mm wall-mount) files in this repo.
//
// Set `part` below to choose what to render:
//   "bin"       -> a storage bin (gx x gy x gh units)
//   "baseplate" -> a baseplate the bins drop into (gx x gy)
//
// Canonical dimensions (Gridfinity spec):
//   Grid pitch (X/Y) ........ 42.0 mm
//   Height unit (Z) ......... 7.0 mm
//   Bin/foot clearance ...... 0.25 mm per side (0.5 total)
//   Base ("foot") profile, top -> bottom:
//       2.15 mm  45-degree chamfer (top, meets body)
//       1.80 mm  vertical
//       0.80 mm  45-degree chamfer (bottom edge)
//     => base height 4.75 mm, bottom corner radius 0.8 mm
//
// Repo: github.com/johntondreau-png/opengrid-desk-mounts
// ============================================

/* [What to render] */
// Part to generate
part = "bin"; // [bin, baseplate]

/* [Grid Size] */
// Footprint width in grid units (X)
gx = 2;
// Footprint depth in grid units (Y)
gy = 1;
// Bin height in 7mm units (Z) -- ignored for baseplate
gh = 3;

/* [Bin Options] */
// Outer wall thickness (mm)
wall = 1.2;
// Solid floor thickness above the base feet (mm)
floor_th = 1.0;
// Add a stacking lip on top so bins nest when stacked
stacking_lip = true;
// Compartment dividers along X (0 = none)
divx = 0;
// Compartment dividers along Y (0 = none)
divy = 0;
// Divider wall thickness (mm)
div_wall = 1.2;

/* [Baseplate Options] */
// Solid floor under the foot pockets (mm)
bp_floor = 0.8;

/* [Quality] */
// Facets per circle (raise for final render)
$fn = 48;

// ============================================
// Constants (Gridfinity spec -- do not change)
// ============================================
PITCH      = 42.0;          // grid center-to-center
Z_UNIT     = 7.0;           // height unit
CLEAR      = 0.25;          // clearance per side
BODY       = PITCH - 2*CLEAR; // 41.5mm body footprint per cell
R_OUT      = 3.75;          // outer corner radius (top of base / body)

// Base ("foot") profile segment heights, top -> bottom
CH_TOP     = 2.15;          // upper 45deg chamfer
STRAIGHT   = 1.80;          // vertical mid section
CH_BOT     = 0.80;          // lower 45deg chamfer
BASE_H     = CH_TOP + STRAIGHT + CH_BOT;  // 4.75mm

EPS        = 0.01;

// Derived footprint sizes (whole bin)
function fp_w() = gx*PITCH - 2*CLEAR;   // outer width
function fp_d() = gy*PITCH - 2*CLEAR;   // outer depth

// ============================================
// Helpers
// ============================================

// A thin rounded-rectangle plate, centered, side = [w,d], corner r.
module rplate(w, d, r, h = EPS) {
    linear_extrude(height = h)
        offset(r = r) square([w - 2*r, d - 2*r], center = true);
}

// One Gridfinity base "foot", centered on origin.
// Widest face (the top, where it meets the body) is flush at z = 0;
// the foot extends DOWN to z = -BASE_H.
module foot() {
    // sizes at each profile break (square side per single cell)
    s_top = BODY;                 // 41.5  (r = R_OUT = 3.75)
    s_mid = BODY - 2*CH_TOP;      // 37.20 (r = 1.60)
    s_bot = s_mid - 2*CH_BOT;     // 35.60 (r = 0.80)
    r_mid = R_OUT - CH_TOP;       // 1.60
    r_bot = r_mid - CH_BOT;       // 0.80

    // upper chamfer: z = 0 -> z = -CH_TOP
    hull() {
        translate([0, 0, -EPS])      rplate(s_top, s_top, R_OUT);
        translate([0, 0, -CH_TOP])   rplate(s_mid, s_mid, r_mid);
    }
    // vertical mid: z = -CH_TOP -> z = -(CH_TOP+STRAIGHT)
    translate([0, 0, -(CH_TOP + STRAIGHT)])
        rplate(s_mid, s_mid, r_mid, STRAIGHT);
    // lower chamfer: -> z = -BASE_H
    hull() {
        translate([0, 0, -(CH_TOP + STRAIGHT)])     rplate(s_mid, s_mid, r_mid);
        translate([0, 0, -BASE_H + EPS])            rplate(s_bot, s_bot, r_bot);
    }
}

// Centers of every grid cell, used to tile feet / pockets.
module for_each_cell() {
    for (i = [0 : gx-1], j = [0 : gy-1])
        translate([ (i - (gx-1)/2) * PITCH,
                    (j - (gy-1)/2) * PITCH, 0 ])
            children();
}

// ============================================
// BIN
// Feet (z<0) + solid body block (z>0), hollowed into a
// compartment, with optional stacking lip and dividers.
// Overall height = gh * Z_UNIT (feet included).
// ============================================
module bin() {
    body_h = gh*Z_UNIT - BASE_H;   // body sits on top of the feet
    W = fp_w();
    D = fp_d();

    difference() {
        union() {
            // feet, one per grid cell
            for_each_cell() foot();
            // body block
            rplate(W, D, R_OUT, body_h);
            if (stacking_lip) translate([0, 0, body_h]) lip();
        }
        // hollow compartment(s)
        cavity(body_h);
    }
}

// Inner compartment cut (open top), respecting dividers.
module cavity(body_h) {
    iw = W_inner();
    id = D_inner();
    ir = max(R_OUT - wall, 0.1);
    // usable inner footprint, minus floor, open well above the top
    nx = divx + 1;
    ny = divy + 1;
    // size of one compartment opening
    cw = (iw - divx*div_wall) / nx;
    cd = (id - divy*div_wall) / ny;
    for (a = [0 : nx-1], b = [0 : ny-1]) {
        cx = -iw/2 + cw/2 + a*(cw + div_wall);
        cy = -id/2 + cd/2 + b*(cd + div_wall);
        translate([cx, cy, floor_th])
            rplate(cw, cd, min(ir, cw/2 - 0.01, cd/2 - 0.01),
                   body_h);   // extends past top -> open
    }
}

function W_inner() = fp_w() - 2*wall;
function D_inner() = fp_d() - 2*wall;

// Stacking lip: extends the wall up by LIP_H and cuts a 45deg
// funnel into the TOP INNER edge, so the chamfered base feet of
// a bin stacked on top seat into this opening.
// Outer wall stays at full footprint (continues the body wall);
// the inner opening widens toward the top.
LIP_H = CH_TOP + STRAIGHT;   // ~3.95mm rim above the body
module lip() {
    W  = fp_w();
    D  = fp_d();
    iw = W - 2*wall;         // inner bore = matches the cavity
    id = D - 2*wall;
    ir = max(R_OUT - wall, 0.1);
    // funnel: leave ~0.6mm of vertical wall at the very top
    top_wall  = 0.6;
    flare     = wall - top_wall;   // horizontal opening per side
    difference() {
        rplate(W, D, R_OUT, LIP_H);                       // rim outer
        translate([0, 0, -EPS])                           // straight bore
            rplate(iw, id, ir, LIP_H + 2*EPS);
        // 45deg flare on the top inner edge (height == flare)
        translate([0, 0, LIP_H - flare])
            hull() {
                rplate(iw, id, ir);
                translate([0, 0, flare + EPS])
                    rplate(iw + 2*flare, id + 2*flare,
                           min(ir + flare, R_OUT), EPS);
            }
    }
}

// ============================================
// BASEPLATE
// Solid plate with a foot-shaped pocket cut into each cell so
// bins drop in. Full pitch footprint so plates tile seamlessly.
// ============================================
module baseplate() {
    W = gx*PITCH;
    D = gy*PITCH;
    total_h = BASE_H + bp_floor;
    difference() {
        // plate: top face at z = 0, extends down by total_h
        translate([0, 0, -total_h])
            rplate(W, D, R_OUT + CLEAR, total_h);
        // foot-shaped pocket in each cell; lift slightly so the
        // pocket mouth cleanly breaks the plate's top face
        for_each_cell() translate([0, 0, EPS]) foot();
    }
}

// ============================================
// RENDER
// ============================================
if (part == "bin")            bin();
else if (part == "baseplate") baseplate();
