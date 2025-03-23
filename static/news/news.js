let sum = 0;
let fetchInterval = null;
let writeInterval = null; // 持续写入的定时器
let lastNewsTitle = ''; // 保存上一次的新闻标题

const startFetchButton = document.getElementById('start-fetch');
const writeToClassIslandButton = document.getElementById('send-to-classisland'); // 按钮改为写入逻辑
const newsContainer = document.getElementById('news-container');
const intervalInput = document.getElementById('interval-input'); // 获取输入框
const apiUrlDisplay = document.getElementById('api-url-display'); // 确保正确获取 API URL 显示元素
const returnButton = document.querySelector('.return-link'); // 获取返回按钮

// 确保页面加载时未启动定时器
document.addEventListener('DOMContentLoaded', () => {
  if (fetchInterval) {
    clearInterval(fetchInterval);
    fetchInterval = null;
  }
  if (writeInterval) {
    clearInterval(writeInterval);
    writeInterval = null;
  }
});

// 在页面卸载时清除所有定时器
window.addEventListener('beforeunload', () => {
  if (fetchInterval) {
    clearInterval(fetchInterval);
    fetchInterval = null;
  }
  if (writeInterval) {
    clearInterval(writeInterval);
    writeInterval = null;
  }
});

// 停止自动刷新时清除定时器
startFetchButton.addEventListener('click', () => {
  if (fetchInterval) {
    clearInterval(fetchInterval); // 清除定时器
    fetchInterval = null;
    startFetchButton.textContent = '启动自动获取';
    console.log('自动刷新已停止');
  } else {
    const interval = parseInt(intervalInput.value, 10) * 1000;
    if (isNaN(interval) || interval < 1000) {
      alert('时间间隔必须大于或等于1秒');
      return;
    }
    fetchInterval = setInterval(fetchNews, interval); // 启动定时器
    startFetchButton.textContent = '停止自动获取';
    console.log('自动刷新已启动');
  }
});

// 获取新闻
async function fetchNews() {
  try {
    sum++;
    if (sum > 300) {
      sum = 1; // 当 sum 超过 300 时重置为 1
    }
    const apiUrl = `https://xiaoapi.cn/API/zs_xw.php?n=${sum}`; // 更新 API URL
    if (apiUrlDisplay) {
      apiUrlDisplay.textContent = `当前 API URL: ${apiUrl}`; // 显示 API URL
    }
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.code === 200) {
      if (data.title === lastNewsTitle) {
        console.log('重复新闻，跳过:', data.title);
        return; // 跳过重复的新闻
      }
      lastNewsTitle = data.title; // 更新最后的新闻标题

      const newsButton = document.createElement('button');
      newsButton.className = 'sentence-option';
      newsButton.textContent = data.title;
      newsButton.addEventListener('click', () => {
        window.open(data.url, '_blank');
      });
      newsContainer.appendChild(newsButton);
    } else {
      console.error('获取新闻失败:', data);
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 持续写入到 ClassIsland
writeToClassIslandButton.addEventListener('click', () => {
  if (writeInterval) {
    clearInterval(writeInterval);
    writeInterval = null;
    writeToClassIslandButton.textContent = '开始持续写入';
  } else {
    writeInterval = setInterval(async () => {
      const latestNews = newsContainer.lastChild?.textContent || '暂无新闻';
      try {
        if (latestNews !== '暂无新闻') {
          await fetch('/sentence.txt', { // 确保路径正确
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
            body: latestNews, // 写入最新新闻内容到 ./sentences/static/sentence.txt
          });
          console.log('已写入 ./sentences/static/sentence.txt:', latestNews);
        } else {
          console.log('没有新闻可写入');
        }
      } catch (error) {
        console.error('写入失败:', error);
      }
    }, 1000); // 每秒写入一次
    writeToClassIslandButton.textContent = '停止持续写入';
  }
});

// 点击返回按钮时关闭获取和写入功能
returnButton.addEventListener('click', () => {
  if (fetchInterval) {
    clearInterval(fetchInterval);
    fetchInterval = null;
    startFetchButton.textContent = '启动自动获取';
  }
  if (writeInterval) {
    clearInterval(writeInterval);
    writeInterval = null;
    writeToClassIslandButton.textContent = '开始持续写入';
  }
});
