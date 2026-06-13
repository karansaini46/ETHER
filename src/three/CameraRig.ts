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
  private pendingMouseX = 0
  private pendingMouseY = 0
  private flight: Flight | null = null
  private disposed = false

  constructor(camera: PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.camera = camera
    this.canvas = canvas

    const rotation = new Euler().setFromQuaternion(camera.quaternion, 'YXZ')
    this.pitch = rotation.x
    this.yaw = rotation.y

    canvas.addEventListener('click', this.handleCanvasClick)
    document.addEventListener('pointerlockchange', this.handlePointerLockChange)
    document.addEventListener('mousemove', this.handleMouseMove)
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

    if (!this.isPointerLocked()) {
      this.pendingMouseX = 0
      this.pendingMouseY = 0
      return
    }

    this.updateRotation()

    if (isEditableElement(document.activeElement)) {
      this.pressedKeys.clear()
      return
    }

    this.updateMovement(Math.min(deltaSeconds, 0.1))
  }

  flyTo(
    position: Vector3,
    duration: number,
    onComplete?: () => void,
  ): void {
    if (this.disposed) {
      return
    }

    const safeDuration = Number.isFinite(duration)
      ? Math.max(0, duration)
      : 0
    this.pendingMouseX = 0
    this.pendingMouseY = 0
    this.pressedKeys.clear()

    if (safeDuration === 0) {
      this.camera.position.copy(position)
      this.releasePointerLock()
      onComplete?.()
      return
    }

    this.flight = {
      startPosition: this.camera.position.clone(),
      targetPosition: position.clone(),
      duration: safeDuration,
      elapsed: 0,
      ...(onComplete ? { onComplete } : {}),
    }
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.pressedKeys.clear()
    this.flight = null
    this.pendingMouseX = 0
    this.pendingMouseY = 0
    this.canvas.removeEventListener('click', this.handleCanvasClick)
    document.removeEventListener(
      'pointerlockchange',
      this.handlePointerLockChange,
    )
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('blur', this.clearInput)

    if (this.isPointerLocked()) {
      document.exitPointerLock()
    }
  }

  private updateRotation(): void {
    if (this.pendingMouseX === 0 && this.pendingMouseY === 0) {
      return
    }

    this.yaw -= this.pendingMouseX * MOUSE_SENSITIVITY
    this.pitch -= this.pendingMouseY * MOUSE_SENSITIVITY
    this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch))
    this.pendingMouseX = 0
    this.pendingMouseY = 0
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ')
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

    if (progress < 1) {
      return
    }

    this.flight = null
    this.releasePointerLock()
    flight.onComplete?.()
  }

  private readonly handleCanvasClick = (): void => {
    if (this.disposed || this.isPointerLocked() || this.flight) {
      return
    }

    try {
      const lockRequest = this.canvas.requestPointerLock()

      if (lockRequest instanceof Promise) {
        lockRequest.catch(() => undefined)
      }
    } catch {
      this.clearInput()
    }
  }

  private readonly handlePointerLockChange = (): void => {
    if (!this.isPointerLocked()) {
      this.clearInput()
    }
  }

  private readonly handleMouseMove = (event: MouseEvent): void => {
    if (!this.isPointerLocked() || this.flight) {
      return
    }

    this.pendingMouseX += event.movementX
    this.pendingMouseY += event.movementY
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Escape' && this.isPointerLocked()) {
      document.exitPointerLock()
      return
    }

    if (
      !this.isPointerLocked() ||
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
    this.pendingMouseX = 0
    this.pendingMouseY = 0
  }

  private isPointerLocked(): boolean {
    return document.pointerLockElement === this.canvas
  }

  private releasePointerLock(): void {
    if (this.isPointerLocked()) {
      document.exitPointerLock()
    }
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
