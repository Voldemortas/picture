import { expect } from 'jsr:@std/expect@^1.0.17'
import { describe, it } from 'jsr:/@std/testing@^1.0.16/bdd'
import Picture, { Pixel } from '~lib/Picture.ts'

const WIDTH = 3
const HEIGHT = 2
//<! -- deno-fmt-ignore-start -->
const BINARY = [
  0, 0, 0, 0xFF, 0, 0, 0, 0xFF, 0, 0, 0, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
]
//<! -- deno-fmt-ignore-start -->
const GRAY = [
  60, 60, 60, 0xFF, 80, 80, 80, 0xFF, 80, 80, 80, 0xFF,
  85, 85, 85, 0xFF, 85, 85, 85, 0xFF, 85, 85, 85, 0xFF,
]
//<! -- deno-fmt-ignore-start -->
const RGBA = [
  60, 60, 60, 0xFF, 70, 80, 90, 0xFF, 70, 80, 90, 0xFF,
  0xFF, 0, 0, 0xFF, 0, 0xFF, 0, 0xFF, 0, 0, 0xFF, 0xFF,
]
//<! -- deno-fmt-ignore-start -->
const BINARY_RGBA = [
  0, 0, 0, 0xFF, 0, 0, 0xFF, 0xFF, 0, 0, 0xFF, 0xFF,
  0xFF, 0, 0, 0xFF, 0, 0xFF, 0, 0xFF, 0, 0, 0xFF, 0xFF,
]
//<! -- deno-fmt-ignore-start -->
const GROUPED_RGBA = [
  0, 0, 0, 0xFF, 0, 0, 127, 0xFF, 0, 0, 127, 0xFF,
  0xFF, 0, 0, 0xFF, 0, 0xFF, 0, 0xFF, 0, 0, 0xFF, 0xFF,
]
//<! -- deno-fmt-ignore-start -->
const DOUBLED_RGBA = [
  120, 120, 120, 0xFF, 140, 160, 180, 0xFF, 140, 160, 180, 0xFF,
  0xFF, 0, 0, 0xFF, 0, 0xFF, 0, 0xFF, 0, 0, 0xFF, 0xFF,
]
//<! -- deno-fmt-ignore-start -->
const SWAPPED_CHANNELS = [
  60, 60, 60, 0xFF, 80, 90, 70, 0xFF, 80, 90, 70, 0xFF,
  0, 0, 0xFF, 0xFF, 0xFF, 0, 0, 0xFF, 0, 0xFF, 0, 0xFF,
]
//<!-- deno-fmt-ignore-end -->
const RGB = RGBA.filter((_, i) => i % 4 !== 3)
const MONOCHROME_RATIOS: [number, number, number] = [1 / 3, 1 / 3, 1 / 3]
const IMAGE1 = {
  width: WIDTH,
  height: HEIGHT,
  data: new Uint8ClampedArray(RGBA),
}
const IMAGE2 = {
  width: WIDTH,
  height: HEIGHT,
  data: new Uint8ClampedArray(RGB),
}

describe('Picture', () => {
  const picture1 = new Picture(WIDTH, HEIGHT, new Uint8ClampedArray(RGBA))
  const picture2 = new Picture(WIDTH, HEIGHT, new Uint8ClampedArray(RGB))

  describe('encoding/decoding', () => {
    it('detects correct channel count when using new Picture()', () => {
      expect([...picture1.data]).toEqual(RGBA)
      expect(picture1.width).toEqual(WIDTH)
      expect(picture1.height).toEqual(HEIGHT)
      expect(picture1).toEqual(picture2)
    })
    it('detects correct channel count when using Picture.from()', () => {
      expect(Picture.From(IMAGE1)).toEqual(picture1)
      expect(Picture.From(IMAGE2)).toEqual(picture1)
    })
    it('converts Picture.toObject() properly', () => {
      expect(picture1.toObject()).toEqual({ ...IMAGE1, channels: 4 })
    })
    it('converts Picture.toNoAlphaObject() properly', () => {
      expect(picture1.toNoAlphaObject()).toEqual({ ...IMAGE2, channels: 3 })
    })
  })
  describe('pixel manipulation', () => {
    it('monochromizes properly', () => {
      expect(picture1.monochromize()).toEqual(
        Picture.monochromize(picture1),
      )
      expect([...picture1.monochromize(MONOCHROME_RATIOS).data]).toEqual(
        GRAY,
      )
    })
    it('binarizes colors properly', () => {
      expect(picture1.binarizeColors()).toEqual(
        Picture.binarizeColors(picture1),
      )
      expect([
        ...picture1.monochromize(MONOCHROME_RATIOS).binarizeColors(80).data,
      ]).toEqual(BINARY)
      expect([...picture1.binarizeColors(80).data]).toEqual(BINARY_RGBA)
    })
    it('groups colors properly', () => {
      expect(picture1.groupColors([1, 1, 1])).toEqual(
        Picture.groupColors(picture1, [1, 1, 1]),
      )
      expect([...picture1.groupColors([1, 1, 1]).data]).toEqual(GROUPED_RGBA)
    })
    describe('channel manipulation', () => {
      it('doubles rgb values', () => {
        expect(
          picture1.manipulateChannels(([r, g, b]) => [2 * r, 2 * g, 2 * b])
            .data,
        ).toEqual(
          Uint8ClampedArray.from(DOUBLED_RGBA),
        )
        expect(
          picture1.manipulateChannels((
            [r, g, b, a],
          ) => [2 * r, 2 * g, 2 * b, a]).data,
        ).toEqual(
          Uint8ClampedArray.from(DOUBLED_RGBA),
        )
      })
      it('swaps RGB channels to GBR', () => {
        expect(picture1.manipulateChannels(([r, g, b]) => [g, b, r]).data)
          .toEqual(
            Uint8ClampedArray.from(SWAPPED_CHANNELS),
          )
        expect(picture1.manipulateChannels(([r, g, b, a]) => [g, b, r, a]).data)
          .toEqual(
            Uint8ClampedArray.from(SWAPPED_CHANNELS),
          )
      })
    })
  })
})
describe('Pixel', () => {
  it('binarizes pixel', () => {
    const binarizeColors = Pixel.binarizeColors(127)
    expect(binarizeColors([0, 127, 255])).toStrictEqual([0, 0, 255, 255])
    expect(binarizeColors([0, 127, 255, 127])).toStrictEqual([0, 0, 255, 0])
  })
  it('groups pixel', () => {
    const groupColors = Pixel.groupColors([1, 2, 1])
    expect(groupColors([60, 120, 180])).toStrictEqual([0, 127, 127, 255])
    expect(groupColors([60, 120, 180, 127])).toStrictEqual([0, 127, 127, 127])
  })
  it('monochromizes pixel', () => {
    const monochromize = Pixel.monochromize([1 / 3, 1 / 3, 1 / 3])
    expect(monochromize([60, 120, 180])).toStrictEqual([120, 120, 120, 255])
    expect(monochromize([60, 120, 180, 3])).toStrictEqual([120, 120, 120, 3])
  })
})
