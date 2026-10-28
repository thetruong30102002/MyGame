"""Rebind existing authored hair without changing the accepted v7 body/gear."""
from pathlib import Path
import importlib.util
from modular_v8_hair import hair_layers

spec=importlib.util.spec_from_file_location('modular_v7',Path(__file__).with_name('assemble-modular-v7.py'))
assembly=importlib.util.module_from_spec(spec);spec.loader.exec_module(assembly)
assembly.hair_layers=hair_layers
assembly.HAIR_OUTPUT=assembly.OUT/'source-art/v8/hair-bindings.json'
assembly.HAIR_REVISION=8
assembly.HAIR_CLEAN_SKULL=True
if __name__=='__main__':assembly.main()
