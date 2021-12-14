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
     * 2. Create Matrices
     */

        // MessageIn is the input message. MessageFloat is the byte array converted from MessageIn
        const MessageIn = "1000";
        console.log("MessageIn is: " + MessageIn);
        var MessageFloatArray = [];
        var messageBuffer = new Buffer(MessageIn, 'utf8');
        for(var i = 0; i < messageBuffer.length; i++){
            MessageFloatArray.push(messageBuffer[i]);
        }
        console.log("MessageIn is: " + MessageFloatArray.toString());


        
        const MessageFloat = new Float32Array(MessageFloatArray);
        /** messageStruct B */
        // const messageStructB = new Float32Array([
        //     4, 2,
        //     1, 2, 
        //     3, 4,
        //     5, 6, 
        //     7, 8
        // ]);

    /** 
     * 3. Allocate Buffered Memory Accessible by GPU (GPU Memory Space) 
     */

        /** device.createBuffer() creates a GPU buffer object in a mapped state */
        const gpuBufferMessageFloat = device.createBuffer({
            mappedAtCreation: true,
            size: MessageFloat.byteLength,
            usage: GPUBufferUsage.STORAGE,
        });

        // const gpuBuffermessageStructB = device.createBuffer({
        //     mappedAtCreation: true,
        //     size: messageStructB.byteLength,
        //     usage: GPUBufferUsage.STORAGE,
        // });

        /** getMappedRange() is a GPU buffer method that retrieves the raw data buffer by the GPU */
        const bufferMessageFloat = gpuBufferMessageFloat.getMappedRange();
        //const buffermessageStructB = gpuBuffermessageStructB.getMappedRange();

        /** Write bytes to buffer */ 
        new Float32Array(bufferMessageFloat).set(MessageFloat);
        //new Float32Array(buffermessageStructB).set(messageStructB);

        /** Unmap() allows the GPU to take control -- and prevents race conditions where GPU/CPU access memory at the same time */
        gpuBufferMessageFloat.unmap();
        //gpuBuffermessageStructB.unmap();

        /** Result messageStruct */
        const buffermessageStructResult = MessageFloat.length;
        const gpuBuffermessageStructResult = device.createBuffer({
            size: buffermessageStructResult,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });

    /**
     * 4. Bind Group Layouts and Bind Groups --
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
            // {
            //     binding: 1,
            //     visibility: GPUShaderStage.COMPUTE,
            //     buffer: {
            //     type: "read-only-storage"
            //     }
            // },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                type: "storage"
                }
            }
            ]
        });

        const bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
            {
                binding: 0,
                resource: {
                buffer: gpuBufferMessageFloat
                }
            },
            // {
            //     binding: 1,
            //     resource: {
            //     buffer: gpuBuffermessageStructB
            //     }
            // },
            {
                binding: 1,
                resource: {
                buffer: gpuBuffermessageStructResult
                }
            }
            ]
        });

    /**
     * 5. Computer Shaders
     */

        /** Compute shader code for multiplying matrices is written in WGSL, the WebGPU Shader Language.
         * device.createShaderModule() creates the actual compute shader module to be run
         */
        const shaderModule = device.createShaderModule({
            code: `
            [[block]] struct messageStruct {
                size : f32;
                numbers: f32;
            };
        
            [[group(0), binding(0)]] var<storage, read> MessageFloat : messageStruct;
            [[group(0), binding(1)]] var<storage, write> resultmessageStruct : messageStruct;
        
            [[stage(compute), workgroup_size(8, 8)]]
            fn main() {
                resultmessageStruct.numbers = MessageFloat.numbers;
            }
            `
        });

    /**
     * 6. Pipeline Setup -- compute pipeline is the object that actually describes the compute operation we're going to perform
     */

        /** device.createComputePipeline() creates pipeline.
         * argument 1: bind group layout
         * argument 2: compute stage for compute shader
         */
        const computePipeline = device.createComputePipeline({
            layout: device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: shaderModule,
                entryPoint: "main"
            }
        });

        /** We've associated bind group with GPU buffers, and compute pipeline with bind group layout! */

    /**
     * 7. Commands To GPU
     */

        /** createCommandEncoder() creates a compute pass encoder used to encode GPU commands that perform messageStruct multiplcation */
        const commandEncoder = device.createCommandEncoder();

        /** Set pipeline */
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(computePipeline);

        /** Set bind group at index 0 (corresponding with group(0) in WGSL code) */
        passEncoder.setBindGroup(0, bindGroup);

        /** messageStruct dimensions */
        //const x = Math.ceil(MessageFloat[0] / 8); 
        //const y = Math.ceil(messageStructB[1] / 8);

        /** dispatch() is the process of encoding a command to execute a kernel function on a set of data */
        //passEncoder.dispatch(x, y);

        /* Ends the compute pass encoder */
        passEncoder.endPass();

    /** 
     * 8. Copy Buffer From GPU -- copy a GPU buffer to another GPU buffer and read it back
     */

        /** Second GPU buffer is created in an unmapped state this time */
        const gpuBufferResult = device.createBuffer({
            size: buffermessageStructResult,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
            
        /** encoder.copyBufferToBuffer() adds the command to command queue for later execution */
        commandEncoder.copyBufferToBuffer(
            gpuBuffermessageStructResult,      /** Source Buffer */
            0,                          /** Source Offset */
            gpuBufferResult,            /** Destination Buffer */
            0,                          /** Destination Offset */
            buffermessageStructResult          /** Size of Memory */
        );

        /** Finish encoding and submit commands to GPU device command queue */
        const gpuCommands = commandEncoder.finish();
        device.queue.submit([gpuCommands]);
        await gpuBufferResult.mapAsync(GPUMapMode.READ);
        const finalBuffer = gpuBufferResult.getMappedRange();

        /** Log result */
        console.log(finalBuffer.toString());
})();