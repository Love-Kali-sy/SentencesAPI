class APIManager {
  constructor() {
    this.baseURLs = {
      one: 'https://api.xygeng.cn/one',
      hitokoto: 'https://cdn.jsdelivr.net/gh/hitokoto-osc/sentences-bundle@1.0.399/sentences/',
      random: 'https://api.kekc.cn/api/yien', // 恢复随机中英文句子的 API
      poetry: 'https://v1.jinrishici.com/rensheng.txt',
      shadiao: 'https://api.shadiao.pro/',
      love: 'https://api.lovelive.tools/api/SweetNothings/1/Serialization/Json?genderType='
    };
  }

  async fetchOne() {
    const response = await fetch(this.baseURLs.one);
    const data = await response.json();
    return data.data.content;
  }

  async fetchHitokoto(type = 'a') {
    const response = await fetch(`${this.baseURLs.hitokoto}${type}.json`);
    const data = await response.json();
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex].hitokoto;
  }

  async fetchRandom() {
    const response = await fetch(this.baseURLs.random);
    const data = await response.json();
    return `${data.cn}\n${data.en}`;
  }

  async fetchPoetry() {
    const response = await fetch(this.baseURLs.poetry);
    return await response.text();
  }

  async fetchShadiao(type = 'chp') {
    const response = await fetch(`${this.baseURLs.shadiao}${type}`);
    const data = await response.json();
    return data.data.text;
  }

  async fetchLoveWords(genderType = 'M') {
    try {
      const response = await fetch(`${this.baseURLs.love}${genderType}`);
      console.log('Fetching Love Words from:', `${this.baseURLs.love}${genderType}`); // 输出请求地址
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Love Words API Response:', data); // 输出 API 返回的数据
      if (data.returnObj && data.returnObj.length > 0) {
        return data.returnObj[0]; // 返回 returnObj 中的第一条数据
      } else {
        throw new Error('API 返回的数据格式不正确或为空');
      }
    } catch (error) {
      console.error('获取随机情话失败:', error.message); // 输出错误信息到控制台
      return '抱歉，暂时无法获取情话，请稍后重试。'; // 返回默认情话
    }
  }
}

// 示例：发送 API 请求的函数
async function fetchSentence(apiUrl, headers = {}) {
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json', // 指定内容类型
        'Authorization': 'Bearer your-token-here', // 添加授权令牌
        ...headers, // 合并传入的其他请求头
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sentence:', error);
    throw error;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const apiManager = new APIManager();
  const options = document.querySelectorAll('.sentence-option input[type="radio"]');
  const displayArea = document.querySelector('.sentence-display');
  const currentApiName = document.getElementById('current-api-name'); // 获取显示 API 名称的元素
  const currentApiUrl = document.getElementById('current-api-url'); // 获取显示 API 地址的元素

  options.forEach(option => {
    option.addEventListener('change', async function() {
      if (this.checked) {
        displayArea.innerHTML = '加载中...';
        currentApiName.textContent = this.nextElementSibling.textContent; // 更新当前 API 名称
        let apiUrl = ''; // 用于存储当前 API 地址
        try {
          let content = '';
          switch(this.value) {
            case 'one':
              apiUrl = apiManager.baseURLs.one;
              content = await apiManager.fetchOne();
              break;
            case 'hitokoto':
              const hitokotoType = document.querySelector('.hitokoto-type').value;
              apiUrl = `${apiManager.baseURLs.hitokoto}${hitokotoType}.json`;
              content = await apiManager.fetchHitokoto(hitokotoType);
              break;
            case 'random-sentence': // 恢复随机中英文句子的逻辑
              apiUrl = apiManager.baseURLs.random;
              content = await apiManager.fetchRandom();
              break;
            case 'poetry':
              apiUrl = apiManager.baseURLs.poetry;
              content = await apiManager.fetchPoetry();
              break;
            case 'love-words':
              const genderType = document.querySelector('.love-words-gender').value;
              apiUrl = `${apiManager.baseURLs.love}${genderType}`;
              content = await apiManager.fetchLoveWords(genderType);
              break;
            case 'shadiao':
              const shadiaoType = document.querySelector('.shadiao-type').value;
              apiUrl = `${apiManager.baseURLs.shadiao}${shadiaoType}`;
              content = await apiManager.fetchShadiao(shadiaoType);
              break;
            default:
              content = '请选择有效的句子类型';
          }
          currentApiUrl.textContent = apiUrl; // 更新当前 API 地址
          displayArea.innerHTML = `<div class="sentence-text">${content}</div>`;
            // 新增保存到服务器的代码
          const cleanedContent = content.replace(/\r?\n/g, " ");
            displayArea.innerHTML = `<div class="sentence-text">${cleanedContent}</div>`;
            fetch('/save_sentence', {
              method: 'POST',
              headers: {
                'Content-Type': 'text/plain; charset=utf-8'
              },
              body: cleanedContent  // 发送处理后的内容
            }).catch(error => console.error('保存失败:', error));
        } catch (error) {
          console.error('获取句子失败:', error);
          displayArea.innerHTML = '获取句子失败，请稍后重试';
        }
      }
    });
  });

  // 初始化类型选择器
  const hitokotoOption = document.querySelector('#hitokoto');
  const shadiaoOption = document.querySelector('#shadiao');
  
  if (hitokotoOption) {
    const typeSelect = hitokotoOption.parentElement.querySelector('.hitokoto-type');
    typeSelect.style.display = hitokotoOption.checked ? 'inline-block' : 'none';
  }

  if (shadiaoOption) {
    const typeSelect = shadiaoOption.parentElement.querySelector('.shadiao-type');
    typeSelect.style.display = shadiaoOption.checked ? 'inline-block' : 'none';
  }

  // 添加性别选择器
  const loveWordsOption = document.querySelector('#love-words');
  if (loveWordsOption) {
    const genderSelect = document.createElement('select');
    genderSelect.className = 'love-words-gender';
    genderSelect.innerHTML = `
      <option value="M">渣男</option>
      <option value="F">绿茶</option>
    `;
    loveWordsOption.parentElement.appendChild(genderSelect);
    genderSelect.style.display = loveWordsOption.checked ? 'inline-block' : 'none';
  }

  // 监听所有选项变化
  document.querySelectorAll('.sentence-option input[type="radio"]').forEach(option => {
    option.addEventListener('change', function() {
      const hitokotoSelect = document.querySelector('.hitokoto-type');
      const shadiaoSelect = document.querySelector('.shadiao-type');
      const genderSelect = document.querySelector('.love-words-gender');
      
      if (this.id === 'hitokoto') {
        hitokotoSelect.style.display = 'inline-block';
        shadiaoSelect.style.display = 'none';
        genderSelect.style.display = 'none';
      } else if (this.id === 'shadiao') {
        shadiaoSelect.style.display = 'inline-block';
        hitokotoSelect.style.display = 'none';
        genderSelect.style.display = 'none';
      } else if (this.id === 'love-words') {
        genderSelect.style.display = 'inline-block';
        hitokotoSelect.style.display = 'none';
        shadiaoSelect.style.display = 'none';
      } else {
        hitokotoSelect.style.display = 'none';
        shadiaoSelect.style.display = 'none';
        genderSelect.style.display = 'none';
      }
    });
  });

  // 自动刷新功能
  let refreshInterval = null;
  const refreshControl = document.createElement('div');
  refreshControl.className = 'refresh-control';
  refreshControl.innerHTML = `
    <label>
      自动刷新间隔（秒）：
      <input type="number" id="refresh-interval" min="5" value="10">
    </label>
    <button id="toggle-refresh">开始自动刷新</button>
  `;
  document.querySelector('.sentence-container').appendChild(refreshControl);

  const refreshInput = document.getElementById('refresh-interval');
  const toggleButton = document.getElementById('toggle-refresh');
  let isRefreshing = false;

  toggleButton.addEventListener('click', () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
      toggleButton.textContent = '开始自动刷新';
    } else {
      const interval = parseInt(document.getElementById('refresh-interval').value) * 1000;
      if (interval >= 5000) {
        refreshInterval = setInterval(() => {
          const selectedOption = document.querySelector('.sentence-option input:checked');
          if (selectedOption) {
            selectedOption.dispatchEvent(new Event('change'));
          }
        }, interval);
        toggleButton.textContent = '停止自动刷新';
      } else {
        alert('刷新间隔不能小于5秒');
      }
    }
  });

  // 确保默认加载逻辑不会触发自动刷新
  if (options.length > 0) {
    options[0].checked = true;
    options[0].dispatchEvent(new Event('change'));
  }
});

window.addEventListener('beforeunload', () => {
  fetch('/save_sentence', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body: '请启动服务', // 写入内容
  }).catch(error => console.error('写入失败:', error));

  // 发送请求以杀死占用 8389 端口的程序
  fetch('/kill_port', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ port: 8389 }),
  }).catch(error => console.error('关闭端口失败:', error));

  // 删除小托盘图标
  if (typeof window.tray !== 'undefined' && window.tray.remove) {
    window.tray.remove();
    console.log('小托盘图标已删除');
  }
});