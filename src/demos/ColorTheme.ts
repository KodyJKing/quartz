export const ColorTheme = {
    accents: {
        accent1Dark: "#264653",
        accent1Light: "#2A9D8F",
        accent2: "#E9C46A",
        accent3Light: "#F4A261",
        accent3Dark: "#E76F51"
    },
    background: "#ebe6d1",
    foreground: "#d1ccb6"
}
// export const ColorTheme = {
//     accents: {
//         accent1Dark: "#cfcfcf",
//         accent1Light: "#cfcfcf",
//         accent2: "#00CC00",
//         accent3Light: "#323232",
//         accent3Dark: "#323232"
//     },
//     background: "#eeeeee",
//     foreground: "#dedede"
// }
const colorPalette = Object.values( ColorTheme.accents )
export const randomThemeColor = () => colorPalette[ Math.random() * colorPalette.length | 0 ]