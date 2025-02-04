<h1 align="center">
	Generate Timeline
</h1>

<p align="center">
    <a href="https://github.com/Shanshuimei/obsidian-generate-timeline/stargazers"><img src="https://img.shields.io/github/stars/Shanshuimei/obsidian-generate-timeline?colorA=363a4f&colorB=e0ac00&style=for-the-badge" alt="GitHub star count"></a>
    <a href="https://github.com/Shanshuimei/obsidian-generate-timeline/issues"><img src="https://img.shields.io/github/issues/Shanshuimei/obsidian-generate-timeline?colorA=363a4f&colorB=e93147&style=for-the-badge" alt="Open issues on GitHub"></a>
    <a href="https://github.com/Shanshuimei/obsidian-generate-timeline/contributors"><img src="https://img.shields.io/github/contributors/Shanshuimei/obsidian-generate-timeline?colorA=363a4f&colorB=08b94e&style=for-the-badge" alt="List of contributors"></a>
    <a href="./LICENCE"><img src="https://img.shields.io/static/v1.svg?style=for-the-badge&label=License&message=MIT&colorA=363a4f&colorB=b7bdf8" alt="MIT license"/></a>
    <br/><br/>
    <b>Generate Timeline</b> is a plugin developed for the Obsidian to help users generate timelines based on folders or tags. With this plugin, users can easily view and manage the content of notes in chronological order.   
</p>
<p align="center"><a href="https://kivgf4fnsy5.feishu.cn/drive/folder/ELWHf58RmlCOv6dBLSKcEG44nRd?from=from_copylink">中文文档</a> </p>

## Functional Overview

1. **Generate a timeline based on folders**：
   - Select a folder, the plugin will scan all the files in that folder and generate a timeline based on the time attributes in the files. The timeline will be arranged in chronological order for users to view and manage.
2. **Generate timeline based on tags**：
   - Select a tag, the plugin will scan all the content with the tag, and generate a timeline according to the time attribute in the file. The timeline will be arranged in chronological order to facilitate users to view and manage.
3. **Generate links based on tags or folders**：
   - This plug-in generates a timeline while generating an md file that links all related files in chronological order.
## Installation
1. Please install the `Update time on edit` plugin before installing this plugin.
2. Download the `main.js`, `manifest.json`, and `styles.css` files in the release.
3. Create a new `obsidian-generate-timeline` folder under the `\.obsidian \ plugins` folder and copy or move all `main.js`, `manifest.json` and `styles.css` files to the `obsidian-generate-timeline` folder.
4. Open `Generate timeline` in the obsidian installed plugins.
## How to use
1. Generate Timeline Based on Folder
	- Open the Command Palette, click Generate Timeline: Generate Timeline from Folder, and select the folder you want to generate the timeline for. This will create both a timeline Markdown file and a timeline view.
	- In the generated timeline Markdown file, click on the "More Options" menu and select Open Timeline View to bring up the timeline view at any time.
2. Generate Timeline Based on Tags
	- Open the Command Palette, click Generate Timeline: Generate Timeline from Tags, and select the tag you want to generate the timeline for. This will create both a timeline Markdown file and a timeline view.
	- In the generated timeline Markdown file, click on the "More Options" menu and select Open Timeline View to bring up the timeline view at any time.
## Contribution
We welcome contributions of any kind! If you have suggestions, questions, or would like to add new features, please submit an Issue or Pull Request on the GitHub repository.

## License
This plugin is released under the MIT License. For more details, please refer to the LICENSE file.
