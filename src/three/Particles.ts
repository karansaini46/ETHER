import {
  AdditiveBlending,
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
  type Camera,
} from 'three'

interface Particle {
  position: Vector3
  velocity: Vector3
  color: Color
  age: number
  maxAge: number
  active: boolean
}

const MAX_PARTICLES = 3000

export class ParticleSystem {
  private readonly mesh: InstancedMesh
  private readonly particles: Particle[]
  private poolPointer = 0

  constructor() {
    const geometry = new PlaneGeometry(1.2, 1.2)
    const material = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      blending: AdditiveBlending,
      depthWrite: false,
    })

    this.mesh = new InstancedMesh(geometry, material, MAX_PARTICLES)
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.setUsage(DynamicDrawUsage)
    }

    this.particles = Array.from({ length: MAX_PARTICLES }, () => ({
      position: new Vector3(),
      velocity: new Vector3(),
      color: new Color(),
      age: 0,
      maxAge: 0,
      active: false,
    }))

    const zeroMatrix = new Matrix4().makeScale(0, 0, 0)
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.mesh.setMatrixAt(i, zeroMatrix)
    }
    this.mesh.instanceMatrix.needsUpdate = true
  }

  getMesh(): InstancedMesh {
    return this.mesh
  }

  burst(position: Vector3, color: Color, count: number): void {
    let allocated = 0

    for (let i = 0; i < MAX_PARTICLES && allocated < count; i++) {
      const idx = (this.poolPointer + i) % MAX_PARTICLES
      const p = this.particles[idx]

      if (!p.active) {
        p.active = true
        p.age = 0
        p.maxAge = 0.8 + Math.random() * 0.5
        p.color.copy(color)

        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)
        const speed = 12 + Math.random() * 28

        const dir = new Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi),
        )

        p.velocity.copy(dir).multiplyScalar(speed)
        
        // Spawn slightly offset from center to clear the larger 3D server box casing
        p.position.copy(position).addScaledVector(dir, 1.5)

        allocated++
      }
    }
    this.poolPointer = (this.poolPointer + allocated) % MAX_PARTICLES
  }

  update(delta: number, camera: Camera): void {
    const matrix = new Matrix4()
    const scale = new Vector3()
    let needsUpdate = false

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i]

      if (p.active) {
        p.velocity.multiplyScalar(0.94)
        p.position.addScaledVector(p.velocity, delta)
        p.age += delta

        if (p.age >= p.maxAge) {
          p.active = false
          matrix.makeScale(0, 0, 0)
          this.mesh.setMatrixAt(i, matrix)
          needsUpdate = true
        } else {
          const lifeRatio = p.age / p.maxAge
          const particleScale = (1.0 - lifeRatio) * 1.5
          const intensity = 1.0 - lifeRatio

          scale.set(particleScale, particleScale, particleScale)
          
          // Force particles to billboard and face the camera directly
          matrix.compose(p.position, camera.quaternion, scale)
          this.mesh.setMatrixAt(i, matrix)

          const c = p.color.clone().multiplyScalar(intensity * 2.0)
          this.mesh.setColorAt(i, c)
          needsUpdate = true
        }
      }
    }

    if (needsUpdate) {
      this.mesh.instanceMatrix.needsUpdate = true
      if (this.mesh.instanceColor) {
        this.mesh.instanceColor.needsUpdate = true
      }
    }
  }

  clear(): void {
    const zeroMatrix = new Matrix4().makeScale(0, 0, 0)
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles[i].active = false
      this.mesh.setMatrixAt(i, zeroMatrix)
    }
    this.mesh.instanceMatrix.needsUpdate = true
  }
}
export default ParticleSystem
