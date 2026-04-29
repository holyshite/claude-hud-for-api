"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderModelLine = renderModelLine;
const colors_1 = require("./colors");
function renderModelLine(data, config) {
    if (!config.display.showModel) {
        return '';
    }
    const { modelName } = data;
    let displayName = modelName;
    if (config.format.modelFormat) {
        displayName = config.format.modelFormat
            .replace('{name}', modelName)
            .replace('{id}', data.modelId || '');
    }
    return (0, colors_1.colorize)(displayName, config.colors.modelColor);
}
