// 用户注册
app.post('/api/register', (req, res) => {
  try {
    let { username, password, email } = req.body;
    
    // 自动去除首尾空格
    username = username?.trim();
    password = password?.trim();
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const data = readData();
    
    // 用户名不区分大小写查重
    if (data.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
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
    let { username, password } = req.body;
    
    username = username?.trim();
    password = password?.trim();
    
    const data = readData();
    
    // 用户名不区分大小写匹配
    const user = data.users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    
    if (user) {
      res.json({ success: true, username: user.username });
    } else {
      res.status(400).json({ error: '用户名或密码错误' });
    }
  } catch (err) {
    res.status(500).json({ error: '登录失败' });
  }
});
