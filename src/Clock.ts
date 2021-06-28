import { lerp } from "./math"

export default class Clock {
    lastFrame: number
    averageFPS: number
    constructor() {
        this.lastFrame = performance.now()
        this.averageFPS = 0
    }
    nextFrame() {
        let now = performance.now()
        let dt = now - this.lastFrame
        this.lastFrame = now

        let FPS = 1000 / dt
        this.averageFPS = lerp( this.averageFPS, FPS, 0.1 )

        return dt
    }
}