class APIManager {
  constructor() {
    this.baseURLs = {
      one: 'https://api.xygeng.cn/one',
      hitokoto: 'https://cdn.jsdelivr.net/gh/hitokoto-osc/sentences-bundle@1.0.399/sentences/',
      random: 'https://api.kekc.cn/api/yien',
      poetry: 'https://v1.jinrishici.com/rensheng.txt',
      shadiao: 'https://api.shadiao.pro/',
      love: 'https://api.lovelive.tools/api/SweetNothings'
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

  async fetchLoveWords() {
    const response = await fetch(this.baseURLs.love);
    return await response.text();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const apiManager = new APIManager();
  const options = document.querySelectorAll('.sentence-option input[type="radio"]');
  const displayArea = document.querySelector('.sentence-display');
  
  options.forEach(option => {
    option.addEventListener('change', async function() {
      if (this.checked) {
        displayArea.innerHTML = '加载中...';
        try {
          let content = '';
          switch(this.value) {
            case 'one':
              content = await apiManager.fetchOne();
              break;
            case 'hitokoto':
              const hitokotoType = document.querySelector('.hitokoto-type').value;
              content = await apiManager.fetchHitokoto(hitokotoType);
              break;
            case 'random-sentence':
              content = await apiManager.fetchRandom();
              break;
            case 'poetry':
              content = await apiManager.fetchPoetry();
              break;
            case 'love-words':
              content = await apiManager.fetchLoveWords();
              break;
            case 'shadiao':
              const shadiaoType = document.querySelector('.shadiao-type').value;
              content = await apiManager.fetchShadiao(shadiaoType);
              break;
            default:
              content = '请选择有效的句子类型';
          }
          displayArea.innerHTML = `<div class="sentence-text">${content}</div>`;
            // 新增保存到服务器的代码
          fetch('/save_sentence', {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain; charset=utf-8'
            },
            body: content
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

  // 监听所有选项变化
  document.querySelectorAll('.sentence-option input[type="radio"]').forEach(option => {
    option.addEventListener('change', function() {
      const hitokotoSelect = document.querySelector('.hitokoto-type');
      const shadiaoSelect = document.querySelector('.shadiao-type');
      
      if (this.id === 'hitokoto') {
        hitokotoSelect.style.display = 'inline-block';
        shadiaoSelect.style.display = 'none';
      } else if (this.id === 'shadiao') {
        shadiaoSelect.style.display = 'inline-block';
        hitokotoSelect.style.display = 'none';
      } else {
        hitokotoSelect.style.display = 'none';
        shadiaoSelect.style.display = 'none';
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
    if (isRefreshing) {
      clearInterval(refreshInterval);
      toggleButton.textContent = '开始自动刷新';
      refreshInput.disabled = false;
    } else {
      const interval = parseInt(refreshInput.value) * 1000;
      if (interval >= 5000) {
        refreshInterval = setInterval(async () => {
          const selectedOption = document.querySelector('.sentence-option input:checked');
          if (selectedOption) {
            selectedOption.dispatchEvent(new Event('change'));
          }
        }, interval);
        toggleButton.textContent = '停止自动刷新';
        refreshInput.disabled = true;
      } else {
        alert('刷新间隔不能小于5秒');
        return;
      }
    }
    isRefreshing = !isRefreshing;
  });

  // 默认加载第一个选项
  if (options.length > 0) {
    options[0].checked = true;
    options[0].dispatchEvent(new Event('change'));
  }
});