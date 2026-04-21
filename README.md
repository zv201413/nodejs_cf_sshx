# nodejs-sshx 翼龙面板部署教程

专为**翼龙面板**优化的 Node.js 脚本，一键部署 **sing-box 多协议代理 + SSHX 网页终端**，并自动同步到 GitHub Gist。

---

## 核心特色

- ✅ **多协议支持**：Hysteria2、TUIC、Reality、VLESS-WS、VMess-WS
- ✅ **Argo 隧道**：支持 Cloudflare Argo 临时/固定隧道
- ✅ **SSHX 网页终端**：支持通过浏览器访问 SSH
- ✅ **GitHub Gist 同步**：自动同步 SSHX 链接和节点订阅到 Gist
- ✅ **WARP 出站**：支持 WARP/直连/自动三种出站模式

---

## 部署步骤

1. 在游戏机页面找到 IP 和端口后，打开 [参数面板](https://zv201413.github.io/PaperMC_WorldMagic/) 复制命令，粘贴到 `application.properties` 文件

2. 将 `index.js`、`package.json`、`application.properties` 三个文件上传到翼龙面板根目录

3. 启动或重启翼龙面板，程序会自动读取配置

4. 复制节点即可使用，如配置了 Gist 也会自动推送

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
| `paper-sshx` | 启用 ttyd 网页终端 | `true`, `false` |
| `gist-id` | GitHub Gist ID | `b514d...` |
| `gh-token` | GitHub Token | `ghp_xxx` |
| `warp-mode` | WARP 出站模式 | `warp`, `direct`, 空(自动) |
| `ttyd-argo-domain` | ttyd 独立 Argo 固定域名 | `ttyd.example.com` |
| `ttyd-argo-auth` | ttyd Argo 固定隧道 Token | `eyJh...` |
| `ttyd-argo-port` | ttyd Argo 端口 | `8002` |
| `ttyd-port` | ttyd 本地监听端口 | `7681` |

---

## 常见问题

**Q: 节点名称如何自动添加国家代码？**
A: 程序会自动调用 IP API 获取国家代码和 ISP 信息

**Q: Gist 同步失败？**
A: 检查 `gist-id` 和 `gh-token` 是否正确

---

## 鸣谢

- [eooce/Sing-box](https://github.com/eooce/Sing-box)
- [SSHX](https://sshx.io)
- [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)

---

MIT - 本项目仅供技术研究与学习使用
