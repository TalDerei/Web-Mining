## Web-Mining on WebGPU API Standard
Achieve parallel hashing and mining for Ethereum on a browser using the WebGPU API 

## Packages
```ethash-js```
EthashJS is a javascript-based implementation of the Ethash Proof-of-Work (PoW) consensus algorithm. 
Repository forked from: https://github.com/ethereumjs/ethashjs

```hasher```
hasher/ folder describes the SHA256 hashing and blockchain validation workloads performed on the CPU and CUDA.

gpu-impl/: parallelized CUDA program was written in CUDA C to run on the GPU. The program performs the hashing and block validation for 20k Bitcoin blocks. Run the make utility 'make', and then run the binary'./cuda_test'. 

cpu-impl/: single-threaded, sequential algorithm written in C runs on the CPU, and servers as a control / baseline. The program performs the same hashing and block validation as the CUDA program. Run the make utility 'make', and then run the binary'./validation'. 

data/: .csv files that contain 20K blocks (headers and nonces) of the Bitcoin blockchain.

```matrix```
matrix/ folder describes the matrix multiplications workloads performed on WebGPU API. 

gpu_compute.js: matrix multiplication written in WebGPU with WGSL shaders to be executed on the GPU.

cpu_compute.js: matrix multiplication written in WebGPU with WGSL shaders to be executed on the CPU.

mining_html: html file that contains the injected javascript code from gpu_compute.js and cpu_compute.

In order to test them, you’ll need to run http-server -c-1 to start your local webserver (make sure you have the http-server command installed), navigate to local host http://127.0.0.1:8080, and then open up the webpage.html file on Google Chrome Canary Broswer or Chromium. Make sure that you’ve enabled webgpu flags on the browswer: chrome://flags/#enable-unsafe-webgpu.

```mining```
mining/ folder contains Ethash POW workloads. mining.js and verify.js javascript files perform the actual mining, but we're not currently using the repository to run any meaningful benchmarks on WebGPU since translating the javascript code to WGSL shader code is an enormous task. For testing purposes, we abstract these workloads as matrix multiplication and SHA-256/512 hashing subroutines. This serves as a generalized proof-of-concept for mining on WebGPU. There's nothing to be run in this folder. 
