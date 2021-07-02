import Clock from "../../Clock"
import Broadphase from "../../collision/Broadphase"
import SAT, { CollisionInfo } from "../../collision/SAT"
import { boxPolygon, initCanvas, polygon, polygonPath } from "../../common"
import Color, { Colors } from "../../graphics/Color"
import Input from "../../Input"
import Matrix from "../../math/Matrix"
import { Vector } from "../../math/Vector"
import Body from "./Body"

const canvas = initCanvas()
const c = canvas.getContext( "2d" ) as CanvasRenderingContext2D
const input = new Input()
const clock = new Clock()
const colorPalette = [ "#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51" ]
const wallColor = "#d1ccb6"
const randomColor = () => colorPalette[Math.random() * colorPalette.length | 0]
const timeStep = 1 / 120
const gravity = 2000
const coefficientOfFriction = .1
const rotationalAirDrag = 1 // .99
const linearAirDrag = 1 // .99
const positionalDamping = .25
const positionalIterations = 10
const velocityIterations = 10
const restitution = 0.1
const minBounceVelocity = 0 // 400
const wallThickness = 80
const broadphaseCellSize = 100

let toggleFlag = false
window.addEventListener( "keypress", ev => {  if ( ev.key == " " ) toggleFlag = !toggleFlag } )

let pairs: Pair[] = []
const bodies: Body[] = [
    new Body({
        model: boxPolygon(canvas.width, wallThickness),
         position: new Vector(canvas.width / 2, canvas.height),
         isStatic: true,
         color: wallColor
    }),
    new Body({
        model: boxPolygon(canvas.width, wallThickness),
         position: new Vector(canvas.width / 2, 0),
         isStatic: true,
         color: wallColor
    }),
    new Body({
        model: boxPolygon(wallThickness, canvas.height),
         position: new Vector(canvas.width, canvas.height / 2),
         isStatic: true,
         color: wallColor
    }),
    new Body({
        model: boxPolygon(wallThickness, canvas.height),
         position: new Vector( 0, canvas.height / 2),
         isStatic: true,
         color: wallColor
    }),
]

{
    for (let i = 0; i < 100; i++) {
        let radius = 50 // (40 + (Math.random() - .5) * 20)
        let mass = radius ** 2 /  (50 * 50)
        let inertia = mass * radius ** 2
        bodies.push(new Body({
            model: polygon(Math.floor(Math.random() * 6) + 3, radius),
            // model: polygon(6, radius),
            position: new Vector(Math.random() * canvas.width, Math.random() * canvas.height ),
            angularVelocity: (Math.random() - .5) * 100,
            velocity: Vector.polar(Math.random() * Math.PI * 2, Math.random() * 2000),
            mass, inertia,
            color: randomColor()
        }))
    }
}

// for (let i = 0; i < 7; i++) {
//     for (let j = 0; j < 1; j++) {
//         let size = 60
//         let mass = size ** 2 /  (50 * 50)
//         let inertia = mass * size ** 2
//         bodies.push(new Body({
//             model: boxPolygon(size, size),
//             position: new Vector(canvas.width / 2 + j * (size + 1), canvas.height - wallThickness / 2 - size / 2 - i * size ),
//             mass, inertia,
//             color: randomColor()
//         }))
//     }
// }

mainLoop()
function mainLoop() {
    clock.nextFrame()
    render()
    update()
    window.requestAnimationFrame( mainLoop )
}

function render() {
    c.fillStyle = "#ebe6d1"
    c.fillRect( 0, 0, canvas.width, canvas.height )
    c.lineWidth = 2
    c.lineCap = "round"
    c.lineJoin = "round"

    for (let body of bodies) {
        polygonPath(c, body.vertices)
        c.fillStyle = body.color
        c.fill()
        polygonPath(c, body.vertices, -2)
        c.strokeStyle = Color.parse(body.color).lerp(Colors.black, .025).toString()
        c.stroke()

        // c.lineWidth = 2
        // c.strokeStyle = "black"
        // c.stroke()
        // c.lineWidth = 1
        
        // let p = body.position
        // c.beginPath()
        // c.arc(p.x, p.y, 4, 0, Math.PI * 2)
        // c.fillStyle = "blue"
        // c.fill()

        // let h = Vector.polar(body.angle, 20)
        // c.beginPath()
        // c.moveTo(p.x, p.y)
        // c.lineTo(p.x + h.x, p.y + h.y)
        // c.strokeStyle = "blue"
        // c.stroke()
    }

    // for (let pair of pairs) {
    //     let n = pair.info.normal.scale(5)
    //     for (let p of pair.info.contact) {
    //         c.beginPath()
    //         c.arc(p.x, p.y, 2, 0, Math.PI * 2)
    //         c.fillStyle = "white"
    //         c.fill()
    //         c.beginPath()
    //         c.moveTo(p.x - n.x, p.y - n.y)
    //         c.lineTo(p.x + n.x, p.y + n.y)
    //         c.strokeStyle = "rgba(255, 255, 255, .5)"
    //         c.stroke()
    //     }
    // }

    c.fillStyle = "red"
    c.font = "24px Impact"
    c.fillText( clock.averageFPS.toFixed( 2 ), 0 + 2, 20 + 2 )
}

function update() {
    for (let body of bodies) {
        if (body.isStatic)
            continue
        if ( !input.mouse.get( 2 ) )
            body.velocity.y += gravity * timeStep
        if ( input.mouse.get( 0 ) ) {
            let diff = input.cursor.subtract( body.position )
            let length = Math.max( diff.length, 50 )
            diff = diff.scale( -250000000 / length ** 3 )
            body.velocity.x += diff.x * timeStep
            body.velocity.y += diff.y * timeStep
        }

        body.angularVelocity *= rotationalAirDrag
        body.velocity.x *= linearAirDrag
        body.velocity.y *= linearAirDrag

        body.positionalCorrection.x = 0
        body.positionalCorrection.y = 0
    }

    pairs = generatePairs()
    for (let i = 0; i < velocityIterations; i++)
        solveVelocities(pairs)
    for (let i = 0; i < positionalIterations; i++)
        solvePositions(pairs, toggleFlag)

    // let netPenetration = pairs.map(x => Math.max(0, -x.info.separation)).reduce((a, b) => a + b)
    // console.log("Net penetration: " + netPenetration.toFixed(2))

    for (let body of bodies) {
        if (body.isStatic)
                continue
        body.position.x += body.velocity.x * timeStep
        body.position.y += body.velocity.y * timeStep
        body.angle += body.angularVelocity * timeStep
        body.updateVertices()
        body.healthCheck()
    }
}

type Pair = { bodyA: Body, bodyB: Body, info: CollisionInfo }
function generatePairs() {
    let pairs: Pair[] = []
    Broadphase.findPairs(
        bodies, canvas.width, canvas.height, broadphaseCellSize, 
        (bodyA, bodyB) => {
            let info = SAT(bodyA.vertices, bodyB.vertices)
            if (info.separation <= 0)
                pairs.push({bodyA, bodyB, info})
        }
    )
    return pairs
}

function solvePositions(pairs: Pair[], updateGeometryAndCollision = false) {
    // TODO: Try implementing angular displacements.
    for (let pair of pairs) {
        let { bodyA, bodyB, info } = pair
        let { normal, separation } = info

        if (separation > 0) continue

        let massA = bodyA.mass
        let massB = bodyB.mass

        let correctedDisplacement = 0
        if (!updateGeometryAndCollision)
            correctedDisplacement = normal.dot(bodyB.positionalCorrection.subtract(bodyA.positionalCorrection))

        let displacement = (-separation - correctedDisplacement) * positionalDamping
        let massRatio = massB / massA
        let displacementB = displacement / ( 1 + massRatio )
        let displacementA = displacement - displacementB

        if ( !bodyA.isStatic ) {
            bodyA.position.x -= normal.x * displacementA
            bodyA.position.y -= normal.y * displacementA
            bodyA.positionalCorrection.x -= normal.x * displacementA
            bodyA.positionalCorrection.y -= normal.y * displacementA
            if (updateGeometryAndCollision)
                bodyA.updateVertices()
        }

        if ( !bodyB.isStatic ) {
            bodyB.position.x += normal.x * displacementB
            bodyB.position.y += normal.y * displacementB
            bodyB.positionalCorrection.x += normal.x * displacementB
            bodyB.positionalCorrection.y += normal.y * displacementB
            if (updateGeometryAndCollision)
                bodyB.updateVertices()
        }

        if (updateGeometryAndCollision)
            pair.info = SAT(bodyA.vertices, bodyB.vertices)
    }
}

function solveVelocities(pairs: Pair[]) {
    for (let pair of pairs) {
        let { bodyA, bodyB, info } = pair
        let { normal } = info
        for (let c of info.contact) {
            let ra = c.subtract(bodyA.position)
            let rb = c.subtract(bodyB.position)

            let raCrossN = ra.cross(normal)
            let rbCrossN = rb.cross(normal)

            let velA = bodyA.velocity.add(ra.crossZLeft(bodyA.angularVelocity))
            let velB = bodyB.velocity.add(rb.crossZLeft(bodyB.angularVelocity))
            let velBA = velB.subtract(velA)

            let _restitution = velBA.lengthSquared < minBounceVelocity ** 2 ? 0 : restitution
            let combinedEffectiveMass = 1 / (1 / bodyA.mass + 1 / bodyB.mass + raCrossN ** 2 / bodyA.inertia + rbCrossN ** 2 / bodyB.inertia)
            let normalImpulse = velBA.dot(normal) * ( 1 + _restitution ) * combinedEffectiveMass

            if ( normalImpulse >= 0 ) continue

            let tangent = normal.leftNormal()
            let tangentImpulse = normalImpulse * coefficientOfFriction * -Math.sign(velBA.dot(tangent))

            let impulse = new Vector(
                normal.x * normalImpulse + tangent.x * tangentImpulse,
                normal.y * normalImpulse + tangent.y * tangentImpulse,
            )

            if ( !bodyA.isStatic ) {
                bodyA.velocity.x += impulse.x / bodyA.mass
                bodyA.velocity.y += impulse.y / bodyA.mass
                bodyA.angularVelocity += ra.cross(impulse) / bodyA.inertia
            }
            if ( !bodyB.isStatic ) {
                bodyB.velocity.x -= impulse.x / bodyB.mass
                bodyB.velocity.y -= impulse.y / bodyB.mass
                bodyB.angularVelocity -= rb.cross(impulse) / bodyB.inertia
            }
        }
    }
}
