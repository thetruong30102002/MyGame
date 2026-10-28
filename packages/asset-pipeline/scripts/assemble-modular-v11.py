from pathlib import Path
import importlib.util
from modular_v11_hair import HairLibrary
spec=importlib.util.spec_from_file_location('assembly',Path(__file__).with_name('assemble-modular-v7.py'));A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A)
A.HAIR_PROVIDER=HairLibrary(A);A.HAIR_OUTPUT=A.OUT/'source-art/v11/hair-bindings.json';A.HAIR_REVISION=11;A.HAIR_CLEAN_SKULL=True
A.CANONICAL_ACTION_HEADS=True;A.COLOR_REFERENCE=True;A.TRANSITION_POSES=True;A.HAIR_WITH_IDENTITY=True;A.INTEGRATED_HEADS=True
if __name__=='__main__':A.main()
