import { TFile, TFolder, App } from 'obsidian';
import { TimelineSettings } from './TimelineSettings';

export interface TimelineItem {
    date: Date;
    title: string;
    path: string;
    preview: string;
    isMilestone?: boolean; // 添加里程碑标志
}

export class Timeline {
    private app: App;
    private settings: TimelineSettings;

    constructor(app: App, settings: TimelineSettings) {
        this.app = app;
        this.settings = settings;
    }

    // 辅助函数：检查文件是否在timelines文件夹中
    private isInTimelinesFolder(file: TFile): boolean {
        return file.path.startsWith('timelines/') || file.path === 'timelines';
    }

    private async getFilePreview(file: TFile, tag: string): Promise<string> {
        const content = await this.app.vault.cachedRead(file);
        const normalizedTag = tag.replace(/^#/, ''); // 使用传入的 tag
        
        // 查找所有包含特定标签的行
        const tagLines = content.split('\n').filter(line => {
            // 精确匹配行内标签，避免匹配 frontmatter 中的 tags 数组
            const tagRegex = new RegExp(`(^|\s)#${normalizedTag}(?=\s|$|[^\w\/])`); // 使用正向预查确保精确匹配标签
            return tagRegex.test(line);
        });
        
        // 如果有找到包含特定标签的行，则返回第一行
        if (tagLines.length > 0) {
            const firstTagLine = tagLines[0];
            return firstTagLine.slice(0, 100) + (firstTagLine.length > 100 ? '...' : '');
        }
        
        // 否则返回文件开头内容（去除 frontmatter）
        const previewContent = content.replace(/^---[\s\S]*?---/, '').trim();
        return previewContent.slice(0, 50) + (previewContent.length > 50 ? '...' : '');
    }

    private async createTimelineItem(file: TFile, tag?: string, metadataQuery?: string): Promise<TimelineItem | null> { // tag 和 metadataQuery 参数变为可选
        const metadata = this.app.metadataCache.getFileCache(file);
        const dateValue = metadata?.frontmatter?.[this.settings.dateAttribute];
        
        if (dateValue) {
            // 只有在提供了 tag 时才使用它来生成预览
            const preview = tag ? await this.getFilePreview(file, tag) : await this.getFilePreview(file, ''); // 如果没有 tag，传递空字符串
            return {
                date: new Date(dateValue),
                title: file.basename,
                path: file.path,
                preview: preview,
                isMilestone: this.checkMilestone(metadata?.frontmatter) // 检查是否为里程碑
            };
        }
        return null;
    }

    private checkMilestone(frontmatter: any): boolean {
        if (!this.settings.milestoneAttribute || !frontmatter) {
            return false;
        }
        const attributeValue = frontmatter[this.settings.milestoneAttribute];
        if (attributeValue === undefined || attributeValue === null) {
            return false;
        }
        // 如果 milestoneValue 为空，则只要属性存在就标记为里程碑
        if (this.settings.milestoneValue === '') {
            return true;
        }
        // 否则，检查属性值是否与设置的值匹配（不区分大小写和类型）
        return String(attributeValue).toLowerCase() === String(this.settings.milestoneValue).toLowerCase();
    }

    private sortItemsByDate(items: TimelineItem[]): TimelineItem[] {
        return items.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    private extractLinkedFiles(content: string): TFile[] {
        const linkedFiles: TFile[] = [];
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        let match;
        
        while ((match = linkRegex.exec(content)) !== null) {
            const linkPath = match[1].split('|')[0]; // 处理带别名的链接
            const file = this.app.metadataCache.getFirstLinkpathDest(linkPath, '');
            if (file && file instanceof TFile) {
                linkedFiles.push(file);
            }
        }
        return linkedFiles;
    }

    async generateFromFileLinks(file: TFile): Promise<TimelineItem[]> {
        const content = await this.app.vault.cachedRead(file);
        const linkedFiles = this.extractLinkedFiles(content);
        const items: TimelineItem[] = [];
        
        for (const linkedFile of linkedFiles) {
            // 忽略timelines文件夹中的文件
            if (!this.isInTimelinesFolder(linkedFile)) {
                const item = await this.createTimelineItem(linkedFile);
                if (item) {
                    items.push(item);
                }
            }
        }
        
        return this.sortItemsByDate(items);
    }

    async generateFromMetadata(metadataQuery: string): Promise<TimelineItem[]> {
        const allFiles = this.app.vault.getMarkdownFiles();
        // 过滤掉timelines文件夹中的文件
        const filteredFiles = allFiles.filter(file => !this.isInTimelinesFolder(file));
        const items: TimelineItem[] = [];
        
        // 更健壮的查询解析
        let queryKey: string;
        let queryValue: string | null = null;
        
        // 尝试寻找第一个冒号作为分隔符
        const firstColonIndex = metadataQuery.indexOf(':');
        if (firstColonIndex > 0) {
            queryKey = metadataQuery.substring(0, firstColonIndex).trim();
            queryValue = metadataQuery.substring(firstColonIndex + 1).trim();
            
            // 如果值为空，则只查询键
            if (queryValue === '') {
                queryValue = null;
            }
        } else {
            // 如果没有冒号，则只查询键
            queryKey = metadataQuery.trim();
        }

        for (const file of filteredFiles) {
            try {
                const cache = this.app.metadataCache.getFileCache(file);
                if (!cache || !cache.frontmatter) continue;

                const frontmatter = cache.frontmatter;
                let match = false;

                if (queryValue !== null) {
                    // 检查 key: value 匹配
                    const fmValue = frontmatter[queryKey];
                    if (fmValue !== undefined && fmValue !== null) {
                        if (Array.isArray(fmValue)) {
                            // 如果 frontmatter 值是数组，检查数组中是否包含查询值
                            // 更健壮的数组项匹配，支持多种格式
                            const cleanedQueryValue = queryValue.startsWith('- ') ? queryValue.substring(2) : queryValue;
                            
                            // 转换所有数组项为字符串并修剪，然后进行不区分大小写的匹配
                            match = fmValue.some(item => {
                                const itemStr = String(item).trim().toLowerCase();
                                const queryStr = cleanedQueryValue.toLowerCase();
                                return itemStr === queryStr || 
                                       itemStr.includes(queryStr) || 
                                       queryStr.includes(itemStr);
                            });
                        } else {
                            // 非数组值的匹配，支持部分匹配和大小写不敏感
                            const fmValueStr = String(fmValue).trim().toLowerCase();
                            const queryValueStr = queryValue.toLowerCase();
                            
                            match = fmValueStr === queryValueStr || 
                                   fmValueStr.includes(queryValueStr) || 
                                   queryValueStr.includes(fmValueStr);
                        }
                    }
                } else {
                    // 只检查 key 是否存在
                    match = Object.prototype.hasOwnProperty.call(frontmatter, queryKey);
                }

                if (match) {
                    const item = await this.createTimelineItem(file, undefined, metadataQuery);
                    if (item) {
                        items.push(item);
                    }
                }
            } catch (error) {
                console.error(`处理文件 ${file.path} 时出错:`, error);
                continue;
            }
        }
        
        return this.sortItemsByDate(items);
    }

    async generateFromFolder(folder: TFolder): Promise<TimelineItem[]> {
        // 检查文件夹是否为timelines或其子文件夹
        if (folder.path === 'timelines' || folder.path.startsWith('timelines/')) {
            return [];
        }
        
        const timelineItems: TimelineItem[] = [];
        
        // 递归处理文件夹的函数
        const processFolder = async (currentFolder: TFolder) => {
            // 确保不处理timelines文件夹及其子文件夹
            if (currentFolder.path === 'timelines' || currentFolder.path.startsWith('timelines/')) {
                return;
            }
            
            for (const item of currentFolder.children) {
                if (item instanceof TFile && item.extension === 'md') {
                    const metadata = this.app.metadataCache.getFileCache(item);
                    const dateValue = metadata?.frontmatter?.[this.settings.dateAttribute];
                    
                    if (dateValue) {
                        timelineItems.push({
                            date: new Date(dateValue),
                            title: item.basename,
                            path: item.path,
                            preview: await this.getFilePreview(item, ''),
                            isMilestone: this.checkMilestone(metadata?.frontmatter)
                        });
                    }
                } else if (item instanceof TFolder) {
                    // 递归处理子文件夹
                    await processFolder(item);
                }
            }
        };
        
        // 开始处理文件夹
        await processFolder(folder);
        
        return timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    async generateFromTag(tag: string): Promise<TimelineItem[]> {
        const allFiles = this.app.vault.getMarkdownFiles();
        // 过滤掉timelines文件夹中的文件
        const filteredFiles = allFiles.filter(file => !this.isInTimelinesFolder(file));
        const items: TimelineItem[] = [];
        
        // 移除开头的#号（如果存在）并标准化标签
        const normalizedTag = tag.replace(/^#/, '').trim();
        
        // 辅助函数：检查两个标签是否匹配（支持精确匹配和子标签匹配）
        const isMatchingTag = (fileTag: string, searchTag: string): boolean => {
            const cleanFileTag = fileTag.replace(/^#/, '').trim().toLowerCase();
            const cleanSearchTag = searchTag.toLowerCase();
            return cleanFileTag === cleanSearchTag || 
                   cleanFileTag.startsWith(cleanSearchTag + '/') ||
                   cleanSearchTag.includes(cleanFileTag); // 支持部分匹配
        };
        
        for (const file of filteredFiles) {
            try {
                const cache = this.app.metadataCache.getFileCache(file);
                if (!cache) continue;

                let hasMatchingTag = false;

                // 检查文件内容中的标签（cache.tags）
                if (cache.tags && cache.tags.length > 0) {
                    hasMatchingTag = cache.tags.some(tagObj => {
                        return isMatchingTag(tagObj.tag, normalizedTag);
                    });
                }

                // 如果内容中没有匹配的标签，检查frontmatter中的标签
                if (!hasMatchingTag && cache.frontmatter?.tags) {
                    const frontmatterTags = cache.frontmatter.tags;
                    
                    if (Array.isArray(frontmatterTags)) {
                        // 数组形式的标签
                        hasMatchingTag = frontmatterTags.some((frontmatterTag: any) => {
                            if (typeof frontmatterTag !== 'string') return false;
                            return isMatchingTag(frontmatterTag, normalizedTag);
                        });
                    } else if (typeof frontmatterTags === 'string') {
                        // 字符串形式的标签，支持多种分隔符
                        const normalizedTags = frontmatterTags.replace(/[,;]/g, ' ').trim();
                        const tagList = normalizedTags.split(/\s+/);
                        
                        hasMatchingTag = tagList.some((tagItem: string) => {
                            return isMatchingTag(tagItem, normalizedTag);
                        });
                    }
                }

                if (hasMatchingTag) {
                    // 将 normalizedTag 传递给 createTimelineItem
                    const item = await this.createTimelineItem(file, normalizedTag);
                    if (item) {
                        items.push(item);
                    }
                }
            } catch (error) {
                console.error(`处理文件 ${file.path} 时出错:`, error);
                continue;
            }
        }
        
        // 按日期排序
        return this.sortItemsByDate(items);
    }

    async generateTimelineMarkdown(items: TimelineItem[], title: string, source: { type: 'tag' | 'folder' | 'file' | 'metadata', value: string }): Promise<string> {
        let generatedFromValue = source.value;
        if (source.type === 'metadata') {
            const parts = source.value.split(':');
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            generatedFromValue = `${key}:${value}`;
        }
        let markdown = `---\ngenerated_from: ${source.type}:${generatedFromValue}\n---\n\n`;
        markdown += `# ${title}\n\n`;
        
        let currentYear = null;
        let currentMonth = null;
        
        for (const item of items) {
            const date = item.date;
            const year = date.getFullYear();
            const month = date.getMonth();
            
            if (currentYear !== year) {
                markdown += `\n## ${year}\n\n`;
                currentYear = year;
                currentMonth = null;
            }
            
            if (currentMonth !== month) {
                const monthName = this.settings.language === 'zh-CN' 
                    ? date.toLocaleString('zh-CN', { month: 'long' })
                    : date.toLocaleString('en-US', { month: 'long' });
                markdown += `\n### ${monthName}\n\n`;
                currentMonth = month;
            }
            
            const dateFormat = this.settings.language === 'zh-CN' 
                ? date.toLocaleDateString('zh-CN')
                : date.toLocaleDateString('en-US');
            markdown += `#### ${dateFormat} - [[${item.title}]]\n\n`;
        }
        
        return markdown;
    }
}