import { Camera, MathUtils, Matrix4, MOUSE, Object3D, OrthographicCamera, PerspectiveCamera, Plane, Quaternion, Ray, Spherical, TOUCH, Vector2, Vector3 } from 'three'

/**
 * Forked and transpiled from three.js version 181
 * See https://github.com/mrdoob/three.js/blob/r181/examples/jsm/controls/OrbitControls.js
 */

// Events used by the controls
const _changeEvent = { type: 'change' }
const _startEvent = { type: 'start' }
const _endEvent = { type: 'end' }

const _ray = new Ray()
const _plane = new Plane()
const _TILT_LIMIT = Math.cos(70 * MathUtils.DEG2RAD)

const _v = new Vector3()
const _twoPI = 2 * Math.PI

function isPerspectiveCamera(obj: any): obj is PerspectiveCamera {
    return !!obj && !!(obj as PerspectiveCamera).isPerspectiveCamera
}

function isOrthographicCamera(obj: any): obj is OrthographicCamera {
    return !!obj && !!(obj as OrthographicCamera).isOrthographicCamera
}

const _STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_PAN: 4,
    TOUCH_DOLLY_PAN: 5,
    TOUCH_DOLLY_ROTATE: 6,
}
const _EPS = 0.000001

export class OrbitControls {
    domElement: HTMLElement | null
    object: Object3D & { zoom?: number, updateProjectionMatrix?: () => void }
    enabled: boolean = true

    // Event API (three's EventDispatcher shape)
    addEventListener(_type: string, _listener: (...args: any[]) => void): void {
    }

    removeEventListener(_type: string, _listener: (...args: any[]) => void): void {
    }

    dispatchEvent(_event: any): void {
    }

    state: number
    target: Vector3
    cursor: Vector3
    minDistance: number
    maxDistance: number
    minZoom: number
    maxZoom: number
    minTargetRadius: number
    maxTargetRadius: number
    minPolarAngle: number
    maxPolarAngle: number
    minAzimuthAngle: number
    maxAzimuthAngle: number
    enableDamping: boolean
    dampingFactor: number
    enableZoom: boolean
    zoomSpeed: number
    enableRotate: boolean
    rotateSpeed: number
    keyRotateSpeed: number
    enablePan: boolean
    panSpeed: number
    screenSpacePanning: boolean
    keyPanSpeed: number
    zoomToCursor: boolean
    autoRotate: boolean
    autoRotateSpeed: number
    keys: any
    mouseButtons: any
    touches: any

    target0: Vector3
    position0: Vector3
    zoom0: number

    _domElementKeyEvents: HTMLElement | Window | null

    _lastPosition: Vector3
    _lastQuaternion: Quaternion
    _lastTargetPosition: Vector3
    _quat: Quaternion
    _quatInverse: Quaternion

    _spherical: Spherical
    _sphericalDelta: Spherical
    _scale: number
    _panOffset: Vector3

    _rotateStart: Vector2
    _rotateEnd: Vector2
    _rotateDelta: Vector2

    _panStart: Vector2
    _panEnd: Vector2
    _panDelta: Vector2

    _dollyStart: Vector2
    _dollyEnd: Vector2
    _dollyDelta: Vector2

    _dollyDirection: Vector3
    _mouse: Vector2
    _performCursorZoom: boolean

    _pointers: number[]
    _pointerPositions: Record<number, Vector2>

    _controlActive: boolean

    // bound handlers
    _onPointerMove: (e: any) => void
    _onPointerDown: (e: any) => void
    _onPointerUp: (e: any) => void
    _onContextMenu: (e: any) => void
    _onMouseWheel: (e: any) => void
    _onKeyDown: (e: any) => void
    _onMouseUp: (e: any) => void

    _onTouchStart: (e: any) => void
    _onTouchMove: (e: any) => void
    _onMouseDown: (e: any) => void
    _onMouseMove: (e: any) => void
    _interceptControlDown: (e: any) => void
    _interceptControlUp: (e: any) => void

    constructor(object: Object3D, domElement: HTMLElement | null = null) {
        this.object = object
        this.domElement = domElement
        this.enabled = true
        this.state = _STATE.NONE
        this.target = new Vector3()
        this.cursor = new Vector3()

        this.minDistance = 0
        this.maxDistance = Infinity
        this.minZoom = 0
        this.maxZoom = Infinity
        this.minTargetRadius = 0
        this.maxTargetRadius = Infinity

        this.minPolarAngle = 0
        this.maxPolarAngle = Math.PI

        this.minAzimuthAngle = -Infinity
        this.maxAzimuthAngle = Infinity

        this.enableDamping = false
        this.dampingFactor = 0.05

        this.enableZoom = true
        this.zoomSpeed = 1.0

        this.enableRotate = true
        this.rotateSpeed = 1.0
        this.keyRotateSpeed = 1.0

        this.enablePan = true
        this.panSpeed = 1.0

        this.screenSpacePanning = true

        this.keyPanSpeed = 7.0

        this.zoomToCursor = false

        this.autoRotate = false
        this.autoRotateSpeed = 2.0

        this.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' }
        this.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }
        this.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }

        this.target0 = this.target.clone()
        this.position0 = this.object.position.clone()
        this.zoom0 = this.object.zoom ?? 1

        this._domElementKeyEvents = null

        this._lastPosition = new Vector3()
        this._lastQuaternion = new Quaternion()
        this._lastTargetPosition = new Vector3()

        this._quat = new Quaternion().setFromUnitVectors(this.object.up, new Vector3(0, 1, 0))
        this._quatInverse = this._quat.clone().invert()

        this._spherical = new Spherical()
        this._sphericalDelta = new Spherical()

        this._scale = 1
        this._panOffset = new Vector3()

        this._rotateStart = new Vector2()
        this._rotateEnd = new Vector2()
        this._rotateDelta = new Vector2()

        this._panStart = new Vector2()
        this._panEnd = new Vector2()
        this._panDelta = new Vector2()

        this._dollyStart = new Vector2()
        this._dollyEnd = new Vector2()
        this._dollyDelta = new Vector2()

        this._dollyDirection = new Vector3()
        this._mouse = new Vector2()
        this._performCursorZoom = false

        this._pointers = []
        this._pointerPositions = {}

        this._controlActive = false

        this._onPointerMove = onPointerMove.bind(this)
        this._onPointerDown = onPointerDown.bind(this)
        this._onPointerUp = onPointerUp.bind(this)
        this._onContextMenu = onContextMenu.bind(this)
        this._onMouseWheel = onMouseWheel.bind(this)
        this._onKeyDown = onKeyDown.bind(this)
        this._onMouseUp = onMouseUp.bind(this)

        this._onTouchStart = onTouchStart.bind(this)
        this._onTouchMove = onTouchMove.bind(this)

        this._onMouseDown = onMouseDown.bind(this)
        this._onMouseMove = onMouseMove.bind(this)

        this._interceptControlDown = interceptControlDown.bind(this)
        this._interceptControlUp = interceptControlUp.bind(this)

        if (this.domElement !== null) {
            this.connect(this.domElement)
        }

        this.update()
    }

    connect(element: HTMLElement) {
        if (!element) {
            console.warn('Controls: connect() now requires an element.')
            return
        }

        if (this.domElement !== null) this.disconnect()

        this.domElement = element

        this.domElement.addEventListener('pointerdown', this._onPointerDown)
        this.domElement.addEventListener('pointercancel', this._onPointerUp)

        this.domElement.addEventListener('contextmenu', this._onContextMenu)
        this.domElement.addEventListener('wheel', this._onMouseWheel, { passive: false })

        const document = this.domElement.getRootNode()
        document.addEventListener('keydown', this._interceptControlDown, { passive: true, capture: true })

        this.domElement.style.touchAction = 'none'
    }

    disconnect() {
        if (!this.domElement) return

        this.domElement.removeEventListener('pointerdown', this._onPointerDown)
        this.domElement.removeEventListener('pointermove', this._onPointerMove)
        this.domElement.removeEventListener('pointerup', this._onPointerUp)
        this.domElement.removeEventListener('pointercancel', this._onPointerUp)

        this.domElement.removeEventListener('wheel', this._onMouseWheel)
        this.domElement.removeEventListener('contextmenu', this._onContextMenu)

        this.stopListenToKeyEvents()

        const document = this.domElement.getRootNode()
        document.removeEventListener('keydown', this._interceptControlDown, { capture: true })

        this.domElement.style.touchAction = 'auto'
    }

    dispose() {
        this.disconnect()
    }

    getPolarAngle(): number {
        return this._spherical.phi
    }

    getAzimuthalAngle(): number {
        return this._spherical.theta
    }

    getDistance(): number {
        return this.object.position.distanceTo(this.target)
    }

    listenToKeyEvents(domElement: HTMLElement | Window) {
        domElement.addEventListener('keydown', this._onKeyDown)
        this._domElementKeyEvents = domElement
    }

    stopListenToKeyEvents() {
        if (this._domElementKeyEvents !== null) {
            this._domElementKeyEvents.removeEventListener('keydown', this._onKeyDown)
            this._domElementKeyEvents = null
        }
    }

    saveState() {
        this.target0.copy(this.target)
        this.position0.copy(this.object.position)
        this.zoom0 = this.object.zoom ?? 0
    }

    reset() {
        this.target.copy(this.target0)
        this.object.position.copy(this.position0)
        this.object.zoom = this.zoom0

        this.object.updateProjectionMatrix?.()
        this.dispatchEvent(_changeEvent)

        this.update()

        this.state = _STATE.NONE
    }

    update(deltaTime: number | null = null): boolean {
        const position = this.object.position

        _v.copy(position).sub(this.target)

        _v.applyQuaternion(this._quat)

        this._spherical.setFromVector3(_v)

        if (this.autoRotate && this.state === _STATE.NONE) {
            this._rotateLeft(this._getAutoRotationAngle(deltaTime))
        }

        if (this.enableDamping) {
            this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor
            this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor
        } else {
            this._spherical.theta += this._sphericalDelta.theta
            this._spherical.phi += this._sphericalDelta.phi
        }

        let min = this.minAzimuthAngle
        let max = this.maxAzimuthAngle

        if (min < -Math.PI) {
            min += _twoPI
        } else if (min > Math.PI) {
            min -= _twoPI
        }
        if (max < -Math.PI) {
            max += _twoPI
        } else if (max > Math.PI) {
            max -= _twoPI
        }

        if (min <= max) {
            this._spherical.theta = Math.max(min, Math.min(max, this._spherical.theta))
        } else {
            this._spherical.theta = (this._spherical.theta > (min + max) / 2) ? Math.max(min, this._spherical.theta) : Math.min(max, this._spherical.theta)
        }

        this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi))

        this._spherical.makeSafe()

        if (this.enableDamping) {
            this.target.addScaledVector(this._panOffset, this.dampingFactor)
        } else {
            this.target.add(this._panOffset)
        }

        this.target.sub(this.cursor)
        this.target.clampLength(this.minTargetRadius, this.maxTargetRadius)
        this.target.add(this.cursor)

        let zoomChanged = false
        if (this.zoomToCursor && this._performCursorZoom || isOrthographicCamera(this.object)) {
            this._spherical.radius = this._clampDistance(this._spherical.radius)
        } else {
            const prevRadius = this._spherical.radius
            this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale)
            zoomChanged = prevRadius != this._spherical.radius
        }

        _v.setFromSpherical(this._spherical)
        _v.applyQuaternion(this._quatInverse)

        this.object.position.copy(this.target).add(_v)

        this.object.lookAt(this.target)

        if (this.enableDamping) {
            this._sphericalDelta.theta *= (1 - this.dampingFactor)
            this._sphericalDelta.phi *= (1 - this.dampingFactor)
            this._panOffset.multiplyScalar(1 - this.dampingFactor)
        } else {
            this._sphericalDelta.set(0, 0, 0)
            this._panOffset.set(0, 0, 0)
        }

        if (this.zoomToCursor && this._performCursorZoom) {
            let newRadius: number | null = null
            if (isPerspectiveCamera(this.object)) {
                const prevRadius = _v.length()
                newRadius = this._clampDistance(prevRadius * this._scale)

                const radiusDelta = prevRadius - newRadius
                this.object.position.addScaledVector(this._dollyDirection, radiusDelta)
                this.object.updateMatrixWorld?.()

                zoomChanged = !!radiusDelta
            } else if (isOrthographicCamera(this.object)) {
                const mouseBefore = new Vector3(this._mouse.x, this._mouse.y, 0)
                mouseBefore.unproject(this.object as unknown as Camera)

                const prevZoom = this.object.zoom
                this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale))
                this.object.updateProjectionMatrix?.()

                zoomChanged = prevZoom !== this.object.zoom

                const mouseAfter = new Vector3(this._mouse.x, this._mouse.y, 0)
                mouseAfter.unproject(this.object as unknown as Camera)

                this.object.position.sub(mouseAfter).add(mouseBefore)
                this.object.updateMatrixWorld?.()

                newRadius = _v.length()
            } else {
                console.warn('WARNING: OrbitControls encountered an unknown camera type - zoom to cursor disabled.')
                this.zoomToCursor = false
            }

            if (newRadius !== null) {
                if (this.screenSpacePanning) {
                    this.target.set(0, 0, -1)
                        .transformDirection(this.object.matrix)
                        .multiplyScalar(newRadius)
                        .add(this.object.position)
                } else {
                    _ray.origin.copy(this.object.position)
                    _ray.direction.set(0, 0, -1).transformDirection(this.object.matrix)

                    if (Math.abs(this.object.up.dot(_ray.direction)) < _TILT_LIMIT) {
                        this.object.lookAt(this.target)
                    } else {
                        _plane.setFromNormalAndCoplanarPoint(this.object.up, this.target)
                        _ray.intersectPlane(_plane, this.target)
                    }
                }
            }
        } else if (isOrthographicCamera(this.object)) {
            const prevZoom = this.object.zoom
            this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale))

            if (prevZoom !== this.object.zoom) {
                this.object.updateProjectionMatrix?.()
                zoomChanged = true
            }
        }

        this._scale = 1
        this._performCursorZoom = false

        if (zoomChanged || this._lastPosition.distanceToSquared(this.object.position) > _EPS || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > _EPS || this._lastTargetPosition.distanceToSquared(this.target) > _EPS) {
            this.dispatchEvent(_changeEvent)
            this._lastPosition.copy(this.object.position)
            this._lastQuaternion.copy(this.object.quaternion)
            this._lastTargetPosition.copy(this.target)
            return true
        }

        return false
    }

    _getAutoRotationAngle(deltaTime: number | null) {
        if (deltaTime !== null) {
            return (_twoPI / 60 * this.autoRotateSpeed) * deltaTime
        } else {
            return _twoPI / 60 / 60 * this.autoRotateSpeed
        }
    }

    _getZoomScale(delta: number) {
        const normalizedDelta = Math.abs(delta * 0.01)
        return Math.pow(0.95, this.zoomSpeed * normalizedDelta)
    }

    _rotateLeft(angle: number) {
        this._sphericalDelta.theta -= angle
    }

    _rotateUp(angle: number) {
        this._sphericalDelta.phi -= angle
    }

    _panLeft(distance: number, objectMatrix: Matrix4) {
        _v.setFromMatrixColumn(objectMatrix, 0)
        _v.multiplyScalar(-distance)
        this._panOffset.add(_v)
    }

    _panUp(distance: number, objectMatrix: Matrix4) {
        if (this.screenSpacePanning) {
            _v.setFromMatrixColumn(objectMatrix, 1)
        } else {
            _v.setFromMatrixColumn(objectMatrix, 0)
            _v.crossVectors(this.object.up, _v)
        }
        _v.multiplyScalar(distance)
        this._panOffset.add(_v)
    }

    _pan(deltaX: number, deltaY: number) {
        if (!this.domElement) return
        if (isPerspectiveCamera(this.object)) {
            const position = this.object.position
            _v.copy(position).sub(this.target)
            let targetDistance = _v.length()
            targetDistance *= Math.tan((this.object.fov / 2) * Math.PI / 180.0)
            this._panLeft(2 * deltaX * targetDistance / this.domElement.clientHeight, this.object.matrix)
            this._panUp(2 * deltaY * targetDistance / this.domElement.clientHeight, this.object.matrix)
        } else if (isOrthographicCamera(this.object)) {
            this._panLeft(deltaX * ((this.object.right - this.object.left) / this.object.zoom / this.domElement.clientWidth), this.object.matrix)
            this._panUp(deltaY * ((this.object.top - this.object.bottom) / this.object.zoom / this.domElement.clientHeight), this.object.matrix)
        } else {
            console.warn('WARNING: OrbitControls encountered an unknown camera type - pan disabled.')
            this.enablePan = false
        }
    }

    _dollyOut(dollyScale: number) {
        if (isPerspectiveCamera(this.object) || isOrthographicCamera(this.object)) {
            this._scale /= dollyScale
        } else {
            console.warn('WARNING: OrbitControls encountered an unknown camera type - dolly/zoom disabled.')
            this.enableZoom = false
        }
    }

    _dollyIn(dollyScale: number) {
        if (isPerspectiveCamera(this.object) || isOrthographicCamera(this.object)) {
            this._scale *= dollyScale
        } else {
            console.warn('WARNING: OrbitControls encountered an unknown camera type - dolly/zoom disabled.')
            this.enableZoom = false
        }
    }

    _updateZoomParameters(x: number, y: number) {
        if (!this.zoomToCursor) return
        this._performCursorZoom = true
        if (!this.domElement) return
        const rect = this.domElement.getBoundingClientRect()
        const dx = x - rect.left
        const dy = y - rect.top
        const w = rect.width
        const h = rect.height
        this._mouse.x = (dx / w) * 2 - 1
        this._mouse.y = -(dy / h) * 2 + 1
        this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object as unknown as Camera).sub(this.object.position).normalize()
    }

    _clampDistance(dist: number) {
        return Math.max(this.minDistance, Math.min(this.maxDistance, dist))
    }

    _handleMouseDownRotate(event: any) {
        this._rotateStart.set(event.clientX, event.clientY)
    }

    _handleMouseDownDolly(event: any) {
        this._updateZoomParameters(event.clientX, event.clientY)
        this._dollyStart.set(event.clientX, event.clientY)
    }

    _handleMouseDownPan(event: any) {
        this._panStart.set(event.clientX, event.clientY)
    }

    _handleMouseMoveRotate(event: any) {
        this._rotateEnd.set(event.clientX, event.clientY)
        this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed)
        if (!this.domElement) return
        this._rotateLeft(_twoPI * this._rotateDelta.x / this.domElement.clientHeight)
        this._rotateUp(_twoPI * this._rotateDelta.y / this.domElement.clientHeight)
        this._rotateStart.copy(this._rotateEnd)
        this.update()
    }

    _handleMouseMoveDolly(event: any) {
        this._dollyEnd.set(event.clientX, event.clientY)
        this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart)
        if (this._dollyDelta.y > 0) this._dollyOut(this._getZoomScale(this._dollyDelta.y))
        else if (this._dollyDelta.y < 0) this._dollyIn(this._getZoomScale(this._dollyDelta.y))
        this._dollyStart.copy(this._dollyEnd)
        this.update()
    }

    _handleMouseMovePan(event: any) {
        this._panEnd.set(event.clientX, event.clientY)
        this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed)
        this._pan(this._panDelta.x, this._panDelta.y)
        this._panStart.copy(this._panEnd)
        this.update()
    }

    _handleMouseWheel(event: any) {
        this._updateZoomParameters(event.clientX, event.clientY)
        if (event.deltaY < 0) this._dollyIn(this._getZoomScale(event.deltaY))
        else if (event.deltaY > 0) this._dollyOut(this._getZoomScale(event.deltaY))
        this.update()
    }

    _handleKeyDown(event: any) {
        let needsUpdate = false
        switch (event.code) {
            case this.keys.UP:
                if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    if (this.enableRotate) {
                        const ch = this.domElement?.clientHeight || 1
                        this._rotateUp(_twoPI * this.keyRotateSpeed / ch)
                    }
                } else {
                    if (this.enablePan) this._pan(0, this.keyPanSpeed)
                }
                needsUpdate = true
                break
            case this.keys.BOTTOM:
                if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    if (this.enableRotate) {
                        const ch = this.domElement?.clientHeight || 1
                        this._rotateUp(-_twoPI * this.keyRotateSpeed / ch)
                    }
                } else {
                    if (this.enablePan) this._pan(0, -this.keyPanSpeed)
                }
                needsUpdate = true
                break
            case this.keys.LEFT:
                if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    if (this.enableRotate) {
                        const ch = this.domElement?.clientHeight || 1
                        this._rotateLeft(_twoPI * this.keyRotateSpeed / ch)
                    }
                } else {
                    if (this.enablePan) this._pan(this.keyPanSpeed, 0)
                }
                needsUpdate = true
                break
            case this.keys.RIGHT:
                if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    if (this.enableRotate) {
                        const ch = this.domElement?.clientHeight || 1
                        this._rotateLeft(-_twoPI * this.keyRotateSpeed / ch)
                    }
                } else {
                    if (this.enablePan) this._pan(-this.keyPanSpeed, 0)
                }
                needsUpdate = true
                break
        }
        if (needsUpdate) {
            event.preventDefault()
            this.update()
        }
    }

    _handleTouchStartRotate(event: any) {
        if (this._pointers.length === 1) this._rotateStart.set(event.pageX, event.pageY)
        else {
            const position = this._getSecondPointerPosition(event)
            const x = 0.5 * (event.pageX + position.x)
            const y = 0.5 * (event.pageY + position.y)
            this._rotateStart.set(x, y)
        }
    }

    _handleTouchStartPan(event: any) {
        if (this._pointers.length === 1) this._panStart.set(event.pageX, event.pageY)
        else {
            const position = this._getSecondPointerPosition(event)
            const x = 0.5 * (event.pageX + position.x)
            const y = 0.5 * (event.pageY + position.y)
            this._panStart.set(x, y)
        }
    }

    _handleTouchStartDolly(event: any) {
        const position = this._getSecondPointerPosition(event)
        const dx = event.pageX - position.x
        const dy = event.pageY - position.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        this._dollyStart.set(0, distance)
    }

    _handleTouchStartDollyPan(event: any) {
        if (this.enableZoom) this._handleTouchStartDolly(event)
        if (this.enablePan) this._handleTouchStartPan(event)
    }

    _handleTouchStartDollyRotate(event: any) {
        if (this.enableZoom) this._handleTouchStartDolly(event)
        if (this.enableRotate) this._handleTouchStartRotate(event)
    }

    _handleTouchMoveRotate(event: any) {
        if (this._pointers.length == 1) this._rotateEnd.set(event.pageX, event.pageY)
        else {
            const position = this._getSecondPointerPosition(event)
            const x = 0.5 * (event.pageX + position.x)
            const y = 0.5 * (event.pageY + position.y)
            this._rotateEnd.set(x, y)
        }
        this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed)
        if (!this.domElement) return
        this._rotateLeft(_twoPI * this._rotateDelta.x / this.domElement.clientHeight)
        this._rotateUp(_twoPI * this._rotateDelta.y / this.domElement.clientHeight)
        this._rotateStart.copy(this._rotateEnd)
    }

    _handleTouchMovePan(event: any) {
        if (this._pointers.length === 1) this._panEnd.set(event.pageX, event.pageY)
        else {
            const position = this._getSecondPointerPosition(event)
            const x = 0.5 * (event.pageX + position.x)
            const y = 0.5 * (event.pageY + position.y)
            this._panEnd.set(x, y)
        }
        this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed)
        this._pan(this._panDelta.x, this._panDelta.y)
        this._panStart.copy(this._panEnd)
    }

    _handleTouchMoveDolly(event: any) {
        const position = this._getSecondPointerPosition(event)
        const dx = event.pageX - position.x
        const dy = event.pageY - position.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        this._dollyEnd.set(0, distance)
        this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed))
        this._dollyOut(this._dollyDelta.y)
        this._dollyStart.copy(this._dollyEnd)
        const centerX = (event.pageX + position.x) * 0.5
        const centerY = (event.pageY + position.y) * 0.5
        this._updateZoomParameters(centerX, centerY)
    }

    _handleTouchMoveDollyPan(event: any) {
        if (this.enableZoom) this._handleTouchMoveDolly(event)
        if (this.enablePan) this._handleTouchMovePan(event)
    }

    _handleTouchMoveDollyRotate(event: any) {
        if (this.enableZoom) this._handleTouchMoveDolly(event)
        if (this.enableRotate) this._handleTouchMoveRotate(event)
    }

    _addPointer(event: any) {
        this._pointers.push(event.pointerId)
    }

    _removePointer(event: any) {
        delete this._pointerPositions[event.pointerId]
        for (let i = 0; i < this._pointers.length; i++) {
            if (this._pointers[i] == event.pointerId) {
                this._pointers.splice(i, 1)
                return
            }
        }
    }

    _isTrackingPointer(event: any) {
        for (let i = 0; i < this._pointers.length; i++) if (this._pointers[i] == event.pointerId) return true
        return false
    }

    _trackPointer(event: any) {
        let position = this._pointerPositions[event.pointerId]
        if (position === undefined) {
            position = new Vector2()
            this._pointerPositions[event.pointerId] = position
        }
        position.set(event.pageX, event.pageY)
    }

    _getSecondPointerPosition(event: any) {
        const pointerId = (event.pointerId === this._pointers[0]) ? this._pointers[1] : this._pointers[0]
        return this._pointerPositions[pointerId]
    }

    _customWheelEvent(event: any) {
        const mode = event.deltaMode
        const newEvent: any = { clientX: event.clientX, clientY: event.clientY, deltaY: event.deltaY }
        switch (mode) {
            case 1:
                newEvent.deltaY *= 16
                break
            case 2:
                newEvent.deltaY *= 100
                break
        }
        if (event.ctrlKey && !this._controlActive) newEvent.deltaY *= 10
        return newEvent
    }
}

// --- Free functions using `this` bound to the OrbitControls instance ---
function onPointerDown(this: any, event: any) {
    if (this.enabled === false) return
    if (!this.domElement) return
    if (this._pointers.length === 0) {
        this.domElement.setPointerCapture(event.pointerId)
        this.domElement.addEventListener('pointermove', this._onPointerMove)
        this.domElement.addEventListener('pointerup', this._onPointerUp)
    }
    if (this._isTrackingPointer(event)) return
    this._addPointer(event)
    if (event.pointerType === 'touch') {
        this._onTouchStart(event)
    } else {
        this._onMouseDown(event)
    }
}

function onPointerMove(this: any, event: any) {
    if (this.enabled === false) return
    if (event.pointerType === 'touch') {
        this._onTouchMove(event)
    } else {
        this._onMouseMove(event)
    }
}

function onPointerUp(this: any, event: any) {
    this._removePointer(event)
    switch (this._pointers.length) {
        case 0:
            this.domElement.releasePointerCapture(event.pointerId)
            this.domElement.removeEventListener('pointermove', this._onPointerMove)
            this.domElement.removeEventListener('pointerup', this._onPointerUp)
            this.dispatchEvent(_endEvent)
            this.state = _STATE.NONE
            break
        case 1:
            const pointerId = this._pointers[0]
            const position = this._pointerPositions[pointerId]
            this._onTouchStart({ pointerId: pointerId, pageX: position.x, pageY: position.y })
            break
    }
}

function onMouseDown(this: any, event: any) {
    let mouseAction
    switch (event.button) {
        case 0:
            mouseAction = this.mouseButtons.LEFT
            break
        case 1:
            mouseAction = this.mouseButtons.MIDDLE
            break
        case 2:
            mouseAction = this.mouseButtons.RIGHT
            break
        default:
            mouseAction = -1
    }
    switch (mouseAction) {
        case MOUSE.DOLLY:
            if (this.enableZoom === false) return
            this._handleMouseDownDolly(event)
            this.state = _STATE.DOLLY
            break
        case MOUSE.ROTATE:
            if (event.ctrlKey || event.metaKey || event.shiftKey) {
                if (this.enablePan === false) return
                this._handleMouseDownPan(event)
                this.state = _STATE.PAN
            } else {
                if (this.enableRotate === false) return
                this._handleMouseDownRotate(event)
                this.state = _STATE.ROTATE
            }
            break
        case MOUSE.PAN:
            if (event.ctrlKey || event.metaKey || event.shiftKey) {
                if (this.enableRotate === false) return
                this._handleMouseDownRotate(event)
                this.state = _STATE.ROTATE
            } else {
                if (this.enablePan === false) return
                this._handleMouseDownPan(event)
                this.state = _STATE.PAN
            }
            break
        default:
            this.state = _STATE.NONE
    }
    if (this.state !== _STATE.NONE) this.dispatchEvent(_startEvent)
}

function onMouseMove(this: any, event: any) {
    switch (this.state) {
        case _STATE.ROTATE:
            if (this.enableRotate === false) return
            this._handleMouseMoveRotate(event)
            break
        case _STATE.DOLLY:
            if (this.enableZoom === false) return
            this._handleMouseMoveDolly(event)
            break
        case _STATE.PAN:
            if (this.enablePan === false) return
            this._handleMouseMovePan(event)
            break
    }
}

function onMouseWheel(this: any, event: any) {
    if (this.enabled === false || this.enableZoom === false || this.state !== _STATE.NONE) return
    event.preventDefault()
    this.dispatchEvent(_startEvent)
    this._handleMouseWheel(this._customWheelEvent(event))
    this.dispatchEvent(_endEvent)
}

function onKeyDown(this: any, event: any) {
    if (this.enabled === false) return
    this._handleKeyDown(event)
}

function onMouseUp(this: any, _event: any) {
    // End any mouse-driven interaction and dispatch end event if appropriate
    switch (this.state) {
        case _STATE.ROTATE:
        case _STATE.DOLLY:
        case _STATE.PAN:
            this.dispatchEvent(_endEvent)
            this.state = _STATE.NONE
            break
    }
}

function onTouchStart(this: any, event: any) {
    this._trackPointer(event)
    switch (this._pointers.length) {
        case 1:
            switch (this.touches.ONE) {
                case TOUCH.ROTATE:
                    if (this.enableRotate === false) return
                    this._handleTouchStartRotate(event)
                    this.state = _STATE.TOUCH_ROTATE
                    break
                case TOUCH.PAN:
                    if (this.enablePan === false) return
                    this._handleTouchStartPan(event)
                    this.state = _STATE.TOUCH_PAN
                    break
                default:
                    this.state = _STATE.NONE
            }
            break
        case 2:
            switch (this.touches.TWO) {
                case TOUCH.DOLLY_PAN:
                    if (this.enableZoom === false && this.enablePan === false) return
                    this._handleTouchStartDollyPan(event)
                    this.state = _STATE.TOUCH_DOLLY_PAN
                    break
                case TOUCH.DOLLY_ROTATE:
                    if (this.enableZoom === false && this.enableRotate === false) return
                    this._handleTouchStartDollyRotate(event)
                    this.state = _STATE.TOUCH_DOLLY_ROTATE
                    break
                default:
                    this.state = _STATE.NONE
            }
            break
        default:
            this.state = _STATE.NONE
    }
    if (this.state !== _STATE.NONE) this.dispatchEvent(_startEvent)
}

function onTouchMove(this: any, event: any) {
    this._trackPointer(event)
    switch (this.state) {
        case _STATE.TOUCH_ROTATE:
            if (this.enableRotate === false) return
            this._handleTouchMoveRotate(event)
            this.update()
            break
        case _STATE.TOUCH_PAN:
            if (this.enablePan === false) return
            this._handleTouchMovePan(event)
            this.update()
            break
        case _STATE.TOUCH_DOLLY_PAN:
            if (this.enableZoom === false && this.enablePan === false) return
            this._handleTouchMoveDollyPan(event)
            this.update()
            break
        case _STATE.TOUCH_DOLLY_ROTATE:
            if (this.enableZoom === false && this.enableRotate === false) return
            this._handleTouchMoveDollyRotate(event)
            this.update()
            break
        default:
            this.state = _STATE.NONE
    }
}

function onContextMenu(this: any, event: any) {
    if (this.enabled === false) return
    event.preventDefault()
}

function interceptControlDown(this: any, event: any) {
    if (event.key === 'Control') {
        this._controlActive = true
        const document = this.domElement.getRootNode()
        document.addEventListener('keyup', this._interceptControlUp, { passive: true, capture: true })
    }
}

function interceptControlUp(this: any, event: any) {
    if (event.key === 'Control') {
        this._controlActive = false
        const document = this.domElement.getRootNode()
        document.removeEventListener('keyup', this._interceptControlUp, { passive: true, capture: true })
    }
}
