// Шейдеры сцены: надпись, панели кольца, небо, вода и шторка при раскрытии кейса.
// Каждый кадр рисуется в три прохода (см. World.tsx): отражение (мир перевёрнут под воду),
// то, что под водой, и основной кадр. uPass говорит шейдеру, какой сейчас проход.
import * as THREE from "three";

export type Shared = {
  uPass: { value: number }; // 0 основной кадр, 1 отражение, 2 под водой
  uPaper: { value: THREE.Color };
  uInk: { value: THREE.Color };
  uPlate: { value: THREE.Color };
  uDeep: { value: THREE.Color }; // цвет глубины
  uGlow: { value: THREE.Color }; // небо у горизонта
  uReflH: { value: number }; // на какой высоте отражение уже почти погасло
};

export function createShared(): Shared {
  return {
    uPass: { value: 0 },
    uPaper: { value: new THREE.Color("#0b0b0c") },
    uInk: { value: new THREE.Color("#f2f2f2") },
    uPlate: { value: new THREE.Color("#18181a") },
    uDeep: { value: new THREE.Color("#050506") },
    uGlow: { value: new THREE.Color("#1d1d20") },
    uReflH: { value: 1.2 },
  };
}

// Под водой предмет темнеет и уходит в цвет глубины. В отражении мир перевёрнут, поэтому высота
// над водой = -vWorld.y: у кромки отражение чёткое, выше растворяется в цвете фона, как на логотипе
const passChunk = /* glsl */ `
  if (uPass > 1.5) {
    float depth = clamp(-vWorld.y / uReflH, 0.0, 1.0);
    col = mix(col * 0.6, uDeep, smoothstep(0.0, 1.0, 0.35 + 0.65 * depth));
  } else if (uPass > 0.5) {
    col = mix(col, uPaper, 0.62 * smoothstep(0.0, uReflH, -vWorld.y)) * 0.82;
  }
`;

// ---------- надпись verver ----------

export function wordMaterial(shared: Shared) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uPass: shared.uPass,
      uInk: shared.uInk,
      uPaper: shared.uPaper,
      uDeep: shared.uDeep,
      uReflH: shared.uReflH,
    },
    clipping: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      #include <clipping_planes_pars_vertex>
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>
      uniform float uPass, uReflH;
      uniform vec3 uInk, uPaper;
      uniform vec3 uDeep;
      varying vec3 vWorld;
      void main() {
        #include <clipping_planes_fragment>
        vec3 col = uInk;
        ${passChunk}
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

// ---------- панель кольца ----------
// Сетка 1×1 в шейдере сгибается в кусок цилиндра. uExpand переводит её в плоский прямоугольник
// перед камерой (uRect в координатах камеры), а картинку — в «cover» под этот прямоугольник.

export type PanelUniforms = {
  uMap: { value: THREE.Texture | null };
  uMap2: { value: THREE.Texture | null }; // при раскрытии: экран, который стоит первым на странице кейса
  uMix: { value: number }; // 0 — свой экран, 1 — экран со страницы кейса
  uHasMap: { value: number };
  uTheta: { value: number };
  uWidth: { value: number };
  uRadius: { value: number };
  uHeight: { value: number };
  uLift: { value: number };
  uHover: { value: number };
  uBlur: { value: number };
  uDim: { value: number };
  uExpand: { value: number };
  uRect: { value: THREE.Vector4 };
  uDepth: { value: number };
  uCover: { value: THREE.Vector4 };
  // появление кольца (одни и те же объекты у всех панелей): см. ENTER ниже
  uEnter: { value: number };
  uEnterT: { value: number };
  uStretch: { value: number };
  // лента как ткань: при быстром вращении края стягиваются к центру кольца (uBend),
  // лента чуть сжимается по высоте (uSqueeze) и растягивается вширь (uWiden)
  uBend: { value: number };
  uSqueeze: { value: number };
  uWiden: { value: number };
  uEnterLin: { value: number }; // время появления 0..1 без сглаживания: по нему раскручивается свиток
};

// Появление кольца, как в DialKit: лента лежит плашмя на воде широким кругом, съезжает к центру
// и по кривой (трактриса: у воды почти горизонтально, выше всё круче) поднимается в стену кольца.
// Длины в половинах высоты панели. uEnterT считается в World.tsx: на какой длине пути середина
// панели встаёт на свою высоту.
export const ENTER = {
  curve: 1.87, // масштаб кривой: больше — положе и шире подъём
  approach: 1.02, // насколько лента в начале не доходит до кривой
  stretch: 1.19, // насколько далеко от кольца лежит лента на воде
  slope: 0.25, // как быстро лента подтягивается к кольцу на подъёме
  floor: 0.02, // высота над водой, на которой лента лежит
};

export function tractrixHeight(d: number, c: number) {
  const inv = Math.exp(-Math.max(0, d) / c);
  const ch = 1 / Math.max(1e-4, inv);
  return c * (Math.acosh(ch) - Math.sqrt(Math.max(0, 1 - inv * inv)));
}

export function panelMaterial(shared: Shared, u: PanelUniforms) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...u,
      uPass: shared.uPass,
      uDeep: shared.uDeep,
      uPlate: shared.uPlate,
      uPaper: shared.uPaper,
      uReflH: shared.uReflH,
    },
    clipping: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      #include <clipping_planes_pars_vertex>
      uniform float uTheta, uWidth, uRadius, uHeight, uLift, uHover, uExpand, uDepth;
      uniform float uEnter, uEnterT, uStretch, uBend, uSqueeze, uWiden, uEnterLin;
      uniform vec4 uRect;
      varying vec2 vUv;
      varying vec3 vWorld;
      varying vec3 vNormalW;

      float tractrixHeight(float d, float c) {
        float inv = exp(-max(0.0, d) / c);
        float ch = 1.0 / max(0.0001, inv);
        return c * (log(ch + sqrt(max(0.0, ch * ch - 1.0))) - sqrt(max(0.0, 1.0 - inv * inv)));
      }

      // точка ленты: место на панели поперёк (u от -0,5 до 0,5) и по высоте (yRel от -1 до 1)
      vec3 band(float u, float yRel, float r) {
        float h = uHeight * 0.5;
        // Пока кольцо появляется, каждый экран свёрнут, как бумажный свиток, и раскручивается.
        // Передние экраны раскручиваются раньше задних. В конце всё ровно, как без этого.
        float lin = clamp(uEnterLin, 0.0, 1.0);
        float roll = 0.0; // по горизонтали не сворачиваем, только по вертикали (см. ниже)
        float W = r * uWidth;
        float sx = (u + 0.5) * W; // от левого края экрана
        float p0 = W * (1.0 - roll); // отсюда бумага уходит в свиток
        float rc = W * 0.1;
        float dTan = 0.0;
        float dIn = 0.0;
        if (sx > p0) {
          float a = (sx - p0) / rc;
          float rr = rc / (1.0 + 0.12 * a); // виток к центру свитка всё уже
          dTan = p0 + rr * sin(a) - sx;
          dIn = rr * (1.0 - cos(a));
        }
        // верх экрана подвёрнут, как край листа, и расправляется вместе со свитком
        float topCurl = 0.55 * (1.0 - smoothstep(0.0, 0.75, lin));
        float q = h * (1.0 - topCurl * 1.4);
        float yy = yRel * h;
        float dY = 0.0;
        if (yy > q && topCurl > 0.0) {
          float a = (yy - q) / (h * 0.35);
          dY = q + h * 0.35 * sin(a) - yy;
          dIn += h * 0.35 * (1.0 - cos(a));
        }
        float e = clamp(uEnter, 0.0, 1.0);
        float settle = smoothstep(0.86, 1.0, e);
        // пока кольцо встаёт, экраны сомкнуты без зазора (как в DialKit), зазор появляется в конце
        float th = uTheta + u * uWidth * mix(1.0 / 0.985, 1.0, settle) + dTan / r;
        yRel = (yy + dY) / h;
        float c = ${ENTER.curve.toFixed(3)} * h;
        float s = yRel * h + mix(-h - ${ENTER.approach.toFixed(3)} * h, uEnterT, e);
        float off;
        if (s <= 0.0) {
          off = (c - s) * uStretch;
        } else {
          float k = pow(clamp(s / uEnterT, 0.0, 1.0), ${ENTER.slope.toFixed(3)});
          off = c * (1.0 - smoothstep(0.0, 1.0, k)) * uStretch;
        }
        // в самом начале лента всплывает из-под воды
        float y = ${ENTER.floor.toFixed(3)} + tractrixHeight(s, c) - (1.0 - smoothstep(0.0, 0.12, e)) * 0.7 * h;
        off *= 1.0 - settle;
        y = mix(y, uLift + h + yRel * h * uSqueeze, settle);
        r += off - dIn;
        return vec3(r * sin(th) * uWiden, y, r * cos(th));
      }

      void main() {
        vUv = uv;
        float u = uv.x - 0.5;
        float r = uRadius + uHover;
        float yRel = uv.y * 2.0 - 1.0;
        vec3 p = band(u, yRel, r);
        // нормаль по наклону ленты: пока лента лежит, она смотрит вверх; в свитке — по витку
        vec3 up = band(u, yRel + 0.02, r) - band(u, yRel - 0.02, r);
        vec3 side = band(u + 0.005, yRel, r) - band(u - 0.005, yRel, r);
        vec3 n = normalize(cross(side, up));
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorld = world.xyz;
        vNormalW = normalize((modelMatrix * vec4(n, 0.0)).xyz);
        vec4 mvPosition = viewMatrix * world;
        vec4 flatPos = vec4(mix(uRect.x, uRect.z, uv.x), mix(uRect.y, uRect.w, uv.y), -uDepth, 1.0);
        gl_Position = projectionMatrix * mix(mvPosition, flatPos, uExpand);
        #include <clipping_planes_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>
      uniform sampler2D uMap, uMap2;
      uniform float uHasMap, uMix, uBlur, uDim, uExpand, uPass, uReflH;
      uniform vec4 uCover;
      uniform vec3 uDeep, uPlate, uPaper;
      varying vec2 vUv;
      varying vec3 vWorld;
      varying vec3 vNormalW;

      // при быстром вращении картинка размывается вдоль хода кольца
      vec3 blurred(sampler2D map, vec2 uv) {
        if (uBlur <= 0.0) return texture2D(map, uv).rgb; // без размытия хватает одной выборки
        vec3 sum = vec3(0.0);
        float total = 0.0;
        for (int i = -3; i <= 3; i++) {
          float w = 1.0 - abs(float(i)) / 4.0;
          sum += texture2D(map, uv + vec2(float(i) * uBlur, 0.0)).rgb * w;
          total += w;
        }
        return sum / total;
      }

      void main() {
        #include <clipping_planes_fragment>
        vec3 col = uPlate;
        bool front = gl_FrontFacing || uExpand > 0.0;
        if (front && uHasMap > 0.5) {
          vec2 uv = mix(vUv, vUv * uCover.xy + uCover.zw, uExpand);
          col = blurred(uMap, uv);
          if (uMix > 0.0) col = mix(col, texture2D(uMap2, uv).rgb, uMix);
        } else if (!front) {
          col = uPlate * 0.8;
        }
        // боковые и дальние панели темнее, раскрытая — как есть
        vec3 v = normalize(cameraPosition - vWorld);
        float facing = abs(dot(vNormalW, v));
        float shade = mix(0.42, 1.0, smoothstep(0.05, 0.85, facing)) * uDim;
        col *= mix(shade, 1.0, uExpand);
        ${passChunk}
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

// ---------- небо: ровный фон с еле заметным светом у горизонта ----------

export function skyMaterial(shared: Shared) {
  return new THREE.ShaderMaterial({
    uniforms: { uPaper: shared.uPaper, uGlow: shared.uGlow, uPass: shared.uPass },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uPaper, uGlow;
      uniform float uPass;
      varying vec3 vWorld;
      void main() {
        float h = abs(vWorld.y);
        vec3 col = mix(uGlow, uPaper, pow(smoothstep(0.0, 90.0, h), 0.55));
        if (uPass > 0.5) col *= 0.9;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

// ---------- вода ----------
// Высоты ряби берутся из симуляции (tSim), поверх неё мелкие волны от времени.
// Отражение и то, что под водой, читаются из текстур проходов по координатам экрана.

export type WaterUniforms = {
  tReflect: { value: THREE.Texture | null };
  tRefract: { value: THREE.Texture | null };
  tSim: { value: THREE.Texture | null };
  uSimRect: { value: THREE.Vector4 }; // x0, z0, ширина, глубина в мире
  uSimTexel: { value: THREE.Vector2 };
  uSimOn: { value: number };
  uRes: { value: THREE.Vector2 }; // размер кадра в пикселях
  uTime: { value: number };
  uCalm: { value: number }; // 0..1, слабее мелкие волны
};

export function waterMaterial(shared: Shared, u: WaterUniforms) {
  return new THREE.ShaderMaterial({
    uniforms: { ...u, uPaper: shared.uPaper, uDeep: shared.uDeep, uGlow: shared.uGlow },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tReflect, tRefract, tSim;
      uniform vec4 uSimRect;
      uniform vec2 uSimTexel, uRes;
      uniform float uSimOn, uTime, uCalm;
      uniform vec3 uPaper, uDeep, uGlow;
      varying vec3 vWorld;

      // Волна, которая на экране короче ~10 пикселей, рябит лесенкой (у горизонта вода сжата
      // по вертикали в разы), поэтому такие волны гасим. px — сколько мира в одном пикселе.
      float keep(vec2 px, vec2 d, float k) {
        return 1.0 - smoothstep(0.35, 1.0, k * dot(px, abs(d)));
      }

      // наклон поверхности от мелких волн: сумма синусов разных направлений
      vec2 ambient(vec2 p, vec2 px, float t) {
        vec2 g = vec2(0.0);
        vec2 d1 = normalize(vec2(0.8, 0.6)), d2 = normalize(vec2(-0.6, 0.9)), d3 = normalize(vec2(0.2, -1.0));
        g += d1 * cos(dot(p, d1) * 2.1 + t * 0.9) * 0.0016 * keep(px, d1, 2.1);
        g += d2 * cos(dot(p, d2) * 3.3 - t * 1.25) * 0.0011 * keep(px, d2, 3.3);
        g += d3 * cos(dot(p, d3) * 5.7 + t * 1.7) * 0.0007 * keep(px, d3, 5.7);
        return g;
      }

      void main() {
        vec3 toCam = cameraPosition - vWorld;
        float dist = length(toCam);
        vec3 v = toCam / dist;

        // производные считаем до любых ветвлений
        vec2 px = abs(dFdx(vWorld.xz)) + abs(dFdy(vWorld.xz));
        vec2 suv = (vWorld.xz - uSimRect.xy) / uSimRect.zw;
        // сколько клеток ряби приходится на пиксель: если больше двух, рябь у горизонта сглаживаем
        float cells = max(px.x / (uSimRect.z * uSimTexel.x), px.y / (uSimRect.w * uSimTexel.y));
        float simKeep = 1.0 - smoothstep(1.2, 3.0, cells);

        vec2 grad = vec2(0.0);
        if (uSimOn > 0.5 && suv.x > 0.0 && suv.x < 1.0 && suv.y > 0.0 && suv.y < 1.0) {
          vec2 edge = smoothstep(0.0, 0.06, suv) * smoothstep(0.0, 0.06, 1.0 - suv);
          grad = texture2D(tSim, suv).ba * edge.x * edge.y * simKeep;
        }
        // мелкие волны гаснут вдаль, чтобы у горизонта не рябило
        float far = smoothstep(70.0, 6.0, dist);
        grad += ambient(vWorld.xz, px, uTime) * far * (1.0 - 0.6 * uCalm);

        vec3 n = normalize(vec3(-grad.x * 4.0, 1.0, -grad.y * 4.0));
        float cosT = clamp(dot(n, v), 0.0, 1.0);
        // сколько отражается: у горизонта почти всё, под камерой меньше, но не до черноты
        float fres = mix(0.55, 1.0, pow(1.0 - cosT, 3.0));

        // сдвиг картинки по экрану: ближе к камере сильнее
        vec2 screen = gl_FragCoord.xy / uRes;
        vec2 off = vec2(grad.x, -grad.y) * 1.1 * clamp(9.0 / dist, 0.25, 1.6);
        vec3 refl = texture2D(tReflect, screen + off).rgb;
        vec3 refr = texture2D(tRefract, screen + off * 1.5).rgb;
        vec3 col = mix(refr, refl, fres);

        // тонкий блик на гребнях ряби
        float crest = clamp(length(grad) * 40.0 - 0.2, 0.0, 1.0);
        col += crest * 0.03 * far;
        // вдали вода сливается с небом у горизонта
        col = mix(col, uGlow, smoothstep(120.0, 700.0, dist));

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

// ---------- шторка: заливает кадр цветом фона, пока панель раскрывается ----------

export function fadeMaterial(shared: Shared) {
  return new THREE.ShaderMaterial({
    uniforms: { uPaper: shared.uPaper, uFade: { value: 0 } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      void main() { gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uPaper;
      uniform float uFade;
      void main() {
        gl_FragColor = vec4(uPaper, uFade);
        #include <colorspace_fragment>
      }
    `,
  });
}
