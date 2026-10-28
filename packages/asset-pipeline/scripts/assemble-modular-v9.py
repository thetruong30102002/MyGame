"""Painted complete-character reference drives every hair action on the v7 rig."""
from pathlib import Path
import importlib.util
from modular_v9_hair import HairLibrary
spec=importlib.util.spec_from_file_location('modular_v7',Path(__file__).with_name('assemble-modular-v7.py'))
assembly=importlib.util.module_from_spec(spec);spec.loader.exec_module(assembly)
assembly.HAIR_PROVIDER=HairLibrary(assembly)
assembly.HAIR_OUTPUT=assembly.OUT/'source-art/v9/hair-bindings.json'
assembly.HAIR_REVISION=9
assembly.HAIR_CLEAN_SKULL=True
if __name__=='__main__':assembly.main()
