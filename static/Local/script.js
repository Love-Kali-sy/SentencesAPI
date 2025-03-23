document.addEventListener('DOMContentLoaded', () => {
  const feature1Radio = document.getElementById('feature1');
  const sentenceText = document.querySelector('.sentence-text');

  feature1Radio.addEventListener('change', () => {
    if (feature1Radio.checked) {
      fetch('./local_json/EnWords.csv', { headers: { 'Content-Type': 'text/plain' } }) // 确保正确的 Content-Type
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.text();
        })
        .then(data => {
          const lines = data.split('\n').filter(line => line.trim() !== '' && !line.startsWith('"word"')); // 过滤空行和标题行
          const randomLine = lines[Math.floor(Math.random() * lines.length)];
          const [word, translation] = randomLine.split('","').map(item => item.replace(/(^"|"$)/g, '')); // 去掉引号
          sentenceText.textContent = `${word}: ${translation}`;
        })
        .catch(error => {
          console.error('Error fetching the CSV file:', error);
          sentenceText.textContent = '无法加载随机英语，请稍后再试。';
        });
    }
  });
});
