/* IMPLEMENTATION OF READING USER FILE AND SORTING CONTENTS */

#include "file.h"

/* Fopen (wrapper for fopen) for opening file with error handling */
FILE *Fopen(const char *file, const char *permission) {
    FILE *fp = fopen(file, permission);
    if (fp == NULL) {
        printf("error opening one or more files!");
        exit(0);
    }
    return fp;
}

/* Fclose (wrapper for fclose) for closing file with error handling */
void Fclose(FILE *fp) {
    if (fp && !fclose(fp)) {
        printf("error closing one or more files!");
    }
}

/* Fread (wrapper for fread) for reading from file with error handling */
size_t Fread(void *buffer, size_t size, size_t nmemb, FILE *file) {
    size_t readBytes = fread(buffer, size, nmemb, file);
    if (readBytes == 0) {
        printf("one or more files is empty!");
    }
    if (ferror(file)) {
        printf("error reading one or more files!");
    }
    return readBytes;
}

/* Fwrite (wrapper for fwrite) for writing to file with error handling */
size_t Fwrite(void *buffer, size_t size, size_t nmemb, FILE *file) {
    size_t writtenBytes = 0;
    while ((writtenBytes = fwrite(buffer, size, nmemb, file) == 0)) {
        if (ferror(file) | fileno(file)) {
            printf("error writing to one or more files!");
            exit(0);
        }
    }
    return writtenBytes;
}

/* returns number of lines in a file */
int lineCount(FILE * inputFile) {
    int counter = 0;
    char character;
    for (character = getc(inputFile); character != EOF; character = getc(inputFile)) {
        if (character == '\n') { 
            counter++;
        }
    }
    return counter; 
}  

/* reads the contents of a file */
void ReadOneFile(char** arr, char *filename) {
    FILE *fp = Fopen(filename, "r");
    int count = (int)lineCount(fp);
    fp = Fopen(filename, "r");                   /* open file again or rewind() to reset pointer */
    int z = 0;
    while ( fgets(arr[z], 100, fp) != NULL ){
        size_t len = strlen(arr[z]);
        if( arr[z][len-1] == '\n') {
            arr[z][len-1] = '\0';
        }
        z++;
    }
    fclose(fp);
}

/* calling function for reading number of lines in a file */
int *GetLineNumbers(char **filename, int count) {
    int *lineNum = (int *)malloc(count*sizeof(int));
    FILE *fp;
    for(int i = 0; i < count; i++){
        fp = fopen(filename[i], "r");
        lineNum[i] = (int) lineCount(fp);
    }
    return lineNum;
}