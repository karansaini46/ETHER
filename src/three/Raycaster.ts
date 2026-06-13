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
  private disposed = false

  constructor(
    canvas: HTMLCanvasElement,
    camera: PerspectiveCamera,
    getMeshes: () => InstancedMesh[],
  ) {
    this.canvas = canvas
    this.camera = camera
    this.getMeshes = getMeshes
    canvas.addEventListener('click', this.handleClick, true)
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.canvas.removeEventListener('click', this.handleClick, true)
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (
      this.disposed ||
      event.button !== 0 ||
      document.pointerLockElement !== null
    ) {
      return
    }

    const bounds = this.canvas.getBoundingClientRect()

    if (bounds.width <= 0 || bounds.height <= 0) {
      useEtherStore.getState().setSelectedNode(null)
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
      useEtherStore.getState().setSelectedNode(node)
      return
    }

    useEtherStore.getState().setSelectedNode(null)
  }
}
