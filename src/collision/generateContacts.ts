import Vector from "../math/Vector"
import SupportFunction from "./SupportFunction"

export default function generateContacts( supportA: SupportFunction, supportB: SupportFunction, normal: Vector, angularTolerance = 0.01 ) {
    // TODO: Simplify and reduce the number of allocations here.

    let rotator = Vector.polar( angularTolerance, 1 )
    let normalHigh = normal.complexProduct( rotator )
    let normalLow = normal.complexQuotient( rotator )

    let aUpper = supportA( normalLow )
    let aLower = supportA( normalHigh )
    let bUpper = supportB( normalHigh.negate() )
    let bLower = supportB( normalLow.negate() )

    let tangent = normal.rightNormal()
    let upperExtent = Math.min( aUpper.dot( tangent ), bUpper.dot( tangent ) )
    let lowerExtent = Math.max( aLower.dot( tangent ), bLower.dot( tangent ) )

    let aUpperContact = aUpper.clampAlongAxis( tangent, lowerExtent, upperExtent )
    let aLowerContact = aLower.clampAlongAxis( tangent, lowerExtent, upperExtent )
    let bUpperContact = bUpper.clampAlongAxis( tangent, lowerExtent, upperExtent )
    let bLowerContact = bLower.clampAlongAxis( tangent, lowerExtent, upperExtent )

    let upperContact = aUpperContact.lerp( bUpperContact, .5 )
    let lowerContact = aLowerContact.lerp( bLowerContact, .5 )

    if ( upperExtent - lowerExtent < 1 )
        return [ upperContact ]


    // if ( Math.random() < .5 )
    //     return [ upperContact, lowerContact ]
    // else
    //     return [ lowerContact, upperContact ]

    // return [ upperContact, lowerContact ]

    if ( Math.random() < .5 )
        return [ upperContact.lerp( lowerContact, .5 ), upperContact, lowerContact ]
    else
        return [ upperContact.lerp( lowerContact, .5 ), lowerContact, upperContact ]

    // return [ upperContact.lerp( lowerContact, .5 ), upperContact, lowerContact ]

}