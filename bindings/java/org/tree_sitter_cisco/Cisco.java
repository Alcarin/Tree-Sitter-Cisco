package org.tree_sitter_cisco;

public class Cisco {
    public static native long language();

    static {
        System.loadLibrary("tree-sitter-cisco");
    }
}
