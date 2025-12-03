# Picture

## Links

github: [Voldemortas/Picture](https://github.com/Voldemortas/Picture)\
jsr: [@voldemortas/picture](https://jsr.io/@voldemortas/picture)

## Instalation

To add it to your dependencies use one of the following

```bash
deno add jsr:@voldemortas/picture
pnpm i jsr:@voldemortas/picture
yarn add jsr:@voldemortas/picture
npx jsr add @voldemortas/picture
bunx jsr add @voldemortas/picture
```

And import with

`import Picture, {Pixel} from "@voldemortas/picture";`\
or if using browser:\
`import Picture, {Pixel} from "https://esm.sh/jsr/@voldemortas/picture"`

## Usage

You can check the functionalit by visiting
https://raw.githack.com/Voldemortas/picture/master/example/example.html or
https://raw.githack.com/Voldemortas/picture/master/example/index.html.

### Preparation

You can get image data using
[`CanvasRenderingContext2D.getImageData()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData)
or other means if you're doing it serverside. And them simply

```ts
//import Picture, prepare context
const imageData = context.getImageData(0, 0, width, height)
const picture = Picture.from(imageData)
```

---

### Picture

#### Initializing and data structures

The `Picture` object/class works with 4 pixel channels: RGBA, however it
provides functionality to (de)construct it from/to RGB kind of data.

```ts
const WIDTH = 1
const HEIGHT = 2
//2 pixels, one green, another red, without alpha
const RGB = new Uint8ClampedArray([0, 255, 0, /*next pixel*/ 255, 0, 0])
//2 pixels, one green, another red, with alpha
const RGBA = new Uint8ClampedArray([0, 255, 0, 255, /*next*/ 255, 0, 0, 255])
const p1 = new Picture(WIDTH, HEIGHT, RGB)
const p2 = new Picture(WIDTH, HEIGHT, RGBA)
const p3 = Picture.From(WIDTH, HEIGHT, RGB)
const p4 = Picture.From(WIDTH, HEIGHT, RGBA)
// all pictures p1 to p4 hold the same data
const p5 = p1.toObject()
// {
//   width: 1,
//   height: 2,
//   data: RGBA
//   channels: 4,
// }
const p6 = p1.toNoAlphaObject()
// {
//   width: 1,
//   height: 2,
//   data: RGB
//   channels: 3,
// }
```

#### Pixel/channel manipulation

The library provides a way to manipulate each pixel by providing a callback of
type

```ts
(channels: number[], index?: number) => [number, number, number, number]
//or
(channels: number[], index?: number) => [number, number, number]
```

In the latter case the alpha becomes `255` (or `FF` in hex if you may). So you
can do stuff like

```ts
//makes the red channel green, green - blue, blue - red
picture.manipulateChannels(([r, g, b]) => [g, b, r])
//makes every 4th channel black
picture.manipulateChannels(([r, g, b], i) => i % 4 !== 0 ? [r, g, b]: [0, 0, 0]))
//picks up blue pixels and make them less red and more green thus making the blue appear more gray
//without altering other pixels
picture.manipulateChannels(([r, g, b]) => (b >= r && b >= g) ? [r * 1/3 + 2/3 * g, g, b] : [r, g, b])
```

![](example/blue.png)\
left - original, right - the last manipulation result

#### monochromize()

You can make the image grayscaled - black - gray - white making all the
non-alpha values the same.

```ts
//uses default monochromization
picture.monochromize()
//puts more weight for blue and less weight for green channels for monochromization
//note that it's better if the values add up to 1
picture.monochromize([2 / 3, 1 / 6, 3 / 6])
//monochromizes and then makes all darker shades appear more red
picture.monochromize().manipulate(([r]) => [255, r, r])
```

![](example/gray.png)\
left - original, right - the monochromized with the default values

#### binarizeColors()

makes the channel be capable of carrying either `0` or `255`, you can pass an
optional `tolerance` value to change when the channel becomes black/white

```ts
picture.binarize(200) //values higher than 200 become 255, values equal or below 200 become black
```

![](example/binary.png)\
left - original, right - the binarized

![](example/binary2.png)\
left - original, right - firsly monochromized, then binarized

#### groupColors

Similar to binarization, however it lets you have more than 2 extreme values.

```ts
picture.groupColors([1, 1, 1])
//each channel can have one of the possible 3 values (0, 127, 255)
//values between 0-84 become 0
//values between 85-170 become 127
//values between 171-255 become 255
//this because 256/3-1=84

picture.groupColors([1, 2, 1])
//each channel can have one of the possible 3 values (0, 127, 255)
//values between 0-63 become 0
//values between 64-191 become 127
//values between 192-255 become 255
//this because 256/4-1=63 yet the middle ratio is twice as big
//as the other
```

![](example/grouped.png)\
left - original, right - firsly monochromized, then grouped with `[1, 1, 1]`

### Pixel

`Pixel` is a static class full of helpers to manipulate a single pixel made of
`[r, g, b, a?]` channels.

All of the `Pixel` methods return a `PixelCallback`!

```ts
type PixelCallback = (
  rgb: [number, number, number, number?],
  index?: number,
) => [number, number, number, number?]
```

#### binarize colors

same as Picture.binarizeColors()

```ts
const pixel = [0, 127, 255]
Pixel.binarizeColors(pixel, 127) //[0, 0, 255]
//as 255 > 127, 127 <= 127 and 0 <= 127
```

#### monochromize

same as Picture.monochromize()

```ts
const pixel = [244, 127, 63]
//only considers the red channel when monochromizing data
const rgbRatio = [1, 0, 0]
Pixel.monochromize(rgbRatio)(pixel) //[244, 244, 244]
//because the red channel was 244
```

#### group colors

same as Picture.groupColors()

```ts
const pixel = [244, 127, 70]
Pixel.groupColors([1, 1, 1])(pixel) //[255, 127, 0]
Pixel.groupColors([1, 2, 1])(pixel) //[255, 127, 127]
```
