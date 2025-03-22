# SentencesAPI

一个提供多种句子API调用的项目，支持多种句子类型的获取，适合学习、娱乐或开发使用。

## 功能特性
- 支持多种句子类型，包括 ONE 一句、一言网、随机中英文句子、古诗词、情话、沙雕文案等。
- 提供主题切换功能（明亮模式和暗黑模式）。
- 支持自动刷新句子内容。
- 响应快速，界面简洁。

## 支持的API接口及调用方式

### 1. ONE·一个
- **API**：`https://api.xygeng.cn/one`
- **请求方式**：GET
- **返回字段**：`content`（句子内容）
- **示例代码**：
  ```javascript
  fetch('https://api.xygeng.cn/one')
    .then(response => response.json())
    .then(data => console.log(data.data.content));
  ```

### 2. 一言 (Hitokoto)
- **API**：`https://cdn.jsdelivr.net/gh/hitokoto-osc/sentences-bundle@1.0.399/sentences/<type>.json`
- **请求方式**：GET
- **参数说明**：`<type>` 为句子类型（a-l），如动画、漫画、游戏等。
- **返回字段**：`hitokoto`（句子内容）
- **示例代码**：
  ```javascript
  const type = 'a'; // 动画类型
  fetch(`https://cdn.jsdelivr.net/gh/hitokoto-osc/sentences-bundle@1.0.399/sentences/${type}.json`)
    .then(response => response.json())
    .then(data => {
      const randomIndex = Math.floor(Math.random() * data.length);
      console.log(data[randomIndex].hitokoto);
    });
  ```

### 3. 随机中英文句子
- **API**：`https://api.kekc.cn/api/yien`
- **请求方式**：GET
- **返回字段**：`cn`（中文句子），`en`（英文句子）
- **示例代码**：
  ```javascript
  fetch('https://api.kekc.cn/api/yien')
    .then(response => response.json())
    .then(data => console.log(`${data.cn}\n${data.en}`));
  ```

### 4. 古诗词
- **API**：`https://v1.jinrishici.com/rensheng.txt`
- **请求方式**：GET
- **返回格式**：纯文本
- **示例代码**：
  ```javascript
  fetch('https://v1.jinrishici.com/rensheng.txt')
    .then(response => response.text())
    .then(data => console.log(data));
  ```

### 5. 沙雕APP
- **API**：
  - 彩虹屁：`https://api.shadiao.pro/chp`
  - 朋友圈文案：`https://api.shadiao.pro/pyq`
  - 毒鸡汤：`https://api.shadiao.pro/du`
  - 疯狂星期四：`https://api.shadiao.pro/kfc`
- **请求方式**：GET
- **返回字段**：`text`（句子内容）
- **示例代码**：
  ```javascript
  const type = 'chp'; // 彩虹屁
  fetch(`https://api.shadiao.pro/${type}`)
    .then(response => response.json())
    .then(data => console.log(data.data.text));
  ```

### 6. 情话API
- **API**：`https://api.lovelive.tools/api/SweetNothings`
- **请求方式**：GET
- **返回格式**：纯文本
- **示例代码**：
  ```javascript
  fetch('https://api.lovelive.tools/api/SweetNothings')
    .then(response => response.text())
    .then(data => console.log(data));
  ```

## 使用方法
1. **克隆本仓库**：
   ```bash
   git clone https://github.com/Love-Kali-sy/SentencesAPI.git
   ```
2. **打开项目目录**：
   ```bash
   cd SentencesAPI
   ```
3. **运行服务**：
   - 后台运行：
     ```bash
     python app.py start
     ```
   - 前台运行：
     ```bash
     python app.py run
     ```
4. **访问页面**：
   打开浏览器，访问 [http://localhost:8389](http://localhost:8389)。

5. **选择句子类型**：
   - 打开 `index.html` 页面。
   - 选择需要的句子类型。
   - 点击获取句子。

## 自动刷新功能
- 支持设置自动刷新间隔（最小5秒）。
- 点击“开始自动刷新”按钮后，句子会根据设置的时间间隔自动更新。

## 开源地址
本项目已开源，欢迎贡献代码或提出建议：
[https://github.com/Love-Kali-sy/SentencesAPI](https://github.com/Love-Kali-sy/SentencesAPI)

## 许可证
本项目基于 MIT 许可证开源。