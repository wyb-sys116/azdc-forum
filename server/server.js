const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '1mb' }));
// 托管前端静态文件
app.use(express.static(path.join(__dirname, '../public')));

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data.json');

// 初始化数据文件
function initData() {
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = {
      posts: [
        {
          id: 1,
          title: "论坛使用指南：发帖规范与功能说明",
          category: "综合",
          author: "管理员",
          avatar: "管",
          avatar_color: "from-blue-400 to-blue-600",
          content: "欢迎来到AZDC论坛！本论坛包含综合、魔方、3D打印、乒乓球四大板块，请大家在对应板块发布相关内容，友好交流。\n\n## 发帖说明\n选择对应分类发布内容，标题清晰，内容详实即可。\n\n## 互动功能\n支持点赞、评论，注册账号后可以发布帖子和评论。",
          views: 2345,
          comments: 1,
          likes: 156,
          created_at: Date.now() - 86400000,
          commentList: [
            { id: 1, author: "新用户", avatar: "新", avatar_color: "from-green-400 to-green-600", content: "支持！论坛界面很清爽", created_at: Date.now() - 3600000, likes: 8 }
          ]
        },
        {
          id: 2,
          title: "三阶魔方CFOP速拧入门：Cross十字技巧",
          category: "魔方",
          author: "魔方达人",
          avatar: "魔",
          avatar_color: "from-purple-400 to-purple-600",
          content: "CFOP是速拧三阶魔方的主流方法，第一步Cross十字是基础，直接影响后续速度。\n\n## 十字技巧\n尽量在底面完成十字，减少整体转动次数。\n\n## 进阶思路\n观察棱块位置，规划最少步数的十字解法，目标8步内完成。",
          views: 1892,
          comments: 3,
          likes: 210,
          created_at: Date.now() - 172800000,
          commentList: [
            { id: 1, author: "魔方新手", avatar: "新", avatar_color: "from-orange-400 to-orange-600", content: "十字总是做很慢，学习了", created_at: Date.now() - 7200000, likes: 15 },
            { id: 2, author: "速拧爱好者", avatar: "速", avatar_color: "from-pink-400 to-pink-600", content: "推荐多练盲拧十字", created_at: Date.now() - 3600000, likes: 10 }
          ]
        },
        {
          id: 3,
          title: "FDM 3D打印机首层校准完整教程",
          category: "3D打印",
          author: "打印老司机",
          avatar: "打",
          avatar_color: "from-orange-400 to-orange-600",
          content: "3D打印首层是决定打印成败的关键，首层校准不好会出现翘边、脱床等问题。\n\n## 调平步骤\n先手动调平四个角，再用纸片法测试喷嘴距离。\n\n## 温度设置\nPLA耗材热床60℃，喷嘴200℃；ABS热床110℃，喷嘴240℃。",
          views: 1654,
          comments: 2,
          likes: 178,
          created_at: Date.now() - 259200000,
          commentList: [
            { id: 1, author: "新手入坑", avatar: "新", avatar_color: "from-green-400 to-green-600", content: "终于不翘边了，感谢", created_at: Date.now() - 86400000, likes: 20 }
          ]
        },
        {
          id: 4,
          title: "乒乓球横拍反手拉球动作核心要点",
          category: "乒乓球",
          author: "乒乓爱好者",
          avatar: "乒",
          avatar_color: "from-red-400 to-red-600",
          content: "反手拉球是横拍的核心技术，很多业余球友容易出现发力不畅的问题。\n\n## 动作框架\n沉肩坠肘，手腕内曲，用腰腹带动前臂发力。\n\n## 常见误区\n不要只用手臂甩，重心要跟上，击球点在身体侧前方。",
          views: 2108,
          comments: 4,
          likes: 245,
          created_at: Date.now() - 345600000,
          commentList: [
            { id: 1, author: "直拍选手", avatar: "直", avatar_color: "from-blue-400 to-blue-600", content: "横拍反手确实羡慕", created_at: Date.now() - 172800000, likes: 12 }
          ]
        }
      ],
      users: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
  }
}

// 读取数据
function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// 写入数据
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 时间格式化
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (diff < minute) return '刚刚';
  if (diff < hour) return Math.floor(diff / minute) + '分钟前';
  if (diff < day) return Math.floor(diff / hour) + '小时前';
  if (diff < 7 * day) return Math.floor(diff / day) + '天前';
  
  return date.toLocaleDateString('zh-CN');
}

// 初始化
initData();

// ==================== API 接口 ====================

// 获取帖子列表（支持分类筛选、关键词搜索、排序）
app.get('/api/posts', (req, res) => {
  try {
    const { category, keyword, sort = 'time' } = req.query;
    const data = readData();
    let posts = [...data.posts];
    
    // 分类筛选
    if (category && category !== 'all') {
      posts = posts.filter(p => p.category === category);
    }
    
    // 关键词搜索
    if (keyword) {
      const kw = keyword.toLowerCase();
      posts = posts.filter(p => 
        p.title.toLowerCase().includes(kw) || 
        p.content.toLowerCase().includes(kw) ||
        p.author.toLowerCase().includes(kw)
      );
    }
    
    // 排序
    if (sort === 'hot') {
      posts.sort((a, b) => b.likes - a.likes);
    } else if (sort === 'views') {
      posts.sort((a, b) => b.views - a.views);
    } else {
      posts.sort((a, b) => b.created_at - a.created_at);
    }
    
    // 格式化输出
    const result = posts.map(post => ({
      ...post,
      time: formatTime(post.created_at)
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: '获取帖子列表失败' });
  }
});

// 获取帖子详情
app.get('/api/posts/:id', (req, res) => {
  try {
    const data = readData();
    const post = data.posts.find(p => p.id == req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }
    
    // 增加浏览量
    post.views++;
    writeData(data);
    
    // 格式化评论
    const commentList = post.commentList.map(c => ({
      ...c,
      time: formatTime(c.created_at)
    }));
    
    res.json({
      ...post,
      time: formatTime(post.created_at),
      commentList
    });
  } catch (err) {
    res.status(500).json({ error: '获取帖子详情失败' });
  }
});

// 发布帖子
app.post('/api/posts', (req, res) => {
  try {
    const { title, content, category, author, avatar, avatarColor } = req.body;
    
    if (!title || !content || !category || !author) {
      return res.status(400).json({ error: '参数不完整' });
    }
    
    const data = readData();
    const newPost = {
      id: Date.now(),
      title,
      content,
      category,
      author,
      avatar,
      avatar_color: avatarColor || 'from-blue-400 to-purple-500',
      views: 0,
      likes: 0,
      comments: 0,
      created_at: Date.now(),
      commentList: []
    };
    
    data.posts.unshift(newPost);
    writeData(data);
    
    res.json({
      ...newPost,
      time: '刚刚'
    });
  } catch (err) {
    res.status(500).json({ error: '发布帖子失败' });
  }
});

// 点赞帖子
app.post('/api/posts/:id/like', (req, res) => {
  try {
    const data = readData();
    const post = data.posts.find(p => p.id == req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }
    
    post.likes++;
    writeData(data);
    
    res.json({ likes: post.likes });
  } catch (err) {
    res.status(500).json({ error: '点赞失败' });
  }
});

// 发表评论
app.post('/api/posts/:id/comments', (req, res) => {
  try {
    const { author, avatar, avatarColor, content } = req.body;
    
    if (!author || !content) {
      return res.status(400).json({ error: '参数不完整' });
    }
    
    const data = readData();
    const post = data.posts.find(p => p.id == req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }
    
    const newComment = {
      id: Date.now(),
      author,
      avatar,
      avatar_color: avatarColor || 'from-blue-400 to-purple-500',
      content,
      likes: 0,
      created_at: Date.now()
    };
    
    post.commentList.unshift(newComment);
    post.comments++;
    writeData(data);
    
    res.json({
      ...newComment,
      time: '刚刚'
    });
  } catch (err) {
    res.status(500).json({ error: '发表评论失败' });
  }
});

// 用户注册
app.post('/api/register', (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const data = readData();
    
    if (data.users.find(u => u.username === username)) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    data.users.push({
      id: Date.now(),
      username,
      password,
      email: email || '',
      created_at: Date.now()
    });
    
    writeData(data);
    res.json({ success: true, username });
  } catch (err) {
    res.status(500).json({ error: '注册失败' });
  }
});

// 用户登录
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const data = readData();
    
    const user = data.users.find(u => u.username === username && u.password === password);
    
    if (user) {
      res.json({ success: true, username: user.username });
    } else {
      res.status(400).json({ error: '用户名或密码错误' });
    }
  } catch (err) {
    res.status(500).json({ error: '登录失败' });
  }
});

// 兜底路由：刷新页面时返回首页
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`✅ AZDC论坛服务已启动，监听端口: ${PORT}`);
  console.log(`📍 本地访问: http://localhost:${PORT}`);
});
