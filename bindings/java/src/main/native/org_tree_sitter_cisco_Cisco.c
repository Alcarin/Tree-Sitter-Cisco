#include <jni.h>
#include <tree_sitter/api.h>

extern const TSLanguage *tree_sitter_cisco(void);

JNIEXPORT jlong JNICALL Java_org_tree_1sitter_1cisco_Cisco_language(JNIEnv *env, jclass cls) {
    return (jlong)tree_sitter_cisco();
}
