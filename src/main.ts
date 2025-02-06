import { 
	App, 
	Plugin, 
	PluginSettingTab, 
	Setting, 
	TFile, 
	Menu,
	TAbstractFile,
	normalizePath,
	Notice
} from 'obsidian';
import { TimelineView, VIEW_TYPE_TIMELINE } from './TimelineView';
import { FolderSuggestModal } from './FolderSuggest';
import { TagSuggestModal } from './TagSuggest';
import { TimelineSettings, DEFAULT_SETTINGS } from './TimelineSettings';
import { Timeline } from './Timeline';
import { TFolder } from 'obsidian';

export default class TimelinePlugin extends Plugin {
	settings: TimelineSettings;

	async onload() {
		await this.loadSettings();
		
		// 添加设置标签页
		this.addSettingTab(new TimelineSettingTab(this.app, this));
		
		console.log('加载 Timeline 插件');
		
		try {
			this.registerView(
				VIEW_TYPE_TIMELINE,
				(leaf) => new TimelineView(leaf, this.settings)
			);

			// 添加文件菜单项
			this.registerEvent(
				this.app.workspace.on('file-menu', (menu: Menu, abstractFile: TAbstractFile) => {
					// 检查是否是时间轴文件
					if (abstractFile instanceof TFile && 
						abstractFile.path.startsWith('timelines/') && 
						abstractFile.extension === 'md') {
						
						// 读取文件的 frontmatter
						const cache = this.app.metadataCache.getFileCache(abstractFile);
						const generatedFrom = cache?.frontmatter?.generated_from;
						
						if (generatedFrom) {
							const [type, value] = generatedFrom.split(':');
							
							menu.addItem((item) => {
								item
									.setTitle('打开时间轴视图')
									.setIcon('clock')
									.onClick(async () => {
										await this.activateView();
										const view = this.getTimelineView();
										if (view) {
											if (type === 'folder') {
												await view.updateFromFolder(value);
											} else if (type === 'tag') {
												await view.updateFromTag(value);
											}
										}
									});
							});
						}
					}
				})
			);

			// 从文件夹生成时间轴视图
			this.addCommand({
				id: 'generate-timeline-view-from-folder',
				name: '从文件夹生成时间轴视图',
				callback: async () => {
					try {
						const folderPath = await this.selectFolder();
						if (folderPath) {
							await this.activateView();
							const view = this.getTimelineView();
							if (view) {
								await view.updateFromFolder(folderPath);
							}
						}
					} catch (error) {
						console.error('生成文件夹时间轴视图时出错:', error);
					}
				}
			});

			// 从文件夹生成时间轴文件
			this.addCommand({
				id: 'generate-timeline-file-from-folder',
				name: '从文件夹生成时间轴文件',
				callback: async () => {
					try {
						const folderPath = await this.selectFolder();
						if (folderPath) {
							const folder = this.app.vault.getAbstractFileByPath(folderPath);
							
							if (!(folder instanceof TFolder)) {
								throw new Error(`Invalid folder path: ${folderPath}`);
							}

							const timeline = new Timeline(this.app, this.settings);
							const items = await timeline.generateFromFolder(folder);
							const content = await timeline.generateTimelineMarkdown(items, `Timeline - ${folderPath}`, { type: 'folder', value: folderPath });
							
							// 创建并打开文件
							const { folderPath: targetFolder, fileName } = await this.createNestedFolders(folderPath);
							const finalFileName = this.generateFileName(fileName || folderPath.split('/').pop() || '');
							const filePath = `${targetFolder}/${finalFileName}.md`;
							
							// 检查文件是否存在,如果存在则删除
							const existingFile = this.app.vault.getAbstractFileByPath(filePath);
							if (existingFile) {
								await this.app.vault.delete(existingFile);
							}
							
							const file = await this.app.vault.create(filePath, content);
							await this.app.workspace.getLeaf().openFile(file);
						}
					} catch (error) {
						console.error('生成文件夹时间轴文件时出错:', error);
					}
				}
			});

			// 从标签生成时间轴视图
			this.addCommand({
				id: 'generate-timeline-view-from-tag',
				name: '从标签生成时间轴视图',
				callback: async () => {
					try {
						const tag = await this.selectTag();
						if (tag) {
							await this.activateView();
							const view = this.getTimelineView();
							if (view) {
								await view.updateFromTag(tag);
							}
						}
					} catch (error) {
						console.error('生成标签时间轴视图时出错:', error);
					}
				}
			});

			// 从标签生成时间轴文件
			this.addCommand({
				id: 'generate-timeline-file-from-tag',
				name: '从标签生成时间轴文件',
				callback: async () => {
					try {
						const tag = await this.selectTag();
						if (tag) {
							await this.generateTimelineFileFromTag(tag);
						}
					} catch (error) {
						console.error('生成标签时间轴文件时出错:', error);
					}
				}
			});
		} catch (error) {
			console.error('插件加载时出错:', error);
		}
	}

	async selectFolder(): Promise<string | null> {
		const modal = new FolderSuggestModal(this.app);
		return await modal.openAndGetValue();
	}

	async selectTag(): Promise<string | null> {
		const modal = new TagSuggestModal(this.app);
		return await modal.openAndGetValue();
	}

	async activateView(position: 'left' | 'right' = this.settings.defaultPosition) {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_TIMELINE)[0];
		
		if (!leaf) {
			const newLeaf = position === 'left' 
				? workspace.getLeftLeaf(false)
				: workspace.getRightLeaf(false);
			if (newLeaf) {
				leaf = newLeaf;
				await leaf.setViewState({ type: VIEW_TYPE_TIMELINE });
			}
		}
		
		if (leaf) {
			workspace.revealLeaf(leaf);
			return leaf;
		}
		return null;
	}

	getTimelineView(): TimelineView | null {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TIMELINE);
		if (leaves.length === 0) {
			return null;
		}
		return leaves[0].view as TimelineView;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.updateStyles();
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateStyles();
	}

	updateStyles() {
		const style = document.createElement('style');
		style.id = 'timeline-custom-styles';
		style.textContent = `
			.timeline-line {
				width: ${this.settings.lineWidth}px !important;
				background: ${this.settings.lineColor} !important;
			}
			
			.timeline-item::after {
				background: ${this.settings.lineColor} !important;
			}
			
			.timeline-item {
				margin: ${this.settings.itemSpacing}px 0 !important;
			}
			
			.timeline-card {
				background: ${this.settings.cardBackground} !important;
				transition: transform ${this.settings.animationDuration}ms !important;
			}
		`;

		// 移除旧样式
		document.getElementById('timeline-custom-styles')?.remove();
		document.head.appendChild(style);
	}

	async createNestedFolders(tagPath: string) {
			// 检查并创建根目录
			const rootPath = 'timelines';
			if (!this.app.vault.getAbstractFileByPath(rootPath)) {
				try {
					await this.app.vault.createFolder(rootPath);
				} catch (error) {
					new Notice(`创建根目录失败: ${rootPath}`);
					throw error;
				}
			}
		
			// 将路径分割为文件夹部分和文件名部分
			const parts = tagPath.split('/');
			const fileName = parts.pop(); // 移除最后一个部分作为文件名
			let currentPath = rootPath;
		
			// 为每个父文件夹创建目录
			for (const part of parts) {
				currentPath = normalizePath(`${currentPath}/${part}`);
				const folder = this.app.vault.getAbstractFileByPath(currentPath);
				if (!folder) {
					try {
						await this.app.vault.createFolder(currentPath);
					} catch (error) {
						new Notice(`创建文件夹失败: ${currentPath}`);
						throw error;
					}
				}
			}
		
			return { folderPath: currentPath, fileName };
		}

	generateFileName(baseName: string): string {
		const prefix = this.settings.fileNamePrefix || '';
		const suffix = this.settings.fileNameSuffix || '';
		return `${prefix}${baseName}${suffix}`;
	}

	async generateTimelineFileFromTag(tag: string) {
		try {
			const tagPath = tag.replace('#', '');
			const { folderPath, fileName } = await this.createNestedFolders(tagPath);
			const finalFileName = this.generateFileName(fileName || '');
			const filePath = `${folderPath}/${finalFileName}.md`;

			// 检查文件是否存在,如果存在则删除
			const existingFile = this.app.vault.getAbstractFileByPath(filePath);
			if (existingFile) {
				await this.app.vault.delete(existingFile);
			}
			
			const timeline = new Timeline(this.app, this.settings);
			const items = await timeline.generateFromTag(tag);
			const content = await timeline.generateTimelineMarkdown(items, `Timeline - ${tag}`, { type: 'tag', value: tag });
			
			// 创建并打开文件
			const file = await this.app.vault.create(filePath, content);
			await this.app.workspace.getLeaf().openFile(file);
		} catch (error) {
			console.error('生成标签时间轴文件时出错:', error);
			throw error;
		}
	}
}

class TimelineSettingTab extends PluginSettingTab {
	plugin: TimelinePlugin;

	constructor(app: App, plugin: TimelinePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: '时间轴设置'});

		new Setting(containerEl)
			.setName('重置设置')
			.setDesc('将所有设置恢复为默认值')
			.addButton(button => button
				.setButtonText('重置为默认值')
				.onClick(async () => {
					this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
					await this.plugin.saveSettings();
					// 重新显示设置面板
					this.display();
				}));

		new Setting(containerEl)
			.setName('时间轴线宽度')
			.setDesc('设置主时间轴线的宽度（像素）')
			.addSlider(slider => slider
				.setLimits(1, 10, 1)
				.setValue(this.plugin.settings.lineWidth)
				.onChange(async (value) => {
					this.plugin.settings.lineWidth = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('时间轴线颜色')
			.setDesc('设置时间轴线的颜色')
			.addColorPicker(color => color
				.setValue(this.plugin.settings.lineColor)
				.onChange(async (value) => {
					this.plugin.settings.lineColor = value;
					await this.plugin.saveSettings();
				}))
			.addText(text => text
				.setPlaceholder('点击左侧色盘选择颜色')
				.setValue('')
				.onChange(async (value) => {
					if (value) {
						this.plugin.settings.lineColor = value;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('项目间距')
			.setDesc('设置时间轴项目之间的间距（像素）')
			.addSlider(slider => slider
				.setLimits(10, 100, 5)
				.setValue(this.plugin.settings.itemSpacing)
				.onChange(async (value) => {
					this.plugin.settings.itemSpacing = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('卡片背景色')
			.setDesc('设置内容卡片的背景颜色')
			.addColorPicker(color => color
				.setValue(this.plugin.settings.cardBackground)
				.onChange(async (value) => {
					this.plugin.settings.cardBackground = value;
					await this.plugin.saveSettings();
				}))
			.addText(text => text
				.setPlaceholder('点击左侧色盘选择颜色')
				.setValue('')
				.onChange(async (value) => {
					if (value) {
						this.plugin.settings.cardBackground = value;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('动画持续时间')
			.setDesc('设置悬停动画的持续时间（毫秒）')
			.addSlider(slider => slider
				.setLimits(0, 1000, 50)
				.setValue(this.plugin.settings.animationDuration)
				.onChange(async (value) => {
					this.plugin.settings.animationDuration = value;
					await this.plugin.saveSettings();
				}));

		// 在文件名设置前添加日期属性设置
		new Setting(containerEl)
			.setName('日期属性')
			.setDesc('选择用于时间轴排序的 frontmatter 日期属性（如：created, updated, date 等）')
			.addText(text => text
				.setPlaceholder('输入日期属性名')
				.setValue(this.plugin.settings.dateAttribute)
				.onChange(async (value) => {
					this.plugin.settings.dateAttribute = value;
					await this.plugin.saveSettings();
				}));

		// 添加文件名前缀设置
		new Setting(containerEl)
			.setName('文件名前缀')
			.setDesc('设置生成的时间轴文件名前缀')
			.addText(text => text
				.setPlaceholder('输入前缀')
				.setValue(this.plugin.settings.fileNamePrefix)
				.onChange(async (value) => {
					this.plugin.settings.fileNamePrefix = value;
					await this.plugin.saveSettings();
				}));

		// 添加文件名后缀设置
		new Setting(containerEl)
			.setName('文件名后缀')
			.setDesc('设置生成的时间轴文件名后缀')
			.addText(text => text
				.setPlaceholder('输入后缀')
				.setValue(this.plugin.settings.fileNameSuffix)
				.onChange(async (value) => {
					this.plugin.settings.fileNameSuffix = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('默认位置')
			.setDesc('选择时间轴视图在左侧还是右侧边栏显示')
			.addDropdown(dropdown => dropdown
				.addOption('left', '左侧边栏')
				.addOption('right', '右侧边栏')
				.setValue(this.plugin.settings.defaultPosition)
				.onChange(async (value) => {
					this.plugin.settings.defaultPosition = value as 'left' | 'right';
					await this.plugin.saveSettings();
				})
			);
	}
}
