export default function initCanvas() {
    let canvas = document.getElementById( "mainCanvas" ) as HTMLCanvasElement
    updateCanvasResolution()
    window.addEventListener( "resize", ev => updateCanvasResolution() )
    function updateCanvasResolution() {
        let rect = canvas.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
    }
    return canvas
}