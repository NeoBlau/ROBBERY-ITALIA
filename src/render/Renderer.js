// Renderer.js — обёртка над Three.js: сцена, свет, камера сверху, ресайз.
// CameraController реализует плавную камеру-«вид сверху под углом» (§43).
import * as THREE from 'three';
import { MOOD } from './Assets.js';
import { damp } from '../core/Util.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.worldRoot = new THREE.Group();
    this.scene.add(this.worldRoot);

    // Перспективная камера с небольшим наклоном даёт «3D сверху».
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.5, 200);
    this.camControl = new CameraController(this.camera);

    // Свет.
    this.ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambient);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const s = this.sun.shadow.camera;
    s.left = -22; s.right = 22; s.top = 22; s.bottom = -22; s.near = 1; s.far = 80;
    this.sun.shadow.bias = -0.0004;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x404050, 0.35);
    this.scene.add(this.hemi);

    // Дополнительные точечные источники (например, тревога/ТВ) хранятся отдельно.
    this.dynamicLights = [];

    this._onResize = () => this.resize();
    addEventListener('resize', this._onResize);
    this.resize();
  }

  setMood(name) {
    const m = MOOD[name] || MOOD.day;
    this.scene.background = new THREE.Color(m.sky);
    this.scene.fog = new THREE.Fog(m.fog, 34, 78);
    this.ambient.intensity = m.ambient;
    this.sun.intensity = m.sun;
    this.sun.color = new THREE.Color(m.sunColor);
  }

  clearWorld() {
    while (this.worldRoot.children.length) {
      const c = this.worldRoot.children.pop();
      c.traverse?.((o) => { o.geometry?.dispose?.(); });
      this.worldRoot.remove(c);
    }
    for (const l of this.dynamicLights) this.scene.remove(l);
    this.dynamicLights = [];
  }

  addDynamicLight(light) { this.dynamicLights.push(light); this.scene.add(light); return light; }

  resize() {
    const w = this.canvas.clientWidth || innerWidth;
    const h = this.canvas.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(dt) {
    this.camControl.update(dt);
    // Солнце следует за камерой, чтобы тени были стабильны.
    const t = this.camControl.target;
    this.sun.position.set(t.x + 12, 26, t.z + 10);
    this.sun.target.position.set(t.x, 0, t.z);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() { removeEventListener('resize', this._onResize); this.renderer.dispose(); }
}

// Плавная камера сверху под углом. Держит цель в кадре, слегка «дышит» при беге.
export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.target = new THREE.Vector3(0, 0, 0);
    this.desired = new THREE.Vector3(0, 0, 0);
    this.height = 15;
    this.back = 9;       // смещение назад по Z для наклона
    this.zoom = 1;       // 1 = обычный, <1 приближение
    this.shake = 0;
  }
  setTarget(x, z, snap = false) {
    this.desired.set(x, 0, z);
    if (snap) { this.target.copy(this.desired); this._place(); }
  }
  addShake(a) { this.shake = Math.min(1.2, this.shake + a); }
  _place() {
    const h = this.height * this.zoom, b = this.back * this.zoom;
    let sx = 0, sz = 0;
    if (this.shake > 0.001) {
      sx = (Math.random() - 0.5) * this.shake * 0.6;
      sz = (Math.random() - 0.5) * this.shake * 0.6;
    }
    this.camera.position.set(this.target.x + sx, h, this.target.z + b + sz);
    this.camera.lookAt(this.target.x, 0, this.target.z - 1.5);
  }
  update(dt) {
    this.target.x = damp(this.target.x, this.desired.x, 6, dt);
    this.target.z = damp(this.target.z, this.desired.z, 6, dt);
    this.shake = Math.max(0, this.shake - dt * 2.2);
    this._place();
  }
}
