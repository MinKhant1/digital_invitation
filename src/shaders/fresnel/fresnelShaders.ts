export const radialVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const radialFragmentShader = /* glsl */ `
precision mediump float;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float ring = smoothstep(0.72, 0.48, r) * smoothstep(0.12, 0.42, r);
  float core = smoothstep(0.55, 0.0, r);
  float spin = 0.5 + 0.5 * sin(atan(p.y, p.x) * 6.0 + uTime * 0.6);
  float alpha = (ring * (0.45 + 0.55 * spin) + core * 0.55) * uOpacity;
  if (alpha < 0.02) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

export const ringVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const ringFragmentShader = /* glsl */ `
precision mediump float;
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  float band = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
  float alpha = band * uOpacity;
  if (alpha < 0.02) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;
