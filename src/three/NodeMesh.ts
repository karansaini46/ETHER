import {
  Color,
  MeshStandardMaterial,
  type IUniform,
  type Material,
} from 'three'

import type { NodeType } from '@/types/graph'

const NODE_COLORS: Record<NodeType, number> = {
  component: 0x00d4ff,
  util: 0x7c3aed,
  store: 0xff6b35,
  style: 0xec4899,
  config: 0x94a3b8,
  test: 0x22c55e,
  entry: 0xffffff,
  unknown: 0x64748b,
}

const ISSUE_COLOR = 0xff2d55
const materialCache = new Map<NodeType, MeshStandardMaterial>()
const pulseUniforms = new Set<IUniform<number>>()
let materialConsumers = 0

export function retainNodeMaterials(): void {
  materialConsumers += 1
}

export function releaseNodeMaterials(): void {
  materialConsumers = Math.max(0, materialConsumers - 1)

  if (materialConsumers === 0) {
    disposeNodeMaterials()
  }
}

export function getNodeMaterial(type: NodeType): MeshStandardMaterial {
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
  for (const uniform of pulseUniforms) {
    uniform.value = value
  }
}

function createNodeMaterial(type: NodeType): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: NODE_COLORS[type],
    emissive: 0x000000,
    metalness: 0.15,
    roughness: 0.45,
  })

  material.onBeforeCompile = (shader) => {
    const pulseUniform: IUniform<number> = { value: 0 }
    shader.uniforms.recentPulse = pulseUniform
    pulseUniforms.add(pulseUniform)

    shader.vertexShader = `
      attribute float instanceRecent;
      varying float vInstanceRecent;
      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `
        #include <begin_vertex>
        vInstanceRecent = instanceRecent;
      `,
    )

    shader.fragmentShader = `
      uniform float recentPulse;
      varying float vInstanceRecent;
      ${shader.fragmentShader}
    `
      .replace(
        '#include <color_fragment>',
        `
          #include <color_fragment>
          #if defined(USE_COLOR) || defined(USE_COLOR_ALPHA)
            diffuseColor.rgb = vColor.rgb;
          #endif
        `,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `
          #include <emissivemap_fragment>
          totalEmissiveRadiance += diffuseColor.rgb * vInstanceRecent * recentPulse;
        `,
      )
  }

  material.customProgramCacheKey = () => 'ether-node-material-v1'

  return material
}

function disposeNodeMaterials(): void {
  for (const material of materialCache.values()) {
    disposeMaterial(material)
  }

  materialCache.clear()
  pulseUniforms.clear()
}

function disposeMaterial(material: Material): void {
  material.dispose()
}
