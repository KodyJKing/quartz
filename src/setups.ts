import Body from "./Body"
import { Vector } from "./Vector"

const colorPalette = [ "#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51" ]
const staticCircleColor = "#d1ccb6"

export function setup1( canvas: HTMLCanvasElement, bodies: Body[] ) {
    for ( let i = 0; i < 1500; i++ ) {
        let pos = new Vector(
            Math.random() * canvas.width,
            Math.random() * canvas.height
        )
        let vel = new Vector(
            ( Math.random() - .5 ) * 1000,
            ( Math.random() - .5 ) * 1000
        )
        let radius = 12
        let color = colorPalette[ Math.random() * colorPalette.length | 0 ]
        let body = new Body( { pos, radius, vel, color } )
        bodies.push( body )
    }
    bodies.push( new Body( {
        pos: new Vector( canvas.width / 2, canvas.height / 2 ),
        radius: 100,
        color: staticCircleColor,
        isStatic: true
    } ) )
}

export function setup2( canvas: HTMLCanvasElement, bodies: Body[] ) {
    for ( let i = 0; i < 1500; i++ ) {
        let pos = new Vector(
            Math.random() * canvas.width,
            Math.random() * canvas.height
        )
        let vel = new Vector(
            ( Math.random() - .5 ) * 1000,
            ( Math.random() - .5 ) * 1000
        )
        // let radius = 12.5
        let radius = ( Math.random() * 10 + 20 ) * .5
        let color = colorPalette[ Math.random() * colorPalette.length | 0 ]
        let body = new Body( { pos, radius, vel, color } )
        bodies.push( body )
    }
    bodies.push( new Body( {
        pos: new Vector( canvas.width / 2, canvas.height / 4 ),
        radius: 100,
        color: staticCircleColor,
        isStatic: true
    } ) )
    bodies.push( new Body( {
        pos: new Vector( canvas.width / 2 + 200, canvas.height / 2 ),
        radius: 100,
        color: staticCircleColor,
        isStatic: true
    } ) )
    bodies.push( new Body( {
        pos: new Vector( canvas.width / 2 - 200, canvas.height / 2 ),
        radius: 100,
        color: staticCircleColor,
        isStatic: true
    } ) )
    bodies.push( new Body( {
        pos: new Vector( canvas.width, canvas.height ),
        radius: 100,
        color: staticCircleColor,
        isStatic: true
    } ) )
    bodies.push( new Body( {
        pos: new Vector( 0, canvas.height ),
        radius: 100,
        color: staticCircleColor,
        isStatic: true
    } ) )
}