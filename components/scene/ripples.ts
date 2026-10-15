// Рябь на воде: волновое уравнение на сетке в двух текстурах, которые меняются местами каждый шаг.
// В канале r высота, в канале g скорость. Капли (курсор, касание, буквы, панели) добавляются пачкой.
import * as THREE from "three";

const MAX_DROPS = 16;

export class Ripples {
  readonly width: number;
  readonly height: number;
  private targets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private index = 0;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private material: THREE.ShaderMaterial;
  private drops: THREE.Vector4[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    const make = () =>
      new THREE.WebGLRenderTarget(width, height, {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false,
      });
    this.targets = [make(), make()];
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tPrev: { value: null },
        uTexel: { value: new THREE.Vector2(1 / width, 1 / height) },
        uDamp: { value: 0.993 },
        uDrops: { value: Array.from({ length: MAX_DROPS }, () => new THREE.Vector4()) },
        uCount: { value: 0 },
        uAspect: { value: width / height },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tPrev;
        uniform vec2 uTexel;
        uniform float uDamp, uAspect;
        uniform vec4 uDrops[${MAX_DROPS}];
        uniform int uCount;
        varying vec2 vUv;
        void main() {
          vec4 info = texture2D(tPrev, vUv);
          float avg = (
            texture2D(tPrev, vUv - vec2(uTexel.x, 0.0)).r +
            texture2D(tPrev, vUv + vec2(uTexel.x, 0.0)).r +
            texture2D(tPrev, vUv - vec2(0.0, uTexel.y)).r +
            texture2D(tPrev, vUv + vec2(0.0, uTexel.y)).r) * 0.25;
          info.g += (avg - info.r) * 2.0;
          info.g *= uDamp;
          info.r += info.g;
          info.r *= 0.999;
          for (int i = 0; i < ${MAX_DROPS}; i++) {
            if (i >= uCount) break;
            vec4 d = uDrops[i]; // u, v, радиус (в долях ширины), сила
            vec2 delta = (vUv - d.xy) * vec2(1.0, 1.0 / uAspect);
            float k = max(0.0, 1.0 - length(delta) / d.z);
            k = 0.5 - cos(k * 3.14159265) * 0.5;
            info.r -= k * d.w;
          }
          // у края сетки волна гаснет, а не отражается
          vec2 e = smoothstep(0.0, 0.03, vUv) * smoothstep(0.0, 0.03, 1.0 - vUv);
          info.rg *= mix(0.85, 1.0, e.x * e.y);
          // наклон поверхности (по соседям прошлого шага): вода читает его с плавной интерполяцией
          float hl = texture2D(tPrev, vUv - vec2(uTexel.x, 0.0)).r;
          float hr = texture2D(tPrev, vUv + vec2(uTexel.x, 0.0)).r;
          float hd = texture2D(tPrev, vUv - vec2(0.0, uTexel.y)).r;
          float hu = texture2D(tPrev, vUv + vec2(0.0, uTexel.y)).r;
          info.ba = vec2(hr - hl, hu - hd) * 0.5;
          gl_FragColor = info;
        }
      `,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }

  // u, v в долях сетки; radius в долях ширины; strength — глубина ямки
  private idle = 0; // шагов подряд без капель

  drop(u: number, v: number, radius: number, strength: number) {
    if (u < 0 || u > 1 || v < 0 || v > 1 || strength <= 0) return;
    if (this.drops.length >= MAX_DROPS) this.drops.shift();
    this.drops.push(new THREE.Vector4(u, v, radius, Math.min(strength, 0.08)));
  }

  step(gl: THREE.WebGLRenderer, steps: number) {
    // давно не было капель: вода уже гладкая, считать нечего
    this.idle = this.drops.length ? 0 : this.idle + steps;
    if (this.idle > 900) return;
    const prev = gl.getRenderTarget();
    const uniforms = this.material.uniforms;
    for (let s = 0; s < steps; s++) {
      const list = s === 0 ? this.drops : [];
      uniforms.uCount.value = list.length;
      list.forEach((d, i) => uniforms.uDrops.value[i].copy(d));
      uniforms.tPrev.value = this.targets[this.index].texture;
      this.index = 1 - this.index;
      gl.setRenderTarget(this.targets[this.index]);
      gl.render(this.scene, this.camera);
    }
    this.drops = [];
    gl.setRenderTarget(prev);
  }

  get texture() {
    return this.targets[this.index].texture;
  }

  dispose() {
    this.targets.forEach((t) => t.dispose());
    this.material.dispose();
  }
}
