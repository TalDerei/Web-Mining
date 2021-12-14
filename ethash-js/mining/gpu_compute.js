/** Ethash on WebGPU */

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

/**
 * Perform GPU computations
 */
 (async () => {
    /** 
     * 1. Initialize WebGPU 
     */
    
        /** navigator.gpu.requestAdapter() accesses the GPU: 
         * returns javascript promise, asynchronously resolving with a GPU adapter 
         */
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) { 
            console.log("Failed to get GPU adapter!");
            return; 
        }
        /** adapter.requestDevice() returns a promise that resolves with a GPU device */
        const device = await adapter.requestDevice();

    /** 
     * 2. Create Matrices
     */
        var matrixDimension = window. prompt("Enter matrix size to run benchmark (e.g. 512): ");
        if (matrixDimension > 2048) {
            alert("Maximum matrix multiplication is 2048x2048");
            return;
        }
        const matrixElements = matrixDimension * matrixDimension;
    
        const matrixA = randomFloats(matrixElements);
        const matrixB = randomFloats(matrixElements);

        const matrixSize = matrixDimension * matrixDimension * 4;

    /** 
     * 3. Allocate Buffered Memory Accessible by GPU (GPU Memory Space) 
     */

        /** device.createBuffer() creates a GPU buffer object in a mapped state */
        const gpuBufferMatrixA = device.createBuffer({
            mappedAtCreation: true,
            size: matrixSize,
            usage: GPUBufferUsage.STORAGE,
        });

        const gpuBufferMatrixB = device.createBuffer({
            mappedAtCreation: true,
            size: matrixSize,
            usage: GPUBufferUsage.STORAGE,
        });

        /** getMappedRange() is a GPU buffer method that retrieves the raw data buffer by the GPU */
        const bufferMatrixA = gpuBufferMatrixA.getMappedRange();
        const bufferMatrixB = gpuBufferMatrixB.getMappedRange();

        /** Write bytes to buffer */ 
        new Float32Array(bufferMatrixA).set(matrixA);
        new Float32Array(bufferMatrixB).set(matrixB);

        /** Unmap() allows the GPU to take control -- and prevents race conditions where GPU/CPU access memory at the same time */
        gpuBufferMatrixA.unmap();
        gpuBufferMatrixB.unmap();

        /** Result matrix */
        // const bufferMatrixResult = Float32Array.BYTES_PER_ELEMENT * (2 + matrixA[0] * matrixB[1]);
        const gpuBufferMatrixResult = device.createBuffer({
            size: matrixSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });


    /**
     * 4. Computer Shaders
     */

        /** Compute shader code for multiplying matrices is written in WGSL, the WebGPU Shader Language.
         * device.createShaderModule() creates the actual compute shader module to be run
         */
        const localSize = 8;
        const wgslSource = `
          [[block]] struct Matrix {
             data: array<f32>;
          };

          [[group(0), binding(0)]] var<storage, read> matrixA : Matrix;
          [[group(0), binding(1)]] var<storage, read> matrixB : Matrix;
          [[group(0), binding(2)]] var<storage, write> matrixC : Matrix;

          [[stage(compute), workgroup_size(${localSize}, ${localSize})]]
          fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {
            if (global_id.x >= ${matrixDimension}u || global_id.y >= ${matrixDimension}u) {
              return;
            }
            
            let resultCell = global_id.xy;
            let resultIndex = resultCell.y + resultCell.x * ${matrixDimension}u;

            var result : f32 = 0.0;
            for (var i = 0u; i < ${matrixDimension}u; i = i + 1u) {
              let aCell = i + resultCell.x * ${matrixDimension}u;
              let bCell = resultCell.y + i * ${matrixDimension}u;
              result = result + matrixA.data[aCell] * matrixB.data[bCell];
            }

            matrixC.data[resultIndex] = result;
          }`;

    /**
     * 5. Pipeline Setup -- compute pipeline is the object that actually describes the compute operation we're going to perform
     */

        /** device.createComputePipeline() creates pipeline.
         * argument 1: bind group layout
         * argument 2: compute stage for compute shader
         */
         const computePipeline = device.createComputePipeline({
            compute: {
              module: device.createShaderModule({
                code: wgslSource
              }),
              entryPoint: "main"
            }
          });

    /**
     * 6. Bind Group Layouts and Bind Groups --
     *      Bind Group Layout defines the input/output interface expected by the shader
     *      Bind Group represents the actual input/output data for a shader
     */

        /** bindGroupLayout associated GPU buffers to entries */
        const bindGroupLayout = device.createBindGroupLayout({
            entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                type: "read-only-storage"
                }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                type: "read-only-storage"
                }
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                type: "storage"
                }
            }
            ]
        });

          const bindGroup = device.createBindGroup({
            layout: computePipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: gpuBufferMatrixA } },
              { binding: 1, resource: { buffer: gpuBufferMatrixB } },
              { binding: 2, resource: { buffer: gpuBufferMatrixResult } }
            ]
          });
  
        /** We've associated bind group with GPU buffers, and compute pipeline with bind group layout! */

    /**
     * 7. Commands To GPU
     */

        /** createCommandEncoder() creates a compute pass encoder used to encode GPU commands that perform matrix multiplcation */
        const commandEncoder = device.createCommandEncoder();

        /** Set pipeline */
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(computePipeline);

        /** Set bind group at index 0 (corresponding with group(0) in WGSL code) */
        passEncoder.setBindGroup(0, bindGroup);

        /** dispatch() is the process of encoding a command to execute a kernel function on a set of data */
        passEncoder.dispatch(
            Math.ceil(matrixDimension / localSize),
            Math.ceil(matrixDimension / localSize)
        );

        /* Ends the compute pass encoder */
        passEncoder.endPass();

    /** 
     * 8. Copy Buffer From GPU -- copy a GPU buffer to another GPU buffer and read it back
     */

        /** Second GPU buffer is created in an unmapped state this time */
        const gpuBufferResult = device.createBuffer({
            size: matrixSize,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
            
        /** encoder.copyBufferToBuffer() adds the command to command queue for later execution */
        commandEncoder.copyBufferToBuffer(
            gpuBufferMatrixResult,      /** Source Buffer */
            0,                          /** Source Offset */
            gpuBufferResult,            /** Destination Buffer */
            0,                          /** Destination Offset */
            matrixSize                  /** Size of Memory */
        );

        /** Start timing GPU execution */
        var start = window.performance.now();

        /** Finish encoding and submit commands to GPU device command queue */
        const gpuCommands = commandEncoder.finish();
        device.queue.submit([gpuCommands]);

    /** 
     * 9. Read Buffer From GPU
     */

        /** mapAsync() returns a promise that will resolve when the GPU buffer is mapped */
        await gpuBufferResult.mapAsync(GPUMapMode.READ);
        const finalBuffer = gpuBufferResult.getMappedRange();

        /** Finish timing GPU execution */
        var end = window.performance.now();

        /** Log results */
        console.log(new Float32Array(finalBuffer));
        alert(new Float32Array(finalBuffer));
        console.log(`Execution time on GPU is: ${end - start} ms`);
        alert(`Execution time on GPU is: ${end - start} ms`);
})();