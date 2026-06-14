// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "AiInsightMenubar",
    platforms: [
        .macOS(.v15)
    ],
    products: [
        .executable(name: "AiInsightMenubar", targets: ["AiInsightMenubar"])
    ],
    targets: [
        .executableTarget(
            name: "AiInsightMenubar",
            path: "Sources/AiInsightMenubar",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency")
            ]
        ),
        .testTarget(
            name: "AiInsightMenubarTests",
            dependencies: ["AiInsightMenubar"],
            path: "Tests/AiInsightMenubarTests"
        )
    ]
)
