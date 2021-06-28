import Body from "./Body"
import Clock from "./Clock"
import { clamp } from "./math"
import { Vector } from "./Vector"

{
    let canvas = initCanvas()
    let c = canvas.getContext( "2d" ) as CanvasRenderingContext2D

    let clock = new Clock()

    let bodies: Body[] = []

    const positionalDamping = 0.25
    const positionalIterations = 15
    const velocityIterations = 10
    const restitution = 0.85
    const gravity = 1000

    const timeStep = 1 / 120

    const offscreenMargin = 60

    const cellSize = 80
    let gridWidth = Math.ceil( canvas.width / cellSize )
    let gridHeight = Math.ceil( canvas.height / cellSize )
    type GridCell = Body[]
    const grid: GridCell[] = []
    for ( let i = 0; i < gridWidth * gridHeight; i++ )
        grid.push( [] )


    for ( let i = 0; i < 1000; i++ ) {
        let pos = new Vector(
            Math.random() * canvas.width,
            Math.random() * canvas.height
        )
        let vel = new Vector(
            ( Math.random() - .5 ) * 1000,
            ( Math.random() - .5 ) * 1000
        )
        let radius = 12
        // let radius = ( Math.random() * 10 + 20 ) * .5
        // let radius = Math.random() < .5 ? 10 : 15
        let color = [ "#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51" ][ Math.random() * 5 | 0 ]
        let body = new Body( { pos, radius, vel, color } )
        bodies.push( body )
    }

    bodies.push( new Body( {
        pos: new Vector( canvas.width / 2, canvas.height * 2 / 3 ),
        radius: 80,
        color: "black",
        isStatic: true
    } ) )

    function initCanvas() {
        let canvas = document.getElementById( "mainCanvas" ) as HTMLCanvasElement
        updateCanvasResolution()
        window.addEventListener( "resize", ev => updateCanvasResolution() )
        function updateCanvasResolution() {
            let rect = canvas.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height
        }
        return canvas
    }

    mainLoop()
    function mainLoop() {
        render()
        update()
        window.setTimeout( mainLoop, timeStep )
    }

    function render() {
        c.fillStyle = "white"
        c.fillRect( 0, 0, canvas.width, canvas.height )

        for ( let body of bodies ) {
            let { x, y } = body.pos
            c.beginPath()
            c.arc( x, y, body.radius, 0, Math.PI * 2 )
            c.fillStyle = body.color
            c.fill()
        }

        let dt = clock.getDt() / 1000
        let fps = 1 / dt
        c.fillStyle = "red"
        c.font = "24px Impact"
        c.fillText( fps.toFixed( 2 ), 0 + 2, 20 + 2 )
    }

    function update() {
        for ( let body of bodies ) {
            if ( body.pos.x > canvas.width + offscreenMargin || body.pos.x < -offscreenMargin ) {
                body.vel.x = ( Math.random() - .5 ) * 1000
                body.vel.y = ( Math.random() - .25 ) * 1000
                body.pos.x = canvas.width / 2 + ( Math.random() - .5 ) * 200
                body.pos.y = canvas.height / 3 + ( Math.random() - .5 ) * 200
            }
            if ( !body.isStatic ) {
                let { pos, vel } = body
                vel.y += timeStep * gravity
                pos.x += vel.x * timeStep
                pos.y += vel.y * timeStep
            }
        }

        let pairs = generateCollisions()
        for ( let i = 0; i < velocityIterations; i++ )
            solveVelocities( pairs )
        for ( let i = 0; i < positionalIterations; i++ )
            solvePositions( pairs )
    }

    function solvePositions( pairs: Collision[] ) {
        for ( let pair of pairs ) {
            let { bodyA, bodyB, normal, penetration } = pair

            let _penetration = penetration()
            if ( _penetration < 0 )
                continue

            let massA = bodyA?.mass ?? 1e+32
            let massB = bodyB?.mass ?? 1e+32

            let displacement = _penetration * positionalDamping
            let massRatio = massB / massA
            let displacementB = displacement / ( 1 + massRatio )
            let displacementA = displacement - displacementB

            if ( bodyA ) {
                bodyA.pos.x -= normal.x * displacementA
                bodyA.pos.y -= normal.y * displacementA
            }

            if ( bodyB ) {
                bodyB.pos.x += normal.x * displacementB
                bodyB.pos.y += normal.y * displacementB
            }
        }
    }

    function solveVelocities( pairs: Collision[] ) {
        for ( let pair of pairs ) {
            let { bodyA, bodyB, normal, penetration } = pair

            let _penetration = penetration()
            if ( _penetration < 0 )
                continue

            let massA = bodyA?.mass ?? 1e+32
            let massB = bodyB?.mass ?? 1e+32
            let velA = bodyA.vel ?? new Vector( 0, 0 )
            let velB = bodyB?.vel ?? new Vector( 0, 0 )


            let netMass = massA + massB
            let px = velA.x * massA + velB.x * massB
            let py = velA.y * massA + velB.y * massB
            let cmVel = new Vector(
                px / netMass,
                py / netMass,
            )

            let cmVelNormal = cmVel.dot( normal )
            let momentumANormal = velA.dot( normal ) * massA
            let impulse = ( cmVelNormal * massA - momentumANormal ) * ( 1 + restitution )
            if ( impulse > 0 )
                continue

            if ( bodyA ) {
                bodyA.vel.x += normal.x * impulse / massA
                bodyA.vel.y += normal.y * impulse / massA
            }

            if ( bodyB ) {
                bodyB.vel.x -= normal.x * impulse / massB
                bodyB.vel.y -= normal.y * impulse / massB
            }
        }
    }

    type Collision = { bodyA: Body, bodyB?: Body, normal: Vector, penetration: () => number }
    function generateCollisions() {
        const walls = [
            { normal: new Vector( 0, -1 ), distance: 0 },
            { normal: new Vector( 0, 1 ), distance: canvas.height },
            { normal: new Vector( -1, 0 ), distance: offscreenMargin * 2 },
            { normal: new Vector( 1, 0 ), distance: canvas.width + offscreenMargin * 2 },
        ]

        let result: Collision[] = []

        for ( let i = 0; i < bodies.length; i++ ) {
            let body = bodies[ i ]
            for ( let wall of walls ) {
                let penetration = () => body.pos.dot( wall.normal ) - wall.distance + body.radius
                if ( penetration() < -10 )
                    continue
                result.push( {
                    bodyA: body,
                    normal: wall.normal,
                    penetration
                } )
            }
        }

        generatePairCollisions( result, bodies, { pos: new Vector( 0, 0 ), size: new Vector( canvas.width, canvas.height ) } )

        return result
    }

    function generatePairCollisions( pairs: Collision[], bodies: Body[], box: { pos: Vector, size: Vector } ) {
        for ( let cell of grid )
            cell.length = 0

        // Place bodies in grid.
        for ( let body of bodies ) {
            let { pos, radius: r } = body
            let { x, y } = pos
            let i1 = clamp( 0, gridWidth - 1, Math.floor( ( x - r ) / cellSize ) )
            let i2 = clamp( 0, gridWidth - 1, Math.floor( ( x + r ) / cellSize ) )
            let j1 = clamp( 0, gridHeight - 1, Math.floor( ( y - r ) / cellSize ) )
            let j2 = clamp( 0, gridHeight - 1, Math.floor( ( y + r ) / cellSize ) )
            for ( let i = i1; i <= i2; i++ ) {
                for ( let j = j1; j <= j2; j++ ) {
                    let cellIndex = i * gridHeight + j
                    grid[ cellIndex ].push( body )
                }
            }
        }

        // Iterate over grid to generate pairs.
        for ( let i = 0; i < gridWidth; i++ ) {
            for ( let j = 0; j < gridHeight; j++ ) {
                let cellIndex = i * gridHeight + j
                for ( let bodyA of grid[ cellIndex ] ) {
                    let u2 = clamp( 0, gridWidth - 1, i + 1 )
                    let v2 = clamp( 0, gridHeight - 1, j + 1 )
                    for ( let u = i; u <= u2; u++ ) {
                        for ( let v = j; v <= v2; v++ ) {
                            let cellIndex2 = u * gridHeight + v
                            for ( let bodyB of grid[ cellIndex2 ] ) {
                                if ( bodyB.id <= bodyA.id )
                                    continue
                                let penetration = () => bodyA.radius + bodyB.radius - bodyA.pos.distance( bodyB.pos )
                                if ( penetration() < 0 )
                                    continue
                                let normal = bodyB.pos.subtract( bodyA.pos ).unit()
                                pairs.push( { bodyA, bodyB, normal, penetration } )
                            }
                        }
                    }
                }

            }
        }

    }
}
