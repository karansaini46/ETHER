import {
  Color,
  ShaderMaterial,
  type Material,
} from 'three'

import type { NodeType } from '@/types/graph'

export const NODE_COLORS = {
  component: 0x00d4ff,
  util: 0x7c3aed,
  store: 0xff6b35,
  style: 0xec4899,
  config: 0x94a3b8,
  test: 0x22c55e,
  entry: 0xffffff,
  unknown: 0x64748b,
} as const

export const NODE_ICON_INDICES = {
  entry: 0,
  component: 1,
  util: 2,
  store: 3,
  style: 4,
  config: 5,
  test: 6,
  unknown: 7,
} as const

const ISSUE_COLOR = 0xff2d55
const materialCache = new Map<NodeType, ShaderMaterial>()
let materialConsumers = 0

const NODE_VERTEX_SHADER = `
  attribute float instanceRecent;
  attribute float instanceHighlighted;

  varying float vInstanceRecent;
  varying float vInstanceHighlighted;
  varying vec3 vOriginalNormal;
  varying vec2 vUv;

  uniform float uPulse;
  uniform float uTime;

  #ifndef is_instanced
    #define is_instanced
    attribute mat4 instanceMatrix;
  #endif

  void main() {
    vInstanceRecent = instanceRecent;
    vInstanceHighlighted = instanceHighlighted;
    vOriginalNormal = normal;
    vUv = uv;

    // Use columns of instanceMatrix to generate unique seeds
    float seedX = length(instanceMatrix[0].xyz);
    float seedY = length(instanceMatrix[1].xyz);

    float pulseFactor = 1.0 + instanceRecent * uPulse * 0.25 + instanceHighlighted * 0.25;

    // Rotate local vertex position around Y-axis based on time
    float speed = 0.5 + fract(seedX * 12.34) * 0.8;
    float angle = uTime * speed + fract(seedY * 56.78) * 6.28;
    float cosA = cos(angle);
    float sinA = sin(angle);

    vec3 rotatedPos = vec3(
      position.x * cosA - position.z * sinA,
      position.y,
      position.x * sinA + position.z * cosA
    );

    vec3 transformed = rotatedPos * pulseFactor;

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const NODE_FRAGMENT_SHADER = `
  varying float vInstanceRecent;
  varying float vInstanceHighlighted;
  varying vec3 vOriginalNormal;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec3 uBaseColor;

  vec3 drawTerminalScreen(vec2 uv, vec3 baseColor, float time) {
    // Glowing holographic console background (tinted by baseColor!)
    vec3 color = baseColor * 0.18 + vec3(0.01, 0.01, 0.02);

    // Screen grid lines (retro CRT scanlines)
    float scanline = sin(uv.y * 120.0 + time * 6.0) * 0.06;
    color += vec3(scanline);

    // Bezel shadow/CRT vignette
    float vignette = uv.x * (1.0 - uv.x) * uv.y * (1.0 - uv.y) * 16.0;
    vignette = clamp(pow(vignette, 0.25), 0.0, 1.0);
    color *= (0.4 + 0.6 * vignette);

    // Prompt ">" shape
    vec2 pUv = (uv - vec2(0.1, 0.65)) / vec2(0.12, 0.18);
    if (pUv.x >= 0.0 && pUv.x <= 1.0 && pUv.y >= 0.0 && pUv.y <= 1.0) {
      float d = abs(abs(pUv.y - 0.5) - (0.5 - pUv.x));
      float promptLine = smoothstep(0.08, 0.0, d - 0.05) * step(pUv.x, 0.85);
      color = mix(color, baseColor * 3.5, promptLine);
    }

    // Blinking cursor "_"
    if (uv.x >= 0.26 && uv.x <= 0.38 && uv.y >= 0.65 && uv.y <= 0.69) {
      float blink = step(0.0, sin(time * 15.0));
      color = mix(color, baseColor * 4.0, blink);
    }

    // Fake code block lines (increase brightness: 2.5x)
    // Line 1: y in [0.46, 0.52]
    if (uv.y >= 0.46 && uv.y <= 0.52 && uv.x >= 0.1 && uv.x <= 0.82) {
      float space = step(0.12, abs(sin(uv.x * 22.0)));
      color = mix(color, baseColor * 2.5, space);
    }

    // Line 2: y in [0.32, 0.38]
    if (uv.y >= 0.32 && uv.y <= 0.38 && uv.x >= 0.16 && uv.x <= 0.72) {
      float space = step(0.16, abs(sin(uv.x * 16.0)));
      color = mix(color, baseColor * 2.5, space);
    }

    // Line 3: y in [0.18, 0.24]
    if (uv.y >= 0.18 && uv.y <= 0.24 && uv.x >= 0.1 && uv.x <= 0.58) {
      float space = step(0.1, abs(sin(uv.x * 30.0)));
      color = mix(color, baseColor * 2.5, space);
    }

    // Anti-aliased bezel screen border glow (strongly lit!)
    float edge = smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x) *
                 smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);
    color += baseColor * (1.0 - edge) * 1.5;

    return color;
  }

  vec3 drawMetallicCasing(vec2 uv, vec3 baseColor, vec3 normal) {
    // Dark metallic body casing with baseColor tint for ambient sci-fi feel
    vec3 color = vec3(0.08, 0.09, 0.12) + baseColor * 0.08;

    float stripe = 0.0;
    if (abs(normal.x) > 0.9) {
      // Left/Right side vertical center glow stripe
      stripe = smoothstep(0.12, 0.0, abs(uv.x - 0.5));
    } else if (abs(normal.y) > 0.9) {
      // Top/Bottom side horizontal center glow stripe
      stripe = smoothstep(0.12, 0.0, abs(uv.y - 0.5));
    }

    // Thick neon outline stripe
    color = mix(color, baseColor * 3.0, stripe * 0.9);

    // Bevel highlighting
    float bevel = uv.x * (1.0 - uv.x) * uv.y * (1.0 - uv.y) * 16.0;
    color *= (0.6 + 0.4 * clamp(bevel, 0.0, 1.0));

    return color;
  }

  void main() {
    float glow = 1.0 + vInstanceRecent * 1.5 + vInstanceHighlighted * 2.0;
    vec3 finalColor;

    if (abs(vOriginalNormal.z) > 0.9) {
      // Render terminal screen on BOTH front and back faces!
      finalColor = drawTerminalScreen(vUv, uBaseColor, uTime) * glow;
    } else {
      // Render sleek server casing with neon stripes on other faces
      finalColor = drawMetallicCasing(vUv, uBaseColor, vOriginalNormal) * (1.0 + vInstanceHighlighted * 0.5);
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

export function retainNodeMaterials(): void {
  materialConsumers += 1
}

export function releaseNodeMaterials(): void {
  materialConsumers = Math.max(0, materialConsumers - 1)

  if (materialConsumers === 0) {
    disposeNodeMaterials()
  }
}

export function getNodeMaterial(type: NodeType): ShaderMaterial {
  const cachedMaterial = materialCache.get(type)

  if (cachedMaterial) {
    return cachedMaterial
  }

  const material = createNodeMaterial(type)
  materialCache.set(type, material)

  return material
}

export function getNodeColor(type: NodeType, hasIssue = false): Color {
  return new Color(hasIssue ? ISSUE_COLOR : NODE_COLORS[type])
}

export function updateNodeMaterialPulse(value: number): void {
  for (const material of materialCache.values()) {
    material.uniforms.uPulse.value = value
  }
}

export function updateNodeMaterialTime(value: number): void {
  for (const material of materialCache.values()) {
    material.uniforms.uTime.value = value
  }
}

function createNodeMaterial(type: NodeType): ShaderMaterial {
  const baseColor = getNodeColor(type)

  return new ShaderMaterial({
    vertexShader: NODE_VERTEX_SHADER,
    fragmentShader: NODE_FRAGMENT_SHADER,
    uniforms: {
      uPulse: { value: 0 },
      uTime: { value: 0 },
      uBaseColor: { value: baseColor },
    },
    transparent: true,
    depthWrite: true,
  })
}

function disposeNodeMaterials(): void {
  for (const material of materialCache.values()) {
    disposeMaterial(material)
  }

  materialCache.clear()
}

function disposeMaterial(material: Material): void {
  material.dispose()
}
