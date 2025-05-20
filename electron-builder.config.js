const baseConfig = {
    appId: "uk.co.thebarcodewarehouse.mqtt-monitor",
    productName: "MQTT Monitor",
    directories: {
        output: "release",
        buildResources: "build",
    },
    files: ["dist-main/main.js", "dist-preload/preload.js", "dist-renderer/**/*"],
    extraMetadata: {
        version: process.env.VITE_APP_VERSION,
    },
};

const platformSpecificConfigurations = {
    win32: {
        ...baseConfig,
        win: {
            icon: "build/app-icon-dark.png",
            target: [{ target: "msi" }, { target: "zip" }],
        },
    },
};

export default platformSpecificConfigurations[process.platform];
