import {
  CHANNELS,
  DEFAULT_ALPHA,
  MAX_PIXEL,
  MIN_PIXEL,
  NO_ALPHA_CHANNELS,
  TRUE_GRAY_RATIO,
} from './common.ts'
import type { PixelCallback, RgbaArray } from './common.ts'
import Comparator from './Comparator.ts'
import { AlphaOption } from './Comparator.ts'
import Pixel from './Pixel.ts'

/**
 * Image with RGBA channels
 * @typedef {Object} RGBA_IMAGE
 * @property {number} width - image width
 * @property {number} height - image height
 * @property {Uint8ClampedArray} data - imada data
 * @property {4} channels - 4
 */
type RGBA_IMAGE = {
  width: number
  height: number
  data: Uint8ClampedArray
  channels: 4
}
/**
 * Image with RGB channels
 * @typedef {Object} RGB_IMAGE
 * @property {number} width - image width
 * @property {number} height - image height
 * @property {Uint8ClampedArray} data - imada data
 * @property {3} channels - 3
 */
type RGB_IMAGE = {
  width: number
  height: number
  data: Uint8ClampedArray
  channels: 3
}

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
   * Ammount of channels
   */
  public readonly channels = 4

  /**
   * creates new Picture object
   * @param {number} width - width of the image
   * @param {number} height - height of the image
   * @param {Uint8ClampedArray} data - rgb(a) data, note that every pixel must be represent either by 3 or 4 channels
   * (alpha is optional) thus data.length must be `width * height * 3` or `width * height * 4`
   *
   * Throws an error if the width*height:data ratio missmatches
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
   * Throws an error if the width*height:data ratio missmatches
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
   * Monochromizes the image - makes all the RGB channels have the same value
   * (thus everything is from white, to gray, to black)
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
   * Convolves the image with given kernel
   * @param {number[][]} kernel
   * @param {boolean=} keepEdges - whether to update image edges; turns black otherwise
   * @returns {Picture} convolved Picture
   * @example
   * ```
   * let picture: Picture
   * //image is unchaged
   * const sameImage = picture.convolve(Kernels.identy)
   * //image appears if it has been dragged down by 1 pixel
   * const slidenDown = picture.convolve([[0, 0, 0], [0, 0, 0], [0, 1, 0]])
   * ```
   */
  public convolve(kernel: number[][], keepEdges = true): Picture {
    return Picture.convolve(this, kernel, keepEdges)
  }

  /**
   * Method that increases/decreases image dimensions without applying any stretching
   * @param {number} offsetX - start offset (negative results in new transparent pixels being added)
   * @param {number} offsetY - start offset (negative results in new transparent pixels being added)
   * @param {number} width - width of the new image
   * @param {number} height - height of the new image
   * @returns {Picture} new resized Picture
   * @example
   * ```
   * let picture: Picture//size 3x2
   * const nothingChanges = picture.resize(0, 0, 3, 2)//3x2
   * const onlyCentralCol = picture.resize( 1, 0, 1, 2)//1x2
   * const additionalRowBefore = picture.resize(0, -1, 3, 3)//3x3
   * ```
   */
  public resize(
    offsetX: number,
    offsetY: number,
    width: number,
    height: number,
  ): Picture {
    return Picture.resize(this, offsetX, offsetY, width, height)
  }

  /**
   * Merges another picture onto current picture, the dimensions of current picture are left unchanged
   * @param {Picture} topLayer - picture on top
   * @param {number=} offsetX - X coordinate of picture `a` where x=0 for picture `b` is
   * @param {number=} offsetY - Y coordinate of picture `a` where y=0 for picture `b` is
   * @returns {Picture}
   * @example
   * ```
   * const white = [255, 255, 255, 255]
   * const data = new Uint8ClampedArray(new Array(9).fill(white).flat())
   * const reddish = [255, 0, 0, 63]
   * const red = [255, 0, 0, 255]
   * const a = new Picture(3, 3, data)
   * const b = new Picture(2, 1, new Uint8ClampedArray(reddish, red).flat())
   * //replaces center and centre-right pixels
   * const c = a.merge2(b, 1, 1)
   * //c.data is [
   * //255, 255, 255, 255,  255, 255, 255, 255,  255, 255, 255, 255
   * //255, 255, 255, 255,  255, 192, 192, 255,  255, 0, 0, 255
   * //255, 255, 255, 255,  255, 255, 255, 255,  255, 255, 255, 255
   * //]
   * ```
   */
  public merge2(
    topLayer: Picture,
    offsetX = 0,
    offsetY = 0,
  ): Picture {
    return Picture.merge2(this, topLayer, offsetX, offsetY)
  }

  /**
   * Creates a new Image with the dimensions of the 1st image.
   * The new image has rgb channels all being [0, 0, 0], the difference is in the alpha channel
   * 0 - fully transparent = the images are equal; 225 - images are completely different
   *
   * @param {Picture} block - a rectangle, that will be repeatedly (assuming it's smaller than the image) put onto image
   *  and compared against the region it's being put on
   * @param {number} offsetX
   * @param {number} offsetY
   */
  public createBlockSimilarityMask(
    block: Picture,
    offsetX: number = 0,
    offsetY: number = 0,
  ): Picture {
    return Picture.createBlockSimilarityMask(this, block, offsetX, offsetY)
  }
  ////////////STATIC////////////

  /**
   * Monochromizes the image - makes all the RGB channels have the same value
   * (thus everything is from white, to gray, to black)
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
          [...image.data.subarray(i, i + CHANNELS)] as RgbaArray,
          i / CHANNELS,
        ) as RgbaArray,
      )
    }

    return new Picture(
      image.width,
      image.height,
      new Uint8ClampedArray(data),
    )
  }

  /**
   * Convolves the image with given kernel
   * @param {Picture} image
   * @param {number[][]} kernel
   * @param {boolean=} keepEdges - whether to update image edges; turns black otherwise
   * @returns {Picture} convolved Picture
   * @example
   * ```
   * let picture: Picture
   * //image is unchaged
   * const sameImage = Picture.convolve(picture, Kernels.identy)
   * //image appears if it has been dragged down by 1 pixel
   * const slidenDown = Picture.convolve(picture, [[0, 0, 0], [0, 0, 0], [0, 1, 0]])
   * ```
   */
  public static convolve(
    image: Picture,
    kernel: number[][],
    keepEdges = true,
  ): Picture {
    const kernelWidth = kernel[0].length
    if (kernelWidth % 2 === 0) {
      throw new Error('Kernel is expected to have odd length')
    }
    const kernerHeight = kernel.length
    if (kernerHeight % 2 === 0) {
      throw new Error('Kernel is expected to have odd height')
    }
    const flattenKernel = kernel.flat()
    const data = new Uint8ClampedArray(image.data)
    let pixel = 0
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const coords = Picture.findCoordsToConvolveKernel(
          [image.width, image.height],
          [x, y],
          [kernelWidth, kernerHeight],
        )
        if (keepEdges && coords.some((x) => x === undefined)) {
          pixel++
          continue
        }
        const summedPixel = coords.reduce(
          (acc: [number, number, number], cur, i) => {
            if (cur === undefined) {
              return acc
            }
            acc[0] += image.data[cur * CHANNELS + 0] * flattenKernel[i]
            acc[1] += image.data[cur * CHANNELS + 1] * flattenKernel[i]
            acc[2] += image.data[cur * CHANNELS + 2] * flattenKernel[i]
            return acc
          },
          [0, 0, 0],
        )
        data.set([...summedPixel, DEFAULT_ALPHA], pixel * CHANNELS)
        pixel++
      }
    }
    return new Picture(image.width, image.height, data)
  }

  /**
   * Helper function to find which linear coordinates (indices) of the picture
   * correspond to which kernel coordinates (indices).
   *
   * @param {[number, number]} - [imageWidth, imageHeight]
   * @param {[number, number]} - [x, y] of the pixel
   * @param {[number, number]} - [kernelWidth, kernerHeight]
   * @returns {(number|undefined)[]} response's cell is `undefined` if the supposed kernel's match is out of bounds
   */
  public static findCoordsToConvolveKernel(
    [imageWidth, imageHeight]: [number, number],
    [x, y]: [number, number],
    [kernelWidth, kernerHeight]: [number, number],
  ): (number | undefined)[] {
    const answer: (number | undefined)[] = new Array(kernelWidth * kernerHeight)
    let kernelId = kernelWidth * kernerHeight
    let distanceToCenterX
    let distanceToCenterY = -Math.floor(kernerHeight / 2)
    for (let j = 0; j < kernerHeight; j++) {
      distanceToCenterX = -Math.floor(kernelWidth / 2)
      if (distanceToCenterY + y < 0 || distanceToCenterY + y >= imageHeight) {
        for (let i = 0; i < kernelWidth; i++) {
          answer[--kernelId] = undefined
        }
        distanceToCenterY++
        continue
      }
      for (let i = 0; i < kernelWidth; i++) {
        if (
          distanceToCenterX + x < 0 ||
          distanceToCenterX + x >= imageWidth
        ) {
          answer[--kernelId] = undefined
        } else {
          answer[--kernelId] = (distanceToCenterX + x) +
            imageWidth * (distanceToCenterY + y)
        }
        distanceToCenterX++
      }
      distanceToCenterY++
    }
    return answer
  }

  /**
   * Method that increases/decreases image dimensions without applying any stretching
   * @param {Picture} picture - picture to manipulate
   * @param {number} offsetX - start offset (negative results in new transparent pixels being added)
   * @param {number} offsetY - start offset (negative results in new transparent pixels being added)
   * @param {number} width - width of the new image
   * @param {number} height - height of the new image
   * @returns {Picture} new resized Picture
   * @example
   * ```
   * let picture: Picture//size 3x2
   * const nothingChanges = Picture.resize(picture, 0, 0, 3, 2)//3x2
   * const onlyCentralCol = Picture.resize(picture, 1, 0, 1, 2)//1x2
   * const additionalRowBefore = Picture.resize(picture, 0, -1, 3, 3)//3x3
   * ```
   */
  public static resize(
    picture: Picture,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number,
  ): Picture {
    const data = new Uint8ClampedArray(width * height * CHANNELS)
    let pixel = 0
    for (let i = offsetY; i < offsetY + height; i++) {
      for (let j = offsetX; j < offsetX + width; j++) {
        if (i >= 0 && i < picture.height && j >= 0 && j < picture.width) {
          const pixelOfOriginal = i * picture.width + j
          const originalPixel = picture.data.subarray(
            CHANNELS * pixelOfOriginal,
            CHANNELS * pixelOfOriginal + CHANNELS,
          )
          data.set(originalPixel, pixel * CHANNELS)
        }
        pixel++
      }
    }
    return new Picture(width, height, data)
  }

  /**
   * Merges picture `b` over picture `a`, the `a`'s dimensions are left unchanged
   * @param {Picture} a - picture below
   * @param {Picture} b - picture on top
   * @param {number=} offsetX - X coordinate of picture `a` where x=0 for picture `b` is
   * @param {number=} offsetY - Y coordinate of picture `a` where y=0 for picture `b` is
   * @returns {Picture}
   * @example
   * ```
   * const white = [255, 255, 255, 255]
   * const data = new Uint8ClampedArray(new Array(9).fill(white).flat())
   * const reddish = [255, 0, 0, 63]
   * const red = [255, 0, 0, 255]
   * const a = new Picture(3, 3, data)
   * const b = new Picture(2, 1, new Uint8ClampedArray(reddish, red).flat())
   * //replaces center and centre-right pixels
   * const c = Picture.merge2(a, b, 1, 1)
   * //c.data is [
   * //255, 255, 255, 255,  255, 255, 255, 255,  255, 255, 255, 255
   * //255, 255, 255, 255,  255, 192, 192, 255,  255, 0, 0, 255
   * //255, 255, 255, 255,  255, 255, 255, 255,  255, 255, 255, 255
   * //]
   * ```
   */
  public static merge2(
    a: Picture,
    b: Picture,
    offsetX = 0,
    offsetY = 0,
  ): Picture {
    const { width, height } = a.toObject()
    const data = new Uint8ClampedArray(a.data)
    for (let i = offsetY, y = 0; y < b.height; i++, y++) {
      if (i < 0 || i >= height) {
        continue
      }
      for (let j = offsetX, x = 0; x < b.width; j++, x++) {
        if (j < 0 || j >= width) {
          continue
        }
        const bPixel = b.width * y + x
        const pixelFromB = b.data.subarray(
          bPixel * CHANNELS,
          bPixel * CHANNELS + CHANNELS,
        )
        const aPixel = a.width * i + j
        const pixelFromA = a.data.subarray(
          aPixel * CHANNELS,
          aPixel * CHANNELS + CHANNELS,
        )
        const alphaA = pixelFromA[CHANNELS - 1] / MAX_PIXEL
        const alphaB = pixelFromB[CHANNELS - 1] / MAX_PIXEL
        if (alphaA === 0 && alphaB === 0) {
          continue
        }
        const pixel = new Array(CHANNELS)
        const newAlpha = alphaA * (1 - alphaB) + alphaB
        pixel[CHANNELS - 1] = newAlpha * MAX_PIXEL
        for (let k = 0; k < NO_ALPHA_CHANNELS; k++) {
          pixel[k] =
            (pixelFromA[k] * alphaA * (1 - alphaB) + pixelFromB[k] * alphaB) /
            newAlpha
        }
        data.set(pixel, aPixel * CHANNELS)
      }
    }
    return new Picture(width, height, data)
  }

  /**
   * Creates a new Image with the dimensions of the 1st image.
   * The new image has rgb channels all being [0, 0, 0], the difference is in the alpha channel
   * 0 - fully transparent = the images are equal; 225 - images are completely different
   *
   * @param main
   * @param block
   * @param offsetX
   * @param offsetY
   */
  public static createBlockSimilarityMask(
    main: Picture,
    block: Picture,
    offsetX: number = 0,
    offsetY: number = 0,
  ): Picture {
    if (
      offsetX < 0 || offsetX > block.width || offsetY < 0 ||
      offsetY > block.height
    ) {
      const realXoffset = (block.width + (offsetX % block.width)) % block.width
      const realYoffset = (block.height + (offsetY % block.height)) %
        block.height
      return Picture.createBlockSimilarityMask(
        main,
        block,
        realXoffset,
        realYoffset,
      )
    }
    const black = new Array(NO_ALPHA_CHANNELS).fill(0) as number[]
    const data = new Uint8ClampedArray(main.data.length)
    const totalPixelsInBlock = block.width * block.height
    const totalChannelsInBlock = totalPixelsInBlock / NO_ALPHA_CHANNELS

    const startingX = (offsetX % block.width - block.width) % block.width
    const startingY = (offsetY % block.height - block.height) % block.height

    for (let y = startingY; y < main.height; y += block.height) {
      for (let x = startingX; x < main.width; x += block.width) {
        const pixelIds: (undefined | number)[] = []
        const channels: (undefined | RgbaArray)[] = []
        for (let i = y; i < y + block.height; i++) {
          if (i < 0 || i >= main.height) {
            pixelIds.push(undefined)
            channels.push(...new Array(block.width).fill(undefined))
            continue
          }
          for (let j = x; j < x + block.width; j++) {
            if (j < 0 || j >= main.width) {
              pixelIds.push(undefined)
              channels.push(undefined)
            } else {
              const pixelId = j + i * main.width
              pixelIds.push(pixelId)
              channels.push(
                [...main.data.subarray(
                  pixelId * CHANNELS,
                  pixelId * CHANNELS + CHANNELS,
                )] as RgbaArray,
              )
            }
          }
        }
        const score = Comparator.compareMultiplePixels(
          channels,
          block.data,
          AlphaOption.multiply,
        ) / totalChannelsInBlock / block.width / block.height

        pixelIds.forEach((p) => {
          if (p !== undefined) {
            data.set([...black, score], p * CHANNELS)
          }
        })
      }
    }

    return new Picture(main.width, main.height, data)
  }
}
