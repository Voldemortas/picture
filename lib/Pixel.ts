import {
  CHANNELS,
  DEFAULT_ALPHA,
  MAX_PIXEL,
  MIN_PIXEL,
  NO_ALPHA_CHANNELS,
  TRUE_GRAY_RATIO,
} from './common.ts'
import type { OptionalAlphaArray, PixelCallback, RgbaArray } from './common.ts'

/**
 * static class for pixel manipulations
 * @class Pixel
 */
export default class Pixel {
  /**
   * Monochromizes the pixel - makes all the RGB channels have the same value (thus everything is from white, to gray, to black)
   * @param {optionalAlphaArray} pixel
   * @param {[number, number, number]=} rgb - RGB array, all vallues should add up to 1
   * @returns {rgbaArray} - monochromized pixel
   *
   * @example
   * ```
   * const pixel = [244, 127, 63]
   * const rgbRatio = [1, 0, 0]
   * Pixel.monochromize(rgbRatio)(pixel)
   * //only considers the red channel when monochromizing data
   * //thus [244, 127, 63] becomes [244, 244, 244] because the red channel was 244
   * ```
   */
  public static monochromize(
    rgb: [number, number, number] = TRUE_GRAY_RATIO,
  ): PixelCallback {
    return (pixel: OptionalAlphaArray) => {
      const black = pixel[0] * rgb[0] + pixel[1] * rgb[1] + pixel[2] * rgb[2]
      return [
        ...new Array(NO_ALPHA_CHANNELS).fill(black),
        pixel[3] ?? MAX_PIXEL,
      ] as RgbaArray
    }
  }

  /**
   * Binarizes image channels - they can be either 0 or 255
   *
   * Monochromize picture first if you want a neat black/white image
   * @param {optionalAlphaArray} pixel
   * @param {number} tolerance - the bar from which the pixel value becomes either 0 or 255
   * @returns {Picture} - monochromized picture
   *
   * @example
   * ```
   * const pixel = [0, 127, 255]
   * Pixel.binarizeColors(pixel, 127)
   * //thus [255, 127, 63] becomes [0, 0, 255]
   * //as 255 > 127, 127 <= 127 and 0 <= 127
   * ```
   */
  public static binarizeColors(
    tolerance: number = 127,
  ): PixelCallback {
    return (pixel: OptionalAlphaArray) => {
      const res = new Array(CHANNELS) as RgbaArray
      for (let i = 0; i < CHANNELS; i++) {
        res[i] = ((pixel[i] ?? DEFAULT_ALPHA) > tolerance)
          ? MAX_PIXEL
          : MIN_PIXEL
      }
      return res
    }
  }

  /**
   * Groups channel values into several groups based on the ratios,
   * starting with 0 and ending with 255.
   * Use {@link Picture.groupColors()} if you want to apply to the entire image
   * for more optimisation
   *
   * @param {optionalAlphaArray} pixel
   * @param {number[]} ratios - since these are ratios `[1, 1, 1]` is equal to `[2, 2, 2]`
   * @returns {Picture} - picture with less colours
   *
   * @example
   * ```
   * const pixel = [60, 120, 180]
   * Picture.groupColors([1, 1, 1])(pixel)// == [0, 127, 255]
   * //each channel can have one of the possible 3 values (0, 127, 255)
   * //values between 0-84 become 0
   * //values between 85-170 become 127
   * //values between 171-255 become 255
   * //this because 256/3-1=84
   * ```
   * @example
   * ```
   * const pixel = [60, 120, 180]
   * Picture.groupColors([1, 2, 1])(pixel)// == [0, 127, 127]
   * //each channel can have one of the possible 3 values (0, 127, 255)
   * //values between 0-63 become 0
   * //values between 64-191 become 127
   * //values between 192-255 become 255
   * //this because 256/4-1=63 yet the middle ratio is twice as big
   *  as the other two
   * ```
   */
  public static groupColors(
    colorSpaceRatios: number[],
  ): PixelCallback {
    const ratiosSum = colorSpaceRatios.reduce((acc, cur) => acc + cur, 0)

    const ranges = [] as number[]
    ranges.push(-1)
    for (let i = 1; i < colorSpaceRatios.length + 1; i++) {
      ranges.push(
        ranges[i - 1] +
          (MAX_PIXEL + 1) / ratiosSum * colorSpaceRatios[i - 1],
      )
    }
    ranges[0] = 0

    const nearestValue = [] as number[]
    nearestValue.push(MIN_PIXEL)
    for (let i = 1; i < colorSpaceRatios.length - 1; i++) {
      nearestValue.push(Math.round((ranges[i] + ranges[i + 1]) / 2))
    }
    nearestValue.push(MAX_PIXEL)

    return (pixel: OptionalAlphaArray) => {
      const data = [...pixel]
      for (let i = 0; i < CHANNELS; i++) {
        if (i % CHANNELS === CHANNELS - 1) {
          data[CHANNELS - 1] = pixel[CHANNELS - 1] ??
            DEFAULT_ALPHA
          continue
        }
        let nearestIntervalIndex = -1
        while (pixel[i]! > ranges[++nearestIntervalIndex]);
        nearestIntervalIndex--
        data[i] = nearestValue[nearestIntervalIndex]
      }

      return data as RgbaArray
    }
  }
}
