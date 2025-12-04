import { expect } from '@std/expect'
import { describe, it } from '@std/testing/bdd'
import Pixel from '~lib/Pixel.ts'

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
