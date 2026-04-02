'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Camera, CameraOff, ZoomIn, ZoomOut, RotateCcw, Info,
  Move, RefreshCw, Hand, PersonStanding, Download, X, ShoppingBag, SwitchCamera
} from 'lucide-react'
import type { Tattoo } from '@/lib/types'
import { useFittingRoomCtx } from '@/context/FittingRoomContext'

// ─── Perspective warp helpers (module-level, no component state) ────────────

function bilerp(
  pts: { x: number; y: number }[],
  u: number, v: number
): { x: number; y: number } {
  return {
    x: pts[0].x*(1-u)*(1-v) + pts[1].x*u*(1-v) + pts[2].x*u*v + pts[3].x*(1-u)*v,
    y: pts[0].y*(1-u)*(1-v) + pts[1].y*u*(1-v) + pts[2].y*u*v + pts[3].y*(1-u)*v,
  }
}

/** Draw a triangle from `img` (src space) mapped to `dst` points (canvas space). */
function drawAffineTriangle(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement,
  src: { x: number; y: number }[],
  dst: { x: number; y: number }[]
) {
  const [s0, s1, s2] = src
  const [d0, d1, d2] = dst
  const det = (s0.x - s2.x) * (s1.y - s2.y) - (s1.x - s2.x) * (s0.y - s2.y)
  if (Math.abs(det) < 0.5) return
  // Compute affine matrix mapping image → canvas
  const a  = ((d0.x - d2.x) * (s1.y - s2.y) - (d1.x - d2.x) * (s0.y - s2.y)) / det
  const b  = ((d0.y - d2.y) * (s1.y - s2.y) - (d1.y - d2.y) * (s0.y - s2.y)) / det
  const c  = ((s0.x - s2.x) * (d1.x - d2.x) - (s1.x - s2.x) * (d0.x - d2.x)) / det
  const dd = ((s0.x - s2.x) * (d1.y - d2.y) - (s1.x - s2.x) * (d0.y - d2.y)) / det
  const e  = d0.x - a * s0.x - c * s0.y
  const f  = d0.y - b * s0.x - dd * s0.y
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(d0.x, d0.y)
  ctx.lineTo(d1.x, d1.y)
  ctx.lineTo(d2.x, d2.y)
  ctx.closePath()
  ctx.clip()
  ctx.transform(a, b, c, dd, e, f)
  ctx.drawImage(img, 0, 0)
  ctx.restore()
}

// ─── Marker detection (dark-ink on skin) ────────────────────────────────────

const DETECT_W = 320  // process at reduced resolution for performance

/**
 * Analyse a video frame and return a 4-point quad [tl,tr,br,bl] in display-space
 * coordinates around any dark mark drawn on skin.
 * Returns null when no credible mark is found.
 */
// ROI fractions in detect-space (fraction of detect canvas dimensions)
const ROI = { x1: 0.10, y1: 0.10, x2: 0.90, y2: 0.90 }

/**
 * Detects a black marker (printed square+X) in the video frame.
 * Black is detected by requiring all RGB channels to be very dark.
 */
function detectMarkerInFrame(
  video: HTMLVideoElement,
  detectCanvas: HTMLCanvasElement,
  displayScale: number,
  displayOffsetX: number,
  displayOffsetY: number,
): { x: number; y: number }[] | null {
  const vw = video.videoWidth, vh = video.videoHeight
  if (!vw || !vh || video.readyState < 2) return null

  const ds = DETECT_W / vw
  const dw = DETECT_W
  const dh = Math.round(vh * ds)
  const total = dw * dh

  detectCanvas.width = dw
  detectCanvas.height = dh
  const ctx = detectCanvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(video, 0, 0, dw, dh)
  const { data } = ctx.getImageData(0, 0, dw, dh)

  // Black detection: all channels very dark
  const darkMap = new Uint8Array(total)
  for (let i = 0; i < total; i++) {
    const r = data[i*4], g = data[i*4+1], b = data[i*4+2]
    if (r < 60 && g < 60 && b < 60) darkMap[i] = 1
  }

  // BFS — find the largest connected dark cluster within ROI only
  const rx1 = Math.round(dw * ROI.x1), ry1 = Math.round(dh * ROI.y1)
  const rx2 = Math.round(dw * ROI.x2), ry2 = Math.round(dh * ROI.y2)

  // BFS — find largest connected green cluster seeded from inside ROI
  const visited = new Uint8Array(total)
  const queue = new Int32Array(total)
  type Cluster = {
    size: number
    // Diagonal-extreme corners for perspective-correct quad
    tlX: number; tlY: number   // min(x+y)  → top-left
    trX: number; trY: number   // max(x-y)  → top-right
    brX: number; brY: number   // max(x+y)  → bottom-right
    blX: number; blY: number   // min(x-y)  → bottom-left
    bw: number; bh: number
  }
  let best: Cluster | null = null

  for (let start = 0; start < total; start++) {
    if (!darkMap[start] || visited[start]) continue
    const sx = start % dw, sy = (start / dw) | 0
    if (sx < rx1 || sx > rx2 || sy < ry1 || sy > ry2) { visited[start] = 1; continue }

    let head = 0, tail = 0
    queue[tail++] = start
    visited[start] = 1
    let minX = dw, maxX = 0, minY = dh, maxY = 0
    // Diagonal-extreme tracking (perspective corners)
    let tlS = Infinity,  tlX = 0, tlY = 0
    let trS = -Infinity, trX = 0, trY = 0
    let brS = -Infinity, brX = 0, brY = 0
    let blS = Infinity,  blX = 0, blY = 0

    while (head < tail) {
      const cur = queue[head++]
      const cx = cur % dw, cy = (cur / dw) | 0
      if (cx < minX) minX = cx; if (cx > maxX) maxX = cx
      if (cy < minY) minY = cy; if (cy > maxY) maxY = cy

      const s1 = cx + cy, s2 = cx - cy
      if (s1 < tlS) { tlS = s1; tlX = cx; tlY = cy }
      if (s2 > trS) { trS = s2; trX = cx; trY = cy }
      if (s1 > brS) { brS = s1; brX = cx; brY = cy }
      if (s2 < blS) { blS = s2; blX = cx; blY = cy }

      if (cx > 0    && darkMap[cur-1]  && !visited[cur-1])  { visited[cur-1]=1;  queue[tail++]=cur-1  }
      if (cx < dw-1 && darkMap[cur+1]  && !visited[cur+1])  { visited[cur+1]=1;  queue[tail++]=cur+1  }
      if (cy > 0    && darkMap[cur-dw] && !visited[cur-dw]) { visited[cur-dw]=1; queue[tail++]=cur-dw }
      if (cy < dh-1 && darkMap[cur+dw] && !visited[cur+dw]) { visited[cur+dw]=1; queue[tail++]=cur+dw }
    }

    const size = tail
    const bw = maxX - minX, bh = maxY - minY
    if (size < 15 || size > total * 0.35) continue
    if (bw < 8 || bh < 8) continue
    if (bw > dw * 0.92 || bh > dh * 0.92) continue
    if (!best || size > best.size) best = { size, tlX, tlY, trX, trY, brX, brY, blX, blY, bw, bh }
  }

  if (!best) return null
  if (best.bw / best.bh > 8 || best.bh / best.bw > 8) return null

  const toD = (px: number, py: number) => ({
    x: (px / ds) * displayScale + displayOffsetX,
    y: (py / ds) * displayScale + displayOffsetY,
  })
  // Return perspective-correct 4 corners [TL, TR, BR, BL]
  return [
    toD(best.tlX, best.tlY),
    toD(best.trX, best.trY),
    toD(best.brX, best.brY),
    toD(best.blX, best.blY),
  ]
}

/** Low-pass smooth a quad toward a new detection (alpha = responsiveness). */
function smoothQuad(
  prev: { x: number; y: number }[],
  next: { x: number; y: number }[],
  alpha = 0.35,
): { x: number; y: number }[] {
  return next.map((p, i) => ({
    x: prev[i].x + alpha * (p.x - prev[i].x),
    y: prev[i].y + alpha * (p.y - prev[i].y),
  }))
}

// ─── Body part definitions ────────────────────────────────────────────────────
const BODY_PARTS = [
  { id: 'hand',        label: '手背',   mode: 'hand',  icon: '✋' },
  { id: 'wrist',       label: '手腕',   mode: 'hand',  icon: '🤲' },
  { id: 'forearm',     label: '前臂',   mode: 'pose',  icon: '💪' },
  { id: 'upper_arm',   label: '上臂',   mode: 'pose',  icon: '💪' },
  { id: 'chest',       label: '胸口',   mode: 'pose',  icon: '🫀' },
  { id: 'shoulder',    label: '肩膀',   mode: 'pose',  icon: '🦴' },
  { id: 'waist',       label: '腰部',   mode: 'pose',  icon: '⬛' },
  { id: 'back',        label: '背部',   mode: 'manual', icon: '🔲' },
  { id: 'ankle',       label: '腳踝',   mode: 'pose',  icon: '🦵' },
  { id: 'manual',      label: '自由拖曳', mode: 'manual', icon: '🖐️' },
  { id: 'marker',      label: '錨點偵測', mode: 'marker', icon: '✏️' },
] as const

type BodyPartId = typeof BODY_PARTS[number]['id']

interface PoseLandmark { x: number; y: number; z: number; visibility?: number }
interface HandLandmark { x: number; y: number; z: number }

export default function ARClient() {
  const { items: tattoos } = useFittingRoomCtx()
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const detectorRef = useRef<unknown>(null)
  const tattooImgRef = useRef<HTMLImageElement | null>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const detectCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const markerQuadRef = useRef<{ x: number; y: number }[] | null>(null)
  const markerLostFrames = useRef(0)
  const [markerLocked, setMarkerLocked] = useState(false)
  const lockedQuadRef = useRef<{ x: number; y: number }[] | null>(null)

  // Manual drag state
  const manualPosRef = useRef({ x: 0.5, y: 0.5 })
  const isDraggingRef = useRef(false)
  const lastTouchRef = useRef({ x: 0, y: 0 })

  const [isStarted, setIsStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTattoo, setSelectedTattoo] = useState<Tattoo | null>(tattoos[0] ?? null)
  const [selectedPart, setSelectedPart] = useState<BodyPartId>('manual')
  const [tattooScale, setTattooScale] = useState(1.0)
  const [tattooOpacity, setTattooOpacity] = useState(0.85)
  const [tattooRotation, setTattooRotation] = useState(0) // degrees
  const [mirrored, setMirrored] = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  // Refs so MediaPipe callbacks always read latest values (no stale closure)
  const tattooScaleRef = useRef(1.0)
  const tattooOpacityRef = useRef(0.85)
  const tattooRotationRef = useRef(0)
  const facingModeRef = useRef<'user' | 'environment'>('user')
  useEffect(() => { tattooScaleRef.current = tattooScale }, [tattooScale])
  useEffect(() => { tattooOpacityRef.current = tattooOpacity }, [tattooOpacity])
  useEffect(() => { tattooRotationRef.current = tattooRotation * (Math.PI / 180) }, [tattooRotation])
  const [detectionStatus, setDetectionStatus] = useState<'none' | 'detected' | 'lost'>('none')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const currentPart = BODY_PARTS.find(p => p.id === selectedPart)!

  // Preload tattoo image
  useEffect(() => {
    if (!selectedTattoo) return
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = selectedTattoo.image_url
    img.onload = () => { tattooImgRef.current = img }
  }, [selectedTattoo])

  // ─── Map video-native coords → display coords (accounts for object-cover) ──
  const getDisplayTransform = useCallback((video: HTMLVideoElement) => {
    const rect = video.getBoundingClientRect()
    const dW = rect.width || 640
    const dH = rect.height || 480
    const vW = video.videoWidth || dW
    const vH = video.videoHeight || dH
    if (vW === 0 || vH === 0) return { scale: 1, offsetX: 0, offsetY: 0, dW, dH }
    const videoAspect = vW / vH
    const containerAspect = dW / dH
    let scale: number, offsetX: number, offsetY: number
    if (videoAspect > containerAspect) {
      // video wider → fit by height, crop sides
      scale = dH / vH
      offsetX = (dW - vW * scale) / 2
      offsetY = 0
    } else {
      // video taller → fit by width, crop top/bottom
      scale = dW / vW
      offsetX = 0
      offsetY = (dH - vH * scale) / 2
    }
    return { scale, offsetX, offsetY, dW, dH }
  }, [])

  // ─── Build offscreen canvas (no rotation — avoids clipping at edges) ─────────
  const buildOffscreen = useCallback((w: number, h: number): HTMLCanvasElement | null => {
    if (!tattooImgRef.current) return null
    const img = tattooImgRef.current
    if (!offscreenRef.current) offscreenRef.current = document.createElement('canvas')
    const off = offscreenRef.current
    off.width = Math.max(1, Math.round(w))
    off.height = Math.max(1, Math.round(h))
    const offCtx = off.getContext('2d')!
    offCtx.clearRect(0, 0, off.width, off.height)
    offCtx.drawImage(img, 0, 0, off.width, off.height)
    return off
  }, []) // reads via refs — stable

  // ─── Draw tattoo on canvas (anchor-based) ───────────────────────────────────
  const drawTattoo = useCallback((
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    sizePx: number, angle: number
  ) => {
    if (!tattooImgRef.current) return
    const img = tattooImgRef.current
    const w = sizePx * tattooScaleRef.current
    const h = (img.naturalHeight / img.naturalWidth) * w
    const off = buildOffscreen(w, h)
    if (!off) return
    ctx.save()
    ctx.globalAlpha = tattooOpacityRef.current
    ctx.translate(cx, cy)
    // Combine landmark angle + user rotation here (display ctx is large — no clipping)
    ctx.rotate(angle + tattooRotationRef.current)
    ctx.drawImage(off, -w / 2, -h / 2, w, h)
    ctx.restore()
  }, [buildOffscreen]) // reads latest values via refs

  // ─── Draw tattoo warped into a perspective quad (InkHunter-style) ───────────
  // dstQuad = [tl, tr, br, bl] in canvas pixel coords
  const drawPerspectiveTattoo = useCallback((
    ctx: CanvasRenderingContext2D,
    dstQuad: { x: number; y: number }[],
    subdivisions = 8
  ) => {
    if (!tattooImgRef.current) return
    const img = tattooImgRef.current
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    if (iw === 0 || ih === 0) return

    // Draw image onto offscreen without rotation (rotation encoded in srcQuad below)
    if (!offscreenRef.current) offscreenRef.current = document.createElement('canvas')
    const off = offscreenRef.current
    off.width = iw
    off.height = ih
    const offCtx = off.getContext('2d')!
    offCtx.clearRect(0, 0, iw, ih)
    offCtx.drawImage(img, 0, 0, iw, ih)

    // Rotate source quad corners around image center — avoids offscreen clipping
    const rot = tattooRotationRef.current
    const cos = Math.cos(rot), sin = Math.sin(rot)
    const mx = iw / 2, my = ih / 2
    const rotPt = (x: number, y: number) => ({
      x: mx + (x - mx) * cos - (y - my) * sin,
      y: my + (x - mx) * sin + (y - my) * cos,
    })
    const srcQuad = [
      rotPt(0, 0), rotPt(iw, 0),
      rotPt(iw, ih), rotPt(0, ih),
    ]

    ctx.save()
    ctx.globalAlpha = tattooOpacityRef.current

    const n = subdivisions
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const u0 = j / n, u1 = (j + 1) / n
        const v0 = i / n, v1 = (i + 1) / n
        const s00 = bilerp(srcQuad, u0, v0), s10 = bilerp(srcQuad, u1, v0)
        const s11 = bilerp(srcQuad, u1, v1), s01 = bilerp(srcQuad, u0, v1)
        const d00 = bilerp(dstQuad, u0, v0), d10 = bilerp(dstQuad, u1, v0)
        const d11 = bilerp(dstQuad, u1, v1), d01 = bilerp(dstQuad, u0, v1)
        drawAffineTriangle(ctx, off, [s00, s10, s11], [d00, d10, d11])
        drawAffineTriangle(ctx, off, [s00, s11, s01], [d00, d11, d01])
      }
    }
    ctx.restore()
  }, []) // reads all via refs — stable

  // ─── Pose landmark → anchor calculation ────────────────────────────────────
  const getPoseAnchor = useCallback((
    lm: PoseLandmark[], W: number, H: number, partId: BodyPartId
  ) => {
    const p = (i: number) => ({ x: lm[i].x * W, y: lm[i].y * H })
    const mid = (a: {x:number,y:number}, b: {x:number,y:number}) =>
      ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
    const dist = (a: {x:number,y:number}, b: {x:number,y:number}) =>
      Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2)
    const ang = (a: {x:number,y:number}, b: {x:number,y:number}) =>
      Math.atan2(b.y - a.y, b.x - a.x)

    switch (partId) {
      case 'chest': {
        const c = mid(p(11), p(12))
        const size = dist(p(11), p(12)) * 1.2
        return { cx: c.x, cy: c.y + size * 0.3, size, angle: 0 }
      }
      case 'shoulder': {
        const c = mid(p(11), p(13))
        const size = dist(p(11), p(13)) * 0.9
        return { cx: c.x, cy: c.y, size, angle: ang(p(11), p(13)) }
      }
      case 'upper_arm': {
        // Use left arm (11=L shoulder, 13=L elbow)
        const c = mid(p(11), p(13))
        const size = dist(p(11), p(13)) * 0.8
        return { cx: c.x, cy: c.y, size, angle: ang(p(11), p(13)) + Math.PI / 2 }
      }
      case 'forearm': {
        // 13=L elbow, 15=L wrist
        const c = mid(p(13), p(15))
        const size = dist(p(13), p(15)) * 0.8
        return { cx: c.x, cy: c.y, size, angle: ang(p(13), p(15)) + Math.PI / 2 }
      }
      case 'waist': {
        const c = mid(p(23), p(24))
        const size = dist(p(23), p(24)) * 1.2
        return { cx: c.x, cy: c.y, size, angle: 0 }
      }
      case 'ankle': {
        // 27=L ankle
        const c = p(27)
        const size = dist(p(25), p(27)) * 0.6
        return { cx: c.x, cy: c.y, size, angle: 0 }
      }
      default:
        return null
    }
  }, [])

  // ─── Hand landmark → anchor ─────────────────────────────────────────────────
  const getHandAnchor = useCallback((
    lm: HandLandmark[], W: number, H: number, partId: BodyPartId
  ) => {
    const p = (i: number) => ({ x: lm[i].x * W, y: lm[i].y * H })
    const dist = (a: {x:number,y:number}, b: {x:number,y:number}) =>
      Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2)
    const ang = (a: {x:number,y:number}, b: {x:number,y:number}) =>
      Math.atan2(b.y - a.y, b.x - a.x)

    if (partId === 'wrist') {
      const cx = p(0).x
      const cy = p(0).y
      const size = dist(p(5), p(17)) * 1.2
      return { cx, cy, size, angle: ang(p(0), p(9)) }
    }
    // hand (default)
    const cx = (p(0).x + p(5).x + p(17).x) / 3
    const cy = (p(0).y + p(5).y + p(17).y) / 3
    const size = dist(p(5), p(17)) * 2.2
    const angle = ang(p(0), p(12)) - Math.PI / 2
    return { cx, cy, size, angle }
  }, [])

  // ─── Main detection loop ────────────────────────────────────────────────────
  const runDetection = useCallback(async () => {
    const canvas = overlayRef.current
    const video = videoRef.current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detector = detectorRef.current as any
    if (!canvas || !video || !detector) return

    const { dW, dH } = getDisplayTransform(video)
    canvas.width = dW
    canvas.height = dH

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, dW, dH)

    if (currentPart.mode === 'manual') {
      const cx = manualPosRef.current.x * dW
      const cy = manualPosRef.current.y * dH
      drawTattoo(ctx, cx, cy, dW * 0.2, 0)
      setDetectionStatus('detected')
    } else if (currentPart.mode === 'marker') {
      if (lockedQuadRef.current) {
        // ── Locked: frozen position, ignore detection ──────────────────────
        drawPerspectiveTattoo(ctx, lockedQuadRef.current)
      } else {
        // ── Live tracking: detect every frame so tattoo follows movement ───
        if (!detectCanvasRef.current) detectCanvasRef.current = document.createElement('canvas')
        const { scale, offsetX, offsetY } = getDisplayTransform(video)
        const raw = detectMarkerInFrame(video, detectCanvasRef.current, scale, offsetX, offsetY)

        if (raw) {
          markerLostFrames.current = 0
          const prev = markerQuadRef.current
          // Higher alpha (0.6) = more responsive tracking
          markerQuadRef.current = prev ? smoothQuad(prev, raw, 0.6) : raw
          drawPerspectiveTattoo(ctx, markerQuadRef.current)
          setDetectionStatus('detected')
        } else {
          markerLostFrames.current++
          // Hold last position for ~15 frames (handles brief occlusion)
          if (markerQuadRef.current && markerLostFrames.current < 15) {
            drawPerspectiveTattoo(ctx, markerQuadRef.current)
          } else {
            markerQuadRef.current = null
            setDetectionStatus('lost')
          }
        }
      }
    } else {
      try {
        if (video.readyState >= 2) {
          await detector.send({ image: video })
        }
      } catch (_) { /* ignore */ }
    }
    animFrameRef.current = requestAnimationFrame(runDetection)
  }, [currentPart, drawTattoo, drawPerspectiveTattoo, getDisplayTransform])

  // ─── Start camera + load detector ──────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingModeRef.current, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Load MediaPipe scripts
      const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
        const s = document.createElement('script')
        s.src = src
        s.crossOrigin = 'anonymous'
        s.onload = () => resolve()
        s.onerror = reject
        document.head.appendChild(s)
      })

      const isHandMode = currentPart.mode === 'hand'
      const isPoseMode = currentPart.mode === 'pose'

      if (isHandMode) {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')
        await new Promise<void>(res => {
          const t = setInterval(() => { if ((window as any).Hands) { clearInterval(t); res() } }, 100)
        })
        const hands = new (window as any).Hands({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        })
        hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.5 })
        hands.onResults((results: { multiHandLandmarks?: HandLandmark[][] }) => {
          const canvas = overlayRef.current
          const video = videoRef.current
          if (!canvas || !video) return
          const { dW, dH, scale, offsetX, offsetY } = getDisplayTransform(video)
          const W = video.videoWidth || 1280
          const H = video.videoHeight || 720
          canvas.width = dW; canvas.height = dH
          const ctx = canvas.getContext('2d')!
          ctx.clearRect(0, 0, dW, dH)
          if (results.multiHandLandmarks?.length) {
            setDetectionStatus('detected')
            const lm = results.multiHandLandmarks[0]

            if (selectedPart === 'hand') {
              // ── Perspective quad from hand landmarks (InkHunter-style) ──
              const toD = (i: number) => ({
                x: lm[i].x * W * scale + offsetX,
                y: lm[i].y * H * scale + offsetY,
              })
              const p5 = toD(5), p17 = toD(17), p0 = toD(0)
              // Knuckle-to-knuckle vector
              const kx = p17.x - p5.x, ky = p17.y - p5.y
              const kLen = Math.sqrt(kx * kx + ky * ky) || 1
              const knx = kx / kLen, kny = ky / kLen
              // Wrist corners spread along knuckle direction
              const half = kLen * 0.5
              const bl = { x: p0.x - knx * half, y: p0.y - kny * half }
              const br = { x: p0.x + knx * half, y: p0.y + kny * half }
              // Scale quad from its center
              const cx = (p5.x + p17.x + br.x + bl.x) / 4
              const cy = (p5.y + p17.y + br.y + bl.y) / 4
              const s = tattooScaleRef.current
              const quad = [p5, p17, br, bl].map(pt => ({
                x: cx + (pt.x - cx) * s,
                y: cy + (pt.y - cy) * s,
              }))
              drawPerspectiveTattoo(ctx, quad)
            } else {
              // Wrist / other hand modes: anchor-based with multiply blend
              const anchor = getHandAnchor(lm, W, H, selectedPart)
              if (anchor) {
                ctx.save()
                ctx.translate(offsetX, offsetY)
                ctx.scale(scale, scale)
                drawTattoo(ctx, anchor.cx, anchor.cy, anchor.size, anchor.angle)
                ctx.restore()
              }
            }
          } else {
            setDetectionStatus('lost')
          }
        })
        detectorRef.current = hands
      } else if (isPoseMode) {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js')
        await new Promise<void>(res => {
          const t = setInterval(() => { if ((window as any).Pose) { clearInterval(t); res() } }, 100)
        })
        const pose = new (window as any).Pose({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
        })
        pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 })
        pose.onResults((results: { poseLandmarks?: PoseLandmark[] }) => {
          const canvas = overlayRef.current
          const video = videoRef.current
          if (!canvas || !video) return
          const { dW, dH, scale, offsetX, offsetY } = getDisplayTransform(video)
          const W = video.videoWidth || 1280
          const H = video.videoHeight || 720
          canvas.width = dW; canvas.height = dH
          const ctx = canvas.getContext('2d')!
          ctx.clearRect(0, 0, dW, dH)
          if (results.poseLandmarks) {
            const anchor = getPoseAnchor(results.poseLandmarks, W, H, selectedPart)
            if (anchor) {
              setDetectionStatus('detected')
              ctx.save()
              ctx.translate(offsetX, offsetY)
              ctx.scale(scale, scale)
              drawTattoo(ctx, anchor.cx, anchor.cy, anchor.size, anchor.angle)
              ctx.restore()
            } else {
              setDetectionStatus('lost')
            }
          } else {
            setDetectionStatus('lost')
          }
        })
        detectorRef.current = pose
      } else {
        // Manual / Marker mode — no external detector needed
        detectorRef.current = { send: async () => {} }
        if (currentPart.mode === 'marker') {
          // reset smoothing state on (re)start
          markerQuadRef.current = null
          markerLostFrames.current = 0
        }
      }

      setIsStarted(true)
      animFrameRef.current = requestAnimationFrame(runDetection)
    } catch (err) {
      setError('無法存取相機，請確認已授予相機權限')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentPart, selectedPart, drawTattoo, drawPerspectiveTattoo, getHandAnchor, getPoseAnchor, runDetection])

  // ─── Capture photo ──────────────────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const overlay = overlayRef.current
    if (!video || !overlay) return

    // Use display dimensions (same as overlay canvas)
    const { dW, dH, scale, offsetX, offsetY } = getDisplayTransform(video)
    const canvas = document.createElement('canvas')
    canvas.width = dW
    canvas.height = dH
    const ctx = canvas.getContext('2d')!

    // Draw video frame with object-cover mapping
    if (mirrored) { ctx.translate(dW, 0); ctx.scale(-1, 1) }
    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
    ctx.restore()
    if (mirrored) ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Overlay tattoo (already in display coords)
    ctx.drawImage(overlay, 0, 0, dW, dH)

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.92))
  }, [mirrored, getDisplayTransform])

  const downloadPhoto = useCallback(() => {
    if (!capturedImage) return
    const a = document.createElement('a')
    a.href = capturedImage
    a.download = `tattoo-ar-${Date.now()}.jpg`
    a.click()
  }, [capturedImage])

  // ─── Download printable marker (black square + X on white) ─────────────────
  const downloadMarker = useCallback(() => {
    const size = 500, border = 40, lw = 22
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="white"/>
  <rect x="${border/2}" y="${border/2}" width="${size-border}" height="${size-border}"
        fill="none" stroke="#000000" stroke-width="${border}"/>
  <line x1="${border}" y1="${border}" x2="${size-border}" y2="${size-border}"
        stroke="#000000" stroke-width="${lw}" stroke-linecap="round"/>
  <line x1="${size-border}" y1="${border}" x2="${border}" y2="${size-border}"
        stroke="#000000" stroke-width="${lw}" stroke-linecap="round"/>
</svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tattoo-ar-marker.svg'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    detectorRef.current = null
    markerQuadRef.current = null
    lockedQuadRef.current = null
    setMarkerLocked(false)
    setIsStarted(false)
    setDetectionStatus('none')
  }, [])

  // ─── Switch front/back camera ───────────────────────────────────────────────
  const switchCamera = useCallback(() => {
    const next = facingModeRef.current === 'user' ? 'environment' : 'user'
    facingModeRef.current = next
    setFacingMode(next)
    setMirrored(next === 'user')
    stopCamera()
    setTimeout(() => startCamera(), 300)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopCamera, startCamera])

  useEffect(() => () => { cancelAnimationFrame(animFrameRef.current) }, [])

  // Restart detecto
  // r when body part changes mid-session
  useEffect(() => {
    if (!isStarted) return
    stopCamera()
    setTimeout(() => startCamera(), 300)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPart])

  // ─── Manual drag on overlay canvas ─────────────────────────────────────────
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentPart.mode !== 'manual') return
    isDraggingRef.current = true
    updateManualPos(e.clientX, e.clientY, e.currentTarget)
  }
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return
    updateManualPos(e.clientX, e.clientY, e.currentTarget)
  }
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (currentPart.mode !== 'manual') return
    isDraggingRef.current = true
    const t = e.touches[0]
    updateManualPos(t.clientX, t.clientY, e.currentTarget)
  }
  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return
    const t = e.touches[0]
    updateManualPos(t.clientX, t.clientY, e.currentTarget)
  }

  const updateManualPos = (clientX: number, clientY: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    // Canvas has CSS scale-x-[-1] when mirrored, so flip x to match visual position
    let x = (clientX - rect.left) / rect.width
    if (mirrored) x = 1 - x
    manualPosRef.current = {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    }
  }

  // ─── Status badge ───────────────────────────────────────────────────────────
  const statusBadge = () => {
    if (currentPart.mode === 'manual') return { text: '拖曳移動刺青位置', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
    if (currentPart.mode === 'marker') {
      if (markerLocked) return { text: '已鎖定位置', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
      if (detectionStatus === 'detected') return { text: '偵測到黑色錨點', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
      return { text: '請將黑色錨點對準框框', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
    }
    if (detectionStatus === 'detected') return { text: `已偵測${currentPart.label}`, color: 'bg-green-500/20 text-green-400 border-green-500/30' }
    return { text: `請將${currentPart.label}對準鏡頭`, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
  }

  // Guard: fitting room is empty
  if (tattoos.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center">
              <ShoppingBag size={36} className="text-[#c9a84c]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">試衣間是空的</h1>
          <p className="text-gray-400 text-sm mb-8">請先到作品集挑選喜歡的刺青，加入試衣間後再開始 AR 試穿</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/gallery"
              className="w-full bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold py-3 rounded-xl transition-colors"
            >
              前往作品集挑選
            </Link>
            <Link
              href="/fitting-room"
              className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 font-medium py-3 rounded-xl border border-[#2a2a2a] transition-colors"
            >
              查看試衣間
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Main AR view ── */}
      <div className="flex-1 relative bg-black flex items-center justify-center min-h-[60vh] lg:min-h-screen">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
          playsInline muted
          style={{ display: isStarted ? 'block' : 'none', maxHeight: '100vh' }}
        />
        <canvas
          ref={overlayRef}
          className={`absolute inset-0 w-full h-full ${mirrored ? 'scale-x-[-1]' : ''} ${currentPart.mode === 'manual' ? 'cursor-move' : 'pointer-events-none'}`}
          style={{ display: isStarted ? 'block' : 'none', mixBlendMode: 'multiply' }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={() => { isDraggingRef.current = false }}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={() => { isDraggingRef.current = false }}
        />

        {/* Marker mode: lock button */}
        {isStarted && currentPart.mode === 'marker' && !markerLocked && (
          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
            {detectionStatus === 'detected' ? (
              <>
                <span className="text-green-400 text-xs font-medium">即時追蹤中</span>
                <button
                  className="pointer-events-auto flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs px-4 py-1.5 rounded-full shadow-lg transition-colors border border-white/20"
                  onClick={() => { lockedQuadRef.current = markerQuadRef.current; setMarkerLocked(true) }}
                >
                  🔒 鎖定（固定位置）
                </button>
              </>
            ) : (
              <span className="text-white/70 text-xs bg-black/50 px-3 py-1.5 rounded-full">將黑色錨點對準鏡頭</span>
            )}
          </div>
        )}

        {/* Locked indicator + unlock button */}
        {isStarted && currentPart.mode === 'marker' && markerLocked && (
          <div className="absolute top-16 right-4">
            <button
              onClick={() => { lockedQuadRef.current = null; markerQuadRef.current = null; setMarkerLocked(false); setDetectionStatus('lost') }}
              className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
            >
              🔓 解除鎖定
            </button>
          </div>
        )}

        {/* Start screen */}
        {!isStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-6">
              <Camera className="text-[#c9a84c]" size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-3">AR 虛擬試穿</h2>
            <p className="text-gray-400 mb-2 max-w-sm text-sm leading-relaxed">
              選擇部位後開啟相機，刺青會自動貼合到對應位置
            </p>
            <p className="text-gray-500 text-xs mb-6">
              目前選擇：<span className="text-[#c9a84c]">{currentPart.icon} {currentPart.label}</span>
            </p>
            {error && (
              <p className="text-red-400 text-sm mb-4 bg-red-400/10 px-4 py-2 rounded-lg">{error}</p>
            )}
            <button
              onClick={startCamera}
              disabled={isLoading}
              className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold px-8 py-3 rounded-full transition-all disabled:opacity-50"
            >
              {isLoading ? <><RefreshCw size={18} className="animate-spin" /> 載入中...</> : <><Camera size={18} /> 開啟相機</>}
            </button>
          </div>
        )}

        {/* Active AR controls */}
        {isStarted && (
          <>
            {/* Status */}
            {(() => { const s = statusBadge(); return (
              <div className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${s.color}`}>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {s.text}
              </div>
            )})()}

            {/* Top right controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button onClick={stopCamera} className="bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full transition-colors" title="關閉相機">
                <CameraOff size={18} />
              </button>
              <button onClick={switchCamera} className="bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full transition-colors" title={facingMode === 'user' ? '切換後鏡頭' : '切換前鏡頭'}>
                <SwitchCamera size={18} />
              </button>
              <button onClick={() => setMirrored(m => !m)} className="bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full transition-colors" title="鏡像翻轉">
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-[95vw] max-w-md">
              {/* Row 1: size + opacity + capture */}
              <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full w-full justify-center">
                <button onClick={() => setTattooScale(s => Math.max(0.3, s - 0.1))} className="text-white hover:text-[#c9a84c] transition-colors p-1"><ZoomOut size={16} /></button>
                <span className="text-white text-xs w-9 text-center">{Math.round(tattooScale * 100)}%</span>
                <button onClick={() => setTattooScale(s => Math.min(4, s + 0.1))} className="text-white hover:text-[#c9a84c] transition-colors p-1"><ZoomIn size={16} /></button>
                <div className="w-px h-4 bg-white/20" />
                <input type="range" min="0.3" max="1" step="0.05" value={tattooOpacity} onChange={e => setTattooOpacity(Number(e.target.value))} className="w-14 sm:w-20 accent-[#c9a84c]" />
                <div className="w-px h-4 bg-white/20" />
                <button onClick={capturePhoto} className="flex items-center gap-1 bg-white hover:bg-gray-100 text-black font-semibold px-2.5 py-1 rounded-full transition-colors text-xs whitespace-nowrap">
                  <Camera size={13} /> 拍照
                </button>
              </div>
              {/* Row 2: rotation */}
              <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full w-full justify-center">
                <RotateCcw size={13} className="text-gray-400 flex-shrink-0" />
                <input
                  type="range" min="-180" max="180" step="1"
                  value={tattooRotation}
                  onChange={e => setTattooRotation(Number(e.target.value))}
                  className="flex-1 max-w-32 accent-[#c9a84c]"
                />
                <span className="text-white text-xs w-9 text-center">{tattooRotation}°</span>
                <button onClick={() => setTattooRotation(0)} className="text-gray-400 hover:text-white text-xs transition-colors whitespace-nowrap">重置</button>
              </div>
            </div>
          </>
        )}

        {/* Captured photo preview modal */}
        {capturedImage && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden max-w-lg w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="拍攝結果" className="w-full" />
              <div className="flex gap-3 p-4">
                <button
                  onClick={() => setCapturedImage(null)}
                  className="flex-1 flex items-center justify-center gap-2 border border-[#2a2a2a] hover:border-white/30 text-gray-400 hover:text-white py-2.5 rounded-xl transition-colors text-sm"
                >
                  <X size={16} /> 重拍
                </button>
                <button
                  onClick={downloadPhoto}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  <Download size={16} /> 儲存照片
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <div className="lg:w-80 bg-[#0f0f0f] border-t lg:border-t-0 lg:border-l border-[#2a2a2a] flex flex-col overflow-y-auto">
        {/* Body part selector */}
        <div className="p-5 border-b border-[#2a2a2a]">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <PersonStanding size={16} className="text-[#c9a84c]" /> 選擇刺青部位
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {BODY_PARTS.filter(p => p.id === 'manual' || p.id === 'marker').map(part => (
              <button
                key={part.id}
                onClick={() => setSelectedPart(part.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all ${
                  selectedPart === part.id
                    ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#c9a84c]'
                    : 'border-[#2a2a2a] text-gray-400 hover:border-[#c9a84c]/40 hover:text-white'
                }`}
              >
                <span>{part.icon}</span>
                <span>{part.label}</span>
                {part.mode === 'manual' && <Move size={10} className="ml-auto opacity-50" />}
              </button>
            ))}
          </div>

          {/* Mode hint */}
          <div className="mt-3 flex items-start gap-2 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-xl p-3">
            <Info size={13} className="text-[#c9a84c] flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-xs text-gray-400 leading-relaxed">
                {currentPart.mode === 'hand' && '使用手部追蹤，請將手背朝向鏡頭'}
                {currentPart.mode === 'pose' && '使用全身追蹤，請確保該部位清晰可見'}
                {currentPart.mode === 'manual' && '自由模式：開啟相機後用手指/滑鼠拖曳刺青到想要的位置'}
                {currentPart.mode === 'marker' && '列印錨點貼紙貼在皮膚上，對準框框，刺青即時跟著移動。轉動手部時刺青會跟著透視變形'}
              </p>
              {currentPart.mode === 'marker' && (
                <button
                  onClick={downloadMarker}
                  className="flex items-center gap-1.5 self-start text-[#c9a84c] hover:text-white border border-[#c9a84c]/40 hover:border-[#c9a84c] text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download size={12} /> 下載錨點圖案
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tattoo selector */}
        <div className="p-5 border-b border-[#2a2a2a]">
          <h3 className="font-semibold mb-1 flex items-center gap-2">
            <Hand size={16} className="text-[#c9a84c]" /> 選擇刺青圖案
          </h3>
          <p className="text-gray-500 text-xs">選擇後即時套用</p>
        </div>

        {tattoos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm p-8 text-center gap-3">
            <ShoppingBag size={32} className="text-gray-600" />
            <p>試衣間是空的</p>
            <p className="text-xs text-gray-600">請先至作品集將刺青加入試衣間</p>
            <a href="/gallery" className="text-[#c9a84c] hover:underline text-xs">前往作品集 →</a>
          </div>
        ) : (
          <div className="flex-1 p-4">
            <div className="grid grid-cols-2 gap-3">
              {tattoos.map(tattoo => (
                <button
                  key={tattoo.id}
                  onClick={() => setSelectedTattoo(tattoo)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                    selectedTattoo?.id === tattoo.id ? 'border-[#c9a84c]' : 'border-[#2a2a2a] hover:border-[#c9a84c]/40'
                  }`}
                >
                  <Image src={tattoo.image_url} alt={tattoo.title || '刺青'} fill className="object-cover" sizes="140px" />
                  {selectedTattoo?.id === tattoo.id && (
                    <div className="absolute inset-0 bg-[#c9a84c]/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-[#c9a84c] flex items-center justify-center">
                        <span className="text-black text-xs font-bold">✓</span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
