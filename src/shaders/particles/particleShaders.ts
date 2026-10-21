export const particleVertexShader = /* glsl */ `
attribute vec3 aSeed;
uniform float uTime;
uniform float uSize;
uniform float uHeight;
uniform float uOpacity;
varying float vAlpha;
varying float vWarmth;

void main() {
  float speed = 0.16 + aSeed.y * 0.42;
  float angle = aSeed.x * 6.2831853 + uTime * speed;
  float radiusX = 0.52 + aSeed.y * 0.36;
  float radiusY = 0.36 + aSeed.x * 0.3;
  float lift = fract(aSeed.z + uTime * (0.045 + aSeed.y * 0.07));
  float drift = sin(uTime * 0.85 + aSeed.z * 11.0) * 0.045;
  vec3 pos = vec3(
    cos(angle) * (radiusX + drift),
    sin(angle) * radiusY - 0.02,
    lift * uHeight + sin(uTime * 1.3 + angle) * 0.03
  );
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float attenuation = clamp(1.25 / max(0.2, -mv.z), 0.45, 5.5);
  float twinkle = 0.55 + 0.45 * sin(uTime * 2.8 + aSeed.x * 24.0);
  gl_PointSize = uSize * (0.35 + aSeed.z * 1.15) * twinkle * attenuation;
  float fade = smoothstep(0.0, 0.07, lift) * smoothstep(1.0, 0.78, lift);
  vAlpha = uOpacity * twinkle * fade;
  vWarmth = aSeed.y;
}
`;

export const particleFragmentShader = /* glsl */ `
precision mediump float;
varying float vAlpha;
varying float vWarmth;

void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float dist = length(p);
  if (dist > 0.5) discard;
  float glow = smoothstep(0.5, 0.08, dist);
  float core = smoothstep(0.16, 0.0, dist);
  vec3 gold = mix(vec3(0.86, 0.42, 0.1), vec3(1.0, 0.9, 0.55), vWarmth);
  vec3 color = gold * (0.55 + core * 1.15);
  gl_FragColor = vec4(color, (glow * 0.72 + core) * vAlpha);
}
`;
