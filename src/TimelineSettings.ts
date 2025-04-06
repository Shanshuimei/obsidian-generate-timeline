export interface TimelineSettings {
    dateAttribute: string;      // frontmatter中用于时间轴排序的日期属性名（如：date, created, updated等）
    fileNamePrefix: string;
    fileNameSuffix: string;
    lineWidth: number;          // 时间轴线宽度
    lineColor: string;          // 时间轴线颜色
    itemSpacing: number;        // 项目间距
    cardBackground: string;     // 卡片背景色
    animationDuration: number;  // 动画持续时间（毫秒）
    defaultPosition: 'left' | 'right';  // 时间轴视图默认位置
    language: 'zh-CN' | 'en-US';  // 界面语言
}

// 使用 CSS 变量作为默认值
function getCssVariable(name: string): string {
    return `var(${name})`;  // 直接返回 CSS 变量
}

export const DEFAULT_SETTINGS: TimelineSettings = {
    lineWidth: 2,
    lineColor: getCssVariable('--interactive-accent'),
    itemSpacing: 30,
    cardBackground: getCssVariable('--background-primary-alt'),
    animationDuration: 200,
    dateAttribute: 'created',      // 默认使用 frontmatter 中的 date 属性作为时间轴排序依据
    fileNamePrefix: '',
    fileNameSuffix: '',
    defaultPosition: 'right',  // 默认在右侧边栏
    language: 'zh-CN'  // 默认使用中文
};