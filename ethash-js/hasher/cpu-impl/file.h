/* HEADER FILE FOR READFILE.C */

#ifndef READFILE_DEF
#define READFILE_DEF

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* function prototypes for reading/writing files */
FILE *Fopen(const char *, const char *);
void Fclose(FILE *);
size_t Fread(void *, size_t, size_t, FILE *); 
size_t Fwrite(void *, size_t, size_t, FILE *);
void ReadOneFile(char**, char *);
int *GetLineNumbers(char **, int);

#endif
