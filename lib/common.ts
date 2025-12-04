export const CHANNELS: number = 4
export const NO_ALPHA_CHANNELS: number = 3
export const MAX_PIXEL = 0xFF
export const MIN_PIXEL = 0x00
export const DEFAULT_ALPHA = 0xFF
/**
 * Default RGB ratio used for grayscaling images:
 * [21% red, 72% green, 7% blue]
 * taken from https://stackoverflow.com/a/14331
 */
export const TRUE_GRAY_RATIO: [number, number, number] = [
  0.2125,
  0.7154,
  0.0721,
]

/**
 * Callback to manipulate pixel, alpha is optional
 * @callback PixelCallback
 * @param {OptionalAlphaArray} rgba - rgba channels
 * @param {number=} index - index of the pixel
 * @returns {OptionalAlphaArray}
 */
export type PixelCallback = (
  rgb: OptionalAlphaArray,
  index?: number,
) => OptionalAlphaArray

/**
 * [number, number, number, number] - resembles rgba channels
 * @typedef {RgbaArray} RgbaArray
 * @property {[number, number, number, number]}
 */
export type RgbaArray = [number, number, number, number]
/**
 * [number, number, number, number?] - resembles rgb channels with optional alpha
 * @typedef {OptionalAlphaArray} optionalAlphaArray
 * @property {[number, number, number, number?]}
 */
export type OptionalAlphaArray = [number, number, number, number?]
