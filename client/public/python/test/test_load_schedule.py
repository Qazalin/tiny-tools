import unittest
from tinygrad.tensor import Tensor
from tinygrad.engine.schedule import _graph_schedule
from load_schedule import load_schedule

def helper_test_op(shps, tinygrad_fxn, vals=None):
  tst = [Tensor(v) for v in vals] if vals is not None else [Tensor.randn(shp) for shp in shps]
  ret = tinygrad_fxn(*tst)
  _graph_schedule([ret.lazydata])

class TestLoadSchedule(unittest.TestCase):
  def test_tiny_add(self):
    xt = Tensor([1]) + Tensor([2])
    ref_graph, ref_in_degree = _graph_schedule([xt.lazydata])
    nodes, _ = load_schedule([(ref_graph, ref_in_degree)])
    blue_nodes = [x for x in nodes if x.fill == "blue"]
    white_nodes = [x for x in nodes if x.fill == "white"]
    assert len(blue_nodes) == 1
    assert len(nodes) == 3
    assert len(white_nodes) == 2

  def test_relu(self):
    helper_test_op([(64,64)], lambda x: x.relu())
    helper_test_op([()], lambda x: x.relu())
  def test_relu_exact(self):
    helper_test_op(None, lambda x: x.relu(), vals=[[-1.,0,1]])

  def test_abs(self):
    helper_test_op([(45,65)], Tensor.abs)
    helper_test_op([()], Tensor.abs)

  def _test_conv2d(self, bs=1, cin=1):
    for H in [1,2,3]:
      for W in [1,2,3,5]:
        for groups in [1,3] if cin == 3 and H == 3 and W == 3 else [1]:
          with self.subTest(batch_size=bs, channels=cin, groups=groups, height=H, width=W):
            helper_test_op([(bs,cin,11,7), (6,cin//groups,H,W)],
              lambda x,w: Tensor.conv2d(x,w,groups=groups).relu())
  def test_conv2d(self): self._test_conv2d(bs=1, cin=3)
  def test_conv2d_bs_4_cin_3(self): self._test_conv2d(bs=4, cin=3)
  def test_conv2d_bs_1_cin_1(self): self._test_conv2d(bs=1, cin=1)
  def test_conv2d_bs_4_cin_1(self): self._test_conv2d(bs=4, cin=1)

if __name__ == "__main__":
  unittest.main()
