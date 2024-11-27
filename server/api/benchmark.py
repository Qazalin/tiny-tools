# https://github.com/wozeparrot/tinymod/blob/main/tinymod/common/benchmarks.py
import re
from math import inf

REGEXES = {
  "sd": re.compile(r"step in (\d+\.\d+) ms"),
  "llama": re.compile(r"total[ ]+(\d+\.\d+) ms"),
  "mixtral": re.compile(r"total[ ]+(\d+\.\d+) ms"),
  "gpt2": re.compile(r"ran model in[ ]+(\d+\.\d+) ms"),
  "cifar": re.compile(r"\d+[ ]+(\d+\.\d+) ms run,"),
  "resnet": re.compile(r"\d+[ ]+(\d+\.\d+) ms run,"),
  "openpilot_compile": re.compile(r"s/[ ]+(\d+\.\d+)ms"),
  "openpilot": re.compile(r"jitted:[ ]+(\d+\.\d+) ms"),
}

ALL_SYSTEMS = ["amd", "amd-train", "nvidia", "nvidia-train", "mac", "comma"]

# regex, systems, skip_count, max_count
TRACKED_BENCHMARKS = {
  # stable diffusion
  "sd.txt": (REGEXES["sd"], ["amd", "mac", "nvidia"], 3, 0),
  "sdxl.txt": (REGEXES["sd"], ["amd", "mac", "nvidia"], 3, 0),
  # llama
  "llama_unjitted.txt": (REGEXES["llama"], ["amd", "mac", "nvidia"], 4, 0),
  "llama_jitted.txt": (REGEXES["llama"], ["amd", "mac", "nvidia"], 4, 0),
  "llama_beam.txt": (REGEXES["llama"], ["amd", "mac", "nvidia"], 4, 0),
  "llama_2_70B.txt": (REGEXES["llama"], ["amd", "nvidia"], 4, 0),
  # llama3
  "llama3_beam.txt": (REGEXES["llama"], ["amd", "nvidia"], 4, 0),
  "llama3_four_gpu.txt": (REGEXES["llama"], ["amd", "nvidia"], 4, 0),
  "llama3_six_gpu.txt": (REGEXES["llama"], ["amd", "nvidia"], 4, 0),
  # mixtral
  "mixtral.txt": (REGEXES["mixtral"], ["amd", "nvidia"], 3, 0),
  # gpt2
  "gpt2_unjitted.txt": (REGEXES["gpt2"], ["amd", "mac", "nvidia"], 4, 0),
  "gpt2_jitted.txt": (REGEXES["gpt2"], ["amd", "mac", "nvidia"], 4, 0),
  "gpt2_half.txt": (REGEXES["gpt2"], ["amd", "mac", "nvidia"], 4, 0),
  "gpt2_half_beam.txt": (REGEXES["gpt2"], ["amd", "mac", "nvidia"], 4, 0),
  # cifar
  "train_cifar.txt": (REGEXES["cifar"], ["amd-train", "mac", "nvidia-train"], 3, 0),
  "train_cifar_half.txt": (REGEXES["cifar"], ["amd-train", "mac", "nvidia-train"], 3, 0),
  "train_cifar_bf16.txt": (REGEXES["cifar"], ["amd-train", "nvidia-train"], 3, 0),
  "train_cifar_one_gpu.txt": (REGEXES["cifar"], ["amd-train", "nvidia-train"], 3, 20),
  "train_cifar_six_gpu.txt": (REGEXES["cifar"], ["amd-train", "nvidia-train"], 3, 20),
  # resnet
  "train_resnet_one_gpu.txt": (REGEXES["resnet"], ["amd-train", "nvidia-train"], 3, 0),
  "train_resnet.txt": (REGEXES["resnet"], ["amd-train", "nvidia-train"], 3, 0),
  # openpilot
  "openpilot_compile_0_9_4.txt": (REGEXES["openpilot_compile"], ["comma"], 0, -1),
  "openpilot_compile_0_9_7.txt": (REGEXES["openpilot_compile"], ["comma"], 0, -1),
  "openpilot_0_9_4.txt": (REGEXES["openpilot"], ["comma"], 13, 0),
  "openpilot_0_9_7.txt": (REGEXES["openpilot"], ["comma"], 13, 0),
  "openpilot_image_0_9_4.txt": (REGEXES["openpilot"], ["comma"], 13, 0),
  "openpilot_image_0_9_7.txt": (REGEXES["openpilot"], ["comma"], 13, 0),
}

def regex_extract_benchmark(regex: re.Pattern, benchmark: str, skip_count: int, max_count: int = 0) -> float:
  iter = regex.finditer(benchmark)
  try:
    for _ in range(skip_count): next(iter)
  except: return -inf
  sums, counts = 0, 0
  for match in iter:
    sums += float(match.group(1))
    counts += 1
    if max_count > 0 and counts >= max_count: break
  if counts == 0: return -inf
  if max_count == -1: return round(float(match.group(1)), 2)
  return round(sums / counts, 2)
