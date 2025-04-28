export interface TimelineSettings {
    dateAttribute: string;      // frontmatter中用于时间轴排序的日期属性名（如：date, created, updated等）
    fileNamePrefix: string;
    fileNameSuffix: string;
    lineWidth: number;          // 时间轴线宽度
    lineColor: string;          // 时间轴线颜色
    itemSpacing: number;        // 项目间距
    cardBackground: string;     // 卡片背景色
    cardTextColor: string;      // 卡片文字颜色
    cardBorderColor: string;    // 卡片边框颜色
    milestoneCardBackground: string; // 里程碑卡片背景色
    milestoneCardTextColor: string;  // 里程碑卡片文字颜色
    milestoneCardBorderColor: string; // 里程碑卡片边框颜色
    animationDuration: number;  // 动画持续时间（毫秒）
    defaultPosition: 'left' | 'right';  // 时间轴视图默认位置
    language: 'zh-CN' | 'en-US';  // 界面语言
    milestoneAttribute: string; // 用于标记里程碑的自定义属性名
    milestoneValue: string;     // 里程碑属性需要匹配的值（为空则表示只要属性存在即可）
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
    cardTextColor: getCssVariable('--text-normal'),
    cardBorderColor: getCssVariable('--background-modifier-border'),
    milestoneCardBackground: '#ffffcc',
    milestoneCardTextColor: getCssVariable('--text-normal'),
    milestoneCardBorderColor: '#f0e68c',
    animationDuration: 200,
    dateAttribute: 'created',      // 默认使用 frontmatter 中的 date 属性作为时间轴排序依据
    fileNamePrefix: '',
    fileNameSuffix: '',
    defaultPosition: 'right',  // 默认在右侧边栏
    language: 'zh-CN',  // 默认使用中文
    milestoneAttribute: '', // 默认不使用里程碑属性
    milestoneValue: '',      // 默认值为空
};