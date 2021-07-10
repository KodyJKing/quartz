import Input from "../Input"
import Matrix from "../math/Matrix"
import Vector from "../math/Vector"

export default class Camera {
    position: Vector
    zoom: number
    rotation: number
    constructor() {
        this.position = new Vector( 0, 0 )
        this.zoom = 1
        this.rotation = 0
    }
    worldToCamera( screenWidth: number, screenHeight: number ) {
        let { x, y } = this.position
        let { zoom, rotation } = this
        return Matrix.transformation(
            -x, -y,
            -rotation,
            zoom, zoom,
            screenWidth / 2, screenHeight / 2
        )
    }
    cameraToWorld( screenWidth: number, screenHeight: number ) {
        let { x, y } = this.position
        let { zoom, rotation } = this
        let invZoom = 1 / zoom
        return Matrix.transformation(
            -screenWidth / 2, -screenHeight / 2,
            rotation,
            invZoom, invZoom,
            x, y
        )
    }
    worldPosition( screenWidth: number, screenHeight: number, screenPosition: Vector ) {
        return this.cameraToWorld( screenWidth, screenHeight ).multiplyVec( screenPosition )
    }
    moveRight( amount ) {
        this.position = this.position.add( Vector.polar( this.rotation, amount ) )
    }
    moveDown( amount ) {
        this.position = this.position.add( Vector.polar( this.rotation + Math.PI / 2, amount ) )
    }

    updateFromInput( input: Input, speed = 20, zoomRate = 1.05 ) {
        speed /= this.zoom
        if ( input.keys.get( "d" ) )
            this.moveRight( speed )
        if ( input.keys.get( "a" ) )
            this.moveRight( -speed )
        if ( input.keys.get( "s" ) )
            this.moveDown( speed )
        if ( input.keys.get( "w" ) )
            this.moveDown( -speed )
        if ( input.keys.get( "e" ) )
            this.zoom *= zoomRate
        if ( input.keys.get( "q" ) )
            this.zoom *= 1 / zoomRate
    }
}