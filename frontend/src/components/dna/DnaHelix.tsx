import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { IDnaVitality } from '../../types'

interface DnaHelixProps {
  builder: number
  solver: number
  competitor: number
  vitality: IDnaVitality
  className?: string
}

const MAX_RUNGS = 110
const HELIX_HEIGHT = 6
const BASE_RADIUS = 1.35
const TURNS = 2.2

/**
 * Data-driven double helix — every visual channel maps to a stored stat:
 * - Teal strand radius + point size <- Builder (shipping strength)
 * - Violet strand radius + point size <- Solver (solving depth)
 * - Rung count <- volume (12 + commits/25 + solves/6 + battles*2)
 * - Rung glow <- Competitor (duel performance)
 * - Spin speed + bob <- Energy (recency of syncs/battles, NOT a score)
 * Asymmetry is the point: an off-center helix reads as an unbalanced profile.
 */
export function DnaHelix({ builder, solver, competitor, vitality, className }: DnaHelixProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const rungCount = Math.max(12, Math.min(MAX_RUNGS, Math.round(vitality.rungCount) || 12))
  const energy = Math.max(0, Math.min(100, vitality.energy))

  const description =
    `DNA helix: Builder ${builder} widens the teal strand, Solver ${solver} widens the violet strand, ` +
    `Competitor ${competitor} lights ${rungCount} rungs ` +
    `(${vitality.commits} commits, ${vitality.solves} solves, ${vitality.battles} battles). ` +
    `Energy ${energy} from activity ${vitality.lastActiveLabel} sets the spin.`

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const width = mount.clientWidth || 600
    const height = mount.clientHeight || 340

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(0, 0, 8.4)

    const group = new THREE.Group()
    scene.add(group)

    const primary = new THREE.Color('#00d4aa')
    const secondary = new THREE.Color('#7c5cff')
    const accent = new THREE.Color('#ff5c8a')

    // Trait -> geometry: stronger trait = wider orbit + chunkier nodes.
    const radiusA = BASE_RADIUS * (0.75 + (builder / 100) * 0.5)
    const radiusB = BASE_RADIUS * (0.75 + (solver / 100) * 0.5)
    const sizeA = 0.055 + (builder / 100) * 0.06
    const sizeB = 0.055 + (solver / 100) * 0.06

    const strandA = new Float32Array(rungCount * 3)
    const strandB = new Float32Array(rungCount * 3)
    const rungPositions: number[] = []
    for (let i = 0; i < rungCount; i += 1) {
      const t = (i / Math.max(1, rungCount - 1)) * Math.PI * 2 * TURNS
      const y = (i / Math.max(1, rungCount - 1) - 0.5) * HELIX_HEIGHT
      const ax = Math.cos(t) * radiusA
      const az = Math.sin(t) * radiusA
      const bx = Math.cos(t + Math.PI) * radiusB
      const bz = Math.sin(t + Math.PI) * radiusB
      strandA[i * 3] = ax
      strandA[i * 3 + 1] = y
      strandA[i * 3 + 2] = az
      strandB[i * 3] = bx
      strandB[i * 3 + 1] = y
      strandB[i * 3 + 2] = bz
      // Denser early rungs would imply false chronology, so space evenly —
      // COUNT (not spacing) carries the volume signal.
      if (i % 2 === 0 || rungCount <= 24) {
        rungPositions.push(ax, y, az, bx, y, bz)
      }
    }

    const geoA = new THREE.BufferGeometry()
    geoA.setAttribute('position', new THREE.BufferAttribute(strandA, 3))
    const matA = new THREE.PointsMaterial({
      color: primary.clone().lerp(new THREE.Color('#ffffff'), (builder / 100) * 0.12),
      size: sizeA,
      transparent: true,
      opacity: 0.55 + (builder / 100) * 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    const geoB = new THREE.BufferGeometry()
    geoB.setAttribute('position', new THREE.BufferAttribute(strandB, 3))
    const matB = new THREE.PointsMaterial({
      color: secondary.clone().lerp(new THREE.Color('#ffffff'), (solver / 100) * 0.12),
      size: sizeB,
      transparent: true,
      opacity: 0.55 + (solver / 100) * 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    const rungGeo = new THREE.BufferGeometry()
    rungGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rungPositions), 3))
    const rungMat = new THREE.LineBasicMaterial({
      color: accent.clone(),
      transparent: true,
      opacity: 0.14 + (competitor / 100) * 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const pointsA = new THREE.Points(geoA, matA)
    const pointsB = new THREE.Points(geoB, matB)
    const rungs = new THREE.LineSegments(rungGeo, rungMat)
    group.add(pointsA, pointsB, rungs)

    let targetX = 0
    let targetY = 0
    const onMouse = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1
      targetX = nx * 0.3
      targetY = ny * 0.2
    }
    window.addEventListener('mousemove', onMouse, { passive: true })

    // Energy -> tempo. Dormant profiles (~5) barely turn; fresh ones (~100)
    // spin briskly. This is vitality, deliberately separate from scores.
    const spinSpeed = 0.08 + (energy / 100) * 0.5
    const bobAmp = 0.02 + (energy / 100) * 0.13

    let raf = 0
    let last = performance.now()
    const render = (now: number) => {
      raf = requestAnimationFrame(render)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const t = now / 1000
      group.rotation.y += dt * spinSpeed
      group.rotation.x += (targetY - group.rotation.x) * (1 - Math.exp(-dt * 2.5))
      group.rotation.z += (targetX * 0.4 - group.rotation.z) * (1 - Math.exp(-dt * 2.5))
      group.position.y = Math.sin(t * 0.6) * bobAmp
      renderer.render(scene, camera)
    }

    const onResize = () => {
      const w = mount.clientWidth || width
      const h = mount.clientHeight || height
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    if (reduceMotion) {
      group.rotation.y = 0.6
      renderer.render(scene, camera)
    } else {
      raf = requestAnimationFrame(render)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      geoA.dispose()
      geoB.dispose()
      rungGeo.dispose()
      matA.dispose()
      matB.dispose()
      rungMat.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [builder, solver, competitor, rungCount, energy])

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label={description}
      title={description}
      className={className ?? 'h-[340px] w-full'}
      style={{ minHeight: 280 }}
    />
  )
}
