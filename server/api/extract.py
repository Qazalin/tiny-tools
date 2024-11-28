from api.benchmark import TRACKED_BENCHMARKS, regex_extract_benchmark
fp = "llama_unjitted.txt"
args = TRACKED_BENCHMARKS[fp]
ret = regex_extract_benchmark(*args)
print(ret)
