# SentencesAPI

这是一个提供多种句子API调用的项目，包含以下API接口：

## 1. ONE·一个
- API：`https://api.xygeng.cn/one`
- 响应结构：
```json
{
    "code": 200,
    "data": {
        "id": 2327,
        "tag": "寥寥此生虚度",
        "name": "佚名",
        "origin": "_萧彬",
        "content": "浮生寻乐，寥寥此生~",
        "created_at": "2019-03-15T23:33:11.000Z",
        "updated_at": "2022-03-09T08:42:10.000Z"
    },
    "error": null,
    "updateTime": 1742636923593
}
```
- 所需字段：`content`

## 2. 一言(Hitokoto)
- API：`https://cdn.jsdelivr.net/gh/hitokoto-osc/sentences-bundle@1.0.399/sentences/<select>.json`
- 参数说明：类型参数来自`<select>`选项的value值（a-l）

## 3. 随机中英文
- API：`https://api.kekc.cn/api/yien`
- 响应结构：
```json
{
    "cn": "人生不总在于握有一手好牌，有时也要打好一把烂牌。",
    "en": "Life is not always a matter of holding good cards, but sometimes, playing a poor hand well.",
    "audio": "http://api.kekc.cn/api/yien?act=getaudio&filename=MjAyMy0wNy0wNC5tcDM=",
    "count": 2638
}
```
- 所需字段：`cn` 和 `en`

## 4. 古诗词
- API：`https://v1.jinrishici.com/rensheng.txt`
- 响应格式：纯文本

## 5. 沙雕APP
- 彩虹屁：`https://api.shadiao.pro/chp`
- 朋友圈文案：`https://api.shadiao.pro/pyq`
- 毒鸡汤：`https://api.shadiao.pro/du`
- 疯狂星期四：`https://api.shadiao.pro/kfc`
- 响应格式：
```json
{
    "data": {
        "type": "彩虹屁",
        "text": "甜有100种方式，吃糖，吃蛋糕，还有98词的想你"
    }
}
```
- 所需字段：`text`

## 6. 情话API
- API：`https://api.lovelive.tools/api/SweetNothings`
- 响应格式：纯文本

## 使用方法
1. 克隆本仓库
2. 打开`index.html`文件
3. 选择需要的API类型
4. 点击获取句子

## 开源地址
本项目已开源，地址：[https://github.com/Love-Kali-sy/SentencesAPI](https://github.com/Love-Kali-sy/SentencesAPI)