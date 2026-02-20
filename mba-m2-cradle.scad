// ============================================
// OpenGrid Under-Desk MacBook Air M2 Cradle
// U-shape: back rail + two side arms
// Laptop drops in from above, lifts straight out.
//
// MOUNTING: OpenGrid Multiconnect dovetail system.
// Top face of each piece has dovetail channel(s).
// Snap (printed separately) slides into channel from end.
// Snap other end clips into OpenGrid grid hole above.
// Channel profile from official openGrid Thread Docs PDF:
//   top_w=14.5mm, bot_w=12.9mm, depth=2.2mm
//
// Print snaps: makerworld.com/en/models/1179191
//   -> OpenGrid Multiconnect profile (~40 min / plate)
//   -> Print 13 minimum, 20+ recommended
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

/* [Cradle Geometry] */
// Wall thickness (mm)
wall = 4.0;
// Lip height above laptop top (mm)
lip = 8;
// Side arm front-to-back depth (mm)
arm_depth = 50;
// Shelf depth under laptop edge (mm)
shelf = 8;

/* [OpenGrid Snaps] */
// Grid spacing center-to-center (mm)
grid = 28;

/* [Part to Generate] */
// Which piece to print
part = "side_arm"; // [side_arm, back_rail, both]

/* [Hidden] */
gap = 1.0;
arm_drop = laptop_h + gap + lip;
// Multiconnect female channel dims (from Thread Docs PDF)
ch_top = 14.5;   // opening width at top surface
ch_bot = 12.9;   // narrower at bottom of channel
ch_d   = 2.2;    // channel depth into part
// Flange thickness = channel depth + 2mm solid base
flange_t = ch_d + 2.0;
// Side arm flange width (one snap + margin)
side_fw = grid + 10;

// ============================================
// MULTICONNECT FEMALE CHANNEL
// Dovetail slot cut into TOP face of a part.
// Opens at Z=flange_t, goes DOWN ch_d mm.
// Runs along Y axis for 'len' mm.
// Snap slides in from open end, dovetail locks it.
// ============================================
module mc_neg(len) {
    translate([0, 0, flange_t])
        rotate([90, 0, 0])
            translate([0, 0, -len/2])
                linear_extrude(height = len)
                        polygon([
                                    [-ch_top/2,  0],
                                                [ ch_top/2,  0],
                                                            [ ch_bot/2, -ch_d],
                                                                        [-ch_bot/2, -ch_d]
                                                                                ]);
                                                                                }

                                                                                // ============================================
                                                                                // SIDE ARM
                                                                                // Flange on top presses against grid underside.
                                                                                // Dovetail channel on top face runs front-to-back.
                                                                                // Snap slides in from front or rear edge.
                                                                                // Vertical back wall + horizontal shelf = L-bracket
                                                                                // that cradles the laptop side edge.
                                                                                // Print 2 copies (left + right, symmetric).
                                                                                // ============================================
                                                                                module side_arm() {
                                                                                    difference() {
                                                                                            union() {
                                                                                                        // Mounting flange
                                                                                                                    cube([side_fw, arm_depth, flange_t]);
                                                                                                                                // Vertical wall dropping below flange
                                                                                                                                            translate([0, 0, -arm_drop])
                                                                                                                                                            cube([side_fw, wall, arm_drop]);
                                                                                                                                                                        // Horizontal shelf (laptop edge rests here)
                                                                                                                                                                                    translate([0, wall, -arm_drop])
                                                                                                                                                                                                    cube([side_fw, shelf, wall]);
                                                                                                                                                                                                            }
                                                                                                                                                                                                                    // Dovetail channel centered on flange, runs full depth
                                                                                                                                                                                                                            translate([side_fw/2, arm_depth/2, 0])
                                                                                                                                                                                                                                        mc_neg(arm_depth);
                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                            // ============================================
                                                                                                                                                                                                                                            // BACK RAIL
                                                                                                                                                                                                                                            // Spans full laptop width behind laptop.
                                                                                                                                                                                                                                            // Multiple dovetail channels spaced at grid pitch.
                                                                                                                                                                                                                                            // Vertical front wall = backstop for laptop rear edge.
                                                                                                                                                                                                                                            // NOTE: rail is ~312mm - orient diagonally on P2S bed.
                                                                                                                                                                                                                                            // ============================================
                                                                                                                                                                                                                                            module back_rail() {
                                                                                                                                                                                                                                                rail_w = laptop_w + wall * 2;
                                                                                                                                                                                                                                                    n = floor(rail_w / grid);
                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                        difference() {
                                                                                                                                                                                                                                                                union() {
                                                                                                                                                                                                                                                                            // Flange strip
                                                                                                                                                                                                                                                                                        cube([rail_w, wall, flange_t]);
                                                                                                                                                                                                                                                                                                    // Vertical backstop wall
                                                                                                                                                                                                                                                                                                                translate([0, wall, -arm_drop])
                                                                                                                                                                                                                                                                                                                                cube([rail_w, wall, arm_drop + flange_t]);
                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                                // Dovetail channels across flange top, spaced at grid
                                                                                                                                                                                                                                                                                                                                                        for (i = [0 : n - 1]) {
                                                                                                                                                                                                                                                                                                                                                                    x = (rail_w / 2) - ((n-1) * grid / 2) + i * grid;
                                                                                                                                                                                                                                                                                                                                                                                translate([x, wall/2, 0])
                                                                                                                                                                                                                                                                                                                                                                                                mc_neg(wall);
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
                                                                                                                                                                                                                                                                                                                                                                                                                    } else {
                                                                                                                                                                                                                                                                                                                                                                                                                        // Preview both together (not for printing)
                                                                                                                                                                                                                                                                                                                                                                                                                            side_arm();
                                                                                                                                                                                                                                                                                                                                                                                                                                translate([side_fw + laptop_w + gap, 0, 0])
                                                                                                                                                                                                                                                                                                                                                                                                                                        side_arm();
                                                                                                                                                                                                                                                                                                                                                                                                                                            translate([side_fw, 0, 0])
                                                                                                                                                                                                                                                                                                                                                                                                                                                    back_rail();
                                                                                                                                                                                                                                                                                                                                                                                                                                                    }
