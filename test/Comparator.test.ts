import { expect } from '@std/expect'
import { describe, it, test } from '@std/testing/bdd'
import Comparator, { AlphaOption } from '~lib/Comparator.ts'
import type { RgbaArray } from '~lib/common.ts'

const P0: RgbaArray = [255, 0, 0, 0]
const P1: RgbaArray = [255, 0, 0, 255]
const P2: RgbaArray = [0, 255, 0, 127]
const P3: RgbaArray = [0, 255, 0, 0]
const P4 = new Uint8ClampedArray(P3)

describe('Comparator', () => {
  describe('Comparator.comparePixels()', () => {
    test('AlphaOption.ignore', () => {
      expect(Comparator.comparePixels(P0, P1, AlphaOption.ignore))
        .toStrictEqual(0)
      expect(Comparator.comparePixels(P1, P0, AlphaOption.ignore))
        .toStrictEqual(0)
      expect(Comparator.comparePixels(P1, P2, AlphaOption.ignore))
        .toStrictEqual(255 + 255)
      expect(Comparator.comparePixels(P2, P1, AlphaOption.ignore))
        .toStrictEqual(255 + 255)
      expect(Comparator.comparePixels(P2, P4, AlphaOption.ignore))
        .toStrictEqual(0)
      expect(Comparator.comparePixels(P4, P2, AlphaOption.ignore))
        .toStrictEqual(0)
    })
    test('AlphaOption.ignoreFirst', () => {
      expect(Comparator.comparePixels(P0, P1, AlphaOption.ignoreFirst))
        .toStrictEqual(0)
      expect(Comparator.comparePixels(P1, P0, AlphaOption.ignoreFirst))
        .toStrictEqual(0)
      expect(Comparator.comparePixels(P1, P2, AlphaOption.ignoreFirst))
        .toStrictEqual(127 + 127)
      expect(Comparator.comparePixels(P2, P1, AlphaOption.ignoreFirst))
        .toStrictEqual(255 + 255)
      expect(Comparator.comparePixels(P2, P3, AlphaOption.ignoreFirst))
        .toStrictEqual(0)
      expect(Comparator.comparePixels(P3, P2, AlphaOption.ignoreFirst))
        .toStrictEqual(0)
      expect(Comparator.comparePixels([255, 0, 0], P2, AlphaOption.ignoreFirst))
        .toStrictEqual(127 + 127)
      expect(
        Comparator.comparePixels(
          [255, 0, 0],
          [0, 255, 0],
          AlphaOption.ignoreFirst,
        ),
      ).toStrictEqual(255 + 255)
    })
    test('AlphaOption.subtract', () => {
      expect(Comparator.comparePixels(P0, P1, AlphaOption.subtract))
        .toStrictEqual(255)
      expect(Comparator.comparePixels(P1, P0, AlphaOption.subtract))
        .toStrictEqual(255)
      expect(Comparator.comparePixels([255, 0, 0], P2, AlphaOption.subtract))
        .toStrictEqual(255 + 255 + 128)
      expect(
        Comparator.comparePixels(
          [255, 0, 0],
          [0, 255, 0],
          AlphaOption.subtract,
        ),
      ).toStrictEqual(255 + 255)
      expect(Comparator.comparePixels(P1, P2, AlphaOption.subtract))
        .toStrictEqual(255 + 255 + 128)
      expect(Comparator.comparePixels(P2, P1, AlphaOption.subtract))
        .toStrictEqual(255 + 255 + 128)
      expect(Comparator.comparePixels(P2, [254, 0, 0], AlphaOption.subtract))
        .toStrictEqual(254 + 255 + 128)
      expect(Comparator.comparePixels(P2, P3, AlphaOption.subtract))
        .toStrictEqual(127)
      expect(Comparator.comparePixels(P3, P2, AlphaOption.subtract))
        .toStrictEqual(127)
    })
    test('AlphaOption.multiply', () => {
      expect(Comparator.comparePixels(P0, P1, AlphaOption.multiply))
        .toStrictEqual(0)
      expect(Comparator.comparePixels(P1, P0, AlphaOption.multiply))
        .toStrictEqual(Comparator.comparePixels(P0, P1, AlphaOption.multiply))
      expect(Comparator.comparePixels([255, 0, 0], P2, AlphaOption.multiply))
        .toStrictEqual(127 + 127)
      expect(Comparator.comparePixels(P1, P2, AlphaOption.multiply))
        .toStrictEqual(127 + 127)
      expect(Comparator.comparePixels(P2, P1, AlphaOption.multiply))
        .toStrictEqual(Comparator.comparePixels(P1, P2, AlphaOption.multiply))
      expect(Comparator.comparePixels(P2, P3, AlphaOption.multiply))
        .toStrictEqual(0)
      expect(Comparator.comparePixels(P3, P2, AlphaOption.multiply))
        .toStrictEqual(Comparator.comparePixels(P2, P3, AlphaOption.multiply))
    })
  })
  describe('Comparator.compareMultiplePixels()', () => {
    const array0 = new Uint8ClampedArray([P1, P2, P2, P3].flat())
    const array1 = [P1, P2, P2, P3]
    const array2 = [P2, P1, P3, P2]
    test('AlphaOption.ignore', () => {
      expect(
        Comparator.compareMultiplePixels(array1, array2, AlphaOption.ignore),
      ).toStrictEqual(255 * 4)
    })
    test('AlphaOption.ignoreFirst', () => {
      expect(
        Comparator.compareMultiplePixels(
          array0,
          array2,
          AlphaOption.ignoreFirst,
        ),
      ).toStrictEqual(255 + 255 * 2 - 1)
    })
    test('AlphaOption.subtract', () => {
      expect(
        Comparator.compareMultiplePixels(array1, array2, AlphaOption.subtract),
      ).toStrictEqual(255 * 6)
    })
    test('AlphaOption.multiply', () => {
      expect(
        Comparator.compareMultiplePixels(array1, array2, AlphaOption.multiply),
      ).toStrictEqual(127 * 2 + 127 * 2)
    })
    test('undefinedScore', () => {
      expect(
        Comparator.compareMultiplePixels([...array1, undefined], [
          ...array2,
          P2,
        ], AlphaOption.ignore),
      ).toStrictEqual(255 * 4 + 255 * 3)
    })
    it('throws when array lengths missmatch', () => {
      expect(() => {
        Comparator.compareMultiplePixels(
          [...array1, undefined],
          array1,
          AlphaOption.ignore,
        )
      }).toThrow()
    })
  })
})
