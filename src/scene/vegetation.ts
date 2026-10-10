import { BufferAttribute, type BufferGeometry, Color, MeshLambertMaterial } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Seconds of wind time, shared by every vegetation material and advanced by the render loop. */
export const windTime = { value: 0 };

export interface VegUniforms {
  /** The two colours a mesh blends between (per vertex or per instance, see below). */
  colA: { value: Color };
  colB: { value: Color };
  /** 0–1 scale of the whole mesh about its base: flowers opening and fading, leaves coming and going. */
  bloom: { value: number };
}

export interface VegOptions {
  /** Sway at the top of the plant, in local units. 0 = rigid. */
  wind?: number;
  /** Local height of the plant (sway grows with the square of height / this). */
  height?: number;
  /** Small, fast leaf flutter on top of the sway. */
  flutter?: number;
  /** Colour blend comes from a per-vertex `color` attribute instead of per-instance colours. */
  vertexColors?: boolean;
}

/**
 * A flat-shaded Lambert material that (1) blends between two seasonal colours using the red
 * channel of the vertex or instance colour (green adds a little brightness variation), (2) sways
 * in a slow, gusting wind and (3) can grow or shrink with the season. Everything else (fog,
 * lights) is stock three.js.
 */
export function vegMaterial({ wind = 0, height = 1, flutter = 0, vertexColors = false }: VegOptions = {}): {
  material: MeshLambertMaterial;
  uniforms: VegUniforms;
} {
  const uniforms: VegUniforms = {
    colA: { value: new Color() },
    colB: { value: new Color() },
    bloom: { value: 1 },
  };
  const material = new MeshLambertMaterial({ flatShading: true, vertexColors });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uColA: uniforms.colA,
      uColB: uniforms.colB,
      uBloom: uniforms.bloom,
      uTime: windTime,
      uWind: { value: wind },
      uHeight: { value: height },
      uFlutter: { value: flutter },
    });
    shader.vertexShader =
      'uniform float uTime;\nuniform float uWind;\nuniform float uHeight;\nuniform float uFlutter;\nuniform float uBloom;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        /* glsl */ `
        vec3 transformed = position * uBloom;
        #ifdef USE_INSTANCING
          vec3 iPos = instanceMatrix[3].xyz;
        #else
          vec3 iPos = vec3(0.0);
        #endif
        float h = clamp(position.y / uHeight, 0.0, 1.4);
        float bend = h * h;
        float phase = iPos.x * 0.37 + iPos.z * 0.23;
        // Slow gusts that travel across the forest, so neighbours move together, not in lockstep.
        float gust = 0.55 + 0.45 * sin(uTime * 0.31 - iPos.x * 0.045 - iPos.z * 0.03);
        transformed.x += (sin(uTime * 1.2 + phase) + 0.35 * sin(uTime * 2.7 + phase * 1.7)) * uWind * bend * gust;
        transformed.z += cos(uTime * 0.95 + phase * 1.3) * uWind * 0.55 * bend * gust;
        transformed.xz += uFlutter * h * gust * vec2(
          sin(uTime * 6.5 + position.x * 9.0 + phase),
          cos(uTime * 5.9 + position.z * 9.0 + phase)
        );
        `,
      );
    shader.fragmentShader =
      'uniform vec3 uColA;\nuniform vec3 uColB;\n' +
      shader.fragmentShader.replace(
        '#include <color_fragment>',
        /* glsl */ `
        #if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
          diffuseColor.rgb = mix(uColA, uColB, vColor.r) * mix(0.88, 1.1, vColor.g);
        #else
          diffuseColor.rgb = uColA;
        #endif
        `,
      );
  };
  // Every vegetation material shares one program (uniforms differ per material).
  material.customProgramCacheKey = () => 'veg';
  return { material, uniforms };
}

/** Give a geometry a constant blend (r) and brightness (g) as its vertex colour. */
export function tint(geo: BufferGeometry, r: number, g = 0.5): BufferGeometry {
  const g2 = geo.index ? geo.toNonIndexed() : geo;
  const count = g2.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colors.set([r, g, 0], i * 3);
  g2.setAttribute('color', new BufferAttribute(colors, 3));
  return g2;
}

/** Merge parts into one non-indexed geometry, dropping attributes they don't all share. */
export function merge(parts: BufferGeometry[]): BufferGeometry {
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  const names = Object.keys(flat[0].attributes).filter((n) => flat.every((g) => g.attributes[n]));
  for (const g of flat) for (const n of Object.keys(g.attributes)) if (!names.includes(n)) g.deleteAttribute(n);
  const merged = mergeGeometries(flat);
  if (!merged) throw new Error('Could not merge geometries');
  return merged;
}
