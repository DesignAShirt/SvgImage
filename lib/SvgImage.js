(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return factory(root);
    });
  } else if (typeof exports !== 'undefined') {
    module.exports = factory(root);
  } else {
    root.SvgImage = factory(root);
  }

}(this, function (root) {
  'use strict';

  var svgType = 'image/svg+xml'
    , svgDataUriPrefix = 'data:' + svgType
    , dataUriPrefix = svgDataUriPrefix + ';base64,'
    , reProto = /^(http[s]?:)?\/\//i
    , xmlSerializer = new XMLSerializer()
    , nativeSVG;

  function svgXmlToString(svgElement) {
    return xmlSerializer.serializeToString(svgElement);
  }

  function loadSvg(src, callback) {
    if (true === nativeSVG) {
      // if we can native and we get SVG data (element or string), just pass it along
      if (typeof src === 'object' && src.documentElement) {
        src = dataUriPrefix + btoa(unescape(encodeURIComponent(svgXmlToString(src.documentElement))));
      }
      else if (src.indexOf('<svg') > -1) {
        src = dataUriPrefix + btoa(unescape(encodeURIComponent(src)));
      }

      // console.log('loading image...', src);

      var img = new Image();
      img.onload = function() {
        callback(null, img);
      };
      img.onerror = function() {
        callback(new Error('Image could not be loaded'));
      };
      if (reProto.test(src)) {
        img.crossOrigin = 'anonymous'; // TODO: support use-credentials?
      }
      img.src = src;
    }
    else {
      // otherwise, no native svg support.  we need to
      // TODO: CanVG fallback that loads SVG to PNG with HiDPI support, etc.
      svgToPng(src, callback);
    }
  }

  function svgToPng(svg, callback) {
    var canvas = document.createElement('canvas')
      , context = canvas.getContext('2d');

    console.log('cors?', reProto.test(svg));

    canvg(canvas, svg, {
      ignoreAnimation: true,
      ignoreMouse: true,
      useCORS: reProto.test(svg),
      renderCallback: function() {
        var img = new Image();
        img.onload = function() {
          callback(null, img);
        };
        img.onerror = function() {
          callback(new Error('Image could not be loaded with canvg'));
        };
        img.src = canvas.toDataURL();
      }
    });
  }

  function wrapImage(img, name) {
    img.SvgImage = {
      name: name,
      update: function(svg, callback) {
        svgToImage(svg, function(err, updatedImage) {
          if (err) return callback(err);
          img.src = updatedImage.src;
          callback.call(img, null, img, updatedImage); // give callback this = img and pass some extra args, in case someone can find them useful
        });
      }
    };

    return img;
  }

  // function svgToImage(svg, callback) {
  //   if (typeof svg === 'object' || (typeof svg === 'string' && svg.indexOf('<svg') > -1)) {
  //     svg = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgXmlToString(svg))));
  //     // TODO: bind to DOM element and update image when DOM changes?  canvg would support via forceRedraw option
  //   }

  //   loadSvg(svg, function(err, img) {
  //     if (err) return callback(err);
  //     callback(null, img);
  //   });
  // }

  var SvgImage = function(svg, name, callback) {
    if (!svg) {
      throw new Error('Invalid SVG');
    }
    else if (typeof svg === 'string' && 0 === svg.indexOf('data:')) {
      throw new Error('Data uris are not supported');
    }
    else if (!callback) {
      callback = name;
      name = null;
    }

    // svgToImage(svg, function(err, img) {
    loadSvg(svg, function(err, img) {
      if (err) return callback(err);
      callback(null, wrapImage(img, name));
    });
  };

  var queued = [];
  function callQueue() {
    for (var i=0; i < queued.length; i++) {
      SvgImage.apply(root, queued[i]);
    }
    queued = [];
  }

  //////////////////////////////////////////////////////

  // test support for native svg in/out of canvas
  (function() {
    // this is technically async, but it returns almost immediately
    // setTimeout(..., 0) works

    // console.info('Testing native svg support...');

    var canvas = document.createElement('canvas')
      , context = canvas.getContext('2d')
      , img = new Image();

    function setNativeSupport(supported) {
      nativeSVG = supported;
      callQueue();
    }

    img.onload = function() {
      try {
        context.drawImage(img, 0, 0);
        if (0 === canvas.toDataURL().indexOf('data:image/png')) {
          setNativeSupport(true);
        }
        else {
          throw new Error('Weirdness getting dataURL from canvas');
        }
      }
      catch(err) {
        // console.warn('No native SVG support', err);
        setNativeSupport(false);
      }
    };

    img.onerror = function() {
      setNativeSupport(false);
    };

    // <svg xmlns="http://www.w3.org/2000/svg"></svg>
    img.src = dataUriPrefix + 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
  })();

  //////////////////////////////////////////////////////

  return function() {
    if (nativeSVG === void 0) {
      queued.push(arguments);
      return;
    }
    else {
      SvgImage.apply(root, arguments);
    }
  };
}));
