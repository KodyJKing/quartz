export default class Clock {
    lastFrame: number
    constructor() {
        this.lastFrame = performance.now()
    }
    getDt() {
        let now = performance.now()
        let dt = now - this.lastFrame
        this.lastFrame = now
        return dt
    }
}