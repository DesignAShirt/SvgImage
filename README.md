# SvgImage

[![Build Status](https://secure.travis-ci.org/designashirt/SvgImage.png?branch=master)](http://travis-ci.org/designashirt/SvgImage)

Allows for cross-browser rendering of SVG to canvas in a way that does not leave canvas write-only (tainted).   

This isn't exactly a polyfill because of limitations in my thinky brain, but I'd like it to be.  See note below.

## Usage

See ./example/basic.html

### Plain

```javascript
var mySvg = '<svg> ... </svg>';
SvgImage(mySvg, function(err, img) {
  if (err) throw err; // handle
  context.drawImage(img, 0, 0);
});
```

### FabricJS

```javascript

```

## Documentation

Some browsers taint a canvas the second an SVG touches it, regardless of CORS.

SvgImage tests if a browser allows reading from a `<canvas>` that has an SVG.  If it does, nothing fancy, the browser just goes on being itself.

If it's not supported, an intermediate canvas is created for use with (canvg)[https://code.google.com/p/canvg/] -- which does the heavy lifting.

## Why you no fill polys?

Why isn't this a polyfill?  Because... in the 5 minutes I tried, I couldn't figure out a way to make it work.

The problem:

  * We need to be an Image object
  * And hook into the `src` property setter, to detect SVG (i'm sure it's possible somehow)
  * And do all that in a way that doesn't break other stuff.  canvas.context.drawImage(img)

Maybe wrap the Image constructor somehow and inject our stuffs on instantiation?  There also might be some browser-specific workarounds we could use since we're really only supporting IE and Safari here.

## License

MIT
