import Vector from "./math/Vector"

export default class Input {
    keys: Map<string, boolean>
    mouse: Map<number, boolean>
    cursor: Vector
    constructor() {
        this.keys = new Map()
        this.mouse = new Map()
        this.cursor = new Vector( 0, 0 )
        this.watchCursor()
        this.watchMouse()
        this.watchKeys()
    }
    watchKeys() {
        console.log( "starting key watch" )
        window.addEventListener( "keydown", ( e ) => this.keys.set( e.key.toLowerCase(), true ) )
        window.addEventListener( "keyup", ( e ) => this.keys.set( e.key.toLowerCase(), false ) )
    }
    watchMouse() {
        console.log( "starting mouse watch" )
        window.addEventListener( "mousedown", ( e ) => this.mouse.set( e.button, true ) )
        window.addEventListener( "mouseup", ( e ) => this.mouse.set( e.button, false ) )
    }
    watchCursor() {
        console.log( "starting cursor watch" )
        window.addEventListener( "mousemove", ( e ) => this.cursor = new Vector( e.x, e.y ) )
    }
}