using System;
using System.Runtime.InteropServices;

namespace TreeSitterCisco
{
    public static class Cisco
    {
        [DllImport("tree-sitter-cisco", CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr tree_sitter_cisco();
    }
}
