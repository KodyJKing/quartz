
import test from "ava"
import { Vector } from "../math/Vector"
import SAT, { polySupport } from "./SAT"

test( "SAT", t => {
    function box() {
        return [
            new Vector( -1, -1 ),
            new Vector( 1, -1 ),
            new Vector( 1, 1 ),
            new Vector( -1, 1 ),
        ]
    }

    // let poly = box()
    // let support = polySupport( poly )
    // console.log( support( new Vector( 1, 1 ) ) )
    // console.log( support( new Vector( -1, -1 ) ) )
    // console.log( support( new Vector( 1, 1 ) ) )
    // console.log( support( new Vector( 1, 1 ) ) )

    let polyA = box()
    let polyB = box().map( v => v.add( Vector.right.scale( -10 ) ).rotated( Math.PI / 4 ) )
    let result = SAT( polyB, polyA )
    let expected = '{"normal":{"x":0.707106781186548,"y":0.7071067811865471},"separation":7.585786437626905}'
    // t.deepEqual( JSON.stringify( result ), expected )
    // console.log( JSON.stringify( result ) )

    t.pass()
} )