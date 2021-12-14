
/** 
 * Check if browser is WebGPU compatible 
 */
if (!navigator.gpu) {
    document.getElementById("not-supported").style.display = "block";
}

function randomFloats(elementCount) {
    const matrix = [];
    for (let i = 0; i < elementCount; i++) {
        matrix.push(Math.random() * 10);
    }
    return matrix;
}

(async () => {
    var matrixDimension = window. prompt("Enter matrix size to run benchmark (e.g. 512): ");
    if (matrixDimension > 2048) {
        alert("Maximum matrix multiplication is 2048x2048");
        return;
    }
    const matrixElements = matrixDimension * matrixDimension;

    const matrixA = randomFloats(matrixElements);
    const matrixB = randomFloats(matrixElements);

    const resultArray = new ArrayBuffer(matrixA.length * 4);
    const result = new Float32Array(resultArray);

    const timeBefore = window.performance.now();

    for (let resultX = 0; resultX < matrixDimension; resultX++) {
        for (let resultY = 0; resultY < matrixDimension; resultY++) {
        let sum = 0.0;

        for (let i = 0; i < matrixDimension; i++) {
            const aCell = i + resultX * matrixDimension;
            const bCell = resultY + i * matrixDimension;
            sum += matrixA[aCell] * matrixB[bCell];
        }

        const resultCell = resultY + resultX * matrixDimension;
        result[resultCell] = sum;
        }
    }

    const elapsedTime = window.performance.now() - timeBefore;
    console.log(result);
    alert(result);
    console.log(`Execution time on CPU is: ${elapsedTime} ms`);
    alert(`Execution time on CPU is: ${elapsedTime} ms`);
})();