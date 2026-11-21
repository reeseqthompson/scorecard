RoomScan (Android ARCore)

Overview
- Android app that lets a user walk a room, captures vertical planes as walls using ARCore, and exports a properly scaled 2D floor plan (SVG and JSON). Doors and windows can be placed by tapping after the scan.

Status
- MVP scaffolding provided. Walls from ARCore vertical planes are collected and merged into 2D line segments. Doors and windows can be added via taps (with default widths). Exports SVG and JSON to the app-specific external files directory.

Requirements
- Android Studio (Giraffe+ recommended)
- Android device that supports ARCore (AR services installed) and Depth API for best results
- minSdk 24, targetSdk 34

How to run
1. Open the `roomscan` folder in Android Studio.
2. Let Gradle sync download dependencies (internet required on your machine).
3. Build and run on a supported Android device.

Usage
- Start the app; move slowly around the room to allow ARCore to detect vertical planes (walls).
- Tap the Door or Window toggle to place an opening on a detected wall by tapping the view. Default width is set; you can adjust in code or extend the UI.
- Press Finish to stop scanning and freeze the current floor plan.
- Press Export to write `floorplan.svg` and `floorplan.json` into the app’s external files directory (visible via Device File Explorer under `Android/data/<package>/files`).

Notes on accuracy and limitations
- ARCore provides plane polygons in meters. Exported SVG is scaled at 100 px/m by default.
- Vertical plane detection is robust for large flat walls; complex shapes may require manual adjustment.
- Automatic detection of doors/windows is not provided by ARCore; this MVP supports manual placement.

Next steps
- Add line regularization and corner snapping across frames for cleaner topology.
- Improve UI for sizing and moving openings.
- Add DXF export and a simple in-app 2D editor.
