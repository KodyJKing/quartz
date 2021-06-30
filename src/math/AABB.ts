import { contains } from "./math"
import { Vector } from "./Vector"

export default class AABB {
    minx: number
    miny: number
    maxx: number
    maxy: number

    constructor(minx: number, miny: number, maxx: number, maxy: number) {
        this.minx = minx
        this.miny = miny
        this.maxx = maxx
        this.maxy = maxy
    }

    static fromDimensions(pos: Vector, dimensions: Vector) {
        return new AABB(pos.x, pos.y, pos.x + dimensions.x, pos.y + dimensions.y)
    }

    hull(a: AABB, b: AABB) {
        function min(x, y) { return Math.min(x, y) }
        function max(x, y) { return Math.max(x, y) }
        return new AABB(
            min(a.minx, b.minx),
            min(a.miny, b.miny),
            max(a.maxx, b.maxx),
            max(a.maxy, b.maxy)
        )
    }

    overlaps(other: AABB) {
        let a = this, b = other
        return a.minx <= b.maxx && a.maxx >= b.minx &&
            a.miny <= b.maxy && a.maxy >= b.miny
    }

    addPoint(p: Vector) {
        this.minx = Math.min(this.minx, p.x)
        this.miny = Math.min(this.miny, p.y)
        this.maxx = Math.max(this.maxx, p.x)
        this.maxy = Math.max(this.maxy, p.y)
    }

    addAABB(other: AABB) {
        let a = this, b = other
        a.minx = Math.min(a.minx, b.minx)
        a.miny = Math.min(a.miny, b.miny)
        a.maxx = Math.max(a.maxx, b.maxx)
        a.maxy = Math.max(a.maxy, b.maxy)
    }

    static empty() {
        return new AABB(Infinity, Infinity, -Infinity, -Infinity)
    }

    static polygonBounds(poly: Vector[]) {
        let result = AABB.empty()
        for (let p of poly)
            result.addPoint(p)
        return result
    }

    contains(p: Vector) {
        let { minx, miny, maxx, maxy } = this
        return p.x >= minx && p.x <= maxx && p.y >= miny && p.y <= maxy
    }
}
