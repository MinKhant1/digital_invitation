export const fabricVertexShader = /* glsl */ `
attribute vec3 aTangent;

uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uSpeed;
uniform float uTwist;
uniform float uOpen;
uniform float uSide;
uniform float uReveal;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vTangentW;
varying vec3 vWorldPos;
varying float vReveal;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vUv = uv;
  float along = uv.x;
  float across = uv.y - 0.5;
  vec3 n = normalize(normal);
  vec3 tangent = normalize(aTangent);
  vec3 side = normalize(cross(tangent, n));

  float wave = sin(along * uFrequency * 6.2831853 + uTime * uSpeed);
  float wave2 = sin(along * uFrequency * 12.5 - uTime * uSpeed * 0.72 + across * 4.5);
  float turb = noise(vec2(along * 3.2, uTime * 0.28)) - 0.5;
  float taper = smoothstep(0.0, 0.14, along) * smoothstep(1.0, 0.8, along);
  float flutter = (wave * 0.62 + wave2 * 0.38 + turb * 0.5) * uAmplitude * mix(0.4, 1.0, taper);
  float twist = sin(along * 3.14159265 + uTime * 0.38) * uTwist;

  vec3 displaced = position;
  displaced += n * flutter;
  displaced += side * twist * across;
  displaced.x += uOpen * uSide * 0.42;
  displaced.y += uOpen * 0.05;
  displaced.z += uOpen * (0.1 + flutter * 0.4);

  vec4 world = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * n);
  vTangentW = normalize(mat3(modelMatrix) * tangent);
  vReveal = 1.0 - smoothstep(uReveal - 0.08, uReveal, along);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const fabricFragmentShader = /* glsl */ `
precision mediump float;

uniform vec3 uColor;
uniform vec3 uTrim;
uniform float uOpacity;
uniform float uHighlight;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vTangentW;
varying vec3 vWorldPos;
varying float vReveal;

void main() {
  float across = abs(vUv.y - 0.5);
  float trim = smoothstep(0.4, 0.48, across);
  float edge = 1.0 - smoothstep(0.455, 0.5, across);
  vec3 normalW = normalize(vNormalW);
  if (!gl_FrontFacing) normalW = -normalW;
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 tangentW = normalize(vTangentW);
  float facing = clamp(dot(normalW, viewDir), 0.0, 1.0);
  float fresnel = pow(1.0 - facing, 2.4);
  vec3 halfDir = normalize(viewDir + tangentW * 0.45);
  float satin = pow(clamp(dot(normalW, halfDir), 0.0, 1.0), 26.0);
  float sheen = pow(clamp(dot(normalize(viewDir + normalize(cross(normalW, tangentW))), normalW), 0.0, 1.0), 6.0);
  float sweep = smoothstep(0.42, 0.5, fract(vUv.x * 1.4 + uHighlight)) * smoothstep(0.66, 0.52, fract(vUv.x * 1.4 + uHighlight));
  float motif = abs(sin(vUv.x * 42.0) * sin((vUv.y - 0.5) * 28.0));

  vec3 color = uColor * (0.78 + 0.45 * facing);
  color += uTrim * satin * 0.8;
  color += vec3(1.0, 0.94, 0.86) * sheen * 0.16;
  color += uTrim * fresnel * 0.38;
  color += uTrim * sweep * 0.45;
  color = mix(color, uTrim, trim * 0.94);
  color = mix(color, uTrim, smoothstep(0.72, 0.96, motif) * 0.16 * (1.0 - trim));

  float alpha = uOpacity * vReveal * edge;
  if (alpha < 0.03) discard;
  gl_FragColor = vec4(color, alpha);
}
`;
