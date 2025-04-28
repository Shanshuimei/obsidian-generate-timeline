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

    private async createTimelineItem(file: TFile, tag?: string): Promise<TimelineItem | null> { // tag 参数变为可选
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
            const item = await this.createTimelineItem(linkedFile);
            if (item) {
                items.push(item);
            }
        }
        
        return this.sortItemsByDate(items);
    }

    async generateFromFolder(folder: TFolder): Promise<TimelineItem[]> {
        if (folder.path === 'timelines') {
            return [];
        }
        
        const timelineItems: TimelineItem[] = [];
        
        // 递归处理文件夹的函数
        const processFolder = async (currentFolder: TFolder) => {
            for (const item of currentFolder.children) {
                if (item instanceof TFile && item.extension === 'md') {
                    const metadata = this.app.metadataCache.getFileCache(item);
                    const dateValue = metadata?.frontmatter?.[this.settings.dateAttribute];
                    
                    if (dateValue) {
                        timelineItems.push({
                            date: new Date(dateValue),
                            title: item.basename,
                            path: item.path,
                            preview: await this.getFilePreview(item, '')
                        });
                    }
                } else if (item instanceof TFolder && item.path !== 'timelines') {
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
        const items: TimelineItem[] = [];
        
        // 移除开头的#号（如果存在）
        const normalizedTag = tag.replace(/^#/, '');
        
        for (const file of allFiles) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) continue;

            // 检查文件是否包含目标标签或其子标签 (保持原有逻辑)
            const hasMatchingTag = (cache.tags && cache.tags.some(tagObj => {
                const fileTag = tagObj.tag.replace(/^#/, '');
                return fileTag === normalizedTag || // 完全匹配
                       fileTag.startsWith(normalizedTag + '/'); // 子标签匹配
            })) || (cache.frontmatter?.tags && Array.isArray(cache.frontmatter.tags) && cache.frontmatter.tags.some((frontmatterTag: string | unknown) => {
                if (typeof frontmatterTag !== 'string') return false;
                const fileTag = frontmatterTag.replace(/^#/, '');
                return fileTag === normalizedTag || // 完全匹配
                       fileTag.startsWith(normalizedTag + '/'); // 子标签匹配
            }));

            if (hasMatchingTag) {
                // 将 normalizedTag 传递给 createTimelineItem
                const item = await this.createTimelineItem(file, normalizedTag);
                if (item) {
                    items.push(item);
                }
            }
        }
        
        // 按日期排序
        return this.sortItemsByDate(items);
    }

    async generateTimelineMarkdown(items: TimelineItem[], title: string, source: { type: 'tag' | 'folder' | 'file', value: string }): Promise<string> {
        let markdown = `---\ngenerated_from: ${source.type}:${source.value}\n---\n\n`;
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