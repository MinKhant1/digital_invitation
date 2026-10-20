import fs from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const buf = fs.readFileSync("public/assets/models/five.glb");
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const loader = new GLTFLoader();

loader.parse(
  arrayBuffer,
  "",
  (gltf) => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    console.log("bbox size", size.toArray().map((n) => +n.toFixed(4)));
    console.log("bbox center", center.toArray().map((n) => +n.toFixed(4)));
    console.log("bbox min", box.min.toArray().map((n) => +n.toFixed(4)));
    console.log("bbox max", box.max.toArray().map((n) => +n.toFixed(4)));
    console.log(
      "clips",
      gltf.animations.map((clip) => `${clip.name} ${clip.duration.toFixed(2)}s`),
    );

    const mixer = new THREE.AnimationMixer(gltf.scene);
    const clip = THREE.AnimationClip.findByName(gltf.animations, "IGNITE_18s_MainReveal");
    const action = mixer.clipAction(clip);
    action.play();
    action.paused = true;
    const hero = gltf.scene.getObjectByName("HERO_GoldenFive");
    const year1 = gltf.scene.getObjectByName("YEAR_1_Pillar");
    const year5 = gltf.scene.getObjectByName("YEAR_5_Pillar");
    const red = gltf.scene.getObjectByName("RIBBON_RedUnion");
    for (const t of [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18]) {
      action.time = t;
      mixer.update(0);
      const read = (obj) => (obj ? obj.scale.x.toFixed(3) : "-");
      console.log(
        `t=${t}`,
        "hero",
        read(hero),
        "y1",
        read(year1),
        "y5",
        read(year5),
        "red",
        read(red),
      );
    }
  },
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
