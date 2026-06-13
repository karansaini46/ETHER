import {
  Euler,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from 'three'

const MOUSE_SENSITIVITY = 0.002
const MAX_PITCH = (85 * Math.PI) / 180
const BASE_SPEED = 8
const FAST_SPEED = 40
const MOVEMENT_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyQ',
  'KeyE',
  'ShiftLeft',
  'ShiftRight',
])

interface Flight {
  startPosition: Vector3
  targetPosition: Vector3
  startQuaternion: Quaternion
  targetQuaternion: Quaternion
  duration: number
  elapsed: number
  onComplete?: () => void
}

export class CameraRig {
  private readonly camera: PerspectiveCamera
  private readonly canvas: HTMLCanvasElement
  private readonly pressedKeys = new Set<string>()
  private readonly movementDirection = new Vector3()
  private readonly forwardDirection = new Vector3()
  private readonly rightDirection = new Vector3()
  private readonly upDirection = new Vector3()
  private readonly cameraQuaternion = new Quaternion()
  private yaw = 0
  private pitch = 0
  private flight: Flight | null = null
  private disposed = false

  private isDragging = false
  private lastMouseX = 0
  private lastMouseY = 0

  constructor(camera: PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.camera = camera
    this.canvas = canvas

    const rotation = new Euler().setFromQuaternion(camera.quaternion, 'YXZ')
    this.pitch = rotation.x
    this.yaw = rotation.y

    canvas.addEventListener('pointerdown', this.handlePointerDown)
    canvas.addEventListener('wheel', this.handleWheel, { passive: false })
    document.addEventListener('pointermove', this.handlePointerMove)
    document.addEventListener('pointerup', this.handlePointerUp)
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('blur', this.clearInput)
  }

  update(delta: number): void {
    if (this.disposed) {
      return
    }

    const deltaSeconds = Number.isFinite(delta) ? Math.max(0, delta) : 0

    if (this.flight) {
      this.updateFlight(deltaSeconds * 1_000)
      return
    }

    if (isEditableElement(document.activeElement)) {
      this.pressedKeys.clear()
      return
    }

    this.updateMovement(Math.min(deltaSeconds, 0.1))
  }

  flyTo(
    position: Vector3,
    duration: number,
    lookAtTarget?: Vector3 | (() => void),
    onComplete?: () => void,
  ): void {
    if (this.disposed) {
      return
    }

    const actualOnComplete =
      typeof lookAtTarget === 'function' ? lookAtTarget : onComplete
    const actualLookAt =
      lookAtTarget instanceof Vector3 ? lookAtTarget : undefined

    const safeDuration = Number.isFinite(duration)
      ? Math.max(0, duration)
      : 0
    this.pressedKeys.clear()

    if (safeDuration === 0) {
      this.camera.position.copy(position)
      if (actualLookAt) {
        this.camera.lookAt(actualLookAt)
        const rotation = new Euler().setFromQuaternion(
          this.camera.quaternion,
          'YXZ',
        )
        this.pitch = rotation.x
        this.yaw = rotation.y
      }
      actualOnComplete?.()
      return
    }

    const startQuaternion = this.camera.quaternion.clone()
    const targetQuaternion = this.camera.quaternion.clone()

    if (actualLookAt) {
      const tempCamera = this.camera.clone()
      tempCamera.position.copy(position)
      tempCamera.lookAt(actualLookAt)
      targetQuaternion.copy(tempCamera.quaternion)
    }

    this.flight = {
      startPosition: this.camera.position.clone(),
      targetPosition: position.clone(),
      startQuaternion,
      targetQuaternion,
      duration: safeDuration,
      elapsed: 0,
      onComplete: actualOnComplete,
    }
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.pressedKeys.clear()
    this.flight = null
    this.isDragging = false

    this.canvas.removeEventListener('pointerdown', this.handlePointerDown)
    this.canvas.removeEventListener('wheel', this.handleWheel)
    document.removeEventListener('pointermove', this.handlePointerMove)
    document.removeEventListener('pointerup', this.handlePointerUp)
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('blur', this.clearInput)
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.disposed || event.button !== 0 || this.flight) {
      return
    }
    this.isDragging = true
    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.disposed || !this.isDragging || this.flight) {
      return
    }

    const deltaX = event.clientX - this.lastMouseX
    const deltaY = event.clientY - this.lastMouseY
    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY

    this.yaw -= deltaX * MOUSE_SENSITIVITY
    this.pitch -= deltaY * MOUSE_SENSITIVITY
    this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch))
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ')
  }

  private readonly handlePointerUp = (): void => {
    this.isDragging = false
  }

  private readonly handleWheel = (event: WheelEvent): void => {
    if (this.disposed || this.flight) {
      return
    }
    event.preventDefault()

    const dir = new Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion)
    const zoomAmount = event.deltaY * 0.08
    this.camera.position.addScaledVector(dir, -zoomAmount)
  }

  private updateMovement(deltaSeconds: number): void {
    this.movementDirection.set(0, 0, 0)

    if (this.pressedKeys.has('KeyW')) {
      this.movementDirection.z -= 1
    }
    if (this.pressedKeys.has('KeyS')) {
      this.movementDirection.z += 1
    }
    if (this.pressedKeys.has('KeyA')) {
      this.movementDirection.x -= 1
    }
    if (this.pressedKeys.has('KeyD')) {
      this.movementDirection.x += 1
    }
    if (this.pressedKeys.has('KeyQ')) {
      this.movementDirection.y -= 1
    }
    if (this.pressedKeys.has('KeyE')) {
      this.movementDirection.y += 1
    }

    if (this.movementDirection.lengthSq() === 0) {
      return
    }

    this.movementDirection.normalize()
    this.camera.getWorldQuaternion(this.cameraQuaternion)
    this.forwardDirection
      .set(0, 0, -1)
      .applyQuaternion(this.cameraQuaternion)
    this.rightDirection.set(1, 0, 0).applyQuaternion(this.cameraQuaternion)
    this.upDirection.set(0, 1, 0).applyQuaternion(this.cameraQuaternion)

    const speed =
      this.pressedKeys.has('ShiftLeft') ||
      this.pressedKeys.has('ShiftRight')
        ? FAST_SPEED
        : BASE_SPEED
    const distance = speed * deltaSeconds

    this.camera.position
      .addScaledVector(
        this.rightDirection,
        this.movementDirection.x * distance,
      )
      .addScaledVector(
        this.upDirection,
        this.movementDirection.y * distance,
      )
      .addScaledVector(
        this.forwardDirection,
        -this.movementDirection.z * distance,
      )
  }

  private updateFlight(deltaMilliseconds: number): void {
    const flight = this.flight

    if (!flight) {
      return
    }

    flight.elapsed = Math.min(
      flight.duration,
      flight.elapsed + deltaMilliseconds,
    )
    const progress = flight.elapsed / flight.duration
    const easedProgress = easeInOutCubic(progress)
    this.camera.position.lerpVectors(
      flight.startPosition,
      flight.targetPosition,
      easedProgress,
    )

    this.camera.quaternion.slerpQuaternions(
      flight.startQuaternion,
      flight.targetQuaternion,
      easedProgress,
    )

    const rotation = new Euler().setFromQuaternion(
      this.camera.quaternion,
      'YXZ',
    )
    this.pitch = rotation.x
    this.yaw = rotation.y

    if (progress < 1) {
      return
    }

    this.flight = null
    flight.onComplete?.()
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (
      this.flight ||
      isEditableElement(document.activeElement)
    ) {
      return
    }

    if (isMovementKey(event.code)) {
      this.pressedKeys.add(event.code)
      event.preventDefault()
    }
  }

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code)
  }

  private readonly clearInput = (): void => {
    this.pressedKeys.clear()
    this.isDragging = false
  }
}

function easeInOutCubic(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function isMovementKey(code: string): boolean {
  return MOVEMENT_KEYS.has(code)
}

function isEditableElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false
  }

  return (
    element.isContentEditable ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  )
}
