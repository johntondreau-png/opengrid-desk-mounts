// ============================================
// OpenGrid Under-Desk Dell Pro 14 Plus (PB14250) Cradle v1
// 4 independent CORNER BRACKETS, slide-in from the FRONT.
//
// MECHANISM (different from the MBA drop-in cradle):
//   - Laptop is stored closed + horizontal under the desk.
//   - It SLIDES IN from the front (+Y) until its back edge
//     hits the two rear brackets' back walls.
//   - Each bracket captures a corner: outer side wall (X stop),
//     bottom shelf (holds weight), top flange (up stop).
//   - Rear pair adds a back wall (insertion limit + back-edge grab).
//   - Front pair adds a small chamfered detent on the shelf so a
//     bump/knee won't slide it out; firm pull to remove.
//
// MOUNTING: OpenGrid Multiconnect dovetail system (same spec as
// the MBA file). Each bracket's top flange has one dovetail
// channel; a snap (printed separately) clips into the grid and the
// bracket slides onto it.
//   slot (top, narrow)        = 12.9mm
//   wide (bottom, undercut)   = 14.5mm
//   depth                     = 2.2mm
//
// GRID ALIGNMENT (why channels run in X):
//   Laptop depth 224mm = exactly 8 grid cells (8 x 28) -> the
//   front and rear brackets land on real grid rows 8 cells apart.
//   Laptop width 313.5mm is NOT a grid multiple, so the channels
//   run along X: each bracket slides sideways to absorb the odd
//   width while staying clipped to the grid.
//
// Every bracket is small (<~70mm) so the P2S 256mm bed is a
// non-issue -- no long back rail, no splitting.
//
// Print snaps: makerworld.com/en/models/1179191
// Repo: github.com/johntondreau-png/opengrid-desk-mounts
// ============================================

/* [Laptop Dimensions] */
// Dell Pro 14 Plus PB14250 width (mm)
laptop_w = 313.5;
// depth (mm)
laptop_d = 224.0;
// max thickness (mm)
laptop_h = 20.2;

/* [Bracket Geometry] */
// Wall / shelf thickness (mm)
wall      = 4.0;
// Side-arm length along the side edge, per bracket (mm)
side_len  = 60;
// Rear back-arm length along the back edge, per bracket (mm)
back_len  = 55;
// How far the bottom shelf reaches under the laptop (mm)
shelf     = 12;
// How far the top flange overhangs the laptop top, side edge (mm)
top_grab  = 10;
// Clearance: laptop top -> flange underside (mm). Must exceed detent.
top_gap   = 2.0;
// Clearance: laptop side edge -> wall (mm)
side_gap  = 0.6;
// Clearance: laptop bottom -> shelf top (mm)
shelf_gap = 0.6;
// Front detent bump height (mm). Set 0 for a free slide. Keep < top_gap.
detent    = 1.2;

/* [OpenGrid] */
// Grid spacing center-to-center (mm)
grid = 28;
// Multiconnect dovetail channel (Thread Docs PDF)
ch_slot = 12.9;   // narrow slot at top surface (grid side)
ch_wide = 14.5;   // wider undercut below (locks snap)
ch_d    = 2.2;    // channel depth into part
// Flange thickness: ch_d below + 2.2mm solid = 4.4mm
flange_t = ch_d + 2.2;

/* [Part to Generate] */
part = "rear_left"; // [rear_left, rear_right, front_left, front_right, all]

/* [Hidden] */
eps = 0.01;

// Z levels (laptop top face at Z = 0)
z_flange_bot = top_gap;
z_flange_top = top_gap + flange_t;
z_shelf_top  = -laptop_h - shelf_gap;
z_shelf_bot  = z_shelf_top - wall;
wall_h       = z_flange_top - z_shelf_bot;

// Channel center offset inward from each edge so the dovetail
// stays on the flange (front & rear stay exactly laptop_d apart).
chan_inset = 5;
yc_rear    = laptop_d - chan_inset;
yc_front   = -chan_inset;

// Back-arm flange inward reach (must clear the channel width)
back_grab  = 14;
// Front channel ear footprint (Y), hosts the X-channel near front
ear_y0     = yc_front - ch_wide/2 - 2;
ear_y1     = 10;
// Detent shelf extends this far in front of the laptop edge
det_front  = 6;

// ============================================
// mc_dovetail_x(len)
// Female Multiconnect dovetail cutter running along +X.
// Call origin at the channel entry on the part's TOP face.
// At Z=0 (top, grid side):  slot width = ch_slot (narrow).
// At Z=-ch_d (deeper):       slot width = ch_wide (undercut).
// Leave solid material before X=0 for a stop wall.
// ============================================
module mc_dovetail_x(len) {
  hull() {
    translate([0, -ch_slot/2, -eps]) cube([len, ch_slot, eps]);
    translate([0, -ch_wide/2, -ch_d]) cube([len, ch_wide, eps]);
  }
}

// ============================================
// left_side_arm(y0, L)
// Captures the laptop LEFT edge (X=0; outside is X<0) over
// Y in [y0, y0+L]: outer side wall + bottom shelf + top flange.
// ============================================
module left_side_arm(y0, L) {
  // Outer side wall (X stop)
  translate([-side_gap - wall, y0, z_shelf_bot])
    cube([wall, L, wall_h]);
  // Bottom shelf (holds the laptop's weight)
  translate([-side_gap, y0, z_shelf_bot])
    cube([shelf, L, wall]);
  // Top flange overhang (Z up-stop, presses against grid)
  translate([-side_gap - wall, y0, z_flange_bot])
    cube([wall + top_grab, L, flange_t]);
}

// ============================================
// front_detent()
// Small chamfered bump on the front-bracket shelf. Ramp on the
// -Y side (cam in), near-vertical face toward the laptop so a
// nudge won't slide it out. Sits 1mm in front of the laptop edge.
// ============================================
module front_detent() {
  hull() {
    translate([-side_gap, -det_front, z_shelf_top]) cube([shelf, det_front - 1, eps]);
    translate([-side_gap, -1 - eps, z_shelf_top])   cube([shelf, eps, detent]);
  }
}

// ============================================
// corner_bracket(rear)
// Builds the LEFT bracket. rear=true -> rear corner (adds back
// wall + back-edge flange). rear=false -> front corner (adds
// channel ear + detent, open front for slide-in).
// Mirror about X=laptop_w/2 for the right-hand brackets.
// ============================================
module corner_bracket(rear) {
  yc = rear ? yc_rear : yc_front;
  cx_end = rear ? back_len : back_len;   // channel runs to this X
  difference() {
    union() {
      if (rear) {
        // Side capture over the rear region
        left_side_arm(laptop_d - side_len, side_len);
        // Back capture: outer back wall (Y stop / insertion limit)
        translate([-side_gap - wall, laptop_d + side_gap, z_shelf_bot])
          cube([back_len + side_gap + wall, wall, wall_h]);
        // Back shelf (grabs the rear edge from below)
        translate([-side_gap - wall, laptop_d + side_gap - shelf, z_shelf_bot])
          cube([back_len + side_gap + wall, shelf, wall]);
        // Back flange (hosts the X-channel)
        translate([-side_gap - wall, laptop_d - back_grab, z_flange_bot])
          cube([back_len + side_gap + wall, (laptop_d + side_gap + wall) - (laptop_d - back_grab), flange_t]);
      } else {
        // Side capture over the front region (shelf reaches forward
        // of the laptop edge to support the detent)
        left_side_arm(-det_front, side_len + det_front);
        // Front channel ear (hosts the X-channel near the front edge)
        translate([-side_gap - wall, ear_y0, z_flange_bot])
          cube([back_len + side_gap + wall, ear_y1 - ear_y0, flange_t]);
        // Retention detent
        front_detent();
      }
    }
    // Dovetail channel: starts after a wall-thick stop, open at the
    // inner (+X) flange edge. Runs along X (grid alignment).
    translate([-side_gap, yc, z_flange_top])
      mc_dovetail_x(cx_end + side_gap);
  }
}

// ============================================
// RENDER
// ============================================
module rear_left()   { corner_bracket(true);  }
module front_left()  { corner_bracket(false); }
module rear_right()  { translate([laptop_w, 0, 0]) mirror([1, 0, 0]) corner_bracket(true);  }
module front_right() { translate([laptop_w, 0, 0]) mirror([1, 0, 0]) corner_bracket(false); }

if (part == "rear_left")        rear_left();
else if (part == "rear_right")  rear_right();
else if (part == "front_left")  front_left();
else if (part == "front_right") front_right();
else if (part == "all") {
  rear_left();  rear_right();
  front_left(); front_right();
}
