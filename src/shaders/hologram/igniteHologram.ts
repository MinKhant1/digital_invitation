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
  if (r > 1.0) discard;
  float ang = atan(p.y, p.x);

  float core = smoothstep(0.16, 0.0, r);
  float halo = smoothstep(0.42, 0.0, r) * 0.35;
  float ringA = smoothstep(0.018, 0.0, abs(r - 0.28));
  float ringB = smoothstep(0.012, 0.0, abs(r - 0.46));
  float ringC = smoothstep(0.016, 0.0, abs(r - 0.66));
  float ringD = smoothstep(0.01, 0.0, abs(r - 0.84));
  float ticks = step(0.62, fract(ang * 1.2732)) * smoothstep(0.58, 0.64, r) * smoothstep(0.78, 0.7, r);
  float dashes = step(0.42, fract(ang * 3.8197 + uTime * 0.08)) * ringB;
  float spin = 0.55 + 0.45 * sin(ang * 7.0 - uTime * 1.1);
  float arc = ringC * spin;

  float alpha = (core * 0.95 + halo + ringA + dashes + arc + ringD * 0.85 + ticks) * uOpacity;
  if (alpha < 0.02) discard;
  vec3 gold = vec3(1.0, 0.82, 0.38);
  vec3 amber = vec3(1.0, 0.48, 0.12);
  vec3 color = mix(amber, gold, clamp(core + ringA + ringD, 0.0, 1.0));
  color += gold * core * 0.65;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

export const holoBeamVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const holoBeamFragmentShader = /* glsl */ `
precision mediump float;
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  float y = vUv.y;
  float spread = mix(0.16, 1.0, smoothstep(0.0, 1.0, y));
  float x = (vUv.x - 0.5) / spread;
  if (abs(x) > 0.5) discard;

  float dist = abs(x) * 2.0;
  float shaft = exp(-dist * dist * 5.5);
  float rays = pow(max(0.0, cos(x * 28.0 + uTime * 0.6)), 8.0);
  float fine = pow(max(0.0, sin(x * 70.0 - uTime * 1.3)), 16.0);
  float flicker = 0.86 + 0.14 * sin(uTime * 2.2 + y * 9.0);
  float lift = smoothstep(0.0, 0.05, y);
  float alpha = shaft * (0.42 + rays * 0.7 + fine * 0.45) * lift * flicker * uOpacity;
  if (alpha < 0.015) discard;
  vec3 color = mix(vec3(1.0, 0.93, 0.62), vec3(1.0, 0.52, 0.14), dist);
  gl_FragColor = vec4(color * alpha, alpha);
}
`;
