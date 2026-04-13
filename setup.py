from os.path import splitext
from setuptools import Extension, find_packages, setup

setup(
    name="tree-sitter-cisco",
    version="0.1.0",
    author="Francesco Rubeo",
    description="Cisco configuration parser for tree-sitter",
    packages=find_packages("bindings/python"),
    package_dir={"": "bindings/python"},
    package_data={
        "tree_sitter_cisco": ["*.pyi", "py.typed"],
    },
    ext_modules=[
        Extension(
            name="tree_sitter_cisco._binding",
            sources=[
                "bindings/python/tree_sitter_cisco/binding.c",
                "src/parser.c",
                "src/scanner.c",
            ],
            include_dirs=["src"],
            define_macros=[
                ("Py_LIMITED_API", 0x03090000),
            ],
            py_limited_api=True,
        )
    ],
    install_requires=["tree-sitter~=0.23"],
    zip_safe=False,
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Topic :: Software Development :: Compilers",
    ],
    project_urls={
        "Source": "https://github.com/Alcarin/Tree-Sitter-Cisco",
    },
)
