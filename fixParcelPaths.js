const fs = require( "fs" )
const path = require( "path" )

function getFilesRecursive( root ) {
    let result = []
    for ( let file of fs.readdirSync( root ) ) {
        let filePath = path.join( root, file )
        if ( fs.statSync( filePath ).isDirectory() ) {
            for ( let file2 of getFilesRecursive( filePath ) )
                result.push( file2 )
        } else {
            result.push( filePath )
        }
    }
    return result
}

let files = getFilesRecursive( "./dist" ).filter( file => file.endsWith( ".html" ) )

function fixFile( filePath ) {
    let text = fs.readFileSync( filePath, { encoding: "utf8" } )
    let fixed = text.replace( /src="\//g, 'src="./' ).replace( /href="\//g, 'href="./' )
    fs.writeFileSync( filePath, fixed )
    // console.log( "\n\n=================================" )
    // console.log( fixed )
}

for ( let file of files ) {
    fixFile( file )
}