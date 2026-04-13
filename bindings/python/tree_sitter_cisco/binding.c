#include <Python.h>
#include <tree_sitter/api.h>

extern const TSLanguage *tree_sitter_cisco(void);

static PyObject *language(PyObject *self, PyObject *args) {
    return PyLong_FromVoidPtr((void *)tree_sitter_cisco());
}

static PyMethodDef methods[] = {
    {"language", language, METH_NOARGS, "Get the Cisco language for tree-sitter."},
    {NULL, NULL, 0, NULL}
};

static struct PyModuleDef module = {
    PyModuleDef_HEAD_INIT,
    "_binding",
    NULL,
    -1,
    methods
};

PyMODINIT_FUNC PyInit__binding(void) {
    return PyModule_Create(&module);
}
