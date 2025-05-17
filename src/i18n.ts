export interface I18nStrings {
    settings: {
        resetSettings: string;
        resetSettingsDesc: string;
        resetSettingsButton: string;
        lineWidth: string;
        lineWidthDesc: string;
        lineColor: string;
        lineColorDesc: string;
        colorPickerPlaceholder: string;
        itemSpacing: string;
        itemSpacingDesc: string;
        cardBackground: string;
        cardBackgroundDesc: string;
        cardTextColor: string;
        cardTextColorDesc: string;
        cardBorderColor: string;
        cardBorderColorDesc: string;
        milestoneCardBackground: string;
        milestoneCardBackgroundDesc: string;
        milestoneCardTextColor: string;
        milestoneCardTextColorDesc: string;
        milestoneCardBorderColor: string;
        milestoneCardBorderColorDesc: string;
        animationDuration: string;
        animationDurationDesc: string;
        dateAttribute: string;
        dateAttributeDesc: string;
        fileNamePrefix: string;
        fileNamePrefixDesc: string;
        fileNameSuffix: string;
        fileNameSuffixDesc: string;
        defaultPosition: string;
        defaultPositionDesc: string;
        leftSidebar: string;
        rightSidebar: string;
        language: string;
        languageDesc: string;
        milestoneAttribute: string;
        milestoneAttributeDesc: string;
        milestoneValue: string;
        milestoneValueDesc: string;
    };
    commands: {
        openTimelineView: string;
        generateFromFolder: string;
        generateFileFromFolder: string;
        generateFromTag: string;
        generateFileFromTag: string;
        generateFromFileLinks: string;
        generateFileFromFileLinks: string;
        generateFromMetadata: string; // New command
        generateFileFromMetadata: string; // New command
    };
    modal: {
        metadataInputTitle: string;
        metadataQueryName: string;
        metadataQueryDesc: string;
        metadataInputPlaceholder: string;
        submitButton: string;
        cancelButton: string;
        emptyInputNotice: string;
    };
    errors: {
        renderFailed: string;
        generateFolderFailed: string;
        generateTagFailed: string;
        generateFileFailed: string;
        noTaggedFiles: string;
        noFileLinks: string;
        createViewFailed: string;
        noMetadataFiles: string; // New error
        generateMetadataFailed: string; // New error
    };
}

export const zhCN: I18nStrings = {
    settings: {
        resetSettings: '重置设置',
        resetSettingsDesc: '将所有设置恢复为默认值',
        resetSettingsButton: '重置为默认值',
        lineWidth: '时间轴线宽度',
        lineWidthDesc: '设置主时间轴线的宽度（像素）',
        lineColor: '时间轴线颜色',
        lineColorDesc: '设置时间轴线的颜色',
        colorPickerPlaceholder: '点击左侧色盘选择颜色',
        itemSpacing: '项目间距',
        itemSpacingDesc: '设置时间轴项目之间的间距（像素）',
        cardBackground: '卡片背景色',
        cardBackgroundDesc: '设置内容卡片的背景颜色',
        cardTextColor: '卡片文字颜色',
        cardTextColorDesc: '设置普通事件卡片的文字颜色',
        cardBorderColor: '卡片边框颜色',
        cardBorderColorDesc: '设置普通事件卡片的边框颜色',
        milestoneCardBackground: '里程碑卡片背景色',
        milestoneCardBackgroundDesc: '设置里程碑事件卡片的背景颜色',
        milestoneCardTextColor: '里程碑卡片文字颜色',
        milestoneCardTextColorDesc: '设置里程碑事件卡片的文字颜色',
        milestoneCardBorderColor: '里程碑卡片边框颜色',
        milestoneCardBorderColorDesc: '设置里程碑事件卡片的边框颜色',
        animationDuration: '动画持续时间',
        animationDurationDesc: '设置悬停动画的持续时间（毫秒）',
        dateAttribute: '日期属性',
        dateAttributeDesc: '选择用于时间轴排序的 frontmatter 日期属性（如：created, updated, date 等）',
        fileNamePrefix: '文件名前缀',
        fileNamePrefixDesc: '设置生成的时间轴文件名前缀',
        fileNameSuffix: '文件名后缀',
        fileNameSuffixDesc: '设置生成的时间轴文件名后缀',
        defaultPosition: '默认位置',
        defaultPositionDesc: '选择时间轴视图在左侧还是右侧边栏显示',
        leftSidebar: '左侧边栏',
        rightSidebar: '右侧边栏',
        language: '语言',
        languageDesc: '选择插件界面语言',
        milestoneAttribute: '里程碑属性',
        milestoneAttributeDesc: '用于标记里程碑事件的 frontmatter 属性名称（例如：milestone）',
        milestoneValue: '里程碑值',
        milestoneValueDesc: '里程碑属性需要匹配的值（留空则表示只要属性存在即可，例如：true, 1）'
    },
    commands: {
        openTimelineView: '打开时间轴视图',
        generateFromFolder: '从文件夹生成时间轴视图',
        generateFileFromFolder: '从文件夹生成时间轴文件',
        generateFromTag: '从标签生成时间轴视图',
        generateFileFromTag: '从标签生成时间轴文件',
        generateFromFileLinks: '从文件链接生成时间轴视图',
        generateFileFromFileLinks: '从文件链接生成时间轴文件',
        generateFromMetadata: '从元数据生成时间轴视图',
        generateFileFromMetadata: '从元数据生成时间轴文件'
    },
    modal: {
        metadataInputTitle: '输入元数据字符串',
        metadataQueryName: '元数据查询',
        metadataQueryDesc: '例如：author: - 我  或  status: ongoing',
        metadataInputPlaceholder: '输入元数据...',
        submitButton: '确定',
        cancelButton: '取消',
        emptyInputNotice: '请输入元数据字符串'
    },
    errors: {
        renderFailed: '时间轴视图渲染失败',
        generateFolderFailed: '生成文件夹时间轴视图时出错',
        generateTagFailed: '生成标签时间轴视图时出错',
        generateFileFailed: '从文件链接生成时间轴视图时出错',
        noTaggedFiles: '没有找到包含标签 #{tag} 及其子标签的文件',
        noFileLinks: '文件 {filename} 中没有找到可用的链接或日期信息',
        createViewFailed: '无法创建时间轴视图：请检查侧边栏空间',
        noMetadataFiles: '没有找到与元数据查询 “{query}” 匹配的文件',
        generateMetadataFailed: '从元数据生成时间轴失败'
    }
};

export const enUS: I18nStrings = {
    settings: {
        resetSettings: 'Reset Settings',
        resetSettingsDesc: 'Restore all settings to default values',
        resetSettingsButton: 'Reset to Defaults',
        lineWidth: 'Timeline Line Width',
        lineWidthDesc: 'Set the width of the main timeline line (pixels)',
        lineColor: 'Timeline Line Color',
        lineColorDesc: 'Set the color of the timeline line',
        colorPickerPlaceholder: 'Click the color picker on the left',
        itemSpacing: 'Item Spacing',
        itemSpacingDesc: 'Set the spacing between timeline items (pixels)',
        cardBackground: 'Card Background Color',
        cardBackgroundDesc: 'Set the background color of content cards',
        cardTextColor: 'Card Text Color',
        cardTextColorDesc: 'Set the text color of regular event cards',
        cardBorderColor: 'Card Border Color',
        cardBorderColorDesc: 'Set the border color of regular event cards',
        milestoneCardBackground: 'Milestone Card Background',
        milestoneCardBackgroundDesc: 'Set the background color of milestone event cards',
        milestoneCardTextColor: 'Milestone Card Text Color',
        milestoneCardTextColorDesc: 'Set the text color of milestone event cards',
        milestoneCardBorderColor: 'Milestone Card Border Color',
        milestoneCardBorderColorDesc: 'Set the border color of milestone event cards',
        animationDuration: 'Animation Duration',
        animationDurationDesc: 'Set the duration of hover animations (milliseconds)',
        dateAttribute: 'Date Attribute',
        dateAttributeDesc: 'Choose the frontmatter date attribute for timeline sorting (e.g., created, updated, date)',
        fileNamePrefix: 'File Name Prefix',
        fileNamePrefixDesc: 'Set the prefix for generated timeline file names',
        fileNameSuffix: 'File Name Suffix',
        fileNameSuffixDesc: 'Set the suffix for generated timeline file names',
        defaultPosition: 'Default Position',
        defaultPositionDesc: 'Choose whether to display the timeline view in the left or right sidebar',
        leftSidebar: 'Left Sidebar',
        rightSidebar: 'Right Sidebar',
        language: 'Language',
        languageDesc: 'Select plugin interface language',
        milestoneAttribute: 'Milestone Attribute',
        milestoneAttributeDesc: 'The frontmatter attribute name used to mark milestone events (e.g., milestone)',
        milestoneValue: 'Milestone Value',
        milestoneValueDesc: 'The value the milestone attribute needs to match (leave empty to match if the attribute exists, e.g., true, 1)'
    },
    commands: {
        openTimelineView: 'Open Timeline View',
        generateFromFolder: 'Generate Timeline View from any Folder',
        generateFileFromFolder: 'Generate Timeline File from any Folder',
        generateFromTag: 'Generate Timeline View from any Tag',
        generateFileFromTag: 'Generate Timeline File from any Tag',
        generateFromFileLinks: 'Generate Timeline View from File Links',
        generateFileFromFileLinks: 'Generate Timeline File from File Links',
        generateFromMetadata: 'Generate Timeline View from any Metadata',
        generateFileFromMetadata: 'Generate Timeline File from any Metadata'
    },
    modal: {
        metadataInputTitle: 'Enter Metadata String',
        metadataQueryName: 'Metadata Query',
        metadataQueryDesc: 'e.g., author: - Me  or  status: ongoing',
        metadataInputPlaceholder: 'Enter metadata...',
        submitButton: 'Submit',
        cancelButton: 'Cancel',
        emptyInputNotice: 'Please enter a metadata string'
    },
    errors: {
        renderFailed: 'Failed to render timeline view',
        generateFolderFailed: 'Error generating folder timeline view',
        generateTagFailed: 'Error generating tag timeline view',
        generateFileFailed: 'Error generating file links timeline view',
        noTaggedFiles: 'No files found with tag #{tag} or its subtags',
        noFileLinks: 'No usable links or date information found in file {filename}',
        createViewFailed: 'Cannot create timeline view: Please check sidebar space',
        noMetadataFiles: 'No files found matching metadata query "{query}"',
        generateMetadataFailed: 'Failed to generate timeline from metadata'
    }
};