# P010 deterministic Paper Explainer motion

The [silent flight demo](flight-motion.mp4) reuses the P009 scene data and SVG objects. The ticket settles, the plane lifts along a curve, operating cost objects arrive in sequence as their connectors draw, and two departure dates reveal two tickets. Paper wipes connect the three scenes. Captions have their own start and end windows and stay outside the moving camera.

Run `node experiments/E07/p010/render-motion.mjs` from the repository root with the existing Chrome and FFmpeg. It evaluates explicit timestamps on a 1920×1080 canvas, then encodes a 1280×720, 12 fps H.264 review copy. The renderer requests frames sequentially and uses browser paint callbacks only to flush the requested state. Browser playback time does not determine a frame.

For manual seeking, open [the P009 fixture in motion mode](../../E06/paper-explainer/story.html?motion=1) and call `paperMotion.renderAt(4.18)` in the browser console. The [motion script](../../E06/paper-explainer/story-motion.js) maps a time in seconds to transforms, opacity, SVG path offsets, camera state and caption visibility. Keys target stable P009 objects and connectors. The authored plan declares scene start times, eased transform tracks, entrance staggers, a path follower, connector draw ranges, camera states and caption windows. The default plan can be overridden by supplying `paperMotionPlan` before loading the script. The Paper adapter uses layer-zero paper drift for parallax. The default P009 view remains static.

## Evidence

- [Start](start.png), [plane lift](lift.png), [mid-wipe](wipe.png), [cost reveal](reveal.png), and [end](end.png) are Full HD captures.
- [Motion evidence](motion-evidence.json) records geometry and hashes. All 108 preview frame evaluations and five keyframe evaluations passed the safe bounds and text checks. The plane’s bounding-box origin moved about 132 px by 0.82 s.
- A nonsequential seek to 0.82 s reproduced the exact object bounds and PNG SHA-256 with Chrome GPU acceleration disabled. The preliminary default raster path reproduced the bounds but differed in PNG bytes. SSIM was 0.999987 on that preliminary comparison. The result only establishes repeatability for the tested Chrome setup and timestamp.
- FFprobe verified one video stream, 1280×720, 12 fps, 108 decodable frames and 9.000 s. Full FFmpeg decoding passed. The E05 typography fixture, P008 frames, and P009 frames passed shared renderer regressions in scratch directories.

Existing speech samples cover other text. This is a silent motion test, and caption windows are authored demonstration times. E07 still needs human motion review, and narration synchronization remains a later experiment.
