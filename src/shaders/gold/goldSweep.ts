import * as THREE from "three";

export interface SweepUniforms {
  uTime: { value: number };
  uSweep: { value: number };
  uGlow: { value: number };
  uBoxMin: { value: number };
  uBoxMax: { value: number };
  uGlowColor: { value: THREE.Color };
}

const vertexInject = /* glsl */ `
varying vec3 vSweepLocal;
`;

const vertexAssign = /* glsl */ `
vSweepLocal = position;
`;

const fragmentInject = /* glsl */ `
varying vec3 vSweepLocal;
uniform float uTime;
uniform float uSweep;
uniform float uGlow;
uniform float uBoxMin;
uniform float uBoxMax;
uniform vec3 uGlowColor;
`;

const fragmentAssign = /* glsl */ `
float sweepSpan = max(uBoxMax - uBoxMin, 0.0001);
float sweepX = clamp((vSweepLocal.x - uBoxMin) / sweepSpan, 0.0, 1.0);
float sweepGate = 1.0 - smoothstep(uSweep, uSweep + 0.16, sweepX);
diffuseColor.a *= sweepGate;
float fresnelEdge = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.6);
float travel = fract(sweepX * 1.7 - uTime * 0.16);
float glint = smoothstep(0.46, 0.5, travel) * smoothstep(0.64, 0.52, travel);
totalEmissiveRadiance += uGlowColor * (fresnelEdge * 0.62 + glint * 0.7) * uGlow * sweepGate;
`;

export function attachSweep(material: THREE.MeshPhysicalMaterial, glow: THREE.Color, variant: string) {
  const uniforms: SweepUniforms = {
    uTime: { value: 0 },
    uSweep: { value: 0 },
    uGlow: { value: 1 },
    uBoxMin: { value: -0.1 },
    uBoxMax: { value: 0.1 },
    uGlowColor: { value: glow },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uSweep = uniforms.uSweep;
    shader.uniforms.uGlow = uniforms.uGlow;
    shader.uniforms.uBoxMin = uniforms.uBoxMin;
    shader.uniforms.uBoxMax = uniforms.uBoxMax;
    shader.uniforms.uGlowColor = uniforms.uGlowColor;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${vertexInject}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${vertexAssign}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${fragmentInject}`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${fragmentAssign}`);
  };
  material.customProgramCacheKey = () => `sweep-${variant}`;
  return uniforms;
}
