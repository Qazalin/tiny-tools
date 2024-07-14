import pickle
from load_schedule import load_schedule
data = pickle.load(open("/tmp/schedule.pkl", "rb"))
load_schedule(data)
