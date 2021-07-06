import Vector from "../math/Vector"
import SupportFunction, { polygonSupport } from "./SupportFunction"
import { modulus } from "../math/math"
import generateContacts from "./generateContacts"

export type CollisionInfo = { normal: Vector, separation: number, contact: Vector[] }
export default function SAT( polyA: Vector[], polyB: Vector[] ): CollisionInfo {
    let maxNormal = Vector.zero
    let maxDist = -Infinity
    function maxSeperationAxis( poly: Vector[], otherSupport: SupportFunction, sign: number ) {
        for ( let i = 0; i < poly.length; i++ ) {
            i = modulus( i, poly.length )
            let j = modulus( i + 1, poly.length )
            let pt_i = poly[ i ], pt_j = poly[ j ]
            let normal = pt_j.subtract( pt_i ).leftNormal().unit() // Inward normal
            let dist = pt_i.dot( normal ) - otherSupport( normal ).dot( normal )
            if ( dist > maxDist )
                maxDist = dist, maxNormal = normal.scale( sign )
        }
    }

    let supportA = polygonSupport( polyA ), supportB = polygonSupport( polyB )
    maxSeperationAxis( polyA, supportB, -1 )
    maxSeperationAxis( polyB, supportA, 1 )

    let contacts = generateContacts( supportA, supportB, maxNormal )

    return {
        normal: maxNormal,
        separation: maxDist,
        contact: contacts
    }
}