import {
  CHANNELS,
  DEFAULT_ALPHA,
  MAX_PIXEL,
  NO_ALPHA_CHANNELS,
} from './common.ts'
import type { OptionalAlphaArray } from './common.ts'

/**
 * Enum for alpha channel comparisons
 * @enum {string}
 */
export enum AlphaOption {
  /** ignores alpha channels */
  ignore = 'ignore',
  /**
   * cares about alpha channels and multiplies pixel's rgb channels by their transparancy
   * for comparison sake
   * [127, 255, 255, 127] gets treated as if it were [63, 127, 127, 255]
   * applies to both pixels in comparison
   */
  multiply = 'multiply',
  /**
   * cares about alpha channels and multiplies pixel's rgb channels by their transparancy
   * for comparison sake
   * [127, 255, 255, 127] gets treated as if it were [63, 127, 127, 255]
   * applies to the `b` pixel only
   */
  ignoreFirst = 'ignoreFirst',
  /**
   * cares about alpha channels, however, instead of multiplying rgb channels by their
   * transparency, it just does simple `Math.abs(a[3] - b[3])`
   */
  compare = 'compare',
}

/**
 * Static class full of helper methods for pixel and image comparison
 */
export default class Comparator {
  /**
   * Compares a single pixel to another single pixel
   * @param {OptionalAlphaArray} a - a pixel represented by `[r, g, b, a?]` array
   * @param {OptionalAlphaArray} b - a pixel represented by `[r, g, b, a?]` array
   * @param {AlphaOption=} alpha - options used for pixel channel's comparison
   * @returns numeric value, the lower it is, the more similar pixels are
   */
  public static comparePixels(
    a: OptionalAlphaArray,
    b: OptionalAlphaArray,
    alpha: keyof typeof AlphaOption = AlphaOption.ignore,
  ): number {
    let answer = 0
    if (alpha === AlphaOption.ignore) {
      for (let i = 0; i < NO_ALPHA_CHANNELS; i++) {
        answer += Math.abs(a[i]! - b[i]!)
      }
      return answer
    }
    if (alpha === AlphaOption.compare) {
      answer = this.comparePixels(a, b, AlphaOption.ignore)
      answer += Math.abs(
        (a[CHANNELS - 1] ?? DEFAULT_ALPHA) - (b[CHANNELS - 1] ?? DEFAULT_ALPHA),
      )
      return answer
    }
    const bTransparency = (b[CHANNELS - 1] ?? DEFAULT_ALPHA) /
      MAX_PIXEL
    if (alpha === AlphaOption.ignoreFirst) {
      for (let i = 0; i < NO_ALPHA_CHANNELS; i++) {
        answer += Math.abs(a[i]! - b[i]! * bTransparency)
      }
      return answer
    }
    const aTransparency = (a[CHANNELS - 1] ?? DEFAULT_ALPHA) /
      MAX_PIXEL
    for (let i = 0; i < NO_ALPHA_CHANNELS; i++) {
      answer += Math.abs(a[i]! * aTransparency - b[i]! * bTransparency)
    }
    return answer
  }

  /**
   * Compares array of pixels to another array of pixels
   * @param {(OptionalAlphaArray | undefined)[]} a - a pixel array represented by an array of `[r, g, b, a?]` array
   * @param {(OptionalAlphaArray | undefined)[]} b - a pixel array represented by an array of `[r, g, b, a?]` array
   * @param {AlphaOption=} alpha - options used for pixel channel's comparison
   * @param {number=} undefinedScore - score for when the pixel is undefined
   * @returns numeric value, the lower it is, the more similar pixels are
   */
  public static compareMultiplePixels(
    a: (OptionalAlphaArray | undefined)[],
    b: (OptionalAlphaArray | undefined)[],
    alpha = AlphaOption.ignore,
    undefinedScore = 255 * NO_ALPHA_CHANNELS,
  ): number {
    if (a.length !== b.length) {
      throw new Error('Lengths of arrays must match')
    }
    let answer = 0
    for (let i = 0; i < a.length; i++) {
      if (a[i] === undefined || b[i] === undefined) {
        answer += undefinedScore
      } else {
        answer += this.comparePixels(a[i]!, b[i]!, alpha)
      }
    }
    return answer
  }
}
