window.addEventListener("dragover", e => e.preventDefault());

window.addEventListener("drop", function(e) {
    drop(e);
});

window.addEventListener("click", function (e) {
    drop(e);
});

function drop(e: Event) {
    e.preventDefault();
    console.log(e);
    alert("drooped");

    let data = '../res/img/up-arrow.png';
    hexangulate(data);
}

function hexangulate(rawImage: string) {
    let img = document.getElementById('uploadedImage') as HTMLImageElement;
    let transformedImg = document.createElement('canvas') as HTMLCanvasElement;
    transformedImg.width = img.width;
    transformedImg.height = img.height;

    img.src = rawImage;

    // wait until image is loaded
    img.onload = function () {
        let originalImg: HTMLCanvasElement = document.createElement('canvas');
        originalImg.width = img.width;
        originalImg.height = img.height;
        originalImg.getContext('2d')!.drawImage(img, 0, 0, img.width, img.height);

        let ctx = transformedImg.getContext('2d');
        if (ctx === null) return;
        ctx.rect(0, 0, 10, 10);
        ctx.fill();

        let reductionFactor = 25;
        for (let x = 0; x < img.width; x += reductionFactor) {
            for (let y = 0; y < img.height; y += reductionFactor) {

                let recWidth = reductionFactor;
                if (x + reductionFactor >= img.width) recWidth = img.width - x - 1;
                let recHeight= reductionFactor;
                if (y + reductionFactor >= img.height) recHeight = img.height - y - 1;

                let averageColor = calcAverageColor(originalImg, x, y, recWidth, recHeight);
                ctx.rect(x, y, recWidth, recHeight);
                console.log("average color " + `rgba(${averageColor[0]}, ${averageColor[1]}, ${averageColor[2]}, ${averageColor[3]})`);
                ctx.fillStyle = `rgba(${averageColor[0]}, ${averageColor[1]}, ${averageColor[2]}, ${averageColor[3]})`;
                ctx.fill()
            }
        }

        document.body.appendChild(transformedImg);
    };
}

function calcAverageColor(canvas: HTMLCanvasElement, startX: number, startY: number, width: number, height: number) {
    if (startX + width >= canvas.width || startY + height >= canvas.height)
        throw new Error(`invalid arguments, size out ot of range is: ${canvas.width}x${canvas.height} given: ${startX}x${startY} w: ${width} h: ${height}`);

    let ctx = canvas.getContext('2d');
    let pixelData = ctx!.getImageData(200, 200, width, height).data;
    console.log(pixelData);

    let averageColor = [0, 0, 0, 0];
    for (let x = startX; x < startX + width; x++) {
        for (let y = startY; y < startY + height; y++) {
            let pixelData = ctx!.getImageData(200, 200, 1, 1).data;
            averageColor[0] += pixelData[0];
            averageColor[1] += pixelData[1];
            averageColor[2] += pixelData[2];
            averageColor[3] += pixelData[3];
        }
    }

    let pixelCount = width * height;
    averageColor.forEach(val => Math.round(val/pixelCount));

    return averageColor;
}