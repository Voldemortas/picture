import { expect } from 'jsr:@std/expect@^1.0.17'
import { describe, it } from 'jsr:/@std/testing@^1.0.16/bdd'
import Picture, { Kernel, Pixel } from '~lib/Picture.ts'

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
    it('throws when image Data missmatches width and height', () => {
      expect(() => {
        new Picture(WIDTH, HEIGHT, new Uint8ClampedArray(RGBA).subarray(0, RGBA.length - 1))
      }).toThrow()
      expect(() => {
        new Picture(WIDTH, HEIGHT, new Uint8ClampedArray(RGB).subarray(0, RGB.length - 1))
      }).toThrow()
      expect(() => {
        Picture.From({ width: WIDTH, height: HEIGHT, data: new Uint8ClampedArray(RGBA).subarray(0, RGBA.length - 1) })
      }).toThrow()
      expect(() => {
        Picture.From({ width: WIDTH, height: HEIGHT, data: new Uint8ClampedArray(RGB).subarray(0, RGB.length - 1) })
      }).toThrow()
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
  describe('convolve', () => {
    const data = [
      20,
      20,
      20,
      20,
      110,
      20,
      20,
      20,
      20,
    ].flatMap((x) => [x, x, x, 0xFF])

    const data2 = [
      20,
      20,
      20,
      20,
      30,
      20,
      20,
      20,
      20,
    ].flatMap((x) => [x, x, x, 0xFF])

    const picture = new Picture(3, 3, new Uint8ClampedArray(data))
    expect([...picture.convolve(Kernel.identity).data.values()]).toEqual(data)
    expect([...picture.convolve(Kernel.boxBlur).data.values()]).toEqual(data2)
  })
  it('throws when kernel is not odd x odd', () => {
    const picture = new Picture(WIDTH, HEIGHT, new Uint8ClampedArray(RGB))
    expect(() => { picture.convolve([[1, 1], [1, 1], [1, 1]]) }).toThrow()
    expect(() => { picture.convolve([[1, 1, 1], [1, 1, 1]]) }).toThrow()
  })
  describe('findCoordsToConvolveKernel', () => {
    /**
     * MAP
     * 0 1 2
     * 3 4 5
     * 6 7 8
     */
    const expectedCoordinates: (number | undefined)[][] = [
      [4, 3, undefined, 1, 0, undefined, undefined, undefined, undefined],
      [5, 4, 3, 2, 1, 0, undefined, undefined, undefined],
      [undefined, 5, 4, undefined, 2, 1, undefined, undefined, undefined],
      [7, 6, undefined, 4, 3, undefined, 1, 0, undefined],
      [8, 7, 6, 5, 4, 3, 2, 1, 0],
      [undefined, 8, 7, undefined, 5, 4, undefined, 2, 1],
      [undefined, undefined, undefined, 7, 6, undefined, 4, 3, undefined],
      [undefined, undefined, undefined, 8, 7, 6, 5, 4, 3],
      [undefined, undefined, undefined, undefined, 8, 7, undefined, 5, 4],
    ]
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        it(`tests coordinate(${j}, ${i})`, () => {
          expect(Picture.findCoordsToConvolveKernel([3, 3], [j, i], [3, 3]))
            .toStrictEqual(expectedCoordinates[i * 3 + j])
        })
      }
    }
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
describe('Kernel', () => {
  type goodKey = keyof typeof Kernel
  const kernelValues: Record<goodKey, number> = {
    identity: 1,
    boxBlur: 1,
    ridge1: 0,
    ridge2: 0,
    gausianBlur3: 1,
    gausianBlur5: 1,
    unsharpen: 1,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    topLeft: 0,
    topRight: 0,
    bottomLeft: 0,
    bottomRight: 0,
  }
  //@ts-ignore key: goodKey
  Object.keys(Kernel).forEach((key: goodKey) => {
    it(`checks if Kernel.${key} add up to ${kernelValues[key]}`, () => {
      expect(
        Kernel[key].flat().reduce(
          (acc, cur) => acc + cur,
          0,
        ),
      ).toBeCloseTo(kernelValues[key])
    })
  })
})
