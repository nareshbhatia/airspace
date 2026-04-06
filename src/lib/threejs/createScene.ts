import { AxesHelper, GridHelper, Scene } from 'three';

export interface CreateSceneOptions {
  /** When true, adds a {@link GridHelper} on the XZ plane. */
  grid?: boolean;
  /** When true, adds an {@link AxesHelper}. */
  axes?: boolean;
  /** Grid extent (default 1000). */
  gridSize?: number;
  /** Grid cell count (default 20). */
  gridDivisions?: number;
}

/**
 * Creates a {@link Scene}, optionally with debug grid and/or axes.
 */
export function createScene(options?: CreateSceneOptions): Scene {
  const scene = new Scene();
  const o = options ?? {};

  if (o.grid === true) {
    const size = o.gridSize ?? 1000;
    const divisions = o.gridDivisions ?? 20;
    scene.add(new GridHelper(size, divisions, 0x333333, 0x222222));
  }

  if (o.axes === true) {
    scene.add(new AxesHelper(300));
  }

  return scene;
}
