"use strict";
window.addEventListener("dragover", function (e) { return e.preventDefault(); });
window.addEventListener("drop", function (e) {
    handleDropEvent(e);
});
function handleDropEvent(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    var files = evt.dataTransfer.files;
    for (var i = 0, f = void 0; f = files[i]; i++) {
        if (!f.type.match('image.*')) {
            continue;
        }
        var reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = (function (e) {
            // @ts-ignore
            handleImageFile(e.target.result);
        });
        break;
    }
}
function handleImageFile(path) {
    setProgress(0);
    var img = document.createElement('img');
    img.src = path;
    img.onload = function () {
        setProgress(100);
        setTimeout(function () {
            var transformedImage = document.getElementById('transformedImage');
            transformedImage.src = hexangulate(img);
        }, 10);
    };
}
function quadrilate(img) {
    var canvas = document.createElement('canvas');
    //updateCanvasSize(img.width, img.height);
    canvas.width = img.width;
    canvas.height = img.height;
    var originalImg = imageToCanvas(img);
    var ctx = canvas.getContext('2d');
    var reductionFactor = 75;
    for (var x = 0; x < img.width; x += reductionFactor) {
        for (var y = 0; y < img.height; y += reductionFactor) {
            var recWidth = reductionFactor;
            if (x + reductionFactor >= img.width)
                recWidth = img.width - x - 1;
            var recHeight = reductionFactor;
            if (y + reductionFactor >= img.height)
                recHeight = img.height - y - 1;
            var averageColor = calcAverageColor(originalImg, x, y, recWidth, recHeight);
            ctx.fillStyle = "rgba(" + averageColor[0] + ", " + averageColor[1] + ", " + averageColor[2] + ", " + averageColor[3] + ")";
            ctx.fillRect(x, y, recWidth, recHeight);
        }
    }
    return canvasToImageURL(canvas);
}
function calcAverageColor(canvas, startX, startY, width, height) {
    if (startX + width >= canvas.width || startY + height >= canvas.height)
        throw new Error("invalid arguments, size out ot of range is: " + canvas.width + "x" + canvas.height + " given: " + startX + "x" + startY + " w: " + width + " h: " + height);
    var averageColor = [0, 0, 0, 0];
    var pixelData = canvas.getContext('2d').getImageData(startX, startY, width, height).data;
    for (var i = 0; i < pixelData.length; i += 4) {
        averageColor[0] += pixelData[i];
        averageColor[1] += pixelData[i + 1];
        averageColor[2] += pixelData[i + 2];
        averageColor[3] += pixelData[i + 3];
    }
    var pixelCount = width * height;
    averageColor = averageColor.map(function (val) { return Math.round(val / pixelCount); });
    return averageColor;
}
function imageToCanvas(image) {
    var canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
    return canvas;
}
function canvasToImageURL(canvas) {
    return canvas.toDataURL();
}
function hexangulate(img) {
    var originalImgCanvas = imageToCanvas(img);
    var startTime = new Date().getTime();
    var hexagonsAverageColor = {};
    var origCtx = originalImgCanvas.getContext('2d');
    var pixelData = origCtx.getImageData(0, 0, originalImgCanvas.width, originalImgCanvas.height).data;
    for (var i = 0; i < pixelData.length; i += 4) {
        var x = (i / 4) % img.width;
        var y = Math.floor((i / 4) / img.width);
        var posString = posToString(mapPixelToHexagon(x, y));
        if (!hexagonsAverageColor[posString])
            hexagonsAverageColor[posString] = [0, 0, 0, 0, 0];
        hexagonsAverageColor[posString][0] += pixelData[i];
        hexagonsAverageColor[posString][1] += pixelData[i + 1];
        hexagonsAverageColor[posString][2] += pixelData[i + 2];
        hexagonsAverageColor[posString][3] += pixelData[i + 3];
        hexagonsAverageColor[posString][4] += 1;
    }
    console.log("summed up values: " + (new Date().getTime() - startTime));
    var _loop_1 = function (pos) {
        var pixelCount = hexagonsAverageColor[pos][4];
        hexagonsAverageColor[pos] = hexagonsAverageColor[pos].map(function (val) { return Math.round(val / pixelCount); });
    };
    for (var pos in hexagonsAverageColor) {
        _loop_1(pos);
    }
    console.log("got averages: " + (new Date().getTime() - startTime));
    var transformedCanvas = document.createElement('canvas');
    transformedCanvas.width = img.width;
    transformedCanvas.height = img.height;
    var ctx = transformedCanvas.getContext('2d');
    var imageData = ctx.createImageData(img.width, img.height);
    var data = imageData.data;
    var index = 0;
    for (var y = 0; y < img.height; y++) {
        for (var x = 0; x < img.width; x++) {
            var posString = posToString(mapPixelToHexagon(x, y));
            var color = hexagonsAverageColor[posString];
            data[index] = color[0];
            data[index + 1] = color[1];
            data[index + 2] = color[2];
            data[index + 3] = color[3];
            index += 4;
        }
    }
    // console.log(`x: ${x} y: ${y} data: ${data}`);
    ctx.putImageData(imageData, 0, 0);
    console.log("drew transformed image: " + (new Date().getTime() - startTime) / 1000 + "s");
    return canvasToImageURL(transformedCanvas);
}
function setProgress(percentage) {
    var progressBar = document.getElementById('progressBar');
    progressBar.value = percentage;
}
function getHexSizeSliderValue() {
    var slider = document.getElementById('sliderWithValue');
    return parseInt(slider.value);
}
function posToString(pos) {
    return pos.q + "-" + pos.r;
}
function mapPixelToHexagon(x, y) {
    return pixelToFlatHex(x, y);
}
function pixelToFlatHex(x, y) {
    var size = getHexSizeSliderValue();
    var q = (2. / 3 * x) / size;
    var r = (-1. / 3 * x + Math.sqrt(3) / 3 * y) / size;
    var hex = roundHex({ q: q, r: r });
    return { q: hex.q, r: hex.r };
}
function roundHex(hex) {
    return cubeToAxial(roundCube(axialToCube(hex)));
}
function roundCube(cube) {
    var rx = Math.round(cube.x);
    var ry = Math.round(cube.y);
    var rz = Math.round(cube.z);
    var x_diff = Math.abs(rx - cube.x);
    var y_diff = Math.abs(ry - cube.y);
    var z_diff = Math.abs(rz - cube.z);
    if (x_diff > y_diff && x_diff > z_diff) {
        rx = -ry - rz;
    }
    else if (y_diff > z_diff) {
        ry = -rx - rz;
    }
    else {
        rz = -rx - ry;
    }
    return { x: rx, y: ry, z: rz };
}
function cubeToAxial(cube) {
    return { q: cube.x, r: cube.z };
}
function axialToCube(hex) {
    return { x: hex.q, y: -hex.q - hex.r, z: hex.r };
}
