import { Vector } from "./Vector";

export default class AABB {
    pos: Vector
    size: Vector
    constructor( pos: Vector, size: Vector ) {
        this.pos = pos
        this.size = size
    }
}