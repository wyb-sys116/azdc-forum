const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// 数据库连接池（Railway自动注入DATABASE_URL）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 时间格式化（和原逻辑一致）
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

// 初始化数据库表和默认数据
async function initDB() {
  try {
    // 1. 创建用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        email VARCHAR(100) DEFAULT '',
        created_at BIGINT NOT NULL
      )
    `);

    // 2. 创建帖子表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id BIGINT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        author VARCHAR(50) NOT NULL,
        avatar VARCHAR(10) DEFAULT '',
        avatar_color VARCHAR(50) DEFAULT 'from-blue-400 to-purple-500',
        views INT DEFAULT 0,
        likes INT DEFAULT 0,
        comments INT DEFAULT 0,
        created_at BIGINT NOT NULL
      )
    `);

    // 3. 创建评论表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id BIGINT PRIMARY KEY,
        post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        author VARCHAR(50) NOT NULL,
        avatar VARCHAR(10) DEFAULT '',
        avatar_color VARCHAR(50) DEFAULT 'from-blue-400 to-purple-500',
        content TEXT NOT NULL,
        likes INT DEFAULT 0,
        created_at BIGINT NOT NULL
      )
    `);

    // 4. 帖子表为空时插入默认示例数据
    const { rows } = await pool.query('SELECT COUNT(*) FROM posts');
    if (parseInt(rows[0].count) === 0) {
      const now = Date.now();
      const defaultPosts = [
        {
          id: 1,
          title: '论坛使用指南：发帖规范与功能说明',
          category: '综合',
          author: '管理员',
          avatar: '管',
          avatar_color: 'from-blue-400 to-blue-600',
          content: '欢迎来到AZDC论坛！本论坛包含综合、魔方、3D打印、乒乓球四大板块，请大家在对应板块发布相关内容，友好交流。\n\n## 发帖说明\n选择对应分类发布内容，标题清晰，内容详实即可。\n\n## 互动功能\n支持点赞、评论，注册账号后可以发布帖子和评论。',
          views: 2345,
          likes: 156,
          comments: 1,
          created_at: now - 86400000 * 3
        },
        {
          id: 2,
          title: '三阶魔方CFOP速拧入门：Cross十字技巧',
          category: '魔方',
          author: '魔方达人',
          avatar: '魔',
          avatar_color: 'from-purple-400 to-purple-600',
          content: 'CFOP是速拧三阶魔方的主流方法，第一步Cross十字是基础，直接影响后续速度。\n\n## 十字技巧\n尽量在底面完成十字，减少整体转动次数。\n\n## 进阶思路\n观察棱块位置，规划最少步数的十字解法，目标8步内完成。',
          views: 1892,
          likes: 210,
          comments: 2,
          created_at: now - 86400000 * 2
        },
        {
          id: 3,
          title: 'FDM 3D打印机首层校准完整教程',
          category: '3D打印',
          author: '打印老司机',
          avatar: '打',
          avatar_color: 'from-orange-400 to-orange-600',
          content: '3D打印首层是决定打印成败的关键，首层校准不好会出现翘边、脱床等问题。\n\n## 调平步骤\n先手动调平四个角，再用纸片法测试喷嘴距离。\n\n## 温度设置\nPLA耗材热床60℃，喷嘴200℃；ABS热床110℃，喷嘴240℃。',
          views: 1654,
          likes: 178,
          comments: 1,
          created_at: now - 86400000 * 1
        },
        {
          id: 4,
          title: '乒乓球横拍反手拉球动作核心要点',
          category: '乒乓球',
          author: '乒乓爱好者',
          avatar: '乒',
          avatar_color: 'from-red-400 to-red-600',
          content: '反手拉球是横拍的核心技术，很多业余球友容易出现发力不畅的问题。\n\n## 动作框架\n沉肩坠肘，手腕内曲，用腰腹带动前臂发力。\n\n## 常见误区\n不要只用手臂甩，重心要跟上，击球点在身体侧前方。',
          views: 2108,
          likes: 245,
          comments: 1,
          created_at: now - 3600000
        }
      ];

      // 批量插入默认帖子
      for (const post of defaultPosts) {
        await pool.query(
          `INSERT INTO posts (id, title, content, category, author, avatar, avatar_color, views, likes, comments, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [post.id, post.title, post.content, post.category, post.author, post.avatar, post.avatar_color, post.views, post.likes, post.comments, post.created_at]
        );
      }

      // 插入默认评论
      const defaultComments = [
        { id: 101, post_id: 1, author: '新用户', avatar: '新', avatar_color: 'from-green-400 to-green-600', content: '支持！论坛界面很清爽', likes: 8, created_at: now - 3600000 },
        { id: 102, post_id: 2, author: '魔方新手', avatar: '新', avatar_color: 'from-orange-400 to-orange-600', content: '十字总是做很慢，学习了', likes: 15, created_at: now - 7200000 },
        { id: 103, post_id: 2, author: '速拧爱好者', avatar: '速', avatar_color: 'from-pink-400 to-pink-600', content: '推荐多练盲拧十字', likes: 10, created_at: now - 3600000 },
        { id: 104, post_id: 3, author: '新手入坑', avatar: '新', avatar_color: 'from-green-400 to-green-600', content: '终于不翘边了，感谢', likes: 20, created_at: now - 86400000 },
        { id: 105, post_id: 4, author: '直拍选手', avatar: '直', avatar_color: 'from-blue-400 to-blue-600', content: '横拍反手确实羡慕', likes: 12, created_at: now - 172800000 }
      ];

      for (const c of defaultComments) {
        await pool.query(
          `INSERT INTO comments (id, post_id, author, avatar, avatar_color, content, likes, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [c.id, c.post_id, c.author, c.avatar, c.avatar_color, c.content, c.likes, c.created_at]
        );
      }
    }

    console.log('✅ 数据库初始化完成');
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err);
  }
}

// ==================== API 接口 ====================

// 获取帖子列表（分类筛选、关键词搜索、排序）
app.get('/api/posts', async (req, res) => {
  try {
    const { category, keyword, sort = 'time' } = req.query;
    let sql = 'SELECT * FROM posts WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // 分类筛选
    if (category && category !== 'all') {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // 关键词搜索
    if (keyword) {
      sql += ` AND (LOWER(title) LIKE LOWER($${paramIndex}) OR LOWER(content) LIKE LOWER($${paramIndex}) OR LOWER(author) LIKE LOWER($${paramIndex}))`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    // 排序
    if (sort === 'hot') {
      sql += ' ORDER BY likes DESC';
    } else if (sort === 'views') {
      sql += ' ORDER BY views DESC';
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    const { rows } = await pool.query(sql, params);
    
    // 格式化时间返回
    const result = rows.map(post => ({
      ...post,
      time: formatTime(post.created_at)
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取帖子列表失败' });
  }
});

// 获取帖子详情
app.get('/api/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;

    // 查询帖子
    const postRes = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    const post = postRes.rows[0];

    // 增加浏览量
    await pool.query('UPDATE posts SET views = views + 1 WHERE id = $1', [postId]);
    post.views++;

    // 查询评论
    const commentsRes = await pool.query(
      'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at DESC',
      [postId]
    );

    const commentList = commentsRes.rows.map(c => ({
      ...c,
      time: formatTime(c.created_at)
    }));

    res.json({
      ...post,
      time: formatTime(post.created_at),
      commentList
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取帖子详情失败' });
  }
});

// 发布帖子
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, category, author, avatar, avatarColor } = req.body;
    
    if (!title || !content || !category || !author) {
      return res.status(400).json({ error: '参数不完整' });
    }

    const newId = Date.now();
    const now = Date.now();

    await pool.query(
      `INSERT INTO posts (id, title, content, category, author, avatar, avatar_color, views, likes, comments, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, $8)`,
      [newId, title, content, category, author, avatar || author.charAt(0), avatarColor || 'from-blue-400 to-purple-500', now]
    );

    res.json({
      id: newId,
      title,
      content,
      category,
      author,
      avatar: avatar || author.charAt(0),
      avatar_color: avatarColor || 'from-blue-400 to-purple-500',
      views: 0,
      likes: 0,
      comments: 0,
      time: '刚刚'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '发布帖子失败' });
  }
});

// 点赞帖子
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const postId = req.params.id;
    
    const result = await pool.query(
      'UPDATE posts SET likes = likes + 1 WHERE id = $1 RETURNING likes',
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    res.json({ likes: result.rows[0].likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '点赞失败' });
  }
});

// 发表评论
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const { author, avatar, avatarColor, content } = req.body;
    
    if (!author || !content) {
      return res.status(400).json({ error: '参数不完整' });
    }

    // 检查帖子是否存在
    const postRes = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    const newId = Date.now();
    const now = Date.now();

    // 插入评论
    await pool.query(
      `INSERT INTO comments (id, post_id, author, avatar, avatar_color, content, likes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7)`,
      [newId, postId, author, avatar || author.charAt(0), avatarColor || 'from-blue-400 to-purple-500', content, now]
    );

    // 更新帖子评论数
    await pool.query('UPDATE posts SET comments = comments + 1 WHERE id = $1', [postId]);

    res.json({
      id: newId,
      author,
      avatar: avatar || author.charAt(0),
      avatar_color: avatarColor || 'from-blue-400 to-purple-500',
      content,
      likes: 0,
      time: '刚刚'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '发表评论失败' });
  }
});

// 用户注册
app.post('/api/register', async (req, res) => {
  try {
    let { username, password, email } = req.body;
    username = username?.trim();
    password = password?.trim();
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 检查用户名是否存在（不区分大小写）
    const existRes = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    if (existRes.rows.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const newId = Date.now();
    await pool.query(
      `INSERT INTO users (id, username, password, email, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [newId, username, password, email || '', Date.now()]
    );

    res.json({ success: true, username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '注册失败' });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  try {
    let { username, password } = req.body;
    username = username?.trim();
    password = password?.trim();

    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, username: result.rows[0].username });
    } else {
      res.status(400).json({ error: '用户名或密码错误' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '登录失败' });
  }
});

// 兜底路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务 + 初始化数据库
app.listen(PORT, async () => {
  console.log(`✅ AZDC论坛服务已启动，监听端口: ${PORT}`);
  await initDB();
});
