import {
  CHANNELS,
  DEFAULT_ALPHA,
  MAX_PIXEL,
  NO_ALPHA_CHANNELS,
} from './common.ts'
import type { OptionalAlphaArray, RgbaArray } from './common.ts'

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
  subtract = 'subtract',
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
    a: OptionalAlphaArray | Uint8ClampedArray,
    b: OptionalAlphaArray | Uint8ClampedArray,
    alpha: keyof typeof AlphaOption = AlphaOption.ignore,
  ): number {
    if (a instanceof Uint8ClampedArray || b instanceof Uint8ClampedArray) {
      const escapedA = a instanceof Uint8ClampedArray
        ? [...a.values()] as OptionalAlphaArray
        : a
      const escapedB = b instanceof Uint8ClampedArray
        ? [...b.values()] as OptionalAlphaArray
        : b
      return this.comparePixels(escapedA, escapedB, alpha)
    }
    let answer = 0
    if (alpha === AlphaOption.ignore) {
      for (let i = 0; i < NO_ALPHA_CHANNELS; i++) {
        answer += Math.abs(a[i]! - b[i]!)
      }
      return answer
    }
    if (alpha === AlphaOption.subtract) {
      answer = this.comparePixels(a, b, AlphaOption.ignore)
      answer += Math.abs(
        (a[CHANNELS - 1] ?? DEFAULT_ALPHA) - (b[CHANNELS - 1] ?? DEFAULT_ALPHA),
      )
      return answer
    }
    function getTranparency(arr: OptionalAlphaArray) {
      return (arr[CHANNELS - 1] ?? DEFAULT_ALPHA) / MAX_PIXEL
    }
    const aTransparency = alpha === AlphaOption.ignoreFirst
      ? 1
      : getTranparency(a)
    const bTransparency = getTranparency(b)

    for (let i = 0; i < NO_ALPHA_CHANNELS; i++) {
      answer += Math.abs(a[i]! - b[i]!)
    }
    return answer * aTransparency * bTransparency
  }

  /**
   * Compares array of pixels to another array of pixels
   * @param {(OptionalAlphaArray | undefined)[] | Uint8ClampedArray} a - a pixel array represented by an array of `[r, g, b, a?]` or Uint8ClampedArray
   * @param {(OptionalAlphaArray | undefined)[] | Uint8ClampedArray} b - a pixel array represented by an array of `[r, g, b, a?]` or Uint8ClampedArray
   * @param {AlphaOption=} alpha - options used for pixel channel's comparison
   * @param {number=} undefinedScore - score for when the pixel is undefined
   * @returns numeric value, the lower it is, the more similar pixels are
   */
  public static compareMultiplePixels(
    a: (OptionalAlphaArray | undefined)[] | Uint8ClampedArray,
    b: (OptionalAlphaArray | undefined)[] | Uint8ClampedArray,
    alpha = AlphaOption.ignore,
    undefinedScore = 255 * NO_ALPHA_CHANNELS,
  ): number {
    if (a instanceof Uint8ClampedArray || b instanceof Uint8ClampedArray) {
      const escapedA = a instanceof Uint8ClampedArray
        ? groupArr([...a.values()], 4) as RgbaArray[]
        : a
      const escapedB = b instanceof Uint8ClampedArray
        ? groupArr([...b.values()], 4) as RgbaArray[]
        : b
      return this.compareMultiplePixels(
        escapedA,
        escapedB,
        alpha,
        undefinedScore,
      )
    }
    if (a.length !== b.length) {
      throw new Error('Lengths of arrays must match')
    }
    let answer = 0
    for (let i = 0; i < a.length; i++) {
      if (a[i] === undefined || b[i] === undefined) {
        answer += undefinedScore
      } else {
        answer += this.comparePixels(
          a[i]! as OptionalAlphaArray,
          b[i]! as OptionalAlphaArray,
          alpha,
        )
      }
    }
    return answer
  }
}

function groupArr<T>(data: T[], n: number): T[][] {
  const group: T[][] = []
  for (let i = 0, j = 0; i < data.length; i++) {
    if (i >= n && i % n === 0) {
      j++
    }
    group[j] = group[j] || []
    group[j].push(data[i])
  }
  return group
}
