// Input: GLSL source code and shader type
var type = glslang.EShLangFragment;
var source = `
    #version 150
    out vec4 finalColor;
    void main() {
        finalColor = vec4(1.0, 1.0, 1.0, 1.0);
    }`;

// Initialize Glslang
glslang.initialize();

// Compile shader
var shader = new glslang.Shader(type, source);

// Output: SPIR-V binary and disassembly
var binary = shader.data();
var disassembly = shader.disasm();

// Delete shader
shader.delete();

// Finalize Glslang
glslang.finalize();
