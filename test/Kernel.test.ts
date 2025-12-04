import { expect } from '@std/expect'
import { describe, it } from '@std/testing/bdd'
import { Kernel } from '~lib/Kernel.ts'

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
