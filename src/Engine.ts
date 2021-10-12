import CircleCollider from "./collision/CircleCollider"
import { getCollisionPairs, Pair } from "./collision/Collision"
import PolygonCollider from "./collision/PolygonCollider"
import Body from "./dynamics/Body"
import solvePositions from "./dynamics/solvePositions"
import solveVelocities from "./dynamics/solveVelocities"
import Drawing from "./graphics/Drawing"
import Vector from "./math/Vector"

type EngineOptions = {
    timeStep: number
    gravity: number
    linearAirDrag: number
    rotationalAirDrag: number
    linearMotionThreshold: number
    angularMotionThreshold: number
    velocitySolverOptions: {
        iterations: number
        minBounceVelocity: number
        friction: number
        staticFriction: number
        restitution: number
    }
    positionalSolverOptions: {
        iterations: number
        positionalDamping: number
        allowedPenetration: number
    }
    broadphaseCellSize: number
}
export default class Engine {
    bodies: Body[]
    pairs: Pair[]
    options: EngineOptions
    constructor( options: EngineOptions ) {
        this.bodies = []
        this.pairs = []
        this.options = options
    }
    fixedUpdate() {
        let {
            timeStep, linearMotionThreshold, angularMotionThreshold,
            gravity, rotationalAirDrag, linearAirDrag, broadphaseCellSize,
            velocitySolverOptions, positionalSolverOptions

        } = this.options
        let { bodies } = this
        for ( let body of bodies ) {
            body.updatePosition( timeStep, linearMotionThreshold, angularMotionThreshold )
            body.updateVelocity( timeStep, gravity, rotationalAirDrag, linearAirDrag )
        }
        this.pairs = getCollisionPairs( this.bodies, broadphaseCellSize )
        solveVelocities( this.pairs, velocitySolverOptions )
        solvePositions( this.pairs, positionalSolverOptions )
    }
    renderToCanvas( c: CanvasRenderingContext2D, options?: { drawOutlines?: boolean, drawPosition?: boolean, drawOrientation?: boolean, drawContacts?: boolean, drawPairEdges?: boolean } ) {
        options = options ?? {}
        Drawing.context = c
        c.lineWidth = 2
        c.lineCap = "round"
        c.lineJoin = "round"
        for ( let body of this.bodies ) {
            const marigin = this.options.positionalSolverOptions.allowedPenetration + c.lineWidth
            if ( body.collider instanceof PolygonCollider ) {
                Drawing.polygon( body.collider.vertices ).fill( body.color )
                if ( options.drawOutlines )
                    Drawing.polygon( body.collider.vertices, -marigin ).stroke( body.outlineColor )
            } else if ( body.collider instanceof CircleCollider ) {
                Drawing.vCircle( body.position, body.collider.radius ).fill( body.color )
                if ( options.drawOutlines )
                    Drawing.vCircle( body.position, body.collider.radius - marigin ).stroke( body.outlineColor )
            }

            let p = body.position
            if ( options.drawPosition )
                Drawing.vCircle( p, 3 ).fill( "white" )
            if ( options.drawOrientation )
                Drawing.vLine( p, p.add( Vector.polar( body.angle, 10 ) ) ).stroke( "white" )
        }

        if ( options.drawContacts || options.drawPairEdges ) {
            for ( let pair of this.pairs ) {
                if ( options.drawContacts ) {
                    let n = pair.info.normal.scale( 5 )
                    for ( let p of pair.info.contact ) {
                        Drawing.vCircle( p, 2 ).fill( "white" )
                        Drawing.vLine( p.subtract( n ), p.add( n ) ).stroke( "rgba(255, 255, 255, .5)" )
                    }
                }
                if ( options.drawPairEdges ) {
                    let { bodyA, bodyB } = pair
                    if ( bodyA.isStatic || bodyB.isStatic )
                        continue
                    let posA = bodyA.position, posB = bodyB.position
                    Drawing.vLine( posA, posB ).stroke( "white" )
                }
            }
        }
    }
    averagePenetration() {
        let pairs = this.pairs
        if ( pairs.length > 0 )
            return pairs.map( x => Math.max( 0, -x.info.separation ) ).reduce( ( a, b ) => a + b ) / pairs.length
        return 0
    }
}