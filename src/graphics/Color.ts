import { lerp } from "../math/math"

export function rgb( r: number, g: number, b: number ) {
    return new Color( r, g, b )
}

export function rgba( r: number, g: number, b: number, a: number = 1 ) {
    return new Color( r, g, b, a )
}

export default class Color {
    r: number
    g: number
    b: number
    a: number

    constructor( r: number, g: number, b: number, a: number = 1 ) {
        this.r = r
        this.g = g
        this.b = b
        this.a = a
    }

    lerp(other: Color, alpha: number) {
        return new Color(
            lerp(this.r, other.r, alpha),
            lerp(this.g, other.g, alpha),
            lerp(this.b, other.b, alpha),
            lerp(this.a, other.a, alpha),
        )
    }

    static parse( str: string ): Color {
        if ( str[ 0 ] == "#" ) {
            // Parse Hex
            let parts = str.match( /[0-9a-f]{2,2}/ig )!.map( x => parseInt( x, 16 ) )
            return new Color( parts[ 0 ], parts[ 1 ], parts[ 2 ], ( parts[ 3 ] || 255 ) / 255 )
        }

        if ( str.indexOf( "(" ) == -1 ) {
            let color = Color[ str ]
            if ( !color ) throw new Error( "unrecognized color " + str )
            return color
        }

        let type = str.match( /\w+/ )![ 0 ]
        let args = str.match( /\d+/g )!.map( x => parseFloat( x ) )

        switch ( type ) {
            case "rgb":
                return new Color( args[ 0 ], args[ 1 ], args[ 2 ] )
            case "rgba":
                return new Color( args[ 0 ], args[ 1 ], args[ 2 ], args[ 3 ] )
        }

        throw new Error("unrecognized type")
    }

    toString() {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`
    }
}

export class Colors {
    static aliceblue = Color.parse( "#f0f8ff" )
    static antiquewhite = Color.parse( "#faebd7" )
    static aqua = Color.parse( "#00ffff" )
    static aquamarine = Color.parse( "#7fffd4" )
    static azure = Color.parse( "#f0ffff" )
    static beige = Color.parse( "#f5f5dc" )
    static bisque = Color.parse( "#ffe4c4" )
    static black = Color.parse( "#000000" )
    static blanchedalmond = Color.parse( "#ffebcd" )
    static blue = Color.parse( "#0000ff" )
    static blueviolet = Color.parse( "#8a2be2" )
    static brown = Color.parse( "#a52a2a" )
    static burlywood = Color.parse( "#deb887" )
    static cadetblue = Color.parse( "#5f9ea0" )
    static chartreuse = Color.parse( "#7fff00" )
    static chocolate = Color.parse( "#d2691e" )
    static coral = Color.parse( "#ff7f50" )
    static cornflowerblue = Color.parse( "#6495ed" )
    static cornsilk = Color.parse( "#fff8dc" )
    static crimson = Color.parse( "#dc143c" )
    static cyan = Color.parse( "#00ffff" )
    static darkblue = Color.parse( "#00008b" )
    static darkcyan = Color.parse( "#008b8b" )
    static darkgoldenrod = Color.parse( "#b8860b" )
    static darkgray = Color.parse( "#a9a9a9" )
    static darkgreen = Color.parse( "#006400" )
    static darkgrey = Color.parse( "#a9a9a9" )
    static darkkhaki = Color.parse( "#bdb76b" )
    static darkmagenta = Color.parse( "#8b008b" )
    static darkolivegreen = Color.parse( "#556b2f" )
    static darkorange = Color.parse( "#ff8c00" )
    static darkorchid = Color.parse( "#9932cc" )
    static darkred = Color.parse( "#8b0000" )
    static darksalmon = Color.parse( "#e9967a" )
    static darkseagreen = Color.parse( "#8fbc8f" )
    static darkslateblue = Color.parse( "#483d8b" )
    static darkslategray = Color.parse( "#2f4f4f" )
    static darkslategrey = Color.parse( "#2f4f4f" )
    static darkturquoise = Color.parse( "#00ced1" )
    static darkviolet = Color.parse( "#9400d3" )
    static deeppink = Color.parse( "#ff1493" )
    static deepskyblue = Color.parse( "#00bfff" )
    static dimgray = Color.parse( "#696969" )
    static dimgrey = Color.parse( "#696969" )
    static dodgerblue = Color.parse( "#1e90ff" )
    static firebrick = Color.parse( "#b22222" )
    static floralwhite = Color.parse( "#fffaf0" )
    static forestgreen = Color.parse( "#228b22" )
    static fuchsia = Color.parse( "#ff00ff" )
    static gainsboro = Color.parse( "#dcdcdc" )
    static ghostwhite = Color.parse( "#f8f8ff" )
    static goldenrod = Color.parse( "#daa520" )
    static gold = Color.parse( "#ffd700" )
    static gray = Color.parse( "#808080" )
    static green = Color.parse( "#008000" )
    static greenyellow = Color.parse( "#adff2f" )
    static grey = Color.parse( "#808080" )
    static honeydew = Color.parse( "#f0fff0" )
    static hotpink = Color.parse( "#ff69b4" )
    static indianred = Color.parse( "#cd5c5c" )
    static indigo = Color.parse( "#4b0082" )
    static ivory = Color.parse( "#fffff0" )
    static khaki = Color.parse( "#f0e68c" )
    static lavenderblush = Color.parse( "#fff0f5" )
    static lavender = Color.parse( "#e6e6fa" )
    static lawngreen = Color.parse( "#7cfc00" )
    static lemonchiffon = Color.parse( "#fffacd" )
    static lightblue = Color.parse( "#add8e6" )
    static lightcoral = Color.parse( "#f08080" )
    static lightcyan = Color.parse( "#e0ffff" )
    static lightgoldenrodyellow = Color.parse( "#fafad2" )
    static lightgray = Color.parse( "#d3d3d3" )
    static lightgreen = Color.parse( "#90ee90" )
    static lightgrey = Color.parse( "#d3d3d3" )
    static lightpink = Color.parse( "#ffb6c1" )
    static lightsalmon = Color.parse( "#ffa07a" )
    static lightseagreen = Color.parse( "#20b2aa" )
    static lightskyblue = Color.parse( "#87cefa" )
    static lightslategray = Color.parse( "#778899" )
    static lightslategrey = Color.parse( "#778899" )
    static lightsteelblue = Color.parse( "#b0c4de" )
    static lightyellow = Color.parse( "#ffffe0" )
    static lime = Color.parse( "#00ff00" )
    static limegreen = Color.parse( "#32cd32" )
    static linen = Color.parse( "#faf0e6" )
    static magenta = Color.parse( "#ff00ff" )
    static maroon = Color.parse( "#800000" )
    static mediumaquamarine = Color.parse( "#66cdaa" )
    static mediumblue = Color.parse( "#0000cd" )
    static mediumorchid = Color.parse( "#ba55d3" )
    static mediumpurple = Color.parse( "#9370db" )
    static mediumseagreen = Color.parse( "#3cb371" )
    static mediumslateblue = Color.parse( "#7b68ee" )
    static mediumspringgreen = Color.parse( "#00fa9a" )
    static mediumturquoise = Color.parse( "#48d1cc" )
    static mediumvioletred = Color.parse( "#c71585" )
    static midnightblue = Color.parse( "#191970" )
    static mintcream = Color.parse( "#f5fffa" )
    static mistyrose = Color.parse( "#ffe4e1" )
    static moccasin = Color.parse( "#ffe4b5" )
    static navajowhite = Color.parse( "#ffdead" )
    static navy = Color.parse( "#000080" )
    static oldlace = Color.parse( "#fdf5e6" )
    static olive = Color.parse( "#808000" )
    static olivedrab = Color.parse( "#6b8e23" )
    static orange = Color.parse( "#ffa500" )
    static orangered = Color.parse( "#ff4500" )
    static orchid = Color.parse( "#da70d6" )
    static palegoldenrod = Color.parse( "#eee8aa" )
    static palegreen = Color.parse( "#98fb98" )
    static paleturquoise = Color.parse( "#afeeee" )
    static palevioletred = Color.parse( "#db7093" )
    static papayawhip = Color.parse( "#ffefd5" )
    static peachpuff = Color.parse( "#ffdab9" )
    static peru = Color.parse( "#cd853f" )
    static pink = Color.parse( "#ffc0cb" )
    static plum = Color.parse( "#dda0dd" )
    static powderblue = Color.parse( "#b0e0e6" )
    static purple = Color.parse( "#800080" )
    static rebeccapurple = Color.parse( "#663399" )
    static red = Color.parse( "#ff0000" )
    static rosybrown = Color.parse( "#bc8f8f" )
    static royalblue = Color.parse( "#4169e1" )
    static saddlebrown = Color.parse( "#8b4513" )
    static salmon = Color.parse( "#fa8072" )
    static sandybrown = Color.parse( "#f4a460" )
    static seagreen = Color.parse( "#2e8b57" )
    static seashell = Color.parse( "#fff5ee" )
    static sienna = Color.parse( "#a0522d" )
    static silver = Color.parse( "#c0c0c0" )
    static skyblue = Color.parse( "#87ceeb" )
    static slateblue = Color.parse( "#6a5acd" )
    static slategray = Color.parse( "#708090" )
    static slategrey = Color.parse( "#708090" )
    static snow = Color.parse( "#fffafa" )
    static springgreen = Color.parse( "#00ff7f" )
    static steelblue = Color.parse( "#4682b4" )
    static tan = Color.parse( "#d2b48c" )
    static teal = Color.parse( "#008080" )
    static thistle = Color.parse( "#d8bfd8" )
    static tomato = Color.parse( "#ff6347" )
    static turquoise = Color.parse( "#40e0d0" )
    static violet = Color.parse( "#ee82ee" )
    static wheat = Color.parse( "#f5deb3" )
    static white = Color.parse( "#ffffff" )
    static whitesmoke = Color.parse( "#f5f5f5" )
    static yellow = Color.parse( "#ffff00" )
    static yellowgreen = Color.parse( "#9acd32" )
    static transparent = rgba( 0, 0, 0, 0 )
}