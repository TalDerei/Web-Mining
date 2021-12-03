/** Ethash on WebGPU */
const Ethash = require('../index.js');

/** 
 * Check if browser is WebGPU compatible 
 */
if (!navigator.gpu) {
    document.getElementById("not-supported").style.display = "block";
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
     * 2. Allocate Buffered Memory Accessible by GPU (GPU Memory Space) 
     */

        /** Size of memory (in bytes) */
        const sizeOfMemory = 4; // change

        /** Data that need to perform calculations on */
        const data = 0; // change

        /** device.createBuffer() creates a GPU buffer object in a mapped state */
        const gpuBuffer = device.createBuffer({
            mappedAtCreation: true,
            size: sizeOfMemory,
            usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
        });

        /** getMappedRange() is a GPU buffer method that retrieves the raw data buffer by the GPU */
        const bufferStorage = gpuBuffer.getMappedRange();

        /** Write bytes to buffer */ 
        new Uint8Array(bufferStorage).set([0, 1, 2, 3]);

        /** Unmap() allows the GPU to take control -- and prevents race conditions where GPU/CPU access memory at the same time */
        gpuBuffer.unmap();

    /** 
     * 3. Read Buffer Memory from GPU -- copy a GPU buffer to another GPU buffer and read it back
     */
        
        /** Second GPU buffer is created in an unmapped state this time */
        const gpuBufferNew = device.createBuffer({
            size: sizeOfMemory,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });

    /**
     * 4. Create GPU Command Encoder -- encode commands for copying buffer to buffer
     */

        /** device.createCommandEncoder() returns javascript object that builds batch of buffered commands for the GPU */
        const encoder = device.createCommandEncoder();

        /** encoder.copyBufferToBuffer() adds the command to command queue for later execution */
        encoder.copyBufferToBuffer(
            gpuBuffer,     /** Source Buffer */
            0,             /** Source Offset */
            gpuBufferNew,  /** Destination Buffer */
            0,             /** Destination Offset */
            sizeOfMemory   /** Size of Memory */
        );

        /** Finish encoding and submit commands to GPU device command queue */
        const commands = encoder.finish();
        device.queue.submit([commands]);

    /** 
     * 5. Read Buffer From GPU
     */

        /** mapAsync() returns a promise that will resolve when the GPU buffer is mapped */
        await gpuBufferNew.mapAsync(GPUMapMode.READ);

        const copyBuffer = gpuBufferNew.getMappedRange();

        console.log(new Uint8Array(copyBuffer));
})();