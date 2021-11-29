/** Ethash on WebGPU */
const Ethash = require('../index.js')

/** 
 * Check if browser is WebGPU compatible 
 */
if (!navigator.gpu) {
    document.getElementById("not-supported").style.display = "block";
}

/**
 * Perform GPU computations
 */
async function computationGPU (inputs) {
    /** 
     * 1. Initialize WebGPU 
     */
    
        /** navigator.gpu.requestAdapter() returns javascript promise, asynchronously resolving the GPU adapter */
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) { 
            return; 
        }
        /** adapter.requestDevice() returns a promise for a GPU device */
        const device = await adapter.requestDevice();

    /** 
     * 2. Allocate Buffer Memory Accessible by GPU (GPU Memory Space) 
     */

        /** Size of memory (in bytes) */
        const sizeOfMemory = 10; // change

        /** Data that need to perform calculations on */
        const data = 0; // change

        /** device.createBuffer() creates a GPU buffer object mapped to a raw binary data buffer */
        const gpuBuffer = device.createBuffer({
            size: sizeOfMemory,
            usage: GPUBufferUsage.STORAGE,
            mappedAtCreation: true
        });

        /** Raw data buffer can be retrieved by the GPU by calling the GPU buffer method getMappedRange() */
        const floatBuffer = gpuBuffer.getMappedRange();

        /** Write bytes to buffer */ 
        new Float32Array(floatBuffer).set(data);

        /** Unmap() prevents race conditions where GPU/CPU access memory at the same time -- GPU takes control */
        gpuBuffer.unmap();

    /** 
     * 3. Read Buffer Memory on GPU -- copy a GPU buffer to another GPU buffer and read it back
     */
        
        /** Second GPU buffer is created in an unmapped state this time with device.createBuffer() */
        const gpuBufferNew = device.createBuffer({
            size: sizeOfMemory,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });

    
    /**
     * WORK IN PROGRESS
     */
}