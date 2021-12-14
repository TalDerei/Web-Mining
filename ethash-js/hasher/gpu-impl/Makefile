all: cuda_test

SHA256=-Lbuild -lsha256
SHA256_CU=-Lbuild -lsha256_cu

INCLUDES=-Iinclude
FLAGS= -Wall -g $(INCLUDES)

cuda_test: validation_cuda.cu sha256_cuda.cu sha256_cuda.h md32_common_cu.h
	nvcc -O3 -o cuda_test validation_cuda.cu $(INCLUDES)

clean:
	rm -f cuda_test
	rm -f *.o
