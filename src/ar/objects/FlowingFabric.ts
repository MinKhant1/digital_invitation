import * as THREE from "three";
import { fabricFragmentShader, fabricVertexShader } from "../../shaders/fabric/fabricShaders";

export interface FabricBuild {
  points: THREE.Vector3[];
  width: number;
  lengthSegments: number;
  widthSegments: number;
  side: number;
  color: THREE.Color;
  trim: THREE.Color;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function buildGeometry(options: FabricBuild) {
  const curve = new THREE.CatmullRomCurve3(options.points, false, "catmullrom", 0.45);
  const lengthSegments = options.lengthSegments;
  const widthSegments = options.widthSegments;
  const frames: { point: THREE.Vector3; normal: THREE.Vector3; binormal: THREE.Vector3; tangent: THREE.Vector3 }[] = [];
  const facing = new THREE.Vector3(0, 0, 1);

  for (let i = 0; i <= lengthSegments; i += 1) {
    const t = i / lengthSegments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, facing);
    if (binormal.lengthSq() < 1e-6) binormal.crossVectors(tangent, new THREE.Vector3(0, 1, 0));
    binormal.normalize();
    if (i > 0 && binormal.dot(frames[i - 1].binormal) < 0) binormal.negate();
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
    frames.push({ point, normal, binormal, tangent: tangent.clone() });
  }

  const positions: number[] = [];
  const normals: number[] = [];
  const tangents: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= lengthSegments; i += 1) {
    const t = i / lengthSegments;
    const frame = frames[i];
    const taper = Math.max(0.28, Math.sin(Math.PI * t) ** 0.55);
    const ends = smoothstep(0, 0.08, t) * smoothstep(1, 0.9, t);
    const half = options.width * 0.5 * taper * Math.max(0.35, ends);
    for (let j = 0; j <= widthSegments; j += 1) {
      const v = j / widthSegments;
      const offset = (v - 0.5) * 2 * half;
      const position = frame.point.clone().addScaledVector(frame.binormal, offset);
      positions.push(position.x, position.y, position.z);
      normals.push(frame.normal.x, frame.normal.y, frame.normal.z);
      tangents.push(frame.tangent.x, frame.tangent.y, frame.tangent.z);
      uvs.push(t, v);
    }
  }

  const stride = widthSegments + 1;
  for (let i = 0; i < lengthSegments; i += 1) {
    for (let j = 0; j < widthSegments; j += 1) {
      const a = i * stride + j;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("aTangent", new THREE.Float32BufferAttribute(tangents, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  if (geometry.boundingSphere) geometry.boundingSphere.radius += 0.25;
  return geometry;
}

export class FlowingFabric {
  readonly mesh: THREE.Mesh;
  readonly uniforms: {
    uTime: { value: number };
    uAmplitude: { value: number };
    uFrequency: { value: number };
    uSpeed: { value: number };
    uTwist: { value: number };
    uOpen: { value: number };
    uSide: { value: number };
    uReveal: { value: number };
    uOpacity: { value: number };
    uHighlight: { value: number };
    uColor: { value: THREE.Color };
    uTrim: { value: THREE.Color };
  };

  constructor(options: FabricBuild) {
    this.uniforms = {
      uTime: { value: 0 },
      uAmplitude: { value: 0.03 },
      uFrequency: { value: 1.15 },
      uSpeed: { value: 0.85 },
      uTwist: { value: 0.035 },
      uOpen: { value: 0 },
      uSide: { value: options.side },
      uReveal: { value: 0 },
      uOpacity: { value: 1 },
      uHighlight: { value: 0 },
      uColor: { value: options.color },
      uTrim: { value: options.trim },
    };
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: fabricVertexShader,
      fragmentShader: fabricFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    this.mesh = new THREE.Mesh(buildGeometry(options), material);
    this.mesh.name = options.side < 0 ? "RedSilk" : "WhiteSilk";
    this.mesh.frustumCulled = true;
    this.mesh.renderOrder = options.side < 0 ? 2 : 3;
  }

  rebuild(options: FabricBuild) {
    const next = buildGeometry(options);
    this.mesh.geometry.dispose();
    this.mesh.geometry = next;
    this.uniforms.uSide.value = options.side;
    this.uniforms.uColor.value.copy(options.color);
    this.uniforms.uTrim.value.copy(options.trim);
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
