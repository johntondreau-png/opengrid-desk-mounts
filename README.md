# OpenGrid Under-Desk Mounts

OpenSCAD parametric under-desk mounts for the [OpenGrid system](https://makerworld.com/en/models/1179191) by David D. Designed for the Bambu Lab P2S printer.

> **AI Skill Repo** — start any new session by linking Claude to this README for full context.
>
> ---
>
> ## 🔧 Skill: OpenGrid Under-Desk Accessory Mount Design
>
> ### System Overview
>
> **OpenGrid** (by David D) is a 28mm-grid modular mounting ecosystem. Accessories mount to grid panels via printed **Multiconnect snaps** that clip into grid holes.
>
> **Key URLs:**
> - Main ecosystem: https://makerworld.com/en/models/1179191 (David D)
> - - Multiconnect snaps to print: same page → "OpenGrid Multiconnect" profile
>   - - Tile Generator reference (BlackjackDuck): https://makerworld.com/en/models/1304337
>     - - Snap SCAD spec: https://github.com/AndyLevesque/QuackWorks/blob/main/openGrid/opengrid-snap.scad
>       - - Thread docs PDF: downloadable from David D's page → Documentation section
>        
>         - ---
>
> ### Critical Dimensions (from official spec)
>
> | Property | Value | Source |
> |---|---|---|
> | Grid spacing | 28mm center-to-center | David D / BlackjackDuck confirmed |
> | Snap square size | 24.80 x 24.80mm | opengrid-snap.scad |
> | Snap lite height | 3.4mm | opengrid-snap.scad |
> | Snap full height | 6.8mm | opengrid-snap.scad |
> | MC channel top width | 14.5mm | Multiconnect Thread Docs PDF |
> | MC channel bottom width | 12.9mm | Multiconnect Thread Docs PDF |
> | MC channel depth | 2.2mm | Multiconnect Thread Docs PDF |
> | Flange min thickness | ch_depth + 2mm = 4.2mm | derived |
>
> **Multiconnect channel profile** (female/negative, dovetail slot in top face):
> ```
> top: 14.5mm wide
>                \              /   depth: 2.2mm
> bot: 12.9mm wide
> ```
>
> ---
>
> ### Accessory Design Pattern
>
> Every under-desk OpenGrid accessory follows this pattern:
>
> **1. Mounting Flange** — flat plate pressing against underside of grid panel
> - Contains Multiconnect dovetail channel(s) on its TOP face
> - - Channels spaced every 28mm (grid spacing)
>   - - Flange thickness >= 4.2mm
>     - - Snap slides into channel from side, locks into grid above
>      
>       - **2. Functional Body** — hangs DOWN from the flange, sized to the object
>      
>       - **3. Print snaps separately** — use David D's Multiconnect profile, ~2 per mount point
>      
>       - ---
>
> ### Lessons Learned
>
> - **Don't assume the connector** — look up the official spec first. We lost 2 iterations using a square pocket instead of the correct dovetail profile.
> - - **Check bed size early** — P2S is 256x256mm. Anything wider needs splitting or diagonal orientation.
>   - - **Blind pockets != dovetail channels** — Multiconnect uses a sliding dovetail, not press-fit pockets.
>     - - **Grid is 28mm, not 25mm** — confirm before starting.
>       - - **JavaScript injection into CodeMirror is unreliable** — use Cmd+A + type to replace code in MakerWorld editor.
>         - - **BlackjackDuck's tile generator** generates grid panels, not accessories — use for geometry reference only.
>           - - **David D's Multiconnect Thread Docs PDF** is the ground truth for channel dimensions — download it first.
>             - - **MakerWorld parametric maker** workflow: Code button -> Cmd+A -> paste -> Save -> close -> Generate -> wait 15s -> inspect -> Download 3MF.
>              
>               - ---
>
> ### SCAD Template (start here for every new mount)
>
> ```openscad
> /* [Object Dimensions] */
> obj_w = 100;   // object width mm
> obj_d = 100;   // object depth mm
> obj_h = 50;    // object height mm
>
> /* [Cradle Geometry] */
> wall = 4.0;
> lip = 8;
> shelf = 8;
> arm_depth = 50;
>
> /* [OpenGrid] */
> grid = 28;
>
> /* [Part] */
> part = "mount"; // [mount]
>
> /* [Hidden] */
> gap = 1.0;
> drop = obj_h + gap + lip;
> ch_top = 14.5; ch_bot = 12.9; ch_d = 2.2;
> flange_t = ch_d + 2.0;
> fw = grid + 10; // flange width
>
> module mc_neg(len) {
>     translate([0, 0, flange_t])
>     rotate([90, 0, 0])
>     translate([0, 0, -len/2])
>     linear_extrude(height=len)
>         polygon([[-ch_top/2,0],[ch_top/2,0],
>                  [ch_bot/2,-ch_d],[-ch_bot/2,-ch_d]]);
> }
>
> module mount() {
>     difference() {
>         union() {
>             cube([fw, arm_depth, flange_t]); // flange
>             // add your functional body below...
>         }
>         translate([fw/2, arm_depth/2, 0]) mc_neg(arm_depth);
>     }
> }
>
> if (part == "mount") mount();
> ```
>
> ---
>
> ## 📋 Device Catalogue
>
> ### Mount 1 — MacBook Air M2 ✅ PRINTED (v1)
> | Field | Value |
> |---|---|
> | Dimensions | 304.1 x 215.0 x 11.3 mm |
> | Mount type | U-shape: back_rail + 2x side_arm |
> | Orientation | Slides front-to-back, drops from above |
> | Drop distance | 11.3 + 1 + 8 = 20.3mm |
> | Snap count | ~13 (11 back + 1 per arm) |
> | SCAD file | mba-m2-cradle.scad |
> | Status | v1 printed — awaiting fit test |
> | Notes | Back rail is ~312mm — orient diagonally on P2S bed |
>
> ### Mount 2 — Dell Pro 14 Plus PB14250 ⚪ READY TO DESIGN
> | Field | Value |
> |---|---|
> | Dimensions | 313.5 x 224.0 x 20.2 mm (max) |
> | Mount type | Same U-shape as MBA |
> | Drop distance | 20.2 + 1 + 8 = 29.2mm |
> | Snap count | ~15 |
> | Notes | Back rail 313mm — likely needs splitting into 2 pieces for P2S |
> | Status | Just change laptop_w/d/h params in mba-m2-cradle.scad |
>
> ### Mount 3 — Plugable UD-3900PDZ Docking Station ⚪ READY TO DESIGN
> | Field | Value |
> |---|---|
> | Dimensions | 200 x 85 x 31 mm |
> | Mount type | Flat tray with front + side lips |
> | Orientation | Lies flat, 31mm is height |
> | Drop distance | 31 + 1 + 5 = 37mm |
> | Snap count | ~8 |
>
> ### Mount 4 — Plugable UD-3900PDZ Power Brick 🔴 MEASURE FIRST
> | Field | Value |
> |---|---|
> | Dimensions | UNKNOWN — measure with calipers |
> | Notes | Typical laptop brick ~150x70x35mm but verify |
>
> ### Mount 5 — Amazon eero 6 Router ⚪ READY TO DESIGN
> | Field | Value |
> |---|---|
> | Dimensions | 99.4 x 97.0 x 61.5 mm |
> | Mount type | Open cradle or C-channel, keep sides open for ventilation |
> | Drop distance | 61.5 + 1 + 5 = 67.5mm (if upright) |
> | Snap count | ~4-6 |
>
> ### Mount 6 — Monster Power Strip (Vertex XL) 🟡 CHECK KEYHOLES FIRST
> | Field | Value |
> |---|---|
> | Dimensions | 381 x 89 x 44 mm |
> | Notes | 381mm is way too long for P2S — use 4-5 clip brackets along length. Check if strip has built-in keyhole slots on back first. |
> | Snap count | ~8 |
>
> ---
>
> ### Total Snap Count
> | Mount | Snaps |
> |---|---|
> | MBA M2 | 13 |
> | Dell PB14250 | 15 |
> | Plugable dock | 8 |
> | Power brick | 4 |
> | eero 6 | 6 |
> | Monster strip | 8 |
> | **TOTAL** | **~54** |
>
> **Print 60 Multiconnect lite snaps** for full coverage + spares.
>
> ---
>
> ## Files in This Repo
>
> | File | Description |
> |---|---|
> | README.md | This skill doc + catalogue |
> | mba-m2-cradle.scad | MacBook Air M2 cradle (back_rail + side_arm) |
>
> ## How to Resume with Claude
>
> Start a new chat and say:
> > "Read my OpenGrid skill repo at github.com/johntondreau-png/opengrid-desk-mounts and let's continue. [describe what you want to do next]"
