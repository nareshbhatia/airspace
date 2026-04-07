# Using Three.js in Mapbox

Sometimes Mapbox layers are enough: lines, fills, extrusions, symbols. When you need **arbitrary 3D** – loaded models, custom shaders, a full scene graph – you will likely reach for **Three.js** inside a **Mapbox custom layer**. The hard part is not drawing a triangle; it is making the **map’s camera** and **Three.js’s camera** agree so your content stays glued to the ground when the user pans, zooms, tilts, or switches projection.

This article explains one well-known integration style used in the wild: **Threebox** and its **`CameraSync`** helper.

Code snippets in this article are taken from my [airspace](https://github.com/nareshbhatia/airspace) repo (and adapted where helpful).

---

## Why embed Three.js at all?

Mapbox gives you a powerful geographic renderer. Three.js gives you **full control** over meshes, materials, lights, and loaders (glTF, and so on). The combination is attractive for operational UIs: map context from Mapbox, bespoke 3D from Three.js.

The cost is **integration complexity**: one canvas, one WebGL context, two mental models of “where is the camera?”

**Visual idea:** One canvas split conceptually – “Mapbox draws first, then your custom pass” – with a warning icon on “camera must match”.

---

## One WebGL context, two users

Mapbox GL JS owns a **single** WebGL context on its canvas. A **custom layer** lets you run your own code in that same frame – often with Three.js’s `WebGLRenderer` configured to use Mapbox’s canvas and context. That means **GL state** (viewport, depth, blending) is shared; you must reset state carefully so Mapbox and Three.js do not stomp on each other.

Details vary by project; the takeaway is: **no second hidden canvas** for the same view unless you deliberately design an overlay.

**Visual idea:** Single pipeline diagram – Mapbox render passes → custom layer callback → `triggerRepaint`.

---

## Projection and view (shared vocabulary)

3D rendering usually combines:

- A **view** transform – “put the world in front of the camera.”
- A **projection** transform – “flatten 3D to the 2D screen with perspective or orthographic rules.”

Mapbox and Three.js each have their own camera story. Your job in an integration is to **stop them from fighting**.

### Perspective vs orthographic (why maps feel different)

**Perspective** mimics a camera with a lens: distant objects look smaller. **Orthographic** is like a blueprint: parallel lines stay parallel; “zoom” often means changing the width of the view box rather than dollying a lens. Map UIs switch between these modes on purpose – operator “2D” views usually pair orthographic with a top-down camera, while “3D” views use perspective and pitch. When Three.js content looks wrong after a mode switch, suspect **projection mismatch** before you suspect your mesh.

**Visual idea:** Two inset maps of the same block – one with converging verticals, one with parallel verticals – labeled perspective vs orthographic.

---

## What Mapbox’s custom layer API gives you

Mapbox GL JS calls your custom layer’s `render` function with a **`matrix`** argument. That matrix is already a **combined** transform for the current frame – Mapbox’s internal camera and projection are baked in. Some integrations **use that matrix directly** as the Three.js projection (plus a model matrix for georeferencing). That path is common in tutorials and in other codebases.

**Threebox takes a different architectural bet**, described next.

**Visual idea:** Tiny callout box – “API hands you `matrix`” vs “Threebox reads `map.transform`” – two columns, equal height, no preference stated beyond learning goals.

---

## Threebox `CameraSync`: build the projection from the map state

[Threebox](https://github.com/jscastro76/threebox) is a library that helps place Three.js objects on a Mapbox map. Its **`CameraSync`** module (see [`CameraSync.js`](https://github.com/jscastro76/threebox/blob/master/src/camera/CameraSync.js)) does **not** treat Mapbox’s per-frame `matrix` as the only source of truth. Instead it reads **`map.transform`** – zoom, pitch, canvas size, field of view, and related values – and **reconstructs** a Three.js **`PerspectiveCamera`** or **`OrthographicCamera`** projection from scratch, including explicit **`nearZ`** and **`farZ`** chosen to match the map’s viewing situation (horizon distance, margins for precision, and so on). It also maintains a **world** group matrix for scaling and panning content in Three.js space.

A useful mental model from comparing approaches: **measure the room, then build a new window frame** – you are synthesizing Three.js projection parameters from raw map camera state rather than only hanging content on Mapbox’s precomposed matrix.

That design trades more math in exchange for **direct control** over near and far planes – important when tall geometry and orthographic-style map modes expose clipping and precision issues.

**Visual idea:** Block diagram – `map.transform` → `CameraSync` → Three.js `projectionMatrix` + world group → `renderer.render`.

### How to read `CameraSync` when you dive in

Treat the Threebox source as documentation. You are looking for three threads:

1. **Inputs** – which fields from **`map.transform`** drive FOV, canvas size, zoom, pitch, and bearing.
2. **Outputs** – the Three.js **`projectionMatrix`** (and any separate view or world matrices) applied before `render`.
3. **Clipping policy** – how **`nearZ`** and **`farZ`** are chosen so content stays inside the frustum across modes.

Comments in the file often explain Mapbox-specific quirks; pair them with Mapbox’s own release notes when you upgrade SDK versions.

---

## Why alignment matters: depth and occlusion

When Mapbox draws terrain and extrusions first, it writes to the **depth buffer**. When Three.js draws afterward, **depth testing** decides what appears in front. If your camera matrices disagree, objects slide, sink into terrain, or fight the basemap. If near and far are badly chosen, you can see **z-fighting** or unexpected clipping even when the map looks fine.

You do not need to master every GPU detail on day one. You **do** need to know that **matching transforms** and sane **near/far** ranges are non-negotiable for credible composites.

**Visual idea:** Side-by-side “misaligned” vs “aligned” screenshot pair (caption only – placeholders OK).

---

## `triggerRepaint` and the render loop

Mapbox schedules frames when the user moves. Custom layers often call **`map.triggerRepaint()`** after Three.js draws so the next frame runs again while nothing “moves” from Mapbox’s point of view – your animation loop and the map’s loop still need to stay friends. Exact call sites depend on whether you animate inside the custom layer or only on camera changes; the invariant is: **do not assume one `render` call is enough** if your scene keeps changing.

**Visual idea:** Two timelines – Mapbox camera events vs your `requestAnimationFrame` – showing where `triggerRepaint` bridges them.

---

## Orthographic maps and tall content (intuition)

On a **top-down, orthographic** map, users expect to look **straight down** at features. Map zoom often **moves the camera toward the ground**. Tall 3D geometry can end up **between the camera and the near clipping plane**, so it gets clipped and “disappears” – a frustrating class of bugs in mixed 2D/3D UIs.

Libraries like Threebox address this class of problem by **controlling near and far explicitly** in the Three.js projection they build. The exact policy lives in `CameraSync` and related code – read the source comments when you adopt it.

**Visual idea:** Simple cross-section: camera above ground, a tall pole, near plane cutting the pole – caption “why explicit near/far matters.”

---

## Practical takeaway

If you are evaluating integrations:

- **Mapbox custom layer + Three.js** is the standard escape hatch for custom 3D on Mapbox GL JS.
- **Threebox `CameraSync`** is a reference implementation for **rebuilding** Three.js cameras from **`map.transform`** with explicit clipping ranges and a world group for scene content.

Pick a path, read the upstream source, and test **pan, zoom, pitch, and 2D/3D mode switches** early.

### Smoke-test checklist (borrowed from painful experience)

- Pan across the antimeridian and polar regions if your users go there.
- Zoom from city scale to globe scale; watch precision and scale jumps.
- Toggle **orthographic vs perspective** if your app exposes a 2D/3D control.
- Load a **tall** object (crane, tower) in orthographic mode and confirm it does not vanish when zooming.

---

## Series navigation

**Previous:** [Three.js 101](./threejs-101.md)

**Start of series:** [Mapbox 101](./mapbox-101.md)

---

## References

- [Mapbox GL JS – `CustomLayerInterface`](https://docs.mapbox.com/mapbox-gl-js/api/properties/#customlayerinterface) – custom layer contract and `render` signature.
- [Mapbox GL JS example – Add a 3D model](https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model/) – official Three.js + custom layer sample.
- [Threebox](https://github.com/jscastro76/threebox) – library for Three.js on Mapbox maps.
- [Threebox `CameraSync.js`](https://github.com/jscastro76/threebox/blob/master/src/camera/CameraSync.js) – projection sync implementation (read the comments).
- [Mapbox GL JS – `Map#setCamera`](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#setcamera) – perspective vs orthographic projection on the map side.
- Farzad Sunavala, [Rendering 3D models with Mapbox + Three.js](https://blog.mapbox.com/rendering-3d-models-with-mapbox-three-js-1f6410923fd1) – Mapbox blog context on custom 3D content (historical; verify against current APIs).
- Jaume Sanchez Elias / community write-ups on **Mapbox + Three.js** – search for recent posts that reference custom layers and `triggerRepaint` patterns.
