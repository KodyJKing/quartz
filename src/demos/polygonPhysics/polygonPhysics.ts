import Clock from "../../Clock"
import SAT, { CollisionInfo } from "../../collision/SAT"
import { boxPolygon, initCanvas, notQuiteInfiniteMass, polygon, polygonPath } from "../../common"
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
const linearAirDrag = 1
const positionalDamping = 0.5
const positionalIterations = 10
const velocityIterations = 10
const restitution = 0.2
const minBounceVelocity = 0 // 400

let pairs: Pair[] = []
const bodies: Body[] = [
    // new Body({
    //     model: polygon(3, 100),
    //     position: new Vector(canvas.width / 2, canvas.height / 2),
    //     angle: 0.1, //-2 * Math.PI / 5 / 4,
    //     angularVelocity: -50,
    //     mass: 1,
    //     inertia: 10000
    // }),
    // new Body({
    //     model: polygon(3, 100),
    //     position: new Vector(canvas.width / 2, canvas.height / 4 ),
    //     angle: 0, //-2 * Math.PI / 5 / 4 + .1,
    //     angularVelocity: -50,
    //     mass: 1,
    //     inertia: 10000
    // }),
    new Body({
        model: boxPolygon(canvas.width, 20),
         position: new Vector(canvas.width / 2, canvas.height - 10),
         isStatic: true,
         color: wallColor
    }),
    new Body({
        model: boxPolygon(canvas.width, 20),
         position: new Vector(canvas.width / 2, 10),
         isStatic: true,
         color: wallColor
    }),
    new Body({
        model: boxPolygon(20, canvas.height),
         position: new Vector(canvas.width - 10, canvas.height / 2),
         isStatic: true,
         color: wallColor
    }),
    new Body({
        model: boxPolygon(20, canvas.height),
         position: new Vector( 10, canvas.height / 2),
         isStatic: true,
         color: wallColor
    }),
]

{
    let radius = 50
    for (let i = 0; i < 100; i++) {
        bodies.push(new Body({
            model: polygon(Math.floor(Math.random() * 4) + 3, radius),
            // model: polygon(4, radius),
            position: new Vector(Math.random() * canvas.width, Math.random() * canvas.height ),
            angularVelocity: (Math.random() - .5) * 500,
            inertia: radius * radius,
            color: randomColor()
        }))
    }
}

let paused = false
let debugNextFrame = false
window.addEventListener( "keypress", ev => { 
    if ( ev.key == " " ) paused = !paused 
    if (ev.key == "`") debugNextFrame = true
} )

mainLoop()
function mainLoop() {
    clock.nextFrame()
    if ( !paused ) {
        render()
        update()
    }
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
    pairs = generatePairs()
    for (let body of bodies) {
        if (body.isStatic)
            continue
        body.velocity.y += gravity * timeStep
        body.position.x += body.velocity.x * timeStep
        body.position.y += body.velocity.y * timeStep
        body.angle += body.angularVelocity * timeStep
        body.angularVelocity *= rotationalAirDrag
        body.velocity.x *= linearAirDrag
        body.velocity.y *= linearAirDrag
        body.updateVertices()
    }
    for (let i = 0; i < velocityIterations; i++)
        solveVelocities(pairs)
    for (let i = 0; i < positionalIterations; i++)
        solvePositions(pairs)
}

type Pair = { bodyA: Body, bodyB: Body, info: CollisionInfo }
function generatePairs() {
    let pairs: Pair[] = []
    for (let i = 0; i < bodies.length; i++) {
        let bodyA = bodies[i]
        for (let j = i + 1; j < bodies.length; j++) {
            let bodyB = bodies[j]
            let info = SAT(bodyA.vertices, bodyB.vertices)
            if (info.separation <= 0)
                pairs.push({bodyA, bodyB, info})
        }
    }
    return pairs
}

function solvePositions(pairs: Pair[]) {
    // TODO: Try implementing angular displacements.
    for (let pair of pairs) {
        let { bodyA, bodyB, info } = pair
        let { normal, separation } = info

        if (separation > 0) continue

        let massA = bodyA.mass
        let massB = bodyB.mass

        let displacement = -separation * positionalDamping
        let massRatio = massB / massA
        let displacementB = displacement / ( 1 + massRatio )
        let displacementA = displacement - displacementB

        if ( !bodyA.isStatic ) {
            bodyA.position.x -= normal.x * displacementA
            bodyA.position.y -= normal.y * displacementA
            bodyA.updateVertices()
        }

        if ( !bodyB.isStatic ) {
            bodyB.position.x += normal.x * displacementB
            bodyB.position.y += normal.y * displacementB
            bodyB.updateVertices()
        }

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
