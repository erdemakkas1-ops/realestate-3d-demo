import type { Material, WebGLProgramParametersWithUniforms } from "three";

type PaneGrid = {
  /** Model-space height where the first residential floor starts. */
  floorStartY: number;
  floorHeight: number;
  paneWidth: number;
};

/**
 * The Meshy model has no window geometry, only glass-coloured recesses. This adds a procedural
 * pane grid to the glass material's emission: dark mullions and transoms aligned to the floor
 * calibration, and a stable, per-pane interior brightness (some rooms dim, a few dark), so the
 * facade reads as lit windows at dusk instead of a uniformly glowing surface.
 */
export function applyWindowPanes(material: Material, grid: PaneGrid) {
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uFloorStart = { value: grid.floorStartY };
    shader.uniforms.uFloorHeight = { value: grid.floorHeight };
    shader.uniforms.uPaneWidth = { value: grid.paneWidth };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vPanePos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPanePos = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec3 vPanePos;
uniform float uFloorStart;
uniform float uFloorHeight;
uniform float uPaneWidth;
float paneHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float paneLight() {
  vec3 n = normalize(cross(dFdx(vPanePos), dFdy(vPanePos)));
  // Run along whichever horizontal axis the face spans.
  float along = abs(n.x) > abs(n.z) ? vPanePos.z : vPanePos.x;
  float side = abs(n.x) > abs(n.z) ? sign(n.x) * 7.0 : sign(n.z) * 13.0;
  vec2 cell = vec2(along / uPaneWidth, (vPanePos.y - uFloorStart) / uFloorHeight);
  vec2 f = fract(cell);
  vec2 id = floor(cell) + side;
  float frame = smoothstep(0.04, 0.09, f.x) * (1.0 - smoothstep(0.91, 0.96, f.x))
              * smoothstep(0.1, 0.16, f.y) * (1.0 - smoothstep(0.86, 0.9, f.y));
  float r = paneHash(id);
  float level = r < 0.18 ? 0.05 : r < 0.42 ? 0.38 : 0.7 + 0.3 * paneHash(id + 3.1);
  // Ceiling light: a little brighter towards the top of each pane.
  return frame * level * (0.8 + 0.35 * f.y);
}`)
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance *= paneLight();");
  };
  material.customProgramCacheKey = () => "window-panes";
  material.needsUpdate = true;
}
