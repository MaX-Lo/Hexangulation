"use strict";
window.addEventListener("dragover", function (e) { return e.preventDefault(); });
window.addEventListener("drop", function (e) {
    drop(e);
});
window.addEventListener("click", function (e) {
    drop(e);
});
function drop(e) {
    e.preventDefault();
    console.log(e);
    alert("drooped");
    var data = '../res/img/up-arrow.png';
    hexangulate(data);
}
function hexangulate(rawImage) {
    var img = document.getElementById('uploadedImage');
    var transformedImg = document.createElement('canvas');
    transformedImg.width = img.width;
    transformedImg.height = img.height;
    img.src = rawImage;
    // wait until image is loaded
    img.onload = function () {
        var originalImg = document.createElement('canvas');
        originalImg.width = img.width;
        originalImg.height = img.height;
        originalImg.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
        var ctx = transformedImg.getContext('2d');
        if (ctx === null)
            return;
        ctx.rect(0, 0, 10, 10);
        ctx.fill();
        var reductionFactor = 25;
        for (var x = 0; x < img.width; x += reductionFactor) {
            for (var y = 0; y < img.height; y += reductionFactor) {
                var recWidth = reductionFactor;
                if (x + reductionFactor >= img.width)
                    recWidth = img.width - x - 1;
                var recHeight = reductionFactor;
                if (y + reductionFactor >= img.height)
                    recHeight = img.height - y - 1;
                var averageColor = calcAverageColor(originalImg, x, y, recWidth, recHeight);
                ctx.rect(x, y, recWidth, recHeight);
                console.log("average color " + ("rgba(" + averageColor[0] + ", " + averageColor[1] + ", " + averageColor[2] + ", " + averageColor[3] + ")"));
                ctx.fillStyle = "rgba(" + averageColor[0] + ", " + averageColor[1] + ", " + averageColor[2] + ", " + averageColor[3] + ")";
                ctx.fill();
            }
        }
        document.body.appendChild(transformedImg);
    };
}
function calcAverageColor(canvas, startX, startY, width, height) {
    if (startX + width >= canvas.width || startY + height >= canvas.height)
        throw new Error("invalid arguments, size out ot of range is: " + canvas.width + "x" + canvas.height + " given: " + startX + "x" + startY + " w: " + width + " h: " + height);
    var ctx = canvas.getContext('2d');
    var pixelData = ctx.getImageData(200, 200, width, height).data;
    console.log(pixelData);
    var averageColor = [0, 0, 0, 0];
    for (var x = startX; x < startX + width; x++) {
        for (var y = startY; y < startY + height; y++) {
            var pixelData_1 = ctx.getImageData(200, 200, 1, 1).data;
            averageColor[0] += pixelData_1[0];
            averageColor[1] += pixelData_1[1];
            averageColor[2] += pixelData_1[2];
            averageColor[3] += pixelData_1[3];
        }
    }
    var pixelCount = width * height;
    averageColor.forEach(function (val) { return Math.round(val / pixelCount); });
    return averageColor;
}
