export const hologramVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const hologramFragmentShader = /* glsl */ `
precision mediump float;

uniform sampler2D uMap;
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;

void main() {
  float fringe = 0.0016;
  float r = texture2D(uMap, vUv + vec2(fringe, 0.0)).r;
  vec4 tex = texture2D(uMap, vUv);
  float b = texture2D(uMap, vUv - vec2(fringe, 0.0)).b;
  if (tex.a < 0.05) discard;

  float scan = 0.78 + 0.22 * sin(vUv.y * 180.0 - uTime * 3.2);
  float bandPos = fract(1.0 - vUv.y + uTime * 0.18);
  float band = smoothstep(0.0, 0.04, bandPos) * smoothstep(0.22, 0.05, bandPos);
  float flicker = 0.94 + 0.06 * sin(uTime * 17.0 + vUv.y * 12.0);

  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fres = pow(1.0 - clamp(abs(dot(normalize(vWorldNormal), viewDir)), 0.0, 1.0), 2.4);
  float rise = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.72, vUv.y);

  vec3 color = vec3(r, tex.g, b);
  color *= 1.05 + band * 0.65;
  color += vec3(1.0, 0.72, 0.28) * fres * 0.55;
  color += vec3(1.0, 0.28, 0.12) * band * 0.35;

  float alpha = tex.a * scan * flicker * rise * uOpacity;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

export const holoRingVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const holoRingFragmentShader = /* glsl */ `
precision mediump float;
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float ring = smoothstep(0.92, 0.72, r) * smoothstep(0.42, 0.68, r);
  float core = smoothstep(0.55, 0.0, r);
  float spin = 0.65 + 0.35 * sin(atan(p.y, p.x) * 8.0 - uTime * 1.4);
  float spokes = 0.55 + 0.45 * sin(atan(p.y, p.x) * 3.0 + uTime * 0.7);
  float alpha = (ring * spin + core * 0.28 * spokes) * uOpacity;
  if (alpha < 0.02) discard;
  vec3 color = mix(vec3(0.85, 0.12, 0.16), vec3(1.0, 0.78, 0.34), ring);
  gl_FragColor = vec4(color * alpha, alpha);
}
`;
