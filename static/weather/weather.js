document.addEventListener('DOMContentLoaded', function () {
  const weatherDisplay = document.querySelector('.weather-display .weather-text');
  const buttons = document.querySelectorAll('.left-button');
  const searchBox = document.getElementById('city-search');

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
      }
    } catch (error) {
      weatherDisplay.textContent = `获取天气信息失败：${error.message}`;
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
        fetchWeather(translatedCity);
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
      switch (button.textContent) {
        case '显示天气':
          const city = searchBox.value.trim();
          if (city) {
            weatherDisplay.textContent = `正在获取 ${city} 的天气信息...`;
            await fetchWeather(city);
          } else {
            weatherDisplay.textContent = '请输入城市名称以显示天气。';
          }
          break;
        case '搜索城市':
          const searchCity = searchBox.value.trim();
          if (searchCity) {
            weatherDisplay.textContent = `正在搜索 ${searchCity} 的天气信息...`;
            await fetchWeather(searchCity);
          } else {
            weatherDisplay.textContent = '请输入城市名称以搜索天气。';
          }
          break;
        default:
          weatherDisplay.textContent = '功能开发中，敬请期待！';
      }
    });
  });

  // 自动获取并显示所在城市
  fetchLocation();
});
