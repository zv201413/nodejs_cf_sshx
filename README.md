# nodejs-sshx 翼龙面板部署教程

专为**翼龙面板**优化的 Node.js 脚本，一键部署 **sing-box 多协议代理 + SSHX 网页终端**，并自动同步到 GitHub Gist。

---

## 一分钟快速部署（翼龙面板）

### 推荐方式：install= 配置在 application.properties 文件中（最简单）

这是最简单的方式，只需修改 `application.properties` 文件：

1. 编辑 `application.properties`，找到 `install=` 那一行
2. 去掉前面的 `#` 号，填入你的配置：
```properties
install=paper-name="JP-31.93-edu" paper-argo="vless-ws" paper-argo-ip="104.17.100.191" paper-domain="162.43.31.93" paper-hy2-port="25565" paper-tuic-port="25575" paper-sshx="true" gist-id="你的GistID" gh-token="你的Token" gist-sshx-file="sshx_JP.txt" gist-sub-file="sub_JP.txt"
```

3. 翼龙面板启动命令填写：
```
cd nodejs && npm install && npm start
```

程序会自动读取 `application.properties` 中的 `install=` 配置。

---

### 命令行方式：install= 直接加在启动命令中

在翼龙面板启动命令中填写：
```
cd nodejs && npm install && node index.js install=paper-name="你的名称" paper-hy2-port="25565" paper-tuic-port="25575" paper-sshx="true" gist-id="你的GistID" gh-token="你的GitHubToken" gist-sshx-file="sshx.txt" gist-sub-file="sub.txt"
```

### 参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `paper-name` | 节点名称前缀 | `JP`, `US`, `CN-edu` |
| `paper-argo` | Argo协议类型 | `vmess-ws`, `vless-ws` |
| `paper-argo-ip` | Argo优选IP | `104.17.100.191` |
| `paper-domain` | 自定义节点地址 | `162.43.31.93` |
| `paper-hy2-port` | Hysteria2端口 | `25565` |
| `paper-tuic-port` | TUIC端口 | `25575` |
| `paper-reality-port` | Reality端口 | `443` |
| `paper-sshx` | 启用SSHX | `true`, `false` |
| `gist-id` | Gist ID | `b514d28028de5dcefeb32855a24b9ad5` |
| `gh-token` | GitHub Token | `ghp_xxxxx` |
| `gist-sshx-file` | Gist SSHX文件名 | `sshx_JP.txt` |
| `gist-sub-file` | Gist订阅文件名 | `sub_JP.txt` |
| `warp-mode` | WARP出站模式 | `warp`, `direct`, 空(自动) |

### 完整示例

```
cd nodejs && npm install && node index.js install=paper-domain="162.43.31.93" paper-name="JP-31.93-edu" paper-argo="vless-ws" paper-argo-ip="104.17.100.191" paper-hy2-port="25565" paper-tuic-port="25575" paper-sshx="true" gist-id="b514d28028de5dcefeb32855a24b9ad5" gh-token="ghp_xxxxx" gist-sshx-file="sshx_JP-31.93-edu.txt" gist-sub-file="sub_JP-31.93-edu.txt"
```

---

### 传统方式：config.json 配置

#### 第一步：创建 GitHub Gist

1. 登录 GitHub，访问 https://gist.github.com
2. 点击 **Create new gist**
3. Filename 填写 `sshx.txt`，Content 随便填（如 `init`）
4. 点击 **Create secret gist**
5. 复制浏览器地址栏的 Gist ID：
   ```
   https://gist.github.com/你的用户名/f2a431371c0c1bf9857cf1d66f159816
                                                 ^^^^^^^^^^^^^^^^^^^
                                                 这串就是 Gist ID
   ```

#### 第二步：获取 GitHub Token

1. 登录 GitHub
2. 进入 **Settings > Developer settings > Personal access tokens > Fine-grained tokens**
3. 点击 **Generate new token**
4. 配置：
   - **Name**: 随便填
   - **Expiration**: 建议 30 天
   - **Repository access**: **Only select repositories** > 创建任意一个私有仓库
   - **Permissions**: 下滑找到 **Gists**，勾选 **Manage**
5. 点击 **Generate token**，复制生成的 Token

#### 第三步：上传项目到翼龙面板

1. 下载本项目，解压
2. 进入翼龙面板 **文件管理器**，上传整个项目
3. 编辑 `config.json`，填入 GitHub 凭证：
   ```json
   {
     "gist_id": "你的Gist ID",
     "gh_token": "你的GitHub Token"
   }
   ```

#### 第四步：配置代理参数

编辑 `application.properties`（如果没有就创建）：
```properties
UUID=你的UUID（留空自动生成）
HY2_PORT=25565
ENABLE_SSHX=true
```

#### 第五步：启动

在翼龙面板启动命令中填写：
```
cd nodejs && npm install && npm start
```

点击启动，等待 10 秒左右。

#### 第六步：查看 SSHX 链接

**方式一**：访问 `http://你的域名:3000/sshx`

**方式二**：打开 GitHub Gist 页面，刷新 `sshx.txt` 文件内容

---

## SSHX 网页终端登录

1. 打开 SSHX 链接
2. 输入 Cloudflare Zero Trust 验证邮箱
3. 查收验证码并填入
4. 进入网页终端

> 如果是首次使用，需要先在 Cloudflare Zero Trust 中创建 SSHX 应用，详见下方「Cloudflare Zero Trust 配置」章节。

---

## Cloudflare Zero Trust 配置（首次使用需配置）

### 创建 SSHX 应用

1. 登录 [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. 进入 **Access > Applications > Add an application**
3. 选择 **Self-hosted**
4. 填写配置：
   - **Application domain**: `sshx.<你的团队名>.cloudflareaccess.com`
   - **Session TTL**: 根据需要设置
5. 在 **Identity providers** 中配置邮箱验证（email OTP）
6. 点击 **Add a policy**，配置允许访问的邮箱

---

## GitHub Gist 同步说明

### 工作原理

```
翼龙面板启动 → SSHX 生成链接 → 自动同步到 GitHub Gist
                                              ↓
                                     你随时打开 Gist 查看
```

### 同步规则

- **启动时**：每次进程启动会生成新的 SSHX 链接和节点订阅，然后同步到 Gist
- **本地清理**：同步完成后删除本地临时文件（s.txt、sub.txt 等）
- **90秒清理**：自动删除二进制文件和配置文件，只保留进程在内存中运行
- **多文件支持**：支持同时同步多个文件到 Gist

### 查看链接

打开你的 Gist 页面：
```
https://gist.github.com/你的用户名/你的Gist ID
```

刷新 `sshx.txt` 文件即可看到最新链接。

---

## 翼龙面板配置参考

### 文件结构

```
nodejs/
├── index.js          # 主程序
├── package.json      # 依赖
├── config.json       # ← Gist 凭证（重点）
├── README.md
└── application.properties  # ← 代理参数配置
```

### config.json 示例

```json
{
  "gist_id": "f2a431371c0c1bf9857cf1d66f159816",
  "gh_token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

### application.properties 示例

```properties
# 代理配置
UUID=
HY2_PORT=25565
ENABLE_SSHX=true

# Argo 隧道（可选）
ARGO_AUTH=你的隧道Token
ARGO_DOMAIN=你的域名
```

### 启动命令

```
cd nodejs && npm install && npm start
```

---

## 常见问题

**Q: 翼龙面板不支持环境变量怎么办？**
A: 使用 `config.json` 文件配置，代码会自动读取。

**Q: Gist 同步失败？**
A: 检查 `config.json` 中的 `gist_id` 和 `gh_token` 是否正确，Token 是否有 Gists 管理权限。

**Q: SSHX 链接打不开？**
A: 确保已在 Cloudflare Zero Trust 创建 SSHX 应用并配置邮箱验证。

**Q: 翼龙面板重启后 SSHX 会失效吗？**
A: 不会。翼龙面板重启后进程会重新启动，会自动生成新的 SSHX 链接并同步到 Gist。

**Q: 如何查看当前 SSHX 链接？**
A: 访问 `http://你的域名:3000/sshx` 或直接打开 GitHub Gist 查看。

---

## 其他平台部署

### Serv00 / 命令行环境

```bash
cd nodejs
npm install

# 配置环境变量
export UUID=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 36 | head -n 1)
export HY2_PORT=25565
export ENABLE_SSHX=true
export GIST_ID=你的GistID
export GH_TOKEN=你的Token

# 启动
screen -S nodejs
npm start
```

### Replit

1. 上传项目文件到 Replit
2. 在 Secrets 中添加环境变量
3. 点击 Run

---

## 环境变量参考

| 变量 | 说明 |
|------|------|
| `UUID` | 代理用户标识，留空自动生成 |
| `HY2_PORT` | Hysteria2 端口 |
| `TUIC_PORT` | TUIC 端口 |
| `REALITY_PORT` | Reality 端口 |
| `ENABLE_SSHX` | 设为 `true` 启用 SSHX |
| `GIST_ID` | GitHub Gist ID |
| `GH_TOKEN` | GitHub Personal Access Token |
| `ARGO_AUTH` | Argo 隧道 Token（可选） |
| `ARGO_DOMAIN` | Argo 域名（可选） |
| `WARP_MODE` | WARP出站模式: warp/direct/留空(自动) |

### install= 参数（推荐）

在启动命令中使用 `install=` 参数，一行配置所有选项：

```
node index.js install=paper-name="JP" paper-argo="vless-ws" paper-hy2-port="25565" paper-tuic-port="25575" paper-sshx="true" gist-id="xxx" gh-token="xxx"
```

> **提示**：在翼龙面板中，推荐使用 `install=` 参数或 `application.properties` 文件配置。

---

## 鸣谢

本项目基于以下开源项目构建，感谢各位作者的贡献：

- **[eooce/Sing-box](https://github.com/eooce/Sing-box)** — 提供了在受限环境（如翼龙面板）部署 sing-box 的核心思路与实现参考
- **[SSHX](https://sshx.io)** — 提供基于 Cloudflare 的网页终端服务
- **[Cloudflare Zero Trust](https://one.dash.cloudflare.com/)** — 提供安全的远程访问认证方案
- **[MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)** — sing-box 规则集数据来源

---

## 许可证

MIT

本项目仅供技术研究与学习使用，请勿用于任何违法用途。