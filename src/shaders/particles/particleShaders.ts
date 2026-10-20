export const particleVertexShader = /* glsl */ `
attribute vec3 aSeed;
uniform float uTime;
uniform float uSize;
uniform float uHeight;
uniform float uOpacity;
varying float vAlpha;

void main() {
  float speed = 0.07 + aSeed.z * 0.14;
  float cycle = fract(uTime * speed + aSeed.y);
  vec3 pos = vec3(
    aSeed.x + sin(uTime * 0.55 + aSeed.y * 9.0) * 0.018,
    aSeed.y * 0.08 + cos(uTime * 0.4 + aSeed.x * 7.0) * 0.016,
    cycle * uHeight
  );
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float attenuation = clamp(1.15 / max(0.25, -mv.z), 0.35, 4.0);
  gl_PointSize = uSize * (1.0 - cycle * 0.65) * attenuation;
  vAlpha = uOpacity * (1.0 - cycle) * smoothstep(0.0, 0.08, cycle);
}
`;

export const particleFragmentShader = /* glsl */ `
precision mediump float;
uniform vec3 uColor;
varying float vAlpha;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;
  float glow = smoothstep(0.5, 0.05, dist);
  gl_FragColor = vec4(uColor, glow * vAlpha);
}
`;
