# nodejs-sshx 翼龙面板部署教程

专为**翼龙面板**优化的 Node.js 脚本，一键部署 **sing-box 多协议代理 / ttyd 网页终端 / SSHX 网页终端**，并自动同步到 GitHub Gist。

---

## 部署步骤

1. 在游戏机页面找到 IP 和端口后，打开 [参数面板](https://zv201413.github.io/nodejs_sshx/) 复制命令，粘贴到 `application.properties` 文件

2. 将 `index.js`、`package.json`、`application.properties` 三个文件上传到翼龙面板根目录

3. 启动或重启翼龙面板，程序会自动读取配置

4. 复制节点即可使用，如配置了 Gist 也会自动推送

> [!IMPORTANT]
> 套warp出站需要用到[第三方API（注意去掉中文）](https://warp.xijp.eu.org/)，或者使用你 `zero trust` 账户创建（见 `本地生成 WARP 数据` ）
> <img width="785" height="249" alt="image" src="https://github.com/user-attachments/assets/44cc436d-e771-46cb-8383-c725ffa66173" />
---

## 参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `paper-name` | 节点名称前缀（会自动添加国家代码） | `JP`, `US` |
| `paper-argo` | Argo 协议类型 | `vless-ws`, `vmess-ws` |
| `paper-argo-ip` | Argo 优选 IP | `104.17.100.191` |
| `paper-domain` | 自定义节点地址 | `162.43.31.93` |
| `paper-hy2-port` | Hysteria2 端口 | `25565` |
| `paper-tuic-port` | TUIC 端口 | `25575` |
| `paper-sshx` | 启用 SSHX 网页终端 (sshx.io直连) | `true`, `false` |
| `paper-ttyd` | 启用 ttyd 网页终端 (独立Argo隧道) | `true`, `false` |
| `gist-id` | GitHub Gist ID | `b514d...` |
| `gh-token` | GitHub Token | `ghp_xxx` |
| `warp-mode` | WARP 出站模式 | `warp`, `direct`, 空(自动) |
| `warp-data` | WARP WireGuard 配置（手动覆盖API） | 见下方格式说明 |
| `ttyd-argo-auth` | ttyd Argo 固定隧道 Token | `eyJh...` |
| `ttyd-argo-port` | ttyd Argo 端口 | `8002` |
| `ttyd-port` | ttyd 本地监听端口 | `7681` |
| `ttyd-credential` | ttyd 认证凭证 (用户名:密码) | `admin:123456` |

---

## WARP 出站说明

### WARP 模式

| 模式 | 值 | 说明 |
|------|------|------|
| 全局 WARP | `warp` | 所有流量通过 WARP 出站 |
| 直连 | `direct` | 关闭 WARP，所有流量直连 |
| 自动 | 空 | 仅 Netflix/OpenAI 等流量走 WARP，其余直连 |

### 智能网络检测

脚本启动时会自动检测服务器的网络栈：
- **双栈** (IPv4+IPv6)：用 IPv4 端点 (`162.159.192.1`) 连接 Cloudflare，隧道内 `prefer_ipv6` 出站
- **纯 IPv4**：用 IPv4 端点连接，隧道内 `prefer_ipv4` 出站
- **纯 IPv6**：用 IPv6 端点 (`2606:4700:d0::a29f:c001`) 连接，隧道内 `prefer_ipv6` 出站

### warp-data 输入格式

留空则自动从第三方 API 获取 WARP 配置。如 API 不可用或想使用自己的 WARP 数据，可手动粘贴，支持以下两种格式：

**格式一：WireGuard INI 配置**（推荐，从 Cloudflare Zero Trust 或 warp-cli 导出）

```
[Interface]
PrivateKey = YFYOAdbw1bKTHlNNi+aEjBM3BO7unuFC5rOkMRAz9XY=
Address = 172.16.0.2/32, fd01:5ca1:ab1e:xxxx:xxxx:xxxx:xxxx:xxxx/128
DNS = 1.1.1.1

[Peer]
PublicKey = bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = engage.cloudflareclient.com:2408
Reserved = [78, 135, 76]
```

**格式二：API 文本格式**（第三方 WARP API 返回的原始文本）

```
Private_key：YFYOAdbw1bKTHlNNi+aEjBM3BO7unuFC5rOkMRAz9XY=
IPV6：fd01:5ca1:ab1e:xxxx:xxxx:xxxx:xxxx:xxxx
reserved：[78, 135, 76]
```

脚本会自动解析 `PrivateKey`、IPv6 地址和 `Reserved` 值。解析失败时自动回退到 API 获取。

### 本地生成 WARP 数据（可选）

如果第三方 API 不可用，也可以通过官方 WARP 客户端在本地生成认证数据，完全绕过第三方 API。

#### 1. 环境初始化

```bash
sudo apt update
sudo apt install -y gnupg lsb-release curl
```

#### 2. 导入官方 GPG 密钥

```bash
curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
```

#### 3. 配置软件源

```bash
echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list
```

#### 4. 安装 WARP 客户端

```bash
sudo apt update
sudo apt install -y cloudflare-warp
```

#### 5. 生成认证数据

```bash
sudo systemctl start warp-svc
warp-cli registration new
```

#### 6. 提取数据

```bash
# Private Key
sudo jq -r '.private_key' /var/lib/cloudflare-warp/reg.json

# Device ID (用于识别)
sudo jq -r '.device_id' /var/lib/cloudflare-warp/reg.json
```

**注意：**
- Docker 环境建议使用 `--privileged` 模式或挂载 `/sys/fs/cgroup`
- 每个节点建议执行一次 `warp-cli registration new` 获取独立的 private_key，避免同一账户多 IP 并发异常
- 生成的密钥请妥善保存

#### 替代方案：使用 wgcf（无需 systemd）

官方客户端依赖 systemd，Docker 环境可直接使用 wgcf 工具生成配置。

```bash
# 1. 下载工具
curl -fsSL https://github.com/ViRb3/wgcf/releases/download/v2.2.22/wgcf_2.2.22_linux_amd64 -o wgcf
chmod +x wgcf

# 2. 注册并生成数据
./wgcf register
./wgcf generate

# 3. 查看配置
cat wgcf-profile.conf
```

生成的文件 `wgcf-profile.conf` 包含 `PrivateKey`、IPv4/IPv6 地址等完整信息，可直接填入 HTML 面板。

---

## 常见问题

**Q: 节点名称如何自动添加国家代码？**
A: 程序会自动调用 IP API 获取国家代码和 ISP 信息

**Q: Gist 同步失败？**
A: 检查 `gist-id` 和 `gh-token` 是否正确

**Q: WARP 节点不通？**
A: 1) 检查服务器是否支持 IPv6（`ip a` 或 `curl -6 ifconfig.co`）；2) 尝试在 HTML 面板填入 `warp-data` 手动覆盖；3) 查看 `.npm/config.json` 中 `peers.address` 是否与服务器的网络栈匹配

---

## 鸣谢

- [eooce/Sing-box](https://github.com/eooce/Sing-box)
- [SSHX](https://sshx.io)
- [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)

---

MIT - 本项目仅供技术研究与学习使用
