/**
 * Kernels for convulutions
 * https://en.wikipedia.org/wiki/Kernel_(image_processing)
 */
export const Kernel: {
  identity: number[][]
  boxBlur: number[][]
  ridge1: number[][]
  ridge2: number[][]
  gausianBlur3: number[][]
  gausianBlur5: number[][]
  unsharpen: number[][]
  top: number[][]
  bottom: number[][]
  left: number[][]
  right: number[][]
  topLeft: number[][]
  topRight: number[][]
  bottomLeft: number[][]
  bottomRight: number[][]
} = {
  identity: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
  boxBlur: [
    new Array(3).fill(1 / 9),
    new Array(3).fill(1 / 9),
    new Array(3).fill(1 / 9),
  ] as number[][],
  ridge1: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]],
  ridge2: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]],
  gausianBlur3: [
    [1 / 16, 2 / 16, 1 / 16],
    [2 / 16, 4 / 16, 2 / 16],
    [1 / 16, 2 / 16, 1 / 16],
  ],
  gausianBlur5: [
    [1 / 256, 4 / 256, 6 / 256, 4 / 256, 1 / 256],
    [4 / 256, 16 / 256, 24 / 256, 16 / 256, 4 / 256],
    [6 / 256, 24 / 256, 36 / 256, 24 / 256, 6 / 256],
    [4 / 256, 16 / 256, 24 / 256, 16 / 256, 4 / 256],
    [1 / 256, 4 / 256, 6 / 256, 4 / 256, 1 / 256],
  ],
  unsharpen: [
    [1 / 256, 4 / 256, 6 / 256, 4 / 256, 1 / 256],
    [4 / 256, 16 / 256, 24 / 256, 16 / 256, 4 / 256],
    [6 / 256, 24 / 256, -476 / 256, 24 / 256, 6 / 256],
    [4 / 256, 16 / 256, 24 / 256, 16 / 256, 4 / 256],
    [1 / 256, 4 / 256, 6 / 256, 4 / 256, 1 / 256],
  ].map((x) => x.map((y) => -y)),
  top: [[1, 2, 1], [0, 0, 0], [-1, -2, -1]],
  bottom: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
  left: [[1, 0, -1], [2, 0, -2], [1, 0, -1]],
  right: [[-1, 0, 1], [-2, 0, 2], [1, 0, -1]],
  topLeft: [[2, 1, 0], [1, 0, -1], [0, -1, -2]],
  topRight: [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]],
  bottomLeft: [[0, -1, -2], [1, 0, -1], [2, 1, 0]],
  bottomRight: [[-2, -1, 0], [-1, 0, 1], [0, 1, 2]],
}
