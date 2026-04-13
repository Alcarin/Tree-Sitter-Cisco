// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterCisco",
    platforms: [.macOS(.v10_13), .iOS(.v11)],
    products: [
        .library(name: "TreeSitterCisco", targets: ["TreeSitterCisco"]),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "TreeSitterCisco",
            path: ".",
            exclude: [
                "Cargo.toml",
                "Makefile",
                "binding.gyp",
                "bindings",
                "grammar.js",
                "package.json",
                "src/grammar.json",
                "src/node-types.json",
                "tree-sitter.json",
                "test",
            ],
            sources: [
                "src/parser.c",
                "src/scanner.c",
            ],
            resources: [
                .copy("src/node-types.json"),
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
    ]
)
