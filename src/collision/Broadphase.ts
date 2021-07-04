import AABB from "../math/AABB"
import { clamp, contains } from "../math/math"
import Vector from "../math/Vector"

// If calculating bounds is slow, it should be cached on the provider because it is called 2-3 times per body here.
export interface IBroadphaseEntry { getBounds: () => AABB, id: number }
export default class Broadphase {
    static findPairs<T extends IBroadphaseEntry>( bodies: T[], width: number, height: number, cellSize: number, callback: ( a: T, b: T ) => void ) {
        let gridWidth = Math.ceil( width / cellSize )
        let gridHeight = Math.ceil( height / cellSize )
        type GridCell = T[]
        const grid: GridCell[] = []
        for ( let i = 0; i < gridWidth * gridHeight; i++ )
            grid.push( [] )

        // Place bodies in grid.
        for ( let body of bodies ) {
            // This is slightly incorrect since it will place bodies outside the grid on the boundary of the grid.
            // However this has the benefit of ensuring all bodies will be covered by collision detection.
            // TODO: Come up with a cleaner solution. Maybe implement chunks and generate chunks adaptively rather than using fixed bounds.
            let bounds = body.getBounds()
            let i1 = clamp( 0, gridWidth - 1, Math.floor( bounds.minx / cellSize ) )
            let i2 = clamp( 0, gridWidth - 1, Math.floor( bounds.maxx / cellSize ) )
            let j1 = clamp( 0, gridHeight - 1, Math.floor( bounds.miny / cellSize ) )
            let j2 = clamp( 0, gridHeight - 1, Math.floor( bounds.maxy / cellSize ) )
            for ( let i = i1; i <= i2; i++ ) {
                for ( let j = j1; j <= j2; j++ ) {
                    let cellIndex = i * gridHeight + j
                    grid[ cellIndex ].push( body )
                }
            }
        }

        let visitedPairs = new Set<number>()

        // Iterate over grid to generate pairs.
        for ( let i = 0; i < gridWidth; i++ ) {
            for ( let j = 0; j < gridHeight; j++ ) {
                let cellIndex = i * gridHeight + j
                let gridCell = grid[ cellIndex ]
                for ( let iBodyA = 0; iBodyA < gridCell.length; iBodyA++ ) {
                    let bodyA = gridCell[ iBodyA ]
                    let boundsA = bodyA.getBounds()
                    for ( let iBodyB = iBodyA + 1; iBodyB < gridCell.length; iBodyB++ ) {
                        let bodyB = gridCell[ iBodyB ]

                        let boundsB = bodyB.getBounds()
                        if ( !boundsA.overlaps( boundsB ) )
                            continue

                        // Check if pair has been visited.
                        let minId = Math.min( bodyA.id, bodyB.id )
                        let maxId = Math.max( bodyA.id, bodyB.id )
                        let pairKey = ( maxId << 16 ) | minId
                        if ( visitedPairs.has( pairKey ) ) continue
                        visitedPairs.add( pairKey )

                        callback( bodyA, bodyB )
                    }
                }

            }
        }

    }
}