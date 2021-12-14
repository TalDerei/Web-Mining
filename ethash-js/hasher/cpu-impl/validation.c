/**
 * @file validation.c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <string.h>
#include <time.h>
#include "sha256.h"

/** Validate block */
void validate(unsigned char digest[], FILE *fp_new) {
    /** Correct hash to test against */
    unsigned char answer[(SHA256_DIGEST_LENGTH * 2) + 1];

    fgets(answer, 256, fp_new);
    printf("Correct Hash: %s\n", answer);

    char res[(SHA256_DIGEST_LENGTH * 2) + 1] = "";
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
        sprintf(res + i * 2, "%02x", digest[i]);
    }

    if (strcmp(res, answer) != 0) {
         printf("Block Validated!\n");
    }
    else {
        printf("Block Incorrect!\n");
    }
}

/** SHA256 hash function */
char *sha256(unsigned char *data, int d_len, FILE *fp_new, int checksum) {
    /** Initialize empty 32-byte buffer */
    unsigned char digest[SHA256_DIGEST_LENGTH] = {};

    /** SHA256_CTX context */
	SHA256_CTX ctx;

    /* Call initialize, update, and final APIs to produce 32-byte hash digest */
	SHA256_Init(&ctx); 
	SHA256_Update(&ctx, data, strlen(data));
	SHA256_Final(digest, &ctx);

    /** Print hash result */
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
        printf("%02x", digest[i]);
    }
    printf("\n");

    /** validate hash of block header + nonce */
    if (checksum == 1) {
        validate(digest, fp_new);
    }

    /** Reset SHA256_CTX context */
    memset(&ctx, 0, sizeof(ctx));

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
    while (fgets(buffer, 256, fp)) {
        buffer[strcspn(buffer, "\n")] = 0;
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
        fgets(concat, 226, fp_newer); 
        concat[strcspn(concat, "\n")] = 0;
        printf("\n");
        printf("Concat Hash: ");
        sha256(concat, sizeof(concat), fp_new, 1);
        counter++;
    }
    printf("BLOCKCHAIN VALIDATED!");
    t = clock() - t;
    double time_taken = ((double)t)/CLOCKS_PER_SEC;
    
    /** Record execution time */
    printf("\n\nTime elapsed is: %f\n", time_taken);

    fclose(fp);
    fclose(fp_new);
    fclose(fp_newer);
} 