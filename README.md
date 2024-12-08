make sure update_benchmark isn't behind master.

0. github's api requires [auth](https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api), if you're not logged in with `gh`, you can export your GH_TOKEN=
1. run `python3 server/api/seed.py`, this saves the benchmarks artifacts into /tmp/benchmarks/
2. run `python3 run.py` - this starts an http server
3. clone the tinystats fork `https://github.com/qazalin/tinystats`, `open index.html`, you should see the update_benchmark value in the last data point.
