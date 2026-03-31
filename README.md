# nodejs-sshx 翼龙面板部署教程

专为**翼龙面板**优化的 Node.js 脚本，一键部署 **sing-box 多协议代理 + SSHX 网页终端**，并自动同步到 GitHub Gist。

---

## 功能特性

- ✅ **多协议支持**：Hysteria2、TUIC、Reality、VLESS-WS、VMess-WS、AnyTLS
- ✅ **Argo 隧道**：支持 Cloudflare Argo 临时/固定隧道
- ✅ **SSHX 网页终端**：支持通过浏览器访问 SSH
- ✅ **GitHub Gist 同步**：自动同步 SSHX 链接和节点订阅到 Gist
- ✅ **WARP 出站**：支持 WARP/直连/自动三种出站模式
- ✅ **install= 参数**：一行命令配置所有选项

---

## 一分钟快速部署（翼龙面板）

### 推荐方式：下载 `index.js`、 `package.json`、 `application.properties` 三个文件

1. 在游戏机页面找到ip和端口后打开 [参数面板](https://zv201413.github.io/PaperMC_WorldMagic/)

复制命令后粘贴 `install=` 命令到 `application.properties文件：
```properties
install=paper-name="JP" paper-argo="vless-ws" paper-hy2-port="25565" paper-tuic-port="25575" paper-sshx="true" gist-id="你的GistID" gh-token="你的Token" gist-sshx-file="sshx_JP.txt" gist-sub-file="sub_JP.txt"
```

2. 翼龙面板启动或重启

程序会自动读取 `application.properties` 中的 `install=` 配置。

---

### 参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `paper-name` | 节点名称前缀（会自动添加国家代码） | `JP`, `US`, `CN-edu` |
| `paper-argo` | Argo 协议类型 | `vless-ws`, `vmess-ws` |
| `paper-argo-ip` | Argo 优选 IP | `104.17.100.191` |
| `paper-domain` | 自定义节点地址 | `162.43.31.93` |
| `paper-hy2-port` | Hysteria2 端口 | `25565` |
| `paper-tuic-port` | TUIC 端口 | `25575` |
| `paper-reality-port` | Reality 端口 | `443` |
| `paper-sshx` | 启用 SSHX | `true`, `false` |
| `gist-id` | GitHub Gist ID | `b514d28028de5dcefeb32855a24b9ad5` |
| `gh-token` | GitHub Token | `ghp_xxxxx` |
| `gist-sshx-file` | Gist SSHX 文件名 | `sshx_JP.txt` |
| `gist-sub-file` | Gist 订阅文件名 | `sub_JP.txt` |
| `warp-mode` | WARP 出站模式 | `warp`, `direct`, 空(自动) |

### WARP 出站模式说明

| 模式 | 说明 |
|------|------|
| `warp` | 强制所有流量通过 WARP 出站 |
| `direct` | 直连模式，不使用 WARP |
| 空(默认) | 自动模式：Netflix/OpenAI/YouTube 走 WARP，其他直连 |

---

### 完整示例

```properties
# application.properties
install=paper-domain="147.135.213.131" paper-name="kama" paper-argo="vless-ws" paper-hy2-port="20082" paper-tuic-port="25575" paper-sshx="true" gist-id="你的GistID" gh-token="你的Token" gist-sshx-file="sshx_kama.txt" gist-sub-file="sub_kama.txt"
```

## 传统方式：config.json 配置

### 第一步：创建 GitHub Gist

1. 登录 GitHub，访问 https://gist.github.com
2. 点击 **Create new gist**
3. Filename 填写 `sshx.txt`，Content 随便填（如 `init`）
4. 点击 **Create secret gist**
5. 复制浏览器地址栏的 Gist ID

### 第二步：获取 GitHub Token

1. 登录 GitHub
2. 进入 **Settings > Developer settings > Personal access tokens > Fine-grained tokens**
3. 点击 **Generate new token**
4. 配置：
   - **Name**: 随便填
   - **Expiration**: 建议 30 天
   - **Repository access**: **Only select repositories** > 创建任意一个私有仓库
   - **Permissions**: 下滑找到 **Gists**，勾选 **Manage**
5. 点击 **Generate token**，复制生成的 Token

### 第三步：上传项目到翼龙面板

1. 下载本项目，解压
2. 进入翼龙面板 **文件管理器**，上传整个项目
3. 编辑 `config.json`，填入 GitHub 凭证：
```json
{
  "gist_id": "你的Gist ID",
  "gh_token": "你的GitHub Token"
}
```

### 第四步：启动

```
cd nodejs && npm install && npm start
```

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
| `WARP_MODE` | WARP 出站模式: warp/direct/留空(自动) |

---

## 常见问题

**Q: 节点名称如何自动添加国家代码？**
A: 程序会自动调用 IP API 获取国家代码和 ISP 信息，格式为：`paper-name-国家代码-ISP`，例如 `kama-FR-OVHcloud`。

**Q: Gist 同步失败？**
A: 检查 `gist-id` 和 `gh-token` 是否正确，Token 是否有 Gists 管理权限。

**Q: SSHX 链接打不开？**
A: 确保已在 Cloudflare Zero Trust 创建 SSHX 应用并配置邮箱验证。

**Q: vless-ws 节点不通？**
A: 确保使用正确的 path 格式（`/vless-argo`），程序已自动处理 URL 编码。

**Q: WARP 出站如何配置？**
A: 在 install 参数中添加 `warp-mode="warp"` 强制 WARP 出站，或留空使用自动模式。

---

## 鸣谢

本项目基于以下开源项目构建，感谢各位作者的贡献：

- **[eooce/Sing-box](https://github.com/eooce/Sing-box)** — 提供了在受限环境部署 sing-box 的核心思路
- **[SSHX](https://sshx.io)** — 提供基于 Cloudflare 的网页终端服务
- **[Cloudflare Zero Trust](https://one.dash.cloudflare.com/)** — 提供安全的远程访问认证方案
- **[MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)** — sing-box 规则集数据来源

---

## 许可证

MIT

本项目仅供技术研究与学习使用，请勿用于任何违法用途。
