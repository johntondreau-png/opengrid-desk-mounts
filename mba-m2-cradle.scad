// ============================================
// OpenGrid Under-Desk MacBook Air M2 Cradle v5
// Fixed: correct Multiconnect dovetail channel (hull method)
//        + stop walls on all channels
// U-shape: back_rail + two side_arm pieces
// Laptop drops in from above, lifts straight out.
//
// MOUNTING: OpenGrid Multiconnect dovetail system.
// Top face of each piece has dovetail channel(s).
// Snap (printed separately) slides in from open end.
// Stop wall prevents snap sliding through.
// Channel dims from official openGrid Thread Docs PDF:
//   slot (top, narrow) = 12.9mm
//   wide (bottom, undercut) = 14.5mm
//   depth = 2.2mm
//
// Print snaps: makerworld.com/en/models/1179191
// Repo: github.com/johntondreau-png/opengrid-desk-mounts
// ============================================

/* [Laptop Dimensions] */
// MacBook Air M2 width (mm)
laptop_w = 304.1;
// MacBook Air M2 depth (mm)
laptop_d = 215.0;
// MacBook Air M2 thickness (mm)
laptop_h = 11.3;

/* [Cradle Geometry] */
// Wall thickness (mm)
wall      = 4.0;
// Lip height above laptop top (mm)
lip       = 8;
// Side arm front-to-back depth (mm)
arm_depth = 50;
// Shelf depth under laptop edge (mm)
shelf     = 8;

/* [OpenGrid Snaps] */
// Grid spacing center-to-center (mm)
grid = 28;

/* [Part to Generate] */
// Which piece to print
part = "side_arm"; // [side_arm, back_rail]

/* [Hidden] */
gap      = 1.0;
arm_drop = laptop_h + gap + lip;

// Multiconnect dovetail channel dims (Thread Docs PDF)
// CORRECT: narrow slot at top, wider undercut below.
ch_slot  = 12.9;   // narrow opening at top surface (grid side)
ch_wide  = 14.5;   // wider undercut at bottom (locks snap)
ch_d     = 2.2;    // channel depth into part

// Snap body approximate length (travel distance in channel)
snap_len = 24.0;

// Flange must be thick enough: ch_d below + 2.2mm solid
flange_t = ch_d + 2.2;   // 4.4mm total

// Side arm flange width (one snap at grid pitch + margin)
side_fw  = grid + 10;    // 38mm

// Back rail flange depth (snap length + 4mm stop wall)
back_fd  = snap_len + 4; // 28mm

// Epsilon for hull geometry
eps = 0.01;

// ============================================
// mc_dovetail(len)
// Female Multiconnect dovetail channel cutter.
// Uses hull() of two thin slabs - unambiguous geometry.
//
// Call with origin at TOP CENTER of channel entry on
// the top face of the part (Z = flange_t in model).
// Channel runs from Y=0 to Y=len along +Y direction.
//
// At Z=0 (top surface, faces grid panel):
//   slot width = ch_slot = 12.9mm (narrow opening)
// At Z=-ch_d (deeper into part):
//   slot width = ch_wide = 14.5mm (wider undercut)
//
// The undercut locks the snap T-flange in place.
// Stop wall: leave solid material beyond Y=len.
// ============================================
module mc_dovetail(len) {
  hull() {
    // Narrow slab at top surface (Z=0): 12.9mm wide
    translate([-ch_slot/2, 0, -eps])
      cube([ch_slot, len, eps]);
    // Wide slab at bottom of channel (Z=-ch_d): 14.5mm wide
    translate([-ch_wide/2, 0, -ch_d])
      cube([ch_wide, len, eps]);
  }
}

// ============================================
// SIDE ARM
// Flange top face presses against OpenGrid panel.
// Channel: open at front face (Y=0), runs snap_len into arm.
// Stop wall = solid flange material from Y=snap_len to rear.
// L-bracket below: vertical wall + shelf cradles laptop edge.
// Print 2 copies (symmetric, works for left and right).
// ============================================
module side_arm() {
  difference() {
    union() {
      // Top flange (presses against grid panel)
      cube([side_fw, arm_depth, flange_t]);
      // Vertical wall below (laptop side edge stop)
      translate([0, 0, -arm_drop])
        cube([side_fw, wall, arm_drop]);
      // Horizontal shelf (laptop edge rests on this)
      translate([0, wall, -arm_drop])
        cube([side_fw, shelf, wall]);
    }
    // Dovetail channel: centered in X, open at Y=0
    // Runs snap_len in Y; rest of arm_depth = stop wall
    translate([side_fw/2, 0, flange_t])
      mc_dovetail(snap_len);
  }
}

// ============================================
// BACK RAIL
// Spans full laptop width as rear backstop.
// Flange depth = back_fd (28mm) to fit snap length.
// Multiple channels at 28mm grid pitch, open at front.
// Vertical wall at rear is laptop back edge stop.
// Rail is ~312mm long; orient diagonally on P2S bed.
// ============================================
module back_rail() {
  rail_w = laptop_w + wall * 2;   // ~312mm
  n = floor(rail_w / grid);       // number of snap channels

  difference() {
    union() {
      // Top flange (back_fd deep to accommodate full snap)
      cube([rail_w, back_fd, flange_t]);
      // Vertical backstop wall below, at rear of flange
      translate([0, back_fd, -arm_drop])
        cube([rail_w, wall, arm_drop + flange_t]);
    }
    // Channels at each grid position, open at Y=0
    for (i = [0 : n - 1]) {
      cx = (rail_w / 2) - ((n - 1) * grid / 2) + i * grid;
      translate([cx, 0, flange_t])
        mc_dovetail(snap_len);
    }
  }
}

// ============================================
// RENDER
// ============================================
if (part == "side_arm") {
  side_arm();
} else if (part == "back_rail") {
  back_rail();
}
