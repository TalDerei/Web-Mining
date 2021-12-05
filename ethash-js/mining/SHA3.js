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
    const MessageIn = "aaa";

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
})();