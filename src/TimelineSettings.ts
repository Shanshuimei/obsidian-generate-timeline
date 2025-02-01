export interface TimelineSettings {
    lineWidth: number;          // 时间轴线宽度
    lineColor: string;          // 时间轴线颜色
    nodeSize: number;           // 节点大小
    nodeColor: string;          // 节点颜色
    itemSpacing: number;        // 项目间距
    cardBackground: string;     // 卡片背景色
    animationDuration: number;  // 动画持续时间（毫秒）
    fileNamePrefix: string;
    fileNameSuffix: string;
}

// 使用 CSS 变量作为默认值
function getCssVariable(name: string): string {
    return `var(${name})`;  // 直接返回 CSS 变量
}

export const DEFAULT_SETTINGS: TimelineSettings = {
    lineWidth: 2,
    lineColor: getCssVariable('--interactive-accent'),
    nodeSize: 16,
    nodeColor: getCssVariable('--interactive-accent'),
    itemSpacing: 30,
    cardBackground: getCssVariable('--background-primary-alt'),
    animationDuration: 200,
    fileNamePrefix: '',
    fileNameSuffix: ''
};