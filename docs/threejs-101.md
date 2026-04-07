# Three.js 101

Three.js is a thin, friendly layer over WebGL. You describe a **scene** (what exists in the world), a **camera** (where you stand and how you look), and a **renderer** (how pixels get drawn). Meshes – **geometry** plus **material** – are the objects you actually see.

Code snippets in this article are taken from my [airspace](https://github.com/nareshbhatia/airspace) repo (and adapted where helpful).

---

## What you need to show anything

To display objects with Three.js you typically line up these pieces:

1. A **scene** – a container for what lives in your 3D world.
2. A **camera** – defines the viewpoint and how 3D becomes 2D on screen.
3. **Lights** – only when you use materials that react to light (for example `MeshStandardMaterial`).
4. One or more **meshes** – geometry + material.
5. A **renderer** – draws the scene from the camera’s point of view.
6. **Controls** (optional) – orbit controls or similar for interaction.

The scene and the camera are **independent objects**. The camera is not always added to the scene. The two are connected when you call:

```typescript
renderer.render(scene, camera);
```

That one line is the contract: **render _this_ world _from_ this viewpoint**.

**Visual idea:** Three labeled boxes in a row – Scene, Camera, Renderer – with an arrow from Renderer labeled `render(scene, camera)`.

---

## Three.js coordinate directions (plain language)

- The **x** axis points to the **right** (positive x is to the right).
- The **y** axis points **up** (positive y is up).
- The **z** axis points **toward the viewer** (positive z comes out of the screen).

The **origin** is `(0, 0, 0)` – a common reference for positions. You move objects by changing their position away from the origin.

By default, a **`PerspectiveCamera`** sits at the origin and looks along **negative z** – that is, **into** the scene. A common first step is to move the camera backward along positive z so you can see what is in front of it:

```typescript
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
camera.position.z = 3;
```

**Visual idea:** A small screenshot of the Three.js `AxesHelper` with x red, y green, z blue – caption “y up, z toward you”.

---

## A minimal pipeline in code

```typescript
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
camera.position.z = 3;

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(width, height);
renderer.render(scene, camera);
```

**MeshBasicMaterial** ignores lights – it paints solid color (and textures if you add them). If you switch to a lit material such as **`MeshStandardMaterial`**, you add **lights** to the scene or the mesh will look black.

**Visual idea:** Same box with `MeshBasicMaterial` (flat red) vs `MeshStandardMaterial` + directional light (shaded red).

---

## Grouping content with `Group`

You will rarely keep everything at the origin. A **`THREE.Group`** is an invisible parent you can move, rotate, or scale as a unit.

```typescript
const content = new THREE.Group();
content.add(zoneMesh);
content.add(routeLine);
scene.add(content);
```

**Visual idea:** Tree sketch – `Scene` → `Group` → three child meshes.

---

## Camera and frustum (just enough)

A perspective camera is defined by a **vertical field of view** (degrees), an **aspect ratio** (width divided by height), and **near** and **far** distances. Only geometry between the near and far planes is drawn; everything else is clipped.

```typescript
const camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
```

You do not need the full linear algebra story to start building. You _do_ need to know that **near and far** set the depth range and that extreme ranges can cause rendering artifacts when you combine Three.js with other engines (such as maps) – more on that in [Using Three.js in Mapbox](./using-threejs-in-mapbox.md).

**Visual idea:** A simple frustum sketch – a pyramid with the tip at the camera and the near/far rectangles labeled.

---

## Orthographic camera (when everything is the same size)

For CAD-like or top-down views, **`OrthographicCamera`** maps a box-shaped slice of space to the screen – objects do not shrink with distance. You will see it in map integrations when the map itself is in an orthographic projection. The constructor takes left/right/top/bottom distances and near/far, unlike the single **fov** number for perspective.

```typescript
const halfW = width / 2;
const halfH = height / 2;
const ortho = new THREE.OrthographicCamera(
  -halfW,
  halfW,
  halfH,
  -halfH,
  near,
  far,
);
```

**Visual idea:** Compare a perspective cube grid (converging lines) with an orthographic grid (parallel lines).

---

## Lights, briefly

When you use **`MeshStandardMaterial`**, **`MeshPhysicalMaterial`**, or other shaded materials, the GPU needs light vectors to compute brightness. A common starter trio is **ambient** (fills shadows) + **directional** (sun-like) + optional **point** lights for accents. No lights + standard material = black mesh – if your object vanished, check that first before you debug matrices.

```typescript
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(1, 1, 1);
scene.add(ambient, sun);
```

**Visual idea:** The same mesh with only ambient vs ambient + directional – show the shadow side.

---

## Renderer size and animation

`WebGLRenderer` draws into a canvas. **`setSize`** sets the drawing buffer to match your layout.

For interaction you usually run a **requestAnimationFrame** loop: update anything that moves, then `renderer.render(scene, camera)` again. For example:

```typescript
function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
```

Resize the canvas when the window changes: update **`setSize`**, and for perspective cameras usually **`camera.aspect = width / height`** then **`camera.updateProjectionMatrix()`**.

**Visual idea:** Split panel – static one-shot `render` vs a loop updating a rotating mesh.

---

## Cleaning up (save your GPU)

When you tear down a view – route change, React unmount, hot reload – dispose **geometries** and **materials** you no longer need so WebGL does not leak resources. Patterns vary (single shared material vs many), but the habit is the same: if you created it and you own it, dispose it when the scene goes away.

**Visual idea:** DevTools memory timeline before/after adding `dispose()` in a stress test.

---

## Series navigation

**Previous:** [Mapbox 101](./mapbox-101.md)

**Next:** [Using Three.js in Mapbox](./using-threejs-in-mapbox.md) – why syncing with a map is hard, and how Threebox’s `CameraSync` thinks about it.

---

## References

- [Three.js](https://threejs.org/) – project home.
- [Three.js manual – Creating a scene](https://threejs.org/manual/#en/creating-a-scene) – official walkthrough.
- [Three.js docs – PerspectiveCamera](https://threejs.org/docs/#api/en/cameras/PerspectiveCamera) – parameters explained.
- [Three.js docs – WebGLRenderer](https://threejs.org/docs/#api/en/renderers/WebGLRenderer) – canvas, size, and rendering.
- [threejs-journey – first project script](https://github.com/nareshbhatia/threejs-journey/blob/main/03-first-threejs-project/src/script.js) – commented pipeline and coordinate notes.
- Bruno Simon – [Three.js Journey](https://threejs-journey.com/) – course that pairs with the repo above (paid).
