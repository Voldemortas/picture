/**
 * Image with RGBA channels
 * @typedef {Object} RGBA_IMAGE
 * @property {number} width - image width
 * @property {number} height - image height
 * @property {Uint8ClampedArray} data - imada data
 * @property {4} channels - 4
 */
/**
 * Image with RGB channels
 * @typedef {Object} RGB_IMAGE
 * @property {number} width - image width
 * @property {number} height - image height
 * @property {Uint8ClampedArray} data - imada data
 * @property {3} channels - 3
 */

const CHANNELS: number = 4
const NO_ALPHA_CHANNELS: number = 3
const MAX_PIXEL = 0xFF
const MIN_PIXEL = 0x00
const DEFAULT_ALPHA = 0xFF
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
 * My custom wrapper to do various pixel oriented operations
 * @class Picture
 */
export default class Picture {
  /**
   * Image width
   */
  public readonly width: number
  /**
   * Image height
   */
  public readonly height: number
  /**
   * Image data with RGBA (4) channels
   */
  public readonly data: Uint8ClampedArray

  /**
   * creates new Picture object
   * @param {number} width - width of the image
   * @param {number} height - height of the image
   * @param {Uint8ClampedArray} data - rgb(a) data, note that every pixel must be represent either by 3 or 4 channels (alpha is optional)
   * thus data.length must be `width * height * 3` or `width * height * 4`
   *
   * Throws an error if the widh*height:data ratio missmatches
   */
  constructor(
    width: number,
    height: number,
    data: Uint8ClampedArray,
  ) {
    this.width = width
    this.height = height
    if (data.length === width * height * CHANNELS) {
      this.data = data
    } else if (data.length === width * height * NO_ALPHA_CHANNELS) {
      const newData = []
      for (let i = 0; i < width * height * NO_ALPHA_CHANNELS; i++) {
        newData.push(data[i])
        if (i % NO_ALPHA_CHANNELS === NO_ALPHA_CHANNELS - 1) {
          newData.push(DEFAULT_ALPHA)
        }
      }
      this.data = new Uint8ClampedArray(newData)
    } else {
      throw new Error(
        `Image data length doesn't match width×height×channels dimensions.`,
      )
    }
  }

  /**
   * Same as running `new Picture(width, height, data)`
   *
   * @param {Object} picture
   * @param {number} picture.width
   * @param {number} picture.height
   * @param {Uint8ClampedArray} picture.data - rgb(a) data, note that every pixel must be represent either by 3 or 4 channels (alpha is optional)
   * thus data.length must be `width * height * 3` or `width * height * 4`
   *
   * @returns {Picture} - Picture
   *
   * Throws an error if the widh*height:data ratio missmatches
   */
  public static From(
    { width, height, data }: {
      width: number
      height: number
      data: Uint8ClampedArray
    },
  ): Picture {
    return new Picture(width, height, data)
  }

  /**
   * RGBA model without the methods containing width, height, data and channels=4
   *
   * @returns {RGBA_IMAGE}
   */
  public toObject(): {
    width: number
    height: number
    data: Uint8ClampedArray
    channels: number
  } {
    return {
      width: this.width,
      height: this.height,
      data: this.data,
      channels: CHANNELS,
    }
  }

  /**
   * RGA model without the methods containing width, height, data and channels=3 (no alpha)
   *
   * @returns {RGB_IMAGE}
   */
  public toNoAlphaObject(): {
    width: number
    height: number
    data: Uint8ClampedArray
    channels: number
  } {
    return {
      width: this.width,
      height: this.height,
      data: this.data.filter((_v, i) => i % 4 !== 3),
      channels: NO_ALPHA_CHANNELS,
    }
  }

  /**
   * Monochromizes the image - makes all the RGB channels have the same value (thus everything is from white, to gray, to black)
   * @param {[number, number, number]=} rgb - RGB array, all vallues should add up to 1
   * @returns {Picture} - monochromized picture
   *
   * @example
   * ```
   * //only considers the red channel when monochromizing data
   * //thus [255, 127, 63] becomes [255, 255, 255] because the red channel was 255
   * picture.monochromize([1, 0, 0])
   * ```
   */
  public monochromize(
    rgb: [number, number, number] = TRUE_GRAY_RATIO,
  ): Picture {
    return Picture.monochromize(
      this,
      rgb,
    )
  }

  /**
   * Binarizes image channels - they can be either 0 or 255
   *
   * Monochromize picture first if you want a neat black/white image
   * @param {number} tolerance - the bar from which the pixel value becomes either 0 or 255
   * @returns {Picture} - monochromized picture
   *
   * @example
   * ```
   * picture.binarizeColors(70)
   * //thus [255, 127, 63] becomes [255, 255, 0]
   * //as 255 > 70 and 63 <= 70
   * ```
   */
  public binarizeColors(
    tolerance: number = 127,
  ): Picture {
    return Picture.binarizeColors(this, tolerance)
  }

  /**
   * Groups channel values into several groups based on the ratios,
   * starting with 0 and ending with 255
   * @param {number[]} ratios - since these are ratios `[1, 1, 1]` is equal to `[2, 2, 2]`
   * @returns {Picture} - picture with less colours
   *
   * @example
   * ```
   * picture.groupColors([1, 1, 1])
   * //each channel can have one of the possible 3 values (0, 127, 255)
   * //values between 0-84 become 0
   * //values between 85-170 become 127
   * //values between 171-255 become 255
   * //this because 256/3-1=84
   * ```
   * @example
   * ```
   * picture.groupColors([1, 2, 1])
   * //each channel can have one of the possible 3 values (0, 127, 255)
   * //values between 0-63 become 0
   * //values between 64-191 become 127
   * //values between 192-255 become 255
   * //this because 256/4-1=63 yet the middle ratio is twice as big
   *  as the other two
   * ```
   */
  public groupColors(
    ratios: number[],
  ): Picture {
    return Picture.groupColors(this, ratios)
  }

  /**
   * Allows to manipulate values of channels within a pixel
   * @returns {Picture}
   * @param {PixelCallback} pixelCallback
   * @example
   * ```
   * picture.manipulateChannels(([r, g, b, a], i) => i % 2 !== 4 ? [r, g, b, a]: [0, 0, 0, 255])
   * //turns every 4th pixel black
   * ```
   * @example
   * ```
   * picture.manipulateChannels(([r, g, b]) => [b, g, r])
   * //swaps rgb to bgr
   * ```
   */
  public manipulateChannels(
    pixelCallback: PixelCallback,
  ): Picture {
    return Picture.manipulateChannels(this, pixelCallback)
  }

  /**
   * Monochromizes the image - makes all the RGB channels have the same value (thus everything is from white, to gray, to black)
   * @param {Picture} image
   * @param {[number, number, number]=} rgb - RGB array, all vallues should add up to 1
   * @returns {Picture} - monochromized picture
   *
   * @example
   * ```
   * const img = Picture.From({width: 1, height: 1, data: new Uint8ClampedArray([255, 127, 63])})
   * Picture.monochromize(img, [1, 0, 0])
   * //only considers the red channel when monochromizing data
   * //thus [255, 127, 63] becomes [255, 255, 255] because the red channel was 255
   * ```
   */
  public static monochromize(
    image: Picture,
    rgb: [number, number, number] = TRUE_GRAY_RATIO,
  ): Picture {
    return Picture.manipulateChannels(
      image,
      Pixel.monochromize(rgb),
    )
  }

  /**
   * Binarizes image channels - they can be either 0 or 255
   *
   * Monochromize picture first if you want a neat black/white image
   * @param {Picture} image
   * @param {number} tolerance - the bar from which the pixel value becomes either 0 or 255
   * @returns {Picture} - monochromized picture
   *
   * @example
   * ```
   * let picture: Picture
   * Picture.binarizeColors(picture, 70)
   * //thus [255, 127, 63] becomes [255, 255, 0]
   * //as 255 > 70 and 63 <= 70
   * ```
   */
  public static binarizeColors(
    image: Picture,
    tolerance: number = 127,
  ): Picture {
    return Picture.manipulateChannels(
      image,
      Pixel.binarizeColors(tolerance),
    )
  }

  /**
   * Groups channel values into several groups based on the ratios,
   * starting with 0 and ending with 255
   * @param {number[]} ratios - since these are ratios `[1, 1, 1]` is equal to `[2, 2, 2]`
   * @returns {Picture} - picture with less colours
   *
   * @example
   * ```
   * let picture: Picture
   * Picture.groupColors(picture, [1, 1, 1])
   * //each channel can have one of the possible 3 values (0, 127, 255)
   * //values between 0-84 become 0
   * //values between 85-170 become 127
   * //values between 171-255 become 255
   * //this because 256/3-1=84
   * ```
   * @example
   * ```
   * let picture: Picture
   * Picture.groupColors(picture, [1, 2, 1])
   * //each channel can have one of the possible 3 values (0, 127, 255)
   * //values between 0-63 become 0
   * //values between 64-191 become 127
   * //values between 192-255 become 255
   * //this because 256/4-1=63 yet the middle ratio is twice as big
   *  as the other two
   * ```
   */
  public static groupColors(
    image: Picture,
    colorSpaceRatios: number[],
  ): Picture {
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

    const data = [] as number[]
    for (let i = 0; i < image.data.length; i++) {
      if (i % CHANNELS === CHANNELS - 1) {
        data.push(image.data[i])
        continue
      }
      let nearestIntervalIndex = -1
      while (image.data[i] > ranges[++nearestIntervalIndex]);
      nearestIntervalIndex--
      data.push(nearestValue[nearestIntervalIndex])
    }

    return new Picture(
      image.width,
      image.height,
      new Uint8ClampedArray(data),
    )
  }

  /**
   * Allows to manipulate values of channels within a pixel
   * @returns {Picture}
   * @param {Picture} image
   * @param {PixelCallback} pixelCallback
   * @example
   * ```
   * let picture: Picture
   * Picture.manipulateChannels(picture, ([r, g, b, a], i) => i % 2 !== 4 ? [r, g, b, a]: [0, 0, 0, 255])
   * //turns every 4th pixel black
   * ```
   * @example
   * ```
   * let picture: Picture
   * Picture.manipulateChannels(picture, ([r, g, b]) => [b, g, r])
   * //swaps rgb to bgr
   * ```
   */
  public static manipulateChannels(
    image: Picture,
    pixelCallback: PixelCallback,
  ): Picture {
    const data = []
    for (let i = 0; i < image.data.length; i += CHANNELS) {
      data.push(
        ...pixelCallback(
          [...image.data.subarray(i, i + CHANNELS)] as rgbaArray,
          i / CHANNELS,
        ) as rgbaArray,
      )
    }

    return new Picture(
      image.width,
      image.height,
      new Uint8ClampedArray(data),
    )
  }
}

/**
 * static class for pixel manipulations
 * @class Pixel
 */
export class Pixel {
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
    return (pixel: optionalAlphaArray) => {
      const black = pixel[0] * rgb[0] + pixel[1] * rgb[1] + pixel[2] * rgb[2]
      return [
        ...new Array(NO_ALPHA_CHANNELS).fill(black),
        pixel[3] ?? MAX_PIXEL,
      ] as rgbaArray
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
    return (pixel: optionalAlphaArray) => {
      const res = new Array(CHANNELS) as rgbaArray
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

    return (pixel: optionalAlphaArray) => {
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

      return data as rgbaArray
    }
  }
}

/**
 * Callback to manipulate pixel, alpha is optional
 * @callback PixelCallback
 * @param {optionalAlphaArray} rgba - rgba channels
 * @param {number=} index - index of the pixel
 * @returns {optionalAlphaArray}
 */
export type PixelCallback = (
  rgb: optionalAlphaArray,
  index?: number,
) => optionalAlphaArray

/**
 * [number, number, number, number] - resembles rgba channels
 * @typedef {rgbaArray} rgbaArray
 * @property {[number, number, number, number]}
 */
export type rgbaArray = [number, number, number, number]
/**
 * [number, number, number, number?] - resembles rgb channels with optional alpha
 * @typedef {rgbaArray} rgbaArray
 * @property {[number, number, number, number?]}
 */
export type optionalAlphaArray = [number, number, number, number?]
