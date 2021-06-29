
import test from "ava"
import { Vector } from "../Vector"
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
    let expected = '{"normal":{"x":1.4142135623730958,"y":1.4142135623730958},"separation":24.828427124746202}'
    t.deepEqual( JSON.stringify( result ), expected )
    // console.log( JSON.stringify( result ) )
    t.pass()
} )