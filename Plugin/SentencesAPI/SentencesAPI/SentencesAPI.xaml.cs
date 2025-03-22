using System.IO;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using ClassIsland.Core.Controls;
using ClassIsland.Core.Abstractions.Controls;
using ClassIsland.Core.Attributes;
using MaterialDesignThemes.Wpf;
using Microsoft.Win32; 

namespace SentencesAPI
{
    [ComponentInfo(
        "3DFE17BA-92D3-9E14-F5CA-CC9EE40C5F58",
        "珨晟",
        PackIconKind.CalendarOutline,
        "婓翋賜醱珆尨珨晟﹝"
    )]
    public partial class MySentencesAPI : ComponentBase
    {
        private readonly DispatcherTimer _refreshTimer;
        private readonly string _filePath; // 改为只读字段

        public MySentencesAPI()
        {
            InitializeComponent();

            // 从注册表获取安装路径
            var installPath = Registry.GetValue(@"HKEY_CURRENT_USER\Software\StaticServer",
                "InstallPath",
                null) as string;

            // 验证注册表值并构造路径
            if (!string.IsNullOrEmpty(installPath))
            {
                _filePath = Path.Combine(installPath, "static", "sentence.txt");
            }
            else
            {
                // 注册表值不存在时的处理方案（这里抛出异常并给出提示）
                throw new InvalidOperationException(
                    "无法在注册表 HKEY_CURRENT_USER\\Software\\StaticServer 中找到 InstallPath 值。");
            }

            // 初始化定时器
            _refreshTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(1)
            };
            _refreshTimer.Tick += async (s, e) => await LoadHitokotoAsync();
            _refreshTimer.Start();

            LoadHitokotoAsync();
        }

        private async Task LoadHitokotoAsync()
        {
            try
            {
                // 异步读取文件内容
                var result = await File.ReadAllTextAsync(_filePath); // 使用新路径
                Dispatcher.Invoke(() => Sentences.Text = result.Trim());
            }
            catch (Exception ex)
            {
                // 添加文件读取异常处理
                Dispatcher.Invoke(() => Sentences.Text = "加载句子失败");
                Console.WriteLine($"读取文件失败: {ex.Message}");
            }
        }
    }
}