import Body from "../dynamics/Body"
import { CollisionInfo } from "./SAT"
type Pair = { bodyA: Body, bodyB: Body, info: CollisionInfo }
export default Pair