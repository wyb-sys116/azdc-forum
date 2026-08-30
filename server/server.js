const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
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
          title: "深入理解 JavaScript 异步编程：从回调到 async/await",
          category: "前端",
          author: "技术大神",
          avatar: "技",
          avatar_color: "from-blue-400 to-blue-600",
          content: "在 JavaScript 开发中，异步编程是一个核心概念。本文将带你从最基础的回调函数，一步步理解 Promise，最终掌握 async/await 的使用方法。\n\n## 回调函数\n回调函数是 JavaScript 中最基础的异步处理方式，通过将函数作为参数传递，在异步操作完成后执行回调。\n\n## Promise\nPromise 是 ES6 引入的异步编程解决方案，解决了回调地狱的问题，提供了更优雅的链式调用。\n\n## async/await\nasync/await 是基于 Promise 的语法糖，让异步代码看起来像同步代码，大大提升了代码的可读性。",
          views: 1567,
          comments: 2,
          likes: 128,
          created_at: Date.now() - 7200000,
          commentList: [
            { id: 1, author: "前端小白", avatar: "前", avatar_color: "from-green-400 to-green-600", content: "讲得太清楚了！终于理解了 async/await", created_at: Date.now() - 3600000, likes: 12 },
            { id: 2, author: "码农小王", avatar: "码", avatar_color: "from-purple-400 to-purple-600", content: "建议补充一下 Promise.all 和 Promise.race 的用法", created_at: Date.now() - 1800000, likes: 8 }
          ]
        },
        {
          id: 2,
          title: "Vue3 + TypeScript 最佳实践指南",
          category: "前端",
          author: "前端小姐姐",
          avatar: "前",
          avatar_color: "from-pink-400 to-pink-600",
          content: "Vue3 已经发布有一段时间了，配合 TypeScript 使用可以大大提升开发效率和代码质量。本文分享一些在实际项目中总结的最佳实践。\n\n## 项目初始化\n使用 create-vue 脚手架创建项目，默认支持 TypeScript。\n\n## 组件写法\n推荐使用 <script setup> 语法糖，代码更简洁，类型推导更友好。",
          views: 2341,
          comments: 1,
          likes: 234,
          created_at: Date.now() - 18000000,
          commentList: [
            { id: 1, author: "Vue爱好者", avatar: "V", avatar_color: "from-green-400 to-green-600", content: "script setup 真的太香了", created_at: Date.now() - 14400000, likes: 23 }
          ]
        },
        {
          id: 3,
          title: "MySQL 索引优化完全指南",
          category: "数据库",
          author: "DBA老司机",
          avatar: "D",
          avatar_color: "from-orange-400 to-orange-600",
          content: "数据库性能优化中，索引优化是最基础也是最重要的一环。本文将详细介绍 MySQL 索引的原理、类型以及优化技巧。\n\n## 索引原理\nB+树结构，支持范围查询和排序。\n\n## 索引类型\n主键索引、唯一索引、普通索引、联合索引、全文索引。",
          views: 1890,
          comments: 0,
          likes: 189,
          created_at: Date.now() - 86400000,
          commentList: []
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

// 获取帖子列表
app.get('/api/posts', (req, res) => {
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
});

// 获取帖子详情
app.get('/api/posts/:id', (req, res) => {
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
});

// 发布帖子
app.post('/api/posts', (req, res) => {
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
});

// 点赞帖子
app.post('/api/posts/:id/like', (req, res) => {
  const data = readData();
  const post = data.posts.find(p => p.id == req.params.id);
  
  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }
  
  post.likes++;
  writeData(data);
  
  res.json({ likes: post.likes });
});

// 发表评论
app.post('/api/posts/:id/comments', (req, res) => {
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
});

// 用户注册
app.post('/api/register', (req, res) => {
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
});

// 用户登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const data = readData();
  
  const user = data.users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({ success: true, username: user.username });
  } else {
    res.status(400).json({ error: '用户名或密码错误' });
  }
});

// 启动服务
app.listen(PORT, () => {
  console.log(`AZDC论坛服务已启动: http://localhost:${PORT}`);
});
