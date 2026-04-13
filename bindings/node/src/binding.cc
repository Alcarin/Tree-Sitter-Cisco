#include <nan.h>
#include <tree_sitter/api.h>

extern "C" const TSLanguage *tree_sitter_cisco();

namespace {

void Init(v8::Local<v8::Object> exports) {
    auto language = Nan::New<v8::External>((void *)tree_sitter_cisco());
    auto name = Nan::New("language").ToLocalChecked();
    Nan::Set(exports, name, language);
}

NODE_MODULE(tree_sitter_cisco_binding, Init)

}  // namespace
