/**
 * ELEMENTA — shared glow post-processing for the lab's WebGL canvases.
 *
 * Wraps the @nexus/3d-post chain (RenderPass → Bloom → Vignette) behind a small,
 * lifecycle-tolerant handle, so each lab element wires it in three lines:
 *
 *   this.glow = createGlowPost(renderer, scene, camera)
 *   if (this.glow?.active) this.glow.render(dt) else renderer.render(scene, camera)
 *   this.glow?.setSize(renderer.domElement.width, renderer.domElement.height)
 *
 * The handle never throws: chain creation failure returns null (callers must
 * tolerate that) and rendering after a dispose is a no-op.
 */

import { BloomPass, EffectComposer, RenderPass, VignettePass } from '@nexus/3d-post'
import type { PerspectiveCamera, Scene, WebGLRenderer } from '@nexus/3d'

export interface GlowPostOptions {
  /** Luma threshold above which pixels bloom (default 0.35). */
  bloomThreshold?: number
  /** Bloom strength (default 0.5). */
  bloomIntensity?: number
  /** Edge-darkening strength of the framing vignette (default 0.55). */
  vignette?: number
}

export interface GlowPost {
  /** False once disposed — a disposed handle renders nothing. */
  readonly active: boolean
  /** Render the full chain this frame (instead of a plain renderer.render). */
  render: (dt?: number) => void
  /** Match the composer's buffers to the drawing-buffer size (post-pixelRatio). */
  setSize: (width: number, height: number) => void
  dispose: () => void
}

export function createGlowPost(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  options: GlowPostOptions = {},
): GlowPost | null {
  try {
    const composer = new EffectComposer(renderer as never)
    composer.setSize(renderer.domElement.width, renderer.domElement.height)
    composer.addPass(new RenderPass(scene as never, camera as never))
    composer.addPass(
      new BloomPass(options.bloomThreshold ?? 0.35, options.bloomIntensity ?? 0.5),
    )
    composer.addPass(new VignettePass(1.0, options.vignette ?? 0.55))

    let disposed = false
    return {
      get active(): boolean {
        return !disposed
      },
      render(dt = 0.016): void {
        if (!disposed) composer.render(dt)
      },
      setSize(width: number, height: number): void {
        if (!disposed) composer.setSize(width, height)
      },
      dispose(): void {
        if (disposed) return
        disposed = true
        try {
          composer.dispose()
        } catch {
          // the context may already be lost
        }
      },
    }
  } catch {
    return null // degrade gracefully: the element keeps its plain render path
  }
}
