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
    // Initialize WebGPU
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) { 
        console.log("Failed to get GPU adapter!");
        return; 
    }
    const device = await adapter.requestDevice();

    // Create variables, this can be an input
    const MessageIn = 10;

    const gpuBuffer = device.createBuffer({
        mappedAtCreation: true,
        size: byteSize(MessageIn),
        usage: GPUBufferUsage.STORAGE,
    });

    const bufferMessage= gpuBuffer.getMappedRange();
    new Float32Array(bufferMessage).set(MessageIn);
    gpuBuffer.unmap();

    const MessageResult = device.createBuffer({
        size: 256,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const bindGroupLayout = device.createBindGroupLayout({
        entries:[
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                type: "read-only-storage"
                }
            },{
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
        entries:[
            {
                binding: 0,
                resource:{
                    buffer: gpuBuffer
                }
            },{
                binding: 1,
                resource:{
                    buffer: MessageResult
                }
            }
        ]
    });

    const shaderModule = device.createShaderModule({
        code:`
            // I am taking messages in as a 32 bit float.
            // Tried to find some variable that will support 256 bits but I couldn't
            [[group(0), binding(0)]] var<storage, read> MessageIn : f32;
            [[group(0), binding(1)]] var<storage, write> resultMessage : f32;
            [[stage(compute)]]
            // Takes no input, returns nothing. Everything will be passed to the variable resultMessage
            fn main(){
                // Doing a left shift of the bits
                resultMessage <<= MessageIn;
            }
        `
    });

    const computePipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        }),
        compute: {
            module: shaderModule,
            entryPoint: "main"
        }
    });

    const commandEncoder = device.createCommandEncoder();

    const passEncoder = commandEncoder. beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, bindGroup);

    passEncoder.dispatch();
    passEncoder.endPass();

    const gpuBufferResult = device.createBuffer({
        size: gpuBuffer,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
        
    /** encoder.copyBufferToBuffer() adds the command to command queue for later execution */
    commandEncoder.copyBufferToBuffer(
        gpuBuffer,      /** Source Buffer */
        0,                          /** Source Offset */
        gpuBufferResult,            /** Destination Buffer */
        0,                          /** Destination Offset */
        MessageResult          /** Size of Memory */
    );

    /** Finish encoding and submit commands to GPU device command queue */
    const gpuCommands = commandEncoder.finish();
    device.queue.submit([gpuCommands]);

/** 
 * 9. Read Buffer From GPU
 */

    /** mapAsync() returns a promise that will resolve when the GPU buffer is mapped */
    await gpuBufferResult.mapAsync(GPUMapMode.READ);
    const finalBuffer = gpuBufferResult.getMappedRange();

    /** Log result */
    console.log(new Float32Array(finalBuffer));
})();