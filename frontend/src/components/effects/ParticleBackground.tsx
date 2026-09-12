import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const PARTICLE_COUNT = 550
const NEON = new THREE.Color('#00d4aa')
const MUTED = new THREE.Color('#5d6478')
const ATTRACTION_RADIUS = 3.6
const ATTRACTION_PULL = 0.5

/**
 * Full-viewport 3D particle layer pinned behind all page content.
 *
 * - Fixed <canvas> at z-0 with pointer-events: none (clicks pass through).
 * - ~550 points drift ambiently in muted gray.
 * - It never reacts to its own hover: foreground elements (buttons, links,
 *   inputs, or anything tagged `.hover-target`) drive it through global
 *   mouseover listeners. On hover, nearby particles ease toward the cursor
 *   raycast onto the z=0 plane, shift gray → neon green, and a halo ring
 *   scales in. Everything eases back on leave — no snapping.
 */
export function ParticleBackground() {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.display = 'block'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0, 8)

    const viewHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const spreadX = (viewHeight * camera.aspect) / 2
    const spreadY = viewHeight / 2

    // --- Particles -------------------------------------------------------
    const base = new Float32Array(PARTICLE_COUNT * 3)
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const phases = new Float32Array(PARTICLE_COUNT * 2)
    const tmpColor = new THREE.Color()

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      base[i * 3] = (Math.random() * 2 - 1) * spreadX
      base[i * 3 + 1] = (Math.random() * 2 - 1) * spreadY
      base[i * 3 + 2] = (Math.random() * 2 - 1) * 1.6
      positions[i * 3] = base[i * 3]
      positions[i * 3 + 1] = base[i * 3 + 1]
      positions[i * 3 + 2] = base[i * 3 + 2]
      tmpColor.copy(MUTED)
      colors[i * 3] = tmpColor.r
      colors[i * 3 + 1] = tmpColor.g
      colors[i * 3 + 2] = tmpColor.b
      phases[i * 2] = Math.random() * Math.PI * 2
      phases[i * 2 + 1] = 0.2 + Math.random() * 0.5
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    // --- Halo ring shown at the hover point -------------------------------
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.37, 64),
      new THREE.MeshBasicMaterial({
        color: NEON,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    halo.position.z = 0.1
    scene.add(halo)
    const haloOuter = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.58, 64),
      new THREE.MeshBasicMaterial({
        color: NEON,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    haloOuter.position.z = 0.1
    scene.add(haloOuter)

    // --- Foreground hover tracking (never the canvas itself) --------------
    const HOVER_SELECTOR = 'button, a, input, select, textarea, [role="button"], .hover-target'
    let hovering = false
    const mouseNDC = new THREE.Vector2(-10, -10)

    const updateMouse = (clientX: number, clientY: number) => {
      mouseNDC.x = (clientX / window.innerWidth) * 2 - 1
      mouseNDC.y = -(clientY / window.innerHeight) * 2 + 1
    }

    const onMouseMove = (event: MouseEvent) => updateMouse(event.clientX, event.clientY)

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target && typeof target.closest === 'function' && target.closest(HOVER_SELECTOR)) {
        hovering = true
        updateMouse(event.clientX, event.clientY)
      }
    }

    const onMouseOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const related = event.relatedTarget as HTMLElement | null
      const stillInside =
        related && typeof related.closest === 'function' && related.closest(HOVER_SELECTOR)
      if (target && typeof target.closest === 'function' && target.closest(HOVER_SELECTOR) && !stillInside) {
        hovering = false
      }
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mouseover', onMouseOver, { passive: true })
    window.addEventListener('mouseout', onMouseOut, { passive: true })

    // --- Animation ---------------------------------------------------------
    const raycaster = new THREE.Raycaster()
    const targetPoint = new THREE.Vector3()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    let hoverStrength = 0
    let raf = 0
    let last = performance.now()

    const render = (now: number) => {
      raf = requestAnimationFrame(render)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const t = now / 1000

      // Single eased float drives pull, color, opacity, halo together.
      hoverStrength += ((hovering ? 1 : 0) - hoverStrength) * (1 - Math.exp(-dt * 4))
      if (Math.abs(hoverStrength) < 0.001) hoverStrength = hovering ? 0.001 : 0

      raycaster.setFromCamera(mouseNDC, camera)
      const hasPoint = hovering && raycaster.ray.intersectPlane(plane, targetPoint) !== null

      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
      const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute
      const pos = posAttr.array as Float32Array
      const col = colAttr.array as Float32Array

      for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        const ix = i * 3
        const speed = phases[i * 2 + 1]
        const phase = phases[i * 2]
        // Ambient drift around the stored base position.
        const driftX = Math.sin(t * speed + phase) * 0.16
        const driftY = Math.cos(t * speed * 0.8 + phase * 1.7) * 0.16

        let desiredX = base[ix] + driftX
        let desiredY = base[ix + 1] + driftY
        let proximity = 0

        if (hasPoint && hoverStrength > 0.001) {
          const dx = targetPoint.x - desiredX
          const dy = targetPoint.y - desiredY
          const distSq = dx * dx + dy * dy
          proximity = Math.exp(-distSq / (ATTRACTION_RADIUS * ATTRACTION_RADIUS))
          const pull = hoverStrength * proximity * ATTRACTION_PULL
          desiredX += dx * pull
          desiredY += dy * pull
        }

        const ease = 1 - Math.exp(-dt * 3.2)
        pos[ix] += (desiredX - pos[ix]) * ease
        pos[ix + 1] += (desiredY - pos[ix + 1]) * ease
        pos[ix + 2] += (base[ix + 2] - pos[ix + 2]) * ease

        const glow = hoverStrength * (0.25 + 0.75 * proximity)
        tmpColor.copy(MUTED).lerp(NEON, Math.min(1, glow))
        col[ix] = tmpColor.r
        col[ix + 1] = tmpColor.g
        col[ix + 2] = tmpColor.b
      }
      posAttr.needsUpdate = true
      colAttr.needsUpdate = true

      material.opacity = 0.38 + hoverStrength * 0.35

      if (hasPoint) {
        halo.position.x = targetPoint.x
        halo.position.y = targetPoint.y
        haloOuter.position.x = targetPoint.x
        haloOuter.position.y = targetPoint.y
      }
      const pulse = 1 + Math.sin(t * 3) * 0.06
      const haloScale = (0.5 + hoverStrength * 1.1) * pulse
      halo.scale.setScalar(Math.max(0.001, haloScale))
      haloOuter.scale.setScalar(Math.max(0.001, haloScale * 1.15))
      const haloMat = halo.material as THREE.MeshBasicMaterial
      const haloOuterMat = haloOuter.material as THREE.MeshBasicMaterial
      haloMat.opacity = hoverStrength * 0.55
      haloOuterMat.opacity = hoverStrength * 0.22

      renderer.render(scene, camera)
    }

    const onResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      // Keep the original spread — stretch the field instead of snapping particles.
      const newSpreadX = (viewHeight * camera.aspect) / 2
      points.scale.x = newSpreadX / spreadX
    }
    window.addEventListener('resize', onResize)

    if (reduceMotion) {
      renderer.render(scene, camera)
    } else {
      raf = requestAnimationFrame(render)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseover', onMouseOver)
      window.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('resize', onResize)
      geometry.dispose()
      material.dispose()
      halo.geometry.dispose()
      ;(halo.material as THREE.Material).dispose()
      haloOuter.geometry.dispose()
      ;(haloOuter.material as THREE.Material).dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  )
}
