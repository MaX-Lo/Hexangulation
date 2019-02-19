window.addEventListener("dragover", e => e.preventDefault());

window.addEventListener("drop", function(e) {
    handleDropEvent(e);
});


type Cube = {x: number, y: number, z: number};
type Hex = {q: number, r: number};

function handleDropEvent(evt: DragEvent) {
    evt.stopPropagation();
    evt.preventDefault();
    let files = evt.dataTransfer!.files;

    for (let i = 0, f; f = files[i]; i++) {
        if (!f.type.match('image.*')) {
            continue;
        }
        let reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = (e => {
            // @ts-ignore
            handleImageFile(e.target!.result);
        });
        break;
    }
}

function handleImageFile(path: string) {
    setProgress(0);
    const img = document.createElement('img') as HTMLImageElement;
    img.src = path;
    img.onload = () => {
        setProgress(100);
        setTimeout(() => {
            let transformedImage = document.getElementById('transformedImage') as HTMLImageElement;
            transformedImage.src = hexangulate(img);
        }, 10);

    };
}

function quadrilate(img: HTMLImageElement): string {
    let canvas: HTMLCanvasElement = document.createElement('canvas');
    //updateCanvasSize(img.width, img.height);
    canvas.width = img.width;
    canvas.height = img.height;

    let originalImg = imageToCanvas(img);
    let ctx = canvas.getContext('2d')!;

    let reductionFactor = 75;
    for (let x = 0; x < img.width; x += reductionFactor) {
        for (let y = 0; y < img.height; y += reductionFactor) {

            let recWidth = reductionFactor;
            if (x + reductionFactor >= img.width) recWidth = img.width - x - 1;
            let recHeight = reductionFactor;
            if (y + reductionFactor >= img.height) recHeight = img.height - y - 1;

            let averageColor = calcAverageColor(originalImg, x, y, recWidth, recHeight);
            ctx.fillStyle = `rgba(${averageColor[0]}, ${averageColor[1]}, ${averageColor[2]}, ${averageColor[3]})`;
            ctx.fillRect(x, y, recWidth, recHeight);
        }
    }

    return canvasToImageURL(canvas);
}

function calcAverageColor(canvas: HTMLCanvasElement, startX: number, startY: number, width: number, height: number) {
    if (startX + width >= canvas.width || startY + height >= canvas.height)
        throw new Error(`invalid arguments, size out ot of range is: ${canvas.width}x${canvas.height} given: ${startX}x${startY} w: ${width} h: ${height}`);

    let averageColor = [0, 0, 0, 0];
    let pixelData = canvas.getContext('2d')!.getImageData(startX, startY, width, height).data;
    for (let i = 0; i < pixelData.length; i += 4) {
        averageColor[0] += pixelData[i];
        averageColor[1] += pixelData[i + 1];
        averageColor[2] += pixelData[i + 2];
        averageColor[3] += pixelData[i + 3];
    }

    let pixelCount = width * height;
    averageColor = averageColor.map(val => Math.round(val / pixelCount));

    return averageColor;
}

function imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
    let canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d')!.drawImage(image, 0, 0, image.width, image.height);
    return canvas;
}

function canvasToImageURL(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL();
}

function hexangulate(img: HTMLImageElement): string {
    let originalImgCanvas = imageToCanvas(img);

    const startTime = new Date().getTime();

    let hexagonsAverageColor: {[pos: string]: number[]} = {};
    let origCtx = originalImgCanvas.getContext('2d');
    let pixelData = origCtx!.getImageData(0, 0, originalImgCanvas.width, originalImgCanvas.height).data;
    for (let i = 0; i < pixelData.length; i += 4) {
        let x = (i / 4) % img.width;
        let y = Math.floor((i / 4) / img.width);
        let posString = posToString(mapPixelToHexagon(x, y));
        if (!hexagonsAverageColor[posString])
            hexagonsAverageColor[posString] = [0, 0, 0, 0, 0];
        hexagonsAverageColor[posString][0] += pixelData[i];
        hexagonsAverageColor[posString][1] += pixelData[i + 1];
        hexagonsAverageColor[posString][2] += pixelData[i + 2];
        hexagonsAverageColor[posString][3] += pixelData[i + 3];
        hexagonsAverageColor[posString][4] += 1;
    }
    console.log(`summed up values: ${new Date().getTime() - startTime}`);

    for (let pos in hexagonsAverageColor) {
        let pixelCount = hexagonsAverageColor[pos][4];
        hexagonsAverageColor[pos] = hexagonsAverageColor[pos].map(val => Math.round(val / pixelCount));
    }
    console.log(`got averages: ${new Date().getTime() - startTime}`);

    let transformedCanvas = document.createElement('canvas') as HTMLCanvasElement;
    transformedCanvas.width = img.width;
    transformedCanvas.height = img.height;
    let ctx = transformedCanvas.getContext('2d')!;

    let imageData = ctx.createImageData(img.width, img.height);
    let data = imageData.data;
    let index = 0;
    for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
            let posString = posToString(mapPixelToHexagon(x, y));
            let color = hexagonsAverageColor[posString];
            data[index] = color[0];
            data[index + 1] = color[1];
            data[index + 2] = color[2];
            data[index + 3] = color[3];
            index += 4
        }
    }
    // console.log(`x: ${x} y: ${y} data: ${data}`);
    ctx.putImageData(imageData, 0, 0);
    console.log(`drew transformed image: ${(new Date().getTime() - startTime) / 1000}s`);

    return canvasToImageURL(transformedCanvas);
}

function setProgress(percentage: number) {
    let progressBar = document.getElementById('progressBar') as HTMLProgressElement;
    progressBar.value = percentage;
}

function getHexSizeSliderValue(): number {
    let slider = document.getElementById('sliderWithValue') as HTMLInputElement;
    return parseInt(slider.value);
}

function posToString(pos: Hex) {
    return `${pos.q}-${pos.r}`;
}

function mapPixelToHexagon(x: number, y: number): Hex {
    return pixelToFlatHex(x, y);
}

function pixelToFlatHex(x: number, y: number): Hex {
    let size = getHexSizeSliderValue();
    let q = (2. / 3 * x) / size;
    let r = (-1. / 3 * x + Math.sqrt(3) / 3 * y) / size;
    let hex = roundHex({q: q, r: r});
    return {q: hex.q, r: hex.r};
}

function roundHex(hex: Hex) {
    return cubeToAxial(roundCube(axialToCube(hex)));
}

function roundCube(cube: Cube): Cube {
    let rx = Math.round(cube.x);
    let ry = Math.round(cube.y);
    let rz = Math.round(cube.z);

    let x_diff = Math.abs(rx - cube.x);
    let y_diff = Math.abs(ry - cube.y);
    let z_diff = Math.abs(rz - cube.z);

    if (x_diff > y_diff && x_diff > z_diff) {
        rx = -ry - rz;
    } else if (y_diff > z_diff) {
        ry = -rx - rz;
    } else {
        rz = -rx - ry;
    }

    return {x: rx, y: ry, z: rz};
}

function cubeToAxial(cube: Cube): Hex {
    return {q: cube.x, r: cube.z};
}

function axialToCube(hex: Hex): Cube {
    return {x: hex.q, y: -hex.q - hex.r, z: hex.r};
}