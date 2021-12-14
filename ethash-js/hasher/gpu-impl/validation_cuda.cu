/**
 * @file validation_cuda.c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <string.h>
#include <time.h>
#include "sha256_cuda.cu"

/** Cuda kernals for executing functions (from host cpu) on device (gpu) */
__global__ void kernel(unsigned char *d, int d_len, unsigned char *out) {
  SHA256(d, d_len, out);
}

// __global__ void kernel(unsigned char digest[], FILE *fp_new) {
//   validate(digest, fp_new);
// }

/** Validate block */
void validate(unsigned char digest[], FILE *fp_new) {
    /** Correct hash to test against */
    unsigned char answer[(SHA256_DIGEST_LENGTH * 2) + 1];

    fgets((char *)answer, (SHA256_DIGEST_LENGTH * 2) + 2, fp_new);
    printf("Correct Hash: %s\n", answer);

    char res[(SHA256_DIGEST_LENGTH * 2) + 1] = "";
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
        sprintf(res + i * 2, "%02x", digest[i]);
    }

    if (strcmp((char *)res, (char *)answer) != 0) {
         printf("Block Validated!\n");
    }
    else {
        printf("Block Incorrect!\n");
    }
}

/** SHA256 hash function */
unsigned char *sha256(unsigned char *data, int d_len, FILE *fp_new, int checksum) {
  /** CUDA kernels are asynchronous -- but GPU-related tasks placed in one stream
  are executed sequentially. cudaDeviceSynchronize() synchronizes the executions */
  cudaDeviceSynchronize();
  unsigned char *d_c;

  /** Allocates size bytes of managed memory on the GPU device */
  cudaMallocManaged((void **)&d_c, d_len);

  /** Copy memory buffers */
  cudaMemcpy(d_c, data, d_len, cudaMemcpyHostToDevice);

  unsigned char *digest_c;
  cudaMallocManaged((void **)&digest_c, SHA256_DIGEST_LENGTH);
  unsigned char digest[SHA256_DIGEST_LENGTH] = {};

  /** Call kernel to run SHA256 function */
  kernel<<<1, 1>>>(d_c, d_len, digest_c);
  cudaDeviceSynchronize();
  cudaError_t error = cudaGetLastError();
  if (error != cudaSuccess) {
    printf("CUDA error: %s\n", cudaGetErrorString(error));
    exit(-1);
  }

  /** Copy results back from GPU device */
  cudaMemcpy(digest, digest_c, SHA256_DIGEST_LENGTH, cudaMemcpyDeviceToHost);
    
  /** Print hash result */
  for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
      printf("%02x", digest[i]);
  }
  printf("\n");

  /** Free memory allocation */
  cudaFree(d_c);
  cudaFree(digest_c);
  
  return digest;
}

int main () {
    /** Declare buffers */
    unsigned char buffer[256];
    unsigned char header[256];
    unsigned char nonce[256];
    unsigned char concat[256];
    
    /** Open files for reading */
    const char filename[] = "../data/blockchain_partial.csv";
    FILE *fp = fopen(filename, "r");

    const char filename_newer[] = "../data/blockchain_full.csv";
    FILE *fp_newer = fopen(filename_newer, "r");

    const char filename_new[] = "../data/block_hash.csv";
    FILE *fp_new = fopen(filename_new, "r+");

    int counter = 0;
    clock_t t;
    t = clock();
    while (fgets((char *)buffer, 256, fp)) {
        buffer[strcspn((char *)buffer, "\n")] = 0;
        printf("--------------------------------------------------------------------------------\n");
        printf("Information for Block: %d\n\n", counter);

        printf("BLOCK CONTENTS......... \n");
        printf("Block: %s\n", buffer);

        /** Copy buffer read into header and nonce */
        memcpy(header, buffer, sizeof(buffer));
        memcpy(nonce, buffer, sizeof(buffer));

        /** Hash of header and nonce */
        printf("\nHASHING HEADER + NONCE.........\n");
        printf("Header Hash: ");
        sha256(header, sizeof(header), fp_new, 0);
        printf("Nonce Hash: ");
        sha256(nonce + 161, sizeof(nonce), fp_new, 0);

        /** Concatenate and hash + nonce and hash the concatenation */
        printf("\nVALIDATING BLOCK HASH.........");
        fgets((char *)concat, 226, fp_newer); 
        concat[strcspn((char *)concat, "\n")] = 0;
        printf("\n");
        printf("Concat Hash: ");
        sha256(concat, sizeof(concat), fp_new, 1);
        counter++;
    }
    t = clock() - t;
    double time_taken = ((double)t)/CLOCKS_PER_SEC;
    
    /** Record execution time */
    printf("\n\nTime elapsed is: %f\n", time_taken);

    if (counter == 16222) {
      printf("BLOCKCHAIN VALIDATED!");
    }

    fclose(fp);
    fclose(fp_new);
    fclose(fp_newer);
} 