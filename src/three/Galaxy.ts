import {
  AmbientLight,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  PerspectiveCamera,
  PointLight,
  Scene,
  type Material,
  Vector3,
  WebGLRenderer,
} from 'three'
import {
  CSS2DObject,
  CSS2DRenderer,
} from 'three/addons/renderers/CSS2DRenderer.js'

import {
  getNodeColor,
  getNodeMaterial,
  releaseNodeMaterials,
  retainNodeMaterials,
  updateNodeMaterialPulse,
} from './NodeMesh'
import type {
  GraphData,
  GraphNode,
  NodeType,
} from '@/types/graph'

const LABEL_DISTANCE = 80
const NODE_TYPES: NodeType[] = [
  'component',
  'util',
  'store',
  'style',
  'config',
  'test',
  'entry',
  'unknown',
]

interface LabelRecord {
  object: CSS2DObject
  element: HTMLDivElement
}

export class Galaxy {
  private readonly canvas: HTMLCanvasElement
  private readonly renderer: WebGLRenderer
  private readonly labelRenderer: CSS2DRenderer
  private readonly camera: PerspectiveCamera
  private readonly scene: Scene
  private readonly graphRoot = new Group()
  private readonly resizeObserver: ResizeObserver
  private readonly resizeTarget: HTMLElement
  private readonly graphGeometries = new Set<BufferGeometry>()
  private readonly graphMaterials = new Set<Material>()
  private readonly labels: LabelRecord[] = []
  private readonly recentLights: PointLight[] = []
  private readonly cameraWorldPosition = new Vector3()
  private readonly labelWorldPosition = new Vector3()
  private animationFrameId = 0
  private disposed = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    })
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.camera = new PerspectiveCamera(60, 1, 0.1, 2_000)
    this.camera.position.set(0, 0, 350)
    this.camera.lookAt(0, 0, 0)

    this.scene = new Scene()
    this.scene.background = new Color(0x000000)
    this.scene.add(new AmbientLight(0xffffff, 1.4))
    this.scene.add(this.graphRoot)

    this.labelRenderer = new CSS2DRenderer()
    this.labelRenderer.domElement.className = 'galaxy-label-layer'
    Object.assign(this.labelRenderer.domElement.style, {
      inset: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
      position: 'absolute',
    })

    this.resizeTarget = canvas.parentElement ?? canvas
    const labelContainer = canvas.parentElement ?? document.body
    labelContainer.appendChild(this.labelRenderer.domElement)

    retainNodeMaterials()

    this.resizeObserver = new ResizeObserver(() => {
      this.resize()
    })
    this.resizeObserver.observe(this.resizeTarget)
    this.resize()
    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  loadGraph(data: GraphData): void {
    if (this.disposed) {
      return
    }

    this.clearGraph()

    const nodesByType = new Map<NodeType, GraphNode[]>(
      NODE_TYPES.map((type) => [type, []]),
    )

    for (const node of data.nodes) {
      nodesByType.get(node.type)?.push(node)
      this.createLabel(node)

      if (node.isRecent) {
        this.createRecentLight(node)
      }
    }

    for (const type of NODE_TYPES) {
      const nodes = nodesByType.get(type) ?? []

      if (nodes.length > 0) {
        this.createNodeInstances(type, nodes)
      }
    }

    this.createEdges(data)
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    cancelAnimationFrame(this.animationFrameId)
    this.resizeObserver.disconnect()
    this.clearGraph()
    this.scene.clear()
    this.labelRenderer.domElement.remove()
    releaseNodeMaterials()
    this.renderer.renderLists.dispose()
    this.renderer.dispose()
  }

  private readonly animate = (time: number): void => {
    if (this.disposed) {
      return
    }

    const pulse = 0.12 + (Math.sin(time * 0.004) + 1) * 0.08
    updateNodeMaterialPulse(pulse)

    for (const light of this.recentLights) {
      light.intensity = 0.35 + (Math.sin(time * 0.004) + 1) * 0.12
    }

    this.updateLabelVisibility()
    this.renderer.render(this.scene, this.camera)
    this.labelRenderer.render(this.scene, this.camera)
    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  private createNodeInstances(type: NodeType, nodes: GraphNode[]): void {
    const geometry = new IcosahedronGeometry(1, 2)
    const recentFlags = new Float32Array(nodes.length)
    geometry.setAttribute(
      'instanceRecent',
      new InstancedBufferAttribute(recentFlags, 1),
    )

    const mesh = new InstancedMesh(
      geometry,
      getNodeMaterial(type),
      nodes.length,
    )
    const matrix = new Matrix4()
    const position = new Vector3()
    const scale = new Vector3()

    nodes.forEach((node, index) => {
      const nodeScale = 0.5 + node.centrality * 3
      position.fromArray(node.position)
      scale.setScalar(nodeScale)
      matrix.compose(position, mesh.quaternion, scale)
      mesh.setMatrixAt(index, matrix)
      mesh.setColorAt(index, getNodeColor(type, node.hasIssue))
      recentFlags[index] = node.isRecent ? 1 : 0
    })

    mesh.instanceMatrix.needsUpdate = true

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }

    const recentAttribute = geometry.getAttribute('instanceRecent')
    recentAttribute.needsUpdate = true
    mesh.computeBoundingSphere()
    this.graphGeometries.add(geometry)
    this.graphRoot.add(mesh)
  }

  private createEdges(data: GraphData): void {
    if (data.edges.length === 0) {
      return
    }

    const positionsById = new Map(
      data.nodes.map((node) => [node.id, node.position]),
    )
    const edgePositions: number[] = []

    for (const edge of data.edges) {
      const sourcePosition = positionsById.get(edge.source)
      const targetPosition = positionsById.get(edge.target)

      if (!sourcePosition || !targetPosition) {
        continue
      }

      edgePositions.push(...sourcePosition, ...targetPosition)
    }

    if (edgePositions.length === 0) {
      return
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(edgePositions, 3),
    )
    const material = new LineBasicMaterial({
      color: 0x334155,
      opacity: 0.35,
      transparent: true,
    })
    const lineSegments = new LineSegments(geometry, material)

    this.graphGeometries.add(geometry)
    this.graphMaterials.add(material)
    this.graphRoot.add(lineSegments)
  }

  private createLabel(node: GraphNode): void {
    const element = document.createElement('div')
    element.className = 'galaxy-node-label'
    element.textContent = node.label
    Object.assign(element.style, {
      color: '#e2e8f0',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      lineHeight: '1',
      pointerEvents: 'none',
      textShadow: '0 1px 4px #000000',
      whiteSpace: 'nowrap',
    })

    const label = new CSS2DObject(element)
    label.position.fromArray(node.position)
    label.center.set(0.5, -0.8)
    this.labels.push({ object: label, element })
    this.graphRoot.add(label)
  }

  private createRecentLight(node: GraphNode): void {
    const light = new PointLight(
      getNodeColor(node.type, node.hasIssue),
      0.45,
      18,
      2,
    )
    light.position.fromArray(node.position)
    this.recentLights.push(light)
    this.graphRoot.add(light)
  }

  private updateLabelVisibility(): void {
    this.camera.getWorldPosition(this.cameraWorldPosition)

    for (const { object, element } of this.labels) {
      object.getWorldPosition(this.labelWorldPosition)
      const visible =
        this.labelWorldPosition.distanceTo(this.cameraWorldPosition) <=
        LABEL_DISTANCE
      object.visible = visible
      element.hidden = !visible
    }
  }

  private clearGraph(): void {
    this.graphRoot.clear()

    for (const geometry of this.graphGeometries) {
      geometry.dispose()
    }

    for (const material of this.graphMaterials) {
      material.dispose()
    }

    for (const { element } of this.labels) {
      element.remove()
    }

    this.graphGeometries.clear()
    this.graphMaterials.clear()
    this.labels.length = 0
    this.recentLights.length = 0
  }

  private resize(): void {
    const width = Math.max(
      1,
      this.resizeTarget.clientWidth || this.canvas.clientWidth,
    )
    const height = Math.max(
      1,
      this.resizeTarget.clientHeight || this.canvas.clientHeight,
    )

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    this.labelRenderer.setSize(width, height)
  }
}
