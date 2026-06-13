import {
  type InstancedMesh,
  type PerspectiveCamera,
  Raycaster,
  Vector2,
} from 'three'

import { useEtherStore } from '@/store'

interface NodeMeshMetadata {
  nodeIds: string[]
}

export class NodeRaycaster {
  private readonly raycaster = new Raycaster()
  private readonly pointer = new Vector2()
  private readonly canvas: HTMLCanvasElement
  private readonly camera: PerspectiveCamera
  private readonly getMeshes: () => InstancedMesh[]
  private pointerDownX = 0
  private pointerDownY = 0
  private pointerDownTime = 0
  private disposed = false

  constructor(
    canvas: HTMLCanvasElement,
    camera: PerspectiveCamera,
    getMeshes: () => InstancedMesh[],
  ) {
    this.canvas = canvas
    this.camera = camera
    this.getMeshes = getMeshes
    canvas.addEventListener('pointerdown', this.handlePointerDown, true)
    canvas.addEventListener('click', this.handleClick, true)
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown, true)
    this.canvas.removeEventListener('click', this.handleClick, true)
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerDownX = event.clientX
    this.pointerDownY = event.clientY
    this.pointerDownTime = Date.now()
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.disposed || event.button !== 0) {
      return
    }

    const clickDuration = Date.now() - this.pointerDownTime
    const dx = event.clientX - this.pointerDownX
    const dy = event.clientY - this.pointerDownY
    const dragDistance = Math.sqrt(dx * dx + dy * dy)

    if (dragDistance > 6 || clickDuration > 300) {
      return
    }

    const bounds = this.canvas.getBoundingClientRect()

    if (bounds.width <= 0 || bounds.height <= 0) {
      useEtherStore.getState().actions.selectNode(null)
      return
    }

    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(this.pointer, this.camera)

    const intersections = this.raycaster.intersectObjects(
      this.getMeshes(),
      false,
    )
    const graph = useEtherStore.getState().graph

    for (const intersection of intersections) {
      if (intersection.instanceId === undefined) {
        continue
      }

      const metadata = intersection.object.userData as NodeMeshMetadata
      const nodeId = metadata.nodeIds?.[intersection.instanceId]
      const node = graph?.nodes.find((candidate) => candidate.id === nodeId)

      if (!node) {
        continue
      }

      event.preventDefault()
      event.stopImmediatePropagation()
      useEtherStore.getState().actions.selectNode(node)
      return
    }

    useEtherStore.getState().actions.selectNode(null)
  }
}
