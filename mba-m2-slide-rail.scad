// ============================================
// OpenGrid Under-Desk MacBook Air M2 Slide-In Holder v1
//
// CONCEPT: Two C-channel rails mounted to OpenGrid.
// The laptop slides in horizontally from the front.
// Gravity presses the laptop DOWN onto the lips and
// UP against the desk — both directions help retention.
// The only way to remove the laptop is to pull it
// forward (horizontally), which gravity can't do.
//
// This replaces the v5 drop-in cradle, which couldn't
// retain the laptop because gravity pulled it straight
// out of the open bottom.
//
// PIECES: Print 2 copies of this rail. Flip one 180°
//         around the Y-axis to create a mirrored pair.
//
// CROSS-SECTION (mounted under desk):
//
//   DESK / GRID PANEL (above)
//   ═══════════════════════════════════
//   ┌────────────────────────────────┐ ← flange (top)
//   └──┬─────────────────────────────┘
//      │
//      │ outer wall        ← open inner side
//      │                     (laptop edge enters here)
//      │
//   ┌──┤                              ← lip (shelf)
//   │  │     laptop edge rests here
//   └──┘
//
// HOW IT WORKS:
//   - Lip catches the laptop edge from below
//   - Desk surface constrains from above (via flange)
//   - Outer wall constrains from the side
//   - Backstop wall at rear prevents over-insertion
//   - Entry chamfer at front guides laptop onto lips
//
// MOUNTING: OpenGrid Multiconnect dovetail system.
//   Dovetail channels on top face of each rail flange.
//   Snaps slide in from the inner edge (toward laptop).
//   Multiple channels at 28mm grid pitch along rail.
//   Print snaps separately: makerworld.com/en/models/1179191
//
// INSTALL:
//   1. Snap both rails to OpenGrid, lips facing inward
//   2. Space rails ~11 grid holes apart (308mm wall-to-wall)
//   3. Slide laptop in from the front
//   4. Backstop prevents over-insertion
//
// SPACING GUIDE (wall-to-wall inner distance):
//   Target: laptop_w + 2-6mm clearance
//   At 11 × 28mm grid = 308mm → ~4mm total clearance ✓
//   Lip overlap per side ≈ 13mm (laptop 304.1 on 15mm lips)
//
// PRINT: Flange flat on bed. Lip overhang needs support
//        material, or print on side (C-opening facing up).
//
// Channel dims from official OpenGrid Thread Docs PDF:
//   slot (top, narrow) = 12.9mm
//   wide (bottom, undercut) = 14.5mm
//   depth = 2.2mm
//
// Repo: github.com/johntondreau-png/opengrid-desk-mounts
// ============================================

/* [Laptop Dimensions] */
// MacBook Air M2 width (mm)
laptop_w = 304.1;
// MacBook Air M2 depth (mm)
laptop_d = 215.0;
// MacBook Air M2 thickness (mm)
laptop_h = 11.3;

/* [Rail Geometry] */
// Wall thickness (mm)
wall = 4.0;
// Vertical clearance above laptop in channel (mm)
gap = 3.0;
// Lip depth — how far lip extends under laptop edge (mm)
lip_depth = 15;
// Rail length front-to-back (mm)
rail_len = 180;
// Entry chamfer length at front of lip (mm)
chamfer = 8;

/* [OpenGrid Snaps] */
// Grid spacing center-to-center (mm)
grid = 28;

/* [Hidden] */
// Channel height = laptop thickness + clearance above
channel_h = laptop_h + gap;   // 14.3mm

// Multiconnect dovetail channel dims (Thread Docs PDF)
// Narrow slot at top (grid side), wider undercut below.
ch_slot  = 12.9;   // narrow opening at top surface
ch_wide  = 14.5;   // wider undercut (locks snap T-flange)
ch_d     = 2.2;    // channel depth into flange

// Snap travel distance in channel
snap_len = 24.0;

// Flange thickness: channel depth + solid backing
flange_t = ch_d + 2.2;   // 4.4mm

// Flange width: snap length + wall + margin
flange_w = snap_len + wall + 10;  // 38mm

eps = 0.01;

// ============================================
// mc_dovetail_x(len)
//
// Female Multiconnect dovetail channel cutter.
// Runs along +X direction, centered on Y, cuts into -Z.
//
// At Z=0 (top surface, faces grid panel):
//   slot width = ch_slot = 12.9mm (narrow opening)
// At Z=-ch_d (deeper into flange):
//   slot width = ch_wide = 14.5mm (wider undercut)
//
// The snap T-flange locks into the undercut.
// Place with origin at top-center of channel entry.
// Open end at X=0; stop wall = solid material at X=len.
// ============================================
module mc_dovetail_x(len) {
  hull() {
    // Narrow slab at top surface: ch_slot wide
    translate([0, -ch_slot/2, -eps])
      cube([len, ch_slot, eps]);
    // Wide slab at channel bottom: ch_wide wide
    translate([0, -ch_wide/2, -ch_d])
      cube([len, ch_wide, eps]);
  }
}

// ============================================
// RAIL
//
// C-channel profile that captures one laptop edge.
// Multiple dovetail channels on the flange for mounting.
// Backstop wall at rear prevents over-insertion.
// Entry chamfer at front guides laptop onto lip.
//
// Orientation in model space:
//   X = across rail (wall at x=0, lip extends toward +X)
//   Y = along rail length (front=0, back=rail_len)
//   Z = vertical (flange top = +flange_t, lip bottom = -(channel_h+wall))
//
// Print 2 copies. Flip one around Y for left/right pair.
// ============================================
module rail() {
  // Number of dovetail channels along rail length
  n_ch = floor((rail_len - 2 * wall) / grid);

  difference() {
    union() {
      // ---- Flange (top plate, mounts to grid panel) ----
      // Full width, provides mounting surface and snap channels
      cube([flange_w, rail_len, flange_t]);

      // ---- Outer wall (hangs below flange at x=0 edge) ----
      // Constrains laptop from the side
      translate([0, 0, -channel_h])
        cube([wall, rail_len, channel_h]);

      // ---- Lip (extends inward from wall bottom) ----
      // Laptop edge rests on this shelf
      translate([0, 0, -(channel_h + wall)])
        cube([wall + lip_depth, rail_len, wall]);

      // ---- Backstop (rear wall, closes channel at back) ----
      // Prevents laptop from sliding out the back
      translate([0, rail_len - wall, -(channel_h + wall)])
        cube([wall + lip_depth, wall, channel_h + wall + flange_t]);
    }

    // ---- Dovetail channels ----
    // Run in +X direction (across flange width).
    // Open at inner edge (x = flange_w) where snap slides in.
    // Stop wall at x = flange_w - snap_len (solid material beyond).
    // Spaced at grid pitch (28mm) along rail length (Y).
    for (i = [0 : n_ch - 1]) {
      cy = wall + grid / 2 + i * grid;
      // Channel runs from x=(flange_w - snap_len) to x=flange_w
      // Open at x=flange_w (inner edge), stopped at other end
      translate([flange_w - snap_len, cy, flange_t])
        mc_dovetail_x(snap_len + eps);
    }

    // ---- Entry chamfer on lip ----
    // At the front of the rail (Y=0 to Y=chamfer), the lip
    // tapers from zero to full depth. This creates a funnel
    // that guides the laptop edge onto the lip surface.
    //
    // Triangle in XY plane, extruded through lip height (Z):
    //   At Y=0: full lip removed (easy entry)
    //   At Y=chamfer: lip is full depth (laptop captured)
    translate([wall - eps, -eps, -(channel_h + wall) - eps])
      linear_extrude(height = wall + 2 * eps)
        polygon([
          [0, 0],
          [lip_depth + 2 * eps, 0],
          [0, chamfer + eps]
        ]);
  }
}

// ============================================
// RENDER
// ============================================
rail();
