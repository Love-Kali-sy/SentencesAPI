document.addEventListener('DOMContentLoaded', function () {
  const weatherDisplay = document.querySelector('.weather-display .weather-text');
  const buttons = document.querySelectorAll('.left-button');
  const searchBox = document.getElementById('city-search');
  const forecastContainer = document.querySelector('.forecast-container'); // 获取天气框容器
  const forecastBoxes = document.querySelectorAll('.forecast-box'); // 获取 6 个天气框
  const realTimeWeather = document.getElementById('real-time-weather'); // 获取实时天气显示区域
  const fifteenDayContainer = document.querySelector('.fifteen-day-container'); // 获取 15 天天气框容器

  // 初始化时隐藏天气框
  forecastContainer.style.display = 'none';
  fifteenDayContainer.style.display = 'none';

  async function fetchWeather(city) {
    try {
      const response = await fetch(`https://xiaoapi.cn/API/zs_tq.php?type=cytq&msg=${encodeURIComponent(city)}&num=20&n=1`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.code === 200) {
        const weatherDetails = data.data.split('\n').map(item => `<div>${item}</div>`).join('');
        weatherDisplay.innerHTML = `<strong>城市：</strong>${data.keyWord}<br>${weatherDetails}`;
      } else {
        weatherDisplay.textContent = `错误：${data.msg || '无法获取天气信息'}`;
        forecastContainer.style.display = 'none'; // 隐藏天气框
      }
    } catch (error) {
      weatherDisplay.textContent = `获取天气信息失败：${error.message}`;
      forecastContainer.style.display = 'none'; // 隐藏天气框
    }
  }

  async function fetchRealTimeWeather(city) {
    try {
      const response = await fetch(`https://xiaoapi.cn/API/zs_tq.php?type=zytq&msg=${encodeURIComponent(city)}&num=20&n=1`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.code === 200) {
        realTimeWeather.innerHTML = `<strong>实时天气：</strong><br>${data.data}`;
      } else {
        realTimeWeather.textContent = `实时天气获取失败：${data.msg || '未知错误'}`;
      }
    } catch (error) {
      realTimeWeather.textContent = `实时天气获取失败：${error.message}`;
    }
  }

  async function fetchForecast(city) {
    try {
      const response = await fetch(`https://xiaoapi.cn/API/zs_tq.php?type=moji&msg=${encodeURIComponent(city)}&num=20&n=1`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.code === 200) {
        weatherDisplay.innerHTML = `<strong>城市：</strong>${data.keyWord}<br>${data.name}`;
        const weatherData = data.data;

        // 填充 6 天气框
        forecastBoxes.forEach((box, index) => {
          const dayData = weatherData[index + 1]; // 获取第 1 到第 6 天的数据
          if (dayData) {
            box.innerHTML = `<div>${dayData.replace(/<del>/g, '').replace(/<\/del>/g, '')}</div>`; // 去除 <del> 标签
          } else {
            box.innerHTML = `<div>暂无数据</div>`;
          }
        });

        // 显示天气框
        forecastContainer.style.display = 'flex';
        fifteenDayContainer.style.display = 'none'; // 隐藏 15 天天气框
      } else {
        weatherDisplay.textContent = `错误：${data.msg || '无法获取天气信息'}`;
        forecastContainer.style.display = 'none'; // 隐藏天气框
      }
    } catch (error) {
      weatherDisplay.textContent = `获取天气信息失败：${error.message}`;
      forecastContainer.style.display = 'none'; // 隐藏天气框
    }
  }

  async function fetchFifteenDayWeather(city) {
    try {
      const response = await fetch(`https://xiaoapi.cn/API/zs_tq.php?type=baidu&msg=${encodeURIComponent(city)}&num=20&n=1`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.code === 200) {
        const weatherData = data.data;

        // 填充 15 天天气框
        const fifteenDayBoxes = document.querySelectorAll('.fifteen-day-box');
        const today = new Date();
        fifteenDayBoxes.forEach((box, index) => {
          const dayData = weatherData[index]; // 获取第 1 到第 15 天的数据
          const date = new Date(today);
          date.setDate(today.getDate() + index); // 计算对应日期
          const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          if (dayData) {
            box.innerHTML = `<div>${dayData.replace(/\n/g, '<br>')}</div><div style="margin-top: 10px; font-size: 14px; color: var(--text-color);">日期：${formattedDate}</div>`;
          } else {
            box.innerHTML = `<div>暂无数据</div><div style="margin-top: 10px; font-size: 14px; color: var(--text-color);">日期：${formattedDate}</div>`;
          }
        });

        // 显示 15 天天气框
        fifteenDayContainer.style.display = 'grid';
        forecastContainer.style.display = 'none'; // 隐藏天气框
      } else {
        weatherDisplay.textContent = `错误：${data.msg || '无法获取天气信息'}`;
        fifteenDayContainer.style.display = 'none'; // 隐藏 15 天天气框
      }
    } catch (error) {
      weatherDisplay.textContent = `获取天气信息失败：${error.message}`;
      fifteenDayContainer.style.display = 'none'; // 隐藏 15 天天气框
    }
  }

  async function fetchLocation() {
    try {
      const response = await fetch('https://ip.011102.xyz/');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const currentCityElement = document.getElementById('current-city');
      if (data.IP && data.IP.City) {
        const city = data.IP.City;
        const translatedCity = await translateCityToChinese(city);
        currentCityElement.textContent = translatedCity;
        fetchRealTimeWeather(translatedCity); // 获取实时天气
        fetchWeather(translatedCity);

        // 每 1 分钟刷新实时天气
        setInterval(() => {
          fetchRealTimeWeather(translatedCity);
        }, 60000);
      } else {
        currentCityElement.textContent = '未知城市';
        weatherDisplay.textContent = '无法获取当前位置，请手动输入城市名称。';
      }
    } catch (error) {
      document.getElementById('current-city').textContent = '获取失败';
      weatherDisplay.textContent = `获取位置信息失败：${error.message}`;
    }
  }

  async function translateCityToChinese(city) {
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(city)}&langpair=en|zh-CN`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.responseData.translatedText || city;
    } catch (error) {
      console.error('翻译失败:', error.message);
      return city; // 如果翻译失败，返回原始城市名
    }
  }

  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      switch (button.id) {
        case 'show-weather':
          forecastContainer.style.display = 'none'; // 隐藏天气框
          fifteenDayContainer.style.display = 'none'; // 隐藏 15 天天气框
          const city = searchBox.value.trim();
          if (city) {
            weatherDisplay.textContent = `正在获取 ${city} 的天气信息...`;
            await fetchWeather(city);
          } else {
            weatherDisplay.textContent = '请输入城市名称以显示天气。';
          }
          break;
        case 'search-city':
          forecastContainer.style.display = 'flex';
          fifteenDayContainer.style.display = 'none';
          const searchCity = searchBox.value.trim();
          if (searchCity) {
            weatherDisplay.textContent = `正在搜索 ${searchCity} 的天气信息...`;
            await fetchForecast(searchCity);
          } else {
            weatherDisplay.textContent = '请输入城市名称以搜索天气。';
          }
          break;
        case 'fifteen-day-weather':
          forecastContainer.style.display = 'none';
          fifteenDayContainer.style.display = 'grid';
          const fifteenDayCity = searchBox.value.trim();
          if (fifteenDayCity) {
            weatherDisplay.textContent = `正在获取 ${fifteenDayCity} 的 15 天天气信息...`;
            await fetchFifteenDayWeather(fifteenDayCity);
          } else {
            weatherDisplay.textContent = '请输入城市名称以获取 15 天天气信息。';
          }
          break;
        default:
          forecastContainer.style.display = 'none'; // 隐藏天气框
          fifteenDayContainer.style.display = 'none'; // 隐藏 15 天天气框
          weatherDisplay.textContent = '功能开发中，敬请期待！';
      }
    });
  });

  // 自动获取并显示所在城市和实时天气
  fetchLocation();
});
