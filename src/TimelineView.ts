import { ItemView, WorkspaceLeaf, TFolder, TFile, Notice, App } from 'obsidian';
import { Timeline, TimelineItem } from './Timeline';
import { TimelineSettings } from './TimelineSettings';
import { I18nStrings } from './i18n';

export const VIEW_TYPE_TIMELINE = 'timeline-view';

// 提取常量类名
const CLASS_TIMELINE_HEADER = 'timeline-header';
const CLASS_TIMELINE_CONTAINER = 'timeline-container';
const CLASS_TIMELINE_LINE = 'timeline-line';
const CLASS_TIMELINE_ERA = 'timeline-era';
const CLASS_TIMELINE_ERA_TITLE = 'timeline-era-title';
const CLASS_TIMELINE_ITEM = 'timeline-item';
const CLASS_TIMELINE_CARD = 'timeline-card';
const CLASS_TIMELINE_DATE = 'timeline-date';
const CLASS_TIMELINE_TITLE = 'timeline-title';
const CLASS_TIMELINE_PREVIEW = 'timeline-preview';

export class TimelineView extends ItemView {
    private timeline: Timeline;
    private settings: TimelineSettings;
    private i18n: I18nStrings;
    items: TimelineItem[] = [];
    currentTitle: string = '';

    constructor(leaf: WorkspaceLeaf, settings: TimelineSettings, i18n: I18nStrings) {
        super(leaf);
        this.timeline = new Timeline(this.app, settings);
        this.settings = settings;
        this.i18n = i18n;
    }

    getViewType(): string {
        return VIEW_TYPE_TIMELINE;
    }

    getDisplayText(): string {
        return this.i18n.commands.openTimelineView;
    }

    async onOpen() {
        try {
            await this.render();
        } catch (error) {
            new Notice(this.i18n.errors.renderFailed);
        }
    }

    private renderTitle(container: HTMLElement) {
        const titleContainer = container.createEl('div', { cls: CLASS_TIMELINE_HEADER });
        titleContainer.createEl('h2', { text: this.currentTitle });
    }

    private groupItemsByYear(): Map<number, TimelineItem[]> {
        const itemsByYear = new Map<number, TimelineItem[]>();
        this.items.forEach(item => {
            const year = item.date.getFullYear();
            if (!itemsByYear.has(year)) {
                itemsByYear.set(year, []);
            }
            itemsByYear.get(year)?.push(item);
        });
        return itemsByYear;
    }

    private renderItem(container: HTMLElement, item: TimelineItem, index: number, itemsLength: number) {
        const itemEl = container.createEl('div', { 
            cls: `${CLASS_TIMELINE_ITEM}${this.getItemClasses(index, itemsLength)}` 
        });
        
        const card = itemEl.createEl('div', { cls: CLASS_TIMELINE_CARD });

        card.createEl('div', { 
            cls: CLASS_TIMELINE_DATE, 
            text: item.date.toLocaleDateString(this.settings.language === 'zh-CN' ? 'zh-CN' : 'en-US') 
        });

        const titleEl = card.createEl('div', { cls: CLASS_TIMELINE_TITLE });
        titleEl.textContent = item.title;

        if (item.preview) {
            const previewEl = card.createEl('div', { cls: CLASS_TIMELINE_PREVIEW });
            previewEl.textContent = item.preview;
        }

        titleEl.addEventListener('click', async () => {
            const file = this.app.vault.getAbstractFileByPath(item.path);
            if (file instanceof TFile) {
                await this.app.workspace.getLeaf().openFile(file);
            }
        });
    }

    private getItemClasses(index: number, itemsLength: number): string {
        return (index === 0 ? ' first-item' : '') + 
               (index === itemsLength - 1 ? ' last-item' : '');
    }

    private renderEra(container: HTMLElement, year: number, items: TimelineItem[]) {
        const era = container.createEl('div', { cls: CLASS_TIMELINE_ERA });
        era.createEl('div', { cls: CLASS_TIMELINE_ERA_TITLE, text: `${year}` });
        items.forEach((item, index) => this.renderItem(era, item, index, items.length));
    }

    async render() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        
        if (this.currentTitle) {
            this.renderTitle(container);
        }
        
        const timelineContainer = container.createEl('div', { cls: CLASS_TIMELINE_CONTAINER });
        timelineContainer.createEl('div', { cls: CLASS_TIMELINE_LINE });

        const itemsByYear = this.groupItemsByYear();
        Array.from(itemsByYear.entries())
            .sort(([yearA], [yearB]) => yearB - yearA)
            .forEach(([year, items]) => this.renderEra(timelineContainer, year, items));
    }

    async updateFromFolder(folderPath: string) {
        const folder = this.app.vault.getAbstractFileByPath(folderPath) as TFolder;
        if (folder) {
            this.currentTitle = `📂 ${folder.name}`;
            this.items = await this.timeline.generateFromFolder(folder);
            await this.render();
        }
    }

    async updateFromTag(tag: string) {
        try {
            this.currentTitle = `🏷️ ${tag}`;
            this.items = await this.timeline.generateFromTag(tag);
            
            if (this.items.length === 0) {
                new Notice(this.i18n.errors.noTaggedFiles.replace('{tag}', tag));
                return;
            }

            await this.render();
        } catch (error) {
            new Notice('生成时间轴失败');
            throw error;
        }
    }

    async updateFromFile(filePath: string) {
        try {
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (file && file instanceof TFile) {
                this.currentTitle = `📄 ${file.basename}`;
                this.items = await this.timeline.generateFromFileLinks(file);
                
                if (this.items.length === 0) {
                    new Notice(this.i18n.errors.noFileLinks.replace('{filename}', file.basename));
                    return;
                }

                await this.render();
            }
        } catch (error) {
            new Notice(this.i18n.errors.generateFileFailed);
            console.error(error);
        }
    }

    getIcon(): string {
        return 'history';
    }
}