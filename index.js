#!/usr/bin/env node

const express = require("express");
const app = express();
const axios = require("axios");
const os = require('os');
const fs = require("fs");
const path = require("path");
require('dotenv').config();
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { execSync } = require('child_process');

// 定义配置文件路径
const appConfigFile = path.join(__dirname, 'application.properties');

// 解析 install= 参数 (格式: install=key="value" key2="value2")
function parseInstallParams() {
  const installParams = {};
  
  // 1. 先从命令行参数读取
  const installArg = process.argv.find(arg => arg.startsWith('install='));
  if (installArg) {
    const paramsStr = installArg.substring(8);
    // 支持 paper-name="xxx" 格式 (带连字符的key)
    const paramRegex = /([a-zA-Z_][a-zA-Z0-9_\-]*)="([^"]*)"/g;
    let match;
    while ((match = paramRegex.exec(paramsStr)) !== null) {
      installParams[match[1]] = match[2];
    }
  }
  
  // 2. 再从 application.properties 文件中读取 install= 开头的行
  if (fs.existsSync(appConfigFile)) {
    try {
      const content = fs.readFileSync(appConfigFile, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && trimmed.startsWith('install=')) {
          const paramsStr = trimmed.substring(8);
          // 支持 paper-name="xxx" 格式 (带连字符的key)
          const paramRegex = /([a-zA-Z_][a-zA-Z0-9_\-]*)="([^"]*)"/g;
          let match;
          while ((match = paramRegex.exec(paramsStr)) !== null) {
            installParams[match[1]] = match[2];
          }
        }
      });
    } catch (e) {}
  }
  
  return installParams;
}

const installParams = parseInstallParams();
console.log('🔧 解析到的 install 参数:', JSON.stringify(installParams));

// 读取 application.properties（必须在使用 getConfig 之前）
const fileConfig = {};
if (fs.existsSync(appConfigFile)) {
  try {
    const content = fs.readFileSync(appConfigFile, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      // 跳过 install= 开头的行（已经在 parseInstallParams 中处理）
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('install=')) {
        const idx = trimmed.indexOf('=');
        if (idx > 0) {
          const key = trimmed.substring(0, idx).trim();
          const value = trimmed.substring(idx + 1).trim();
          fileConfig[key] = value;
        }
      }
    });
  } catch (e) {}
}

// 合并 install 参数到 fileConfig (install 参数优先)
Object.keys(installParams).forEach(key => {
  fileConfig[key] = installParams[key];
});
console.log('🔧 合并后的 fileConfig:', JSON.stringify(fileConfig));

// 获取配置值（优先环境变量，其次配置文件，支持两种格式）
function getConfig(envKey, fileKey, defaultValue) {
  // 支持 fileKey 和 fileKey 的下划线版本（如 paper-hy2-port 和 paper_hy2_port）
  const underscoreKey = fileKey.replace(/-/g, '_');
  return process.env[envKey] || fileConfig[fileKey] || fileConfig[underscoreKey] || defaultValue;
}

const UPLOAD_URL = getConfig('UPLOAD_URL', 'UPLOAD_URL', '');      // 订阅或节点自动上传地址
const PROJECT_URL = getConfig('PROJECT_URL', 'PROJECT_URL', '');    // 需要上传订阅或保活时需填写项目分配的url
const AUTO_ACCESS = getConfig('AUTO_ACCESS', 'AUTO_ACCESS', 'false'); // false关闭自动保活，true开启
const YT_WARPOUT = getConfig('YT_WARPOUT', 'YT_WARPOUT', 'false');   // 设置为true时强制使用warp出站访问youtube
const FILE_PATH = getConfig('FILE_PATH', 'FILE_PATH', '.npm');    // sub.txt订阅文件路径
const SUB_PATH = getConfig('SUB_PATH', 'SUB_PATH', 'sub');       // 订阅sub路径
const UUID = getConfig('UUID', 'UUID', 'c3c87d01-891f-48e3-a91a-6dee38821bbb');  // 在不同的平台运行了v1哪吒请修改UUID,否则会覆盖
const NEZHA_SERVER = getConfig('NEZHA_SERVER', 'NEZHA_SERVER', '');         // 哪吒面板地址,v1形式：nz.serv00.net:8008  v0形式：nz.serv00.net
const NEZHA_PORT = getConfig('NEZHA_PORT', 'NEZHA_PORT', '');             // v1哪吒请留空，v0 agent端口
const NEZHA_KEY = getConfig('NEZHA_KEY', 'NEZHA_KEY', '');               // v1的NZ_CLIENT_SECRET或v0 agwnt密钥 
const ARGO_DOMAIN = getConfig('ARGO_DOMAIN', 'ARGO_DOMAIN', '');           // argo固定隧道域名,留空即使用临时隧道
const ARGO_AUTH = getConfig('ARGO_AUTH', 'ARGO_AUTH', '');               // argo固定隧道token或json,留空即使用临时隧道
const ARGO_PORT = parseInt(getConfig('ARGO_PORT', 'ARGO_PORT', '8001'));             // argo固定隧道端口
const S5_PORT = getConfig('S5_PORT', 'S5_PORT', '');                   // socks5端口
const TUIC_PORT = getConfig('TUIC_PORT', 'TUIC_PORT', '');               // tuic端口
const HY2_PORT = getConfig('HY2_PORT', 'HY2_PORT', '20282');                 // hy2端口
const ANYTLS_PORT = getConfig('ANYTLS_PORT', 'ANYTLS_PORT', '');           // AnyTLS端口
const REALITY_PORT = getConfig('REALITY_PORT', 'REALITY_PORT', '');         // reality端口
const ANYREALITY_PORT = getConfig('ANYREALITY_PORT', 'ANYREALITY_PORT', '');   // Anyr-eality端口
const CFIP = getConfig('CFIP', 'CFIP', '104.17.100.191');             // 优选域名或优选IP
const CFPORT = parseInt(getConfig('CFPORT', 'CFPORT', '443'));                    // 优选域名或优选IP对应端口
const PORT = parseInt(getConfig('PORT', 'PORT', '3000'));                       // http订阅端口    
const NAME = getConfig('NAME', 'NAME', '');                         // 节点名称
const CHAT_ID = getConfig('CHAT_ID', 'CHAT_ID', '');                   // Telegram chat_id 
const BOT_TOKEN = getConfig('BOT_TOKEN', 'BOT_TOKEN', '');               // Telegram bot_token 
const DISABLE_ARGO = getConfig('DISABLE_ARGO', 'DISABLE_ARGO', 'false');      // 设置为 true 时禁用argo,false开启
const ENABLE_SSHX = getConfig('ENABLE_SSHX', 'ENABLE_SSHX', 'true');      //  设置为 true 时禁用argo,false开启

// ===== 新增配置选项 (来自 install= 参数) =====
const PAPER_NAME = getConfig('PAPER_NAME', 'paper-name', '');                   // 节点名称前缀
const PAPER_ARGO = getConfig('PAPER_ARGO', 'paper-argo', '');                   // Argo隧道类型: vless-ws, vmess-ws 等
const PAPER_TUIC_PORT = getConfig('PAPER_TUIC_PORT', 'paper-tuic-port', '');    // TUIC端口
const PAPER_SSHX = getConfig('PAPER_SSHX', 'paper-sshx', '');                  // SSHX启用: true/false
const GIST_SSHX_FILE = getConfig('GIST_SSHX_FILE', 'gist-sshx-file', 'sshx.txt');  // Gist sshx文件
const GIST_SUB_FILE = getConfig('GIST_SUB_FILE', 'gist-sub-file', 'sub.txt');      // Gist sub文件
const PAPER_HY2_PORT = getConfig('PAPER_HY2_PORT', 'paper-hy2-port', '');       // Hysteria2端口
const PAPER_REALITY_PORT = getConfig('PAPER_REALITY_PORT', 'paper-reality-port', ''); // Reality端口
const PAPER_VLESS_PORT = getConfig('PAPER_VLESS_PORT', 'paper-vless-port', '');    // VLESS端口
const PAPER_DOMAIN = getConfig('PAPER_DOMAIN', 'paper-domain', '');              // 自定义域名/IP
const PAPER_ARGO_IP = getConfig('PAPER_ARGO_IP', 'paper-argo-ip', '');          // Argo优选IP

// ===== Gist 配置 (支持 install= 参数) =====
const GIST_ID_PARAM = getConfig('GIST_ID', 'gist-id', '');               // Gist ID (install参数)
const GH_TOKEN_PARAM = getConfig('GH_TOKEN', 'gh-token', '');             // GitHub Token (install参数)

// ===== WARP/直连出站配置 =====
const WARP_MODE = getConfig('WARP_MODE', 'warp-mode', '');                    // WARP出站模式: warp/direct/auto(默认)

// ===== ttyd 独立 Argo 隧道配置 =====
const TTYD_ARGO_DOMAIN = getConfig('TTYD_ARGO_DOMAIN', 'ttyd-argo-domain', '');  // ttyd Argo 固定隧道域名
const TTYD_ARGO_AUTH = getConfig('TTYD_ARGO_AUTH', 'ttyd-argo-auth', '');      // ttyd Argo 固定隧道 token/json
const TTYD_ARGO_PORT = parseInt(getConfig('TTYD_ARGO_PORT', 'ttyd-argo-port', '8002')); // ttyd Argo 端口
const TTYD_PORT = parseInt(getConfig('TTYD_PORT', 'ttyd-port', '7681'));        // ttyd 本地监听端口

// 读取 config.json 配置文件（Gist 凭证专用）
let GIST_ID = process.env.GIST_ID || '';
let GH_TOKEN = process.env.GH_TOKEN || '';
const CONFIG_FILE = path.join(__dirname, 'config.json');
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    GIST_ID = configData.gist_id || GIST_ID;
    GH_TOKEN = configData.gh_token || GH_TOKEN;
  } catch (e) {
    console.log('⚠️ config.json 读取失败，使用环境变量');
  }
}

// install 参数中的 gist 配置优先 (GIST_ID_PARAM 已经从fileConfig读取了)
if (GIST_ID_PARAM && !GIST_ID) {
  GIST_ID = GIST_ID_PARAM;
}
if (GH_TOKEN_PARAM && !GH_TOKEN) {
  GH_TOKEN = GH_TOKEN_PARAM;
}

console.log('📋 配置信息:');
console.log('  paper-name:', PAPER_NAME);
console.log('  paper-argo:', PAPER_ARGO);
console.log('  paper-hy2-port:', PAPER_HY2_PORT);
console.log('  paper-tuic-port:', PAPER_TUIC_PORT);
console.log('  paper-domain:', PAPER_DOMAIN);
console.log('  paper-argo-ip:', PAPER_ARGO_IP);
console.log('  warp-mode:', WARP_MODE || 'auto(默认)');
console.log('  GIST_ID:', GIST_ID ? '已设置' : '未设置');
console.log('  GH_TOKEN:', GH_TOKEN ? '已设置' : '未设置');

//创建运行文件夹
if (!fs.existsSync(FILE_PATH)) {
  fs.mkdirSync(FILE_PATH);
  console.log(`${FILE_PATH} is created`);
} else {
  console.log(`${FILE_PATH} already exists`);
}

let privateKey = '';
let publicKey = '';
let sshxUrl = '';

// 生成随机6位字符函数
function generateRandomName() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成随机名称
const npmRandomName = generateRandomName();
const webRandomName = generateRandomName();
const botRandomName = generateRandomName();
const phpRandomName = generateRandomName();

// 使用随机文件名定义路径
let npmPath = path.join(FILE_PATH, npmRandomName);
let phpPath = path.join(FILE_PATH, phpRandomName);
let webPath = path.join(FILE_PATH, webRandomName);
let botPath = path.join(FILE_PATH, botRandomName);
let subPath = path.join(FILE_PATH, 'sub.txt');
let listPath = path.join(FILE_PATH, 'list.txt');
let bootLogPath = path.join(FILE_PATH, 'boot.log');
let configPath = path.join(FILE_PATH, 'config.json');

function deleteNodes() {
  try {
    if (!UPLOAD_URL) return;

    const subPath = path.join(FILE_PATH, 'sub.txt');
    if (!fs.existsSync(subPath)) return;

    let fileContent;
    try {
      fileContent = fs.readFileSync(subPath, 'utf-8');
    } catch {
      return null;
    }

    const decoded = Buffer.from(fileContent, 'base64').toString('utf-8');
    const nodes = decoded.split('\n').filter(line => 
      /(vless|vmess|trojan|hysteria2|tuic):\/\//.test(line)
    );

    if (nodes.length === 0) return;

    return axios.post(`${UPLOAD_URL}/api/delete-nodes`, 
      JSON.stringify({ nodes }),
      { headers: { 'Content-Type': 'application/json' } }
    ).catch((error) => { 
      return null; 
    });
  } catch (err) {
    return null;
  }
}

// 端口验证函数
function isValidPort(port) {
  try {
    if (port === null || port === undefined || port === '') return false;
    if (typeof port === 'string' && port.trim() === '') return false;
    
    const portNum = parseInt(port);
    if (isNaN(portNum)) return false;
    if (portNum < 1 || portNum > 65535) return false;
    
    return true;
  } catch (error) {
    return false;
  }
}

//清理历史文件
const pathsToDelete = [ webRandomName, botRandomName, npmRandomName, 'boot.log', 'list.txt'];
function cleanupOldFiles() {
  pathsToDelete.forEach(file => {
    const filePath = path.join(FILE_PATH, file);
    fs.unlink(filePath, () => {});
  });
}

// 获取固定隧道json
function argoType() {
  if (DISABLE_ARGO === 'true' || DISABLE_ARGO === true) {
    console.log("DISABLE_ARGO is set to true, disable argo tunnel");
    return;
  }

  if (!ARGO_AUTH || !ARGO_DOMAIN) {
    console.log("ARGO_DOMAIN or ARGO_AUTH variable is empty, use quick tunnels");
    return;
  }

  if (ARGO_AUTH.includes('TunnelSecret')) {
    fs.writeFileSync(path.join(FILE_PATH, 'tunnel.json'), ARGO_AUTH);
    const tunnelYaml = `
  tunnel: ${ARGO_AUTH.split('"')[11]}
  credentials-file: ${path.join(FILE_PATH, 'tunnel.json')}
  protocol: http2
  
  ingress:
    - hostname: ${ARGO_DOMAIN}
      service: http://localhost:${ARGO_PORT}
      originRequest:
        noTLSVerify: true
    - service: http_status:404
  `;
    fs.writeFileSync(path.join(FILE_PATH, 'tunnel.yml'), tunnelYaml);
  } else {
    console.log("ARGO_AUTH mismatch TunnelSecret,use token connect to tunnel");
  }
}

// 判断系统架构
function getSystemArchitecture() {
  const arch = os.arch();
  if (arch === 'arm' || arch === 'arm64' || arch === 'aarch64') {
    return 'arm';
  } else {
    return 'amd';
  }
}

// 下载对应系统架构的依赖文件
function downloadFile(fileName, fileUrl, callback) {
  const filePath = path.join(FILE_PATH, fileName);
  const writer = fs.createWriteStream(filePath);

  axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  })
    .then(response => {
      response.data.pipe(writer);

      writer.on('finish', () => {
        writer.close();
        console.log(`Download ${fileName} successfully`);
        callback(null, fileName);
      });

      writer.on('error', err => {
        fs.unlink(filePath, () => { });
        const errorMessage = `Download ${fileName} failed: ${err.message}`;
        console.error(errorMessage); // 下载失败时输出错误消息
        callback(errorMessage);
      });
    })
    .catch(err => {
      const errorMessage = `Download ${fileName} failed: ${err.message}`;
      console.error(errorMessage); // 下载失败时输出错误消息
      callback(errorMessage);
    });
}

// 下载并运行依赖文件
async function downloadFilesAndRun() {
  const architecture = getSystemArchitecture();
  const filesToDownload = getFilesForArchitecture(architecture);

  if (filesToDownload.length === 0) {
    console.log(`Can't find a file for the current architecture`);
    return;
  }

  // 修改文件名映射为使用随机名称
  const renamedFiles = filesToDownload.map(file => {
    let newFileName;
    if (file.fileName === 'npm') {
      newFileName = npmRandomName;
    } else if (file.fileName === 'web') {
      newFileName = webRandomName;
    } else if (file.fileName === 'bot') {
      newFileName = botRandomName;
    } else if (file.fileName === 'php') {
      newFileName = phpRandomName;
    } else {
      newFileName = file.fileName;
    }
    return { ...file, fileName: newFileName };
  });

  const downloadPromises = renamedFiles.map(fileInfo => {
    return new Promise((resolve, reject) => {
      downloadFile(fileInfo.fileName, fileInfo.fileUrl, (err, fileName) => {
        if (err) {
          reject(err);
        } else {
          resolve(fileName);
        }
      });
    });
  });

  try {
    await Promise.all(downloadPromises); // 等待所有文件下载完成
  } catch (err) {
    console.error('Error downloading files:', err);
    return;
  }

  // 授权文件
  function authorizeFiles(filePaths) {
    const newPermissions = 0o775;
    filePaths.forEach(relativeFilePath => {
      const absoluteFilePath = path.join(FILE_PATH, relativeFilePath);
      if (fs.existsSync(absoluteFilePath)) {
        fs.chmod(absoluteFilePath, newPermissions, (err) => {
          if (err) {
            console.error(`Empowerment failed for ${absoluteFilePath}: ${err}`);
          } else {
            console.log(`Empowerment success for ${absoluteFilePath}: ${newPermissions.toString(8)}`);
          }
        });
      }
    });
  }
  // 修改授权文件列表以使用随机名称
  const filesToAuthorize = NEZHA_PORT ? [npmRandomName, webRandomName, botRandomName] : [phpRandomName, webRandomName, botRandomName];
  authorizeFiles(filesToAuthorize);

  // 检测哪吒是否开启TLS
  const port = NEZHA_SERVER.includes(':') ? NEZHA_SERVER.split(':').pop() : '';
  const tlsPorts = new Set(['443', '8443', '2096', '2087', '2083', '2053']);
  const nezhatls = tlsPorts.has(port) ? 'true' : 'false';

  //运行ne-zha
  if (NEZHA_SERVER && NEZHA_KEY) {
    if (!NEZHA_PORT) {
      // 生成 config.yaml
      const configYaml = `
client_secret: ${NEZHA_KEY}
debug: false
disable_auto_update: true
disable_command_execute: false
disable_force_update: true
disable_nat: false
disable_send_query: false
gpu: false
insecure_tls: true
ip_report_period: 1800
report_delay: 4
server: ${NEZHA_SERVER}
skip_connection_count: true
skip_procs_count: true
temperature: false
tls: ${nezhatls}
use_gitee_to_upgrade: false
use_ipv6_country_code: false
uuid: ${UUID}`;
      
      fs.writeFileSync(path.join(FILE_PATH, 'config.yaml'), configYaml);
    }
  }
  
  // 生成 reality-keypair
  const keyFilePath = path.join(FILE_PATH, 'key.txt');

  if (fs.existsSync(keyFilePath)) {
    const content = fs.readFileSync(keyFilePath, 'utf8');
    const privateKeyMatch = content.match(/PrivateKey:\s*(.*)/);
    const publicKeyMatch = content.match(/PublicKey:\s*(.*)/);
  
    privateKey = privateKeyMatch ? privateKeyMatch[1] : '';
    publicKey = publicKeyMatch ? publicKeyMatch[1] : '';
  
    if (!privateKey || !publicKey) {
      console.error('Failed to extract privateKey or publicKey from key.txt.');
      return;
    }
  
    console.log('Private Key:', privateKey);
    console.log('Public Key:', publicKey);

    continueExecution();
  } else {
    // 修改执行命令以使用随机文件名
    exec(`${path.join(FILE_PATH, webRandomName)} generate reality-keypair`, async (err, stdout, stderr) => {
      if (err) {
        console.error(`Error generating reality-keypair: ${err.message}`);
        return;
      }
    
      const privateKeyMatch = stdout.match(/PrivateKey:\s*(.*)/);
      const publicKeyMatch = stdout.match(/PublicKey:\s*(.*)/);
    
      privateKey = privateKeyMatch ? privateKeyMatch[1] : '';
      publicKey = publicKeyMatch ? publicKeyMatch[1] : '';
    
      if (!privateKey || !publicKey) {
        console.error('Failed to extract privateKey or publicKey from output.');
        return;
      }
    
      // Save keys to key.txt
      fs.writeFileSync(keyFilePath, `PrivateKey: ${privateKey}\nPublicKey: ${publicKey}\n`, 'utf8');
    
      console.log('Private Key:', privateKey);
      console.log('Public Key:', publicKey);

      continueExecution();
    });
  }

  function continueExecution() {

    exec('which openssl || where.exe openssl', async (err, stdout, stderr) => {
        if (err || stdout.trim() === '') {
          // OpenSSL 不存在，创建预定义的证书和私钥文件
          // console.log('OpenSSL not found, creating predefined certificate and key files');
          
          // 创建 private.key 文件
          const privateKeyContent = `-----BEGIN EC PARAMETERS-----
BggqhkjOPQMBBw==
-----END EC PARAMETERS-----
-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIM4792SEtPqIt1ywqTd/0bYidBqpYV/++siNnfBYsdUYoAoGCCqGSM49
AwEHoUQDQgAE1kHafPj07rJG+HboH2ekAI4r+e6TL38GWASANnngZreoQDF16ARa
/TsyLyFoPkhLxSbehH/NBEjHtSZGaDhMqQ==
-----END EC PRIVATE KEY-----`;
          
          fs.writeFileSync(path.join(FILE_PATH, 'private.key'), privateKeyContent);
          // console.log('private.key has been created');
          
          // 创建 cert.pem 文件
          const certContent = `-----BEGIN CERTIFICATE-----
MIIBejCCASGgAwIBAgIUfWeQL3556PNJLp/veCFxGNj9crkwCgYIKoZIzj0EAwIw
EzERMA8GA1UEAwwIYmluZy5jb20wHhcNMjUwOTE4MTgyMDIyWhcNMzUwOTE2MTgy
MDIyWjATMREwDwYDVQQDDAhiaW5nLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEH
A0IABNZB2nz49O6yRvh26B9npACOK/nuky9/BlgEgDZ54Ga3qEAxdegEWv07Mi8h
aD5IS8Um3oR/zQRIx7UmRmg4TKmjUzBRMB0GA1UdDgQWBBTV1cFID7UISE7PLTBR
BfGbgkrMNzAfBgNVHSMEGDAWgBTV1cFID7UISE7PLTBRBfGbgkrMNzAPBgNVHRMB
Af8EBTADAQH/MAoGCCqGSM49BAMCA0cAMEQCIAIDAJvg0vd/ytrQVvEcSm6XTlB+
eQ6OFb9LbLYL9f+sAiAffoMbi4y/0YUSlTtz7as9S8/lciBF5VCUoVIKS+vX2g==
-----END CERTIFICATE-----`;
          
      fs.writeFileSync(path.join(FILE_PATH, 'cert.pem'), certContent);
      // console.log('cert.pem has been created');
    } else {
      // OpenSSL 存在，直接生成证书
      // console.log('OpenSSL found, generating certificate and key files');
      
      // 生成 private.key 文件
      try {
        await execPromise(`openssl ecparam -genkey -name prime256v1 -out "${path.join(FILE_PATH, 'private.key')}"`);
        // console.log('private.key has been generated successfully');
      } catch (err) {
        console.error(`Error generating private.key: ${err.message}`);
        return;
      }
      
      // 生成 cert.pem 文件
      try {
        await execPromise(`openssl req -new -x509 -days 3650 -key "${path.join(FILE_PATH, 'private.key')}" -out "${path.join(FILE_PATH, 'cert.pem')}" -subj "/CN=bing.com"`);
        // console.log('cert.pem has been generated successfully');
      } catch (err) {
        console.error(`Error generating cert.pem: ${err.message}`);
        return;
      }
    }

    // 确保 privateKey 和 publicKey 已经被正确赋值
    if (!privateKey || !publicKey) {
      console.error('PrivateKey or PublicKey is missing, retrying...');
      return;
    }

    // 生成sb配置文件
  let config;
  
  // 从第三方API获取WARP配置
  async function fetchWarpConfig() {
    const warpApiUrls = [
      'https://ygkkk-warp.renky.eu.org',
      'https://warp.xijp.eu.org'
    ];
    
    for (const url of warpApiUrls) {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        const data = response.data;
        
        // 解析返回的数据，格式：Private_key：xxx IPV6：xxx reserved：[x,x,x]
        const privateKeyMatch = data.match(/Private_key[：:]\s*([a-zA-Z0-9+/=]+)/);
        const ipv6Match = data.match(/IPV6[：:]\s*([a-fA-F0-9:]+)/);
        const reservedMatch = data.match(/reserved[：:]\s*(\[[\d,\s]+\])/);
        
        if (privateKeyMatch && ipv6Match && reservedMatch) {
          return {
            privateKey: privateKeyMatch[1].trim(),
            ipv6: ipv6Match[1].trim(),
            reserved: JSON.parse(reservedMatch[1].trim())
          };
        }
      } catch (e) {
        console.log(`获取WARP配置失败 (${url}):`, e.message);
      }
    }
    
    // 使用默认配置
    console.log('使用默认WARP配置');
    return {
      privateKey: 'YFYOAdbw1bKTHlNNi+aEjBM3BO7unuFC5rOkMRAz9XY=',
      ipv6: '2606:4700:110:8dfe:d141:69bb:6b80:925',
      reserved: [78, 135, 76]
    };
  }

  // 根据WARP_MODE配置出站策略
  let warpOutConfig = null;
  let routeConfig = null;
  let finalOutbound = "direct";
  let warpPrivateKey = 'YFYOAdbw1bKTHlNNi+aEjBM3BO7unuFC5rOkMRAz9XY=';
  let warpIpv6 = '2606:4700:110:8dfe:d141:69bb:6b80:925';
  let warpReserved = [78, 135, 76];

  // 如果启用了WARP，先获取WARP配置
  if (WARP_MODE === 'warp' || (WARP_MODE !== 'direct' && WARP_MODE !== '')) {
    const warpConfig = await fetchWarpConfig();
    warpPrivateKey = warpConfig.privateKey;
    warpIpv6 = warpConfig.ipv6;
    warpReserved = warpConfig.reserved;
    console.log('📡 WARP配置获取成功');
    console.log('  Private Key:', warpPrivateKey.substring(0, 10) + '...');
    console.log('  IPv6:', warpIpv6);
    console.log('  Reserved:', JSON.stringify(warpReserved));
  }

  if (WARP_MODE === 'warp') {
    // 强制WARP出站模式
    warpOutConfig = {
      "type": "wireguard",
      "tag": "warp-out",
      "mtu": 1280,
      "address": [
        "172.16.0.2/32",
        `${warpIpv6}/128`
      ],
      "private_key": warpPrivateKey,
      "peers": [
        {
          "address": "engage.cloudflareclient.com",
          "port": 2408,
          "public_key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
          "allowed_ips": ["0.0.0.0/0", "::/0"],
          "reserved": warpReserved
        }
      ]
    };
    finalOutbound = "warp-out";
  } else if (WARP_MODE === 'direct' || WARP_MODE === '') {
      // 直连模式或默认模式(自动)
      if (WARP_MODE === 'direct') {
        finalOutbound = "direct";
      }
      // 默认自动模式: 添加Netflix/OpenAI规则，通过WARP出站
      routeConfig = {
        "rule_set": [
          {
            "tag": "netflix",
            "type": "remote",
            "format": "binary",
            "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geosite/netflix.srs",
            "download_detour": "direct"
          },
          {
            "tag": "openai",
            "type": "remote",
            "format": "binary",
            "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geosite/openai.srs",
            "download_detour": "direct"
          }
        ],
        "rules": [
          {
            "rule_set": ["openai", "netflix"],
            "outbound": "wireguard-out"
          }
        ],
        "final": "direct"
      };
    warpOutConfig = {
      "type": "wireguard",
      "tag": "wireguard-out",
      "mtu": 1280,
      "address": [
        "172.16.0.2/32",
        `${warpIpv6}/128`
      ],
      "private_key": warpPrivateKey,
      "peers": [
        {
          "address": "engage.cloudflareclient.com",
          "port": 2408,
          "public_key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
          "allowed_ips": ["0.0.0.0/0", "::/0"],
          "reserved": warpReserved
        }
      ]
    };
  }
    
  // 根据PAPER_ARGO选择inbound类型
  const argoProtocol = PAPER_ARGO || 'vmess-ws';
  const argoInboundType = argoProtocol === 'vless-ws' ? 'vless' : 'vmess';
  const argoPath = argoProtocol === 'vless-ws' ? '/vless-argo' : '/vmess-argo';

  config = {
    "log": {
      "disabled": true,
      "level": "error",
      "timestamp": true
    },
    "inbounds": [
      {
        "tag": `${argoInboundType}-ws-in`,
        "type": argoInboundType,
        "listen": "::",
        "listen_port": ARGO_PORT,
        "users": [
          {
            "uuid": UUID
          }
        ],
        "tls": {
          "enabled": false
        },
        "transport": {
          "type": "ws",
          "path": argoPath,
          "early_data_header_name": "Sec-WebSocket-Protocol"
        }
      }
    ],
    "endpoints": warpOutConfig ? [warpOutConfig] : [],
    "outbounds": [
      {
        "type": "direct",
        "tag": "direct"
      }
    ],
    "route": routeConfig || { "final": finalOutbound }
  };

    // 确定实际使用的端口 (paper- 参数优先)
    const actualRealityPort = isValidPort(PAPER_REALITY_PORT) ? PAPER_REALITY_PORT : REALITY_PORT;
    const actualHY2Port = isValidPort(PAPER_HY2_PORT) ? PAPER_HY2_PORT : HY2_PORT;
    const actualTUICPort = isValidPort(PAPER_TUIC_PORT) ? PAPER_TUIC_PORT : TUIC_PORT;

    // Reality配置
    try {
      if (isValidPort(actualRealityPort)) {
        config.inbounds.push({
          "tag": "vless-in",
          "type": "vless",
          "listen": "::",
          "listen_port": parseInt(actualRealityPort),
          "users": [
            {
              "uuid": UUID,
              "flow": "xtls-rprx-vision"
            }
          ],
          "tls": {
            "enabled": true,
            "server_name": "www.iij.ad.jp",
            "reality": {
              "enabled": true,
              "handshake": {
                "server": "www.iij.ad.jp",
                "server_port": 443
              },
              "private_key": privateKey, 
              "short_id": [""]
            }
          }
        });
      }
    } catch (error) {
      // 忽略错误，继续运行
    }

    // Hysteria2配置
    try {
      if (isValidPort(actualHY2Port)) {
        config.inbounds.push({
          "tag": "hysteria-in",
          "type": "hysteria2",
          "listen": "::",
          "listen_port": parseInt(actualHY2Port),
          "users": [
            {
              "password": UUID
            }
          ],
          "masquerade": "https://bing.com",
          "tls": {
            "enabled": true,
            "alpn": ["h3"],
            "certificate_path": path.join(FILE_PATH, "cert.pem"),
            "key_path": path.join(FILE_PATH, "private.key")
          }
        });
      }
    } catch (error) {
      // 忽略错误，继续运行
    }

    // TUIC配置
    try {
      if (isValidPort(actualTUICPort)) {
        config.inbounds.push({
          "tag": "tuic-in",
          "type": "tuic",
          "listen": "::",
          "listen_port": parseInt(actualTUICPort),
          "users": [
            {
              "uuid": UUID
            }
          ],
          "congestion_control": "bbr",
          "tls": {
            "enabled": true,
            "alpn": ["h3"],
            "certificate_path": path.join(FILE_PATH, "cert.pem"),
            "key_path": path.join(FILE_PATH, "private.key")
          }
        });
      }
    } catch (error) {
      // 忽略错误，继续运行
    }

    // S5配置
    try {
      if (isValidPort(S5_PORT)) {
        config.inbounds.push({
          "tag": "s5-in",
          "type": "socks",
          "listen": "::",
          "listen_port": parseInt(S5_PORT),
          "users": [
            {
              "username": UUID.substring(0, 8),
              "password": UUID.slice(-12)
            }
          ]
        });
      }
    } catch (error) {
      // 忽略错误，继续运行
    }

    // AnyTLS配置
    try {
      if (isValidPort(ANYTLS_PORT)) {
        config.inbounds.push({
          "tag": "anytls-in",
          "type": "anytls",
          "listen": "::",
          "listen_port": parseInt(ANYTLS_PORT),
          "users": [
            {
              "password": UUID
            }
          ],
          "tls": {
            "enabled": true,
            "certificate_path": path.join(FILE_PATH, "cert.pem"),
            "key_path": path.join(FILE_PATH, "private.key")
          }
        });
      }
    } catch (error) {
      // 忽略错误，继续运行
    }

    // AnyReality配置
    try {
      if (isValidPort(ANYREALITY_PORT)) {
        config.inbounds.push({
          "tag": "anyreality-in",
          "type": "anytls",
          "listen": "::",
          "listen_port": parseInt(ANYREALITY_PORT),
          "users": [
            {
              "password": UUID
            }
          ],
          "tls": {
            "enabled": true,
            "server_name": "www.iij.ad.jp",
            "reality": {
              "enabled": true,
              "handshake": {
                "server": "www.iij.ad.jp",
                "server_port": 443
              },
              "private_key": privateKey, 
              "short_id": [""]
            }
          }
        });
      }
    } catch (error) {
      // 忽略错误，继续运行
    }

    // 检测YouTube可访问性并智能配置出站规则
    try {
      // console.log(`YT_WARPOUT environment variable is set to: ${YT_WARPOUT}`);
      let isYouTubeAccessible = true;
      
      // 如果YT_WARPOUT设置为true，则强制添加YouTube出站规则
      if (YT_WARPOUT === true) {
        isYouTubeAccessible = false;
      } else {
        try {
          // 尝试使用curl检测
          const youtubeTest = execSync('curl -o /dev/null -m 2 -s -w "%{http_code}" https://www.youtube.com', { encoding: 'utf8' }).trim();
          isYouTubeAccessible = youtubeTest === '200';
          // console.log(`YouTube access check result: ${isYouTubeAccessible ? 'accessible' : 'inaccessible'}`);
        } catch (curlError) {
          // 如果curl失败，检查输出中是否包含状态码
          if (curlError.output && curlError.output[1]) {
            const youtubeTest = curlError.output[1].toString().trim();
            isYouTubeAccessible = youtubeTest === '200';
          } else {
            isYouTubeAccessible = false;
          }
          // console.log(`YouTube access check failed, assuming inaccessible`);
        }
      }
      // 当YouTube不可访问或YT_WARPOUT设置为true时添加出站规则
      if (!isYouTubeAccessible) {
        // console.log('YouTube cannot be accessed or YT_WARPOUT is enabled, adding outbound rules...');
        
        // 确保route结构完整
        if (!config.route) {
          config.route = {};
        }
        if (!config.route.rule_set) {
          config.route.rule_set = [];
        }
        if (!config.route.rules) {
          config.route.rules = [];
        }
        
        // 检查是否已存在YouTube规则集
        const existingYoutubeRule = config.route.rule_set.find(rule => rule.tag === 'youtube');
        if (!existingYoutubeRule) {
          config.route.rule_set.push({
            "tag": "youtube",
            "type": "remote",
            "format": "binary",
            "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geosite/youtube.srs",
            "download_detour": "direct"
          });
          // console.log('Add YouTube outbound successfully');
        } else {
          // console.log('YouTube rule set already exists');
        }
        
        // 查找wireguard-out规则
        let wireguardRule = config.route.rules.find(rule => rule.outbound === 'wireguard-out');
        if (!wireguardRule) {
          // 如果不存在wireguard-out规则，创建一个
          wireguardRule = {
            "rule_set": ["openai", "netflix", "youtube"],
            "outbound": "wireguard-out"
          };
          config.route.rules.push(wireguardRule);
          // console.log('Created new wireguard-out rule with YouTube');
        } else {
          // 如果规则集中没有youtube，则添加
          if (!wireguardRule.rule_set.includes('youtube')) {
            wireguardRule.rule_set.push('youtube');
            // console.log('Added YouTube to existing wireguard-out rule');
          } else {
            // console.log('YouTube already exists in wireguard-out rule');
          }
        }
        
        console.log('Add YouTube outbound rule');
      } else {
        // console.log('YouTube is accessible and YT_WARPOUT is not enabled, no need to add outbound rule');
      }
    } catch (error) {
      console.error('YouTube check error:', error);
      // ignore YouTube check error, continue running
    }

    fs.writeFileSync(path.join(FILE_PATH, 'config.json'), JSON.stringify(config, null, 2));

    // 运行ne-zha
    let NEZHA_TLS = '';
    if (NEZHA_SERVER && NEZHA_PORT && NEZHA_KEY) {
      const tlsPorts = ['443', '8443', '2096', '2087', '2083', '2053'];
      if (tlsPorts.includes(NEZHA_PORT)) {
        NEZHA_TLS = '--tls';
      } else {
        NEZHA_TLS = '';
      }
      const command = `nohup ${path.join(FILE_PATH, npmRandomName)} -s ${NEZHA_SERVER}:${NEZHA_PORT} -p ${NEZHA_KEY} ${NEZHA_TLS} --disable-auto-update --report-delay 4 --skip-conn --skip-procs >/dev/null 2>&1 &`;
      try {
        await execPromise(command);
        console.log('npm is running');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`npm running error: ${error}`);
      }
    } else if (NEZHA_SERVER && NEZHA_KEY) {
        // 运行 V1
        const command = `nohup ${FILE_PATH}/${phpRandomName} -c "${FILE_PATH}/config.yaml" >/dev/null 2>&1 &`;
        try {
          await exec(command);
          console.log('php is running');
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`php running error: ${error}`);
        }
    } else {
      console.log('NEZHA variable is empty, skipping running');
    }

    // 运行sbX
    // 修改执行命令以使用随机文件名
    const command1 = `nohup ${path.join(FILE_PATH, webRandomName)} run -c ${path.join(FILE_PATH, 'config.json')} >/dev/null 2>&1 &`;
    try {
      await execPromise(command1);
      console.log('web is running');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`web running error: ${error}`);
    }

    // 运行cloud-fared
    if (DISABLE_ARGO !== 'true' && DISABLE_ARGO !== true) {
      if (fs.existsSync(path.join(FILE_PATH, botRandomName))) {
        let args;

        if (ARGO_AUTH.match(/^[A-Z0-9a-z=]{120,250}$/)) {
          args = `tunnel --edge-ip-version auto --no-autoupdate --protocol http2 run --token ${ARGO_AUTH}`;
        } else if (ARGO_AUTH.match(/TunnelSecret/)) {
          args = `tunnel --edge-ip-version auto --config ${path.join(FILE_PATH, 'tunnel.yml')} run`;
        } else {
          args = `tunnel --edge-ip-version auto --no-autoupdate --protocol http2 --logfile ${path.join(FILE_PATH, 'boot.log')} --loglevel info --url http://localhost:${ARGO_PORT}`;
        }

        try {
          await execPromise(`nohup ${path.join(FILE_PATH, botRandomName)} ${args} >/dev/null 2>&1 &`);
          console.log('bot is running');
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error executing command: ${error}`);
        }
      }
    }

    // 运行 ttyd 网页终端 (替换SSHX) + 独立 Argo 隧道
    const enableTTYD = PAPER_SSHX === 'true' || PAPER_SSHX === 'false' ? 
      (PAPER_SSHX === 'true') : (ENABLE_SSHX === true || ENABLE_SSHX === 'true');
    
    if (enableTTYD) {
      const ttydFileName = 'ttyd';
      const ttydBotFileName = 'ttyd-bot';
      
      const architecture = getSystemArchitecture();
      const ttydUrl = architecture === 'arm' 
        ? 'https://github.com/tsl0922/ttyd/releases/download/1.10.0/ttyd-aarch64'
        : 'https://github.com/tsl0922/ttyd/releases/download/1.10.0/ttyd-x86_64';
      
      const ttydPath = path.join(FILE_PATH, ttydFileName);
      const ttydBotPath = path.join(FILE_PATH, ttydBotFileName);
      
      try {
        console.log(`下载 ttyd from ${ttydUrl}...`);
        await new Promise((resolve, reject) => {
          axios({ method: 'get', url: ttydUrl, responseType: 'stream' })
            .then(response => {
              const writer = fs.createWriteStream(ttydPath);
              response.data.pipe(writer);
              writer.on('finish', () => { writer.close(); console.log('ttyd 下载完成'); resolve(); });
              writer.on('error', err => { console.error('ttyd 下载失败:', err.message); reject(err); });
            }).catch(err => { console.error('ttyd 下载失败:', err.message); reject(err); });
        });
        fs.chmodSync(ttydPath, 0o775);
        
        const ttydCommand = `nohup ${ttydPath} -p ${TTYD_PORT} -P "${UUID}" bash >/dev/null 2>&1 &`;
        await execPromise(ttydCommand);
        console.log(`ttyd 已在端口 ${TTYD_PORT} 启动`);
        
        console.log(`下载 ttyd cloudflared...`);
        const botUrl = architecture === 'arm' ? 'https://arm64.ssss.nyc.mn/bot' : 'https://amd64.ssss.nyc.mn/bot';
        await new Promise((resolve, reject) => {
          axios({ method: 'get', url: botUrl, responseType: 'stream' })
            .then(response => {
              const writer = fs.createWriteStream(ttydBotPath);
              response.data.pipe(writer);
              writer.on('finish', () => { writer.close(); console.log('ttyd-bot 下载完成'); resolve(); });
              writer.on('error', err => { console.error('ttyd-bot 下载失败:', err.message); reject(err); });
            }).catch(err => { console.error('ttyd-bot 下载失败:', err.message); reject(err); });
        });
        fs.chmodSync(ttydBotPath, 0o775);
        
        let ttydArgoDomain = TTYD_ARGO_DOMAIN;
        
        if (TTYD_ARGO_AUTH && TTYD_ARGO_DOMAIN) {
          fs.writeFileSync(path.join(FILE_PATH, 'ttyd-tunnel.json'), TTYD_ARGO_AUTH);
          const tunnelYaml = `
tunnel: ${TTYD_ARGO_AUTH.split('"')[11]}
credentials-file: ${path.join(FILE_PATH, 'ttyd-tunnel.json')}
protocol: http2
ingress:
  - hostname: ${TTYD_ARGO_DOMAIN}
    service: http://localhost:${TTYD_PORT}
    originRequest:
      noTLSVerify: true
  - service: http_status:404
`;
          fs.writeFileSync(path.join(FILE_PATH, 'ttyd-tunnel.yml'), tunnelYaml);
          
          const botArgs = `tunnel --edge-ip-version auto --config ${path.join(FILE_PATH, 'ttyd-tunnel.yml')} run`;
          await execPromise(`nohup ${ttydBotPath} ${botArgs} >/dev/null 2>&1 &`);
          console.log('ttyd Argo 隧道已启动 (固定域名)');
          
          const timestamp = new Date(Date.now() + 8 * 3600 * 1000).toLocaleString('zh-CN');
          const ttydUrl = `https://${ttydArgoDomain}`;
          const sshxFileName = GIST_SSHX_FILE || 'sshx.txt';
          await syncToGist(sshxFileName, `最后更新时间: ${timestamp}\n----------------------------\n${ttydUrl}\n密码: ${UUID}`);
          
        } else {
          const bootLogPath2 = path.join(FILE_PATH, 'ttyd-boot.log');
          const botArgs = `tunnel --edge-ip-version auto --no-autoupdate --protocol http2 --logfile ${bootLogPath2} --loglevel info --url http://localhost:${TTYD_PORT}`;
          await execPromise(`nohup ${ttydBotPath} ${botArgs} >/dev/null 2>&1 &`);
          console.log('ttyd Argo 隧道正在启动 (临时域名)...');
          
          await new Promise(resolve => setTimeout(resolve, 6000));
          
          if (fs.existsSync(bootLogPath2)) {
            const fileContent = fs.readFileSync(bootLogPath2, 'utf-8');
            const match = fileContent.match(/https?:\/\/([^ ]*trycloudflare\.com)\/?/);
            if (match) {
              ttydArgoDomain = match[1];
              console.log('ttyd Argo Domain:', ttydArgoDomain);
              
              const timestamp = new Date(Date.now() + 8 * 3600 * 1000).toLocaleString('zh-CN');
              const ttydUrl = `https://${ttydArgoDomain}`;
              const sshxFileName = GIST_SSHX_FILE || 'sshx.txt';
              await syncToGist(sshxFileName, `最后更新时间: ${timestamp}\n----------------------------\n${ttydUrl}\n密码: ${UUID}`);
            }
          }
        }
        
      } catch (error) {
        console.error(`ttyd 启动错误: ${error}`);
      }
    }

    // 无论是否禁用 Argo，都需要生成节点信息
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await extractDomains();
    });
  };
}

// 执行命令的Promise封装
function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
}

// 同步到 GitHub Gist（支持多文件）
async function syncToGist(url, content) {
  if (!GIST_ID || !GH_TOKEN) {
    return;
  }

  const gistUrl = `https://api.github.com/gists/${GIST_ID}`;

  const body = {
    description: "SSH 链接同步",
    files: {
      [url]: {
        content: content
      }
    }
  };

  try {
    const res = await axios.patch(gistUrl, body, {
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      }
    });

    if (res.status === 200) {
      console.log('✅ Gist 云端同步成功！');
    } else {
      console.log('❌ Gist 同步失败:', res.status);
    }
  } catch (e) {
    console.log('⚠️ Gist 同步网络错误:', e.message);
  }
}

// 根据系统架构返回对应的url
function getFilesForArchitecture(architecture) {
  let baseFiles;
  if (architecture === 'arm') {
    baseFiles = [
      { fileName: "web", fileUrl: "https://arm64.ssss.nyc.mn/sb" },
      { fileName: "bot", fileUrl: "https://arm64.ssss.nyc.mn/bot" }
    ];
  } else {
    baseFiles = [
      { fileName: "web", fileUrl: "https://amd64.ssss.nyc.mn/sb" },
      { fileName: "bot", fileUrl: "https://amd64.ssss.nyc.mn/bot" }
    ];
  }

  if (NEZHA_SERVER && NEZHA_KEY) {
    if (NEZHA_PORT) {
      const npmUrl = architecture === 'arm' 
        ? "https://arm64.ssss.nyc.mn/agent"
        : "https://amd64.ssss.nyc.mn/agent";
        baseFiles.unshift({ 
          fileName: "npm", 
          fileUrl: npmUrl 
        });
    } else {
      const phpUrl = architecture === 'arm' 
        ? "https://arm64.ssss.nyc.mn/v1" 
        : "https://amd64.ssss.nyc.mn/v1";
      baseFiles.unshift({ 
        fileName: "php", 
        fileUrl: phpUrl
      });
    }
  }

  return baseFiles;
}

// 获取临时隧道domain
async function extractDomains() {
  if (DISABLE_ARGO === 'true' || DISABLE_ARGO === true) {
    await generateLinks(null);
    return;
  }

  let argoDomain;

  if (ARGO_AUTH && ARGO_DOMAIN) {
    argoDomain = ARGO_DOMAIN;
    console.log('ARGO_DOMAIN:', argoDomain);
    await generateLinks(argoDomain);
  } else {
    try {
      const fileContent = fs.readFileSync(path.join(FILE_PATH, 'boot.log'), 'utf-8');
      const lines = fileContent.split('\n');
      const argoDomains = [];
      lines.forEach((line) => {
        const domainMatch = line.match(/https?:\/\/([^ ]*trycloudflare\.com)\/?/);
        if (domainMatch) {
          const domain = domainMatch[1];
          argoDomains.push(domain);
        }
      });

      if (argoDomains.length > 0) {
        argoDomain = argoDomains[0];
        console.log('ArgoDomain:', argoDomain);
        await generateLinks(argoDomain);
      } else {
        console.log('ArgoDomain not found, re-running bot to obtain ArgoDomain');
          // 删除 boot.log 文件，等待 2s 重新运行 server 以获取 ArgoDomain
          fs.unlinkSync(path.join(FILE_PATH, 'boot.log'));
          async function killBotProcess() {
            try {
              await exec(`pkill -f "${botRandomName}" > /dev/null 2>&1`);
            } catch (error) {
                return null;
              // 忽略输出
            }
          }
          killBotProcess();
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const args = `tunnel --edge-ip-version auto --no-autoupdate --protocol http2 --logfile ${FILE_PATH}/boot.log --loglevel info --url http://localhost:${ARGO_PORT}`;
          try {
            await exec(`nohup ${path.join(FILE_PATH, botRandomName)} ${args} >/dev/null 2>&1 &`);
            console.log('bot is running.');
            await new Promise((resolve) => setTimeout(resolve, 6000)); // 等待6秒
            await extractDomains(); // 重新提取域名
          } catch (error) {
            console.error(`Error executing command: ${error}`);
          }
        }
      } catch (error) {
      console.error('Error reading boot.log:', error);
    }
  }
}

// 获取isp信息
async function getMetaInfo() {
  try {
    const response1 = await axios.get('https://api.ip.sb/geoip', { headers: { 'User-Agent': 'Mozilla/5.0', timeout: 3000 }});
    if (response1.data && response1.data.country_code && response1.data.isp) {
      return `${response1.data.country_code}-${response1.data.isp}`.replace(/\s+/g, '_');
    }
  } catch (error) {
      try {
        // 备用 ip-api.com 获取isp
        const response2 = await axios.get('http://ip-api.com/json', { headers: { 'User-Agent': 'Mozilla/5.0', timeout: 3000 }});
        if (response2.data && response2.data.status === 'success' && response2.data.countryCode && response2.data.org) {
          return `${response2.data.countryCode}-${response2.data.org}`.replace(/\s+/g, '_');
        }
      } catch (error) {
        // console.error('Backup API also failed');
      }
  }
  return 'Unknown';
}

// 生成 list 和 sub 信息
async function generateLinks(argoDomain) {
  let SERVER_IP = '';
  try {
    const ipv4Response = await axios.get('http://ipv4.ip.sb', { timeout: 3000 });
    SERVER_IP = ipv4Response.data.trim();
  } catch (err) {
    try {
      SERVER_IP = execSync('curl -sm 3 ipv4.ip.sb').toString().trim();
    } catch (curlErr) {
      try {
        const ipv6Response = await axios.get('http://ipv6.ip.sb', { timeout: 3000 });
        SERVER_IP = `[${ipv6Response.data.trim()}]`;
      } catch (ipv6AxiosErr) {
        try {
          SERVER_IP = `[${execSync('curl -sm 3 ipv6.ip.sb').toString().trim()}]`;
        } catch (ipv6CurlErr) {
          console.error('Failed to get IP address:', ipv6CurlErr.message);
        }
      }
    }
  }

  const ISP = await getMetaInfo();
  // 使用PAPER_NAME或NAME，优先使用PAPER_NAME
  const nodeNamePrefix = PAPER_NAME || NAME || '';
  const nodeName = nodeNamePrefix ? `${nodeNamePrefix}-${ISP}` : ISP;
  
  // 确定实际使用的端口 (install参数优先)
  const actualRealityPort = isValidPort(PAPER_REALITY_PORT) ? PAPER_REALITY_PORT : REALITY_PORT;
  const actualHY2Port = isValidPort(PAPER_HY2_PORT) ? PAPER_HY2_PORT : (isValidPort(HY2_PORT) ? HY2_PORT : '');
  const actualTUICPort = isValidPort(PAPER_TUIC_PORT) ? PAPER_TUIC_PORT : (isValidPort(TUIC_PORT) ? TUIC_PORT : '');
  
  console.log('📡 端口配置:');
  console.log('  HY2_PORT默认:', HY2_PORT);
  console.log('  paper-hy2-port:', PAPER_HY2_PORT);
  console.log('  实际HY2端口:', actualHY2Port);
  console.log('  TUIC默认:', TUIC_PORT);
  console.log('  paper-tuic-port:', PAPER_TUIC_PORT);
  console.log('  实际TUIC端口:', actualTUICPort);
  
  // 自定义域名/IP配置
  const actualDomain = PAPER_DOMAIN || SERVER_IP;

  return new Promise((resolve) => {
    setTimeout(() => {
      let subTxt = '';

      // 只有当 DISABLE_ARGO 不为 'true' 且 argoDomain 存在时才生成默认的 vmess 节点
      if ((DISABLE_ARGO !== 'true' && DISABLE_ARGO !== true) && argoDomain) {
        // 根据PAPER_ARGO选择协议类型
        const argoProtocol = PAPER_ARGO || 'vmess-ws';
        // 使用自定义的argo IP或默认CFIP
        const argoIP = PAPER_ARGO_IP || CFIP;
        let vmessNode;
      if (argoProtocol === 'vless-ws') {
        // vless-ws 格式 (参考 PaperMC_WorldMagic)
        // path 需要URL编码，argo模式下使用 /vless-argo
        // 必须包含 insecure=1&allowInsecure=1
        vmessNode = `vless://${UUID}@${argoIP}:${CFPORT}?encryption=none&security=tls&sni=${argoDomain}&fp=chrome&alpn=h2&insecure=1&allowInsecure=1&type=ws&host=${argoDomain}&path=%2Fvless-argo#${nodeName}`;
        } else {
          // 默认vmess-ws
          vmessNode = `vmess://${Buffer.from(JSON.stringify({ v: '2', ps: `${nodeName}`, add: argoIP, port: CFPORT, id: UUID, aid: '0', scy: 'auto', net: 'ws', type: 'none', host: argoDomain, path: '/vmess-argo', tls: 'tls', sni: argoDomain, alpn: 'h2', fp: 'chrome', allowInsecure: 1 })).toString('base64')}`;
        }
        subTxt = vmessNode;
        console.log('🔗 Argo节点:', vmessNode.substring(0, 100) + '...');
      }

      // TUIC端口是有效端口号时生成tuic节点
      if (isValidPort(actualTUICPort)) {
        const tuicNode = `\ntuic://${UUID}:@${actualDomain}:${actualTUICPort}?sni=www.bing.com&congestion_control=bbr&udp_relay_mode=native&alpn=h3&allow_insecure=1#${nodeName}`;
        subTxt += tuicNode;
        console.log('🔗 TUIC节点:', tuicNode.trim());
      }

      // HY2端口是有效端口号时生成hysteria2节点
      if (isValidPort(actualHY2Port)) {
        const hysteriaNode = `\nhysteria2://${UUID}@${actualDomain}:${actualHY2Port}/?sni=www.bing.com&insecure=1&alpn=h3&obfs=none#${nodeName}`;
        subTxt += hysteriaNode;
        console.log('🔗 HY2节点:', hysteriaNode.trim());
      }

      // Reality端口是有效端口号时生成reality节点
      if (isValidPort(actualRealityPort)) {
        const vlessNode = `\nvless://${UUID}@${actualDomain}:${actualRealityPort}?encryption=none&flow=xtls-rprx-vision&security=reality&sni=www.iij.ad.jp&fp=firefox&pbk=${publicKey}&type=tcp&headerType=none#${nodeName}`;
        subTxt += vlessNode;
      }

      // ANYTLS_PORT是有效端口号时生成anytls节点
      if (isValidPort(ANYTLS_PORT)) {
        const anytlsNode = `\nanytls://${UUID}@${SERVER_IP}:${ANYTLS_PORT}?security=tls&sni=${SERVER_IP}&fp=chrome&insecure=1&allowInsecure=1#${nodeName}`;
        subTxt += anytlsNode;
      }

      // ANYREALITY_PORT是有效端口号时生成anyreality节点
      if (isValidPort(ANYREALITY_PORT)) {
        const anyrealityNode = `\nanytls://${UUID}@${SERVER_IP}:${ANYREALITY_PORT}?security=reality&sni=www.iij.ad.jp&fp=chrome&pbk=${publicKey}&type=tcp&headerType=none#${nodeName}`;
        subTxt += anyrealityNode;
      }

      // S5_PORT是有效端口号时生成socks5节点 
      if (isValidPort(S5_PORT)) {
        const S5_AUTH = Buffer.from(`${UUID.substring(0, 8)}:${UUID.slice(-12)}`).toString('base64');
        const s5Node = `\nsocks://${S5_AUTH}@${SERVER_IP}:${S5_PORT}#${nodeName}`;
        subTxt += s5Node;
      }

      // 打印 sub.txt 内容到控制台
      console.log('\x1b[32m' + Buffer.from(subTxt).toString('base64') + '\x1b[0m'); // 输出绿色
      console.log('\x1b[35m' + 'Logs will be deleted in 90 seconds,you can copy the above nodes' + '\x1b[0m'); // 洋红色
      fs.writeFileSync(subPath, Buffer.from(subTxt).toString('base64'));
      fs.writeFileSync(listPath, subTxt, 'utf8');
      console.log(`${FILE_PATH}/sub.txt saved successfully`);
      
      // 同步 sub.txt 到 Gist (使用 GIST_SUB_FILE 参数)
      const timestamp = new Date(Date.now() + 8 * 3600 * 1000).toLocaleString('zh-CN');
      const subFileName = GIST_SUB_FILE || 'sub.txt';
      syncToGist(subFileName, `最后更新时间: ${timestamp}\n----------------------------\n${subTxt}`);
      
      sendTelegram(); // 发送tg消息提醒
      uplodNodes(); // 推送节点到订阅器
      // 将内容进行 base64 编码并写入 SUB_PATH 路由
      app.get(`/${SUB_PATH}`, (req, res) => {
        const encodedContent = Buffer.from(subTxt).toString('base64');
        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.send(encodedContent);
      });
      resolve(subTxt);
    }, 2000);
  });
}
  
// 90s分钟后删除所有临时文件
function cleanFiles() {
  setTimeout(() => {
    console.log('正在清理临时文件...');
    
    // 删除所有二进制文件
    const binaryFiles = [webPath, botPath, phpPath, npmPath];
    binaryFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch (e) {}
      }
    });
    
    // 删除配置文件
    [bootLogPath, configPath, listPath, subPath].forEach(file => {
      if (fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch (e) {}
      }
    });
    
    console.clear();
    console.log('App is running');
    console.log('Thank you for using this script, enjoy!');
    if (sshxUrl) console.log('SSHX URL:', sshxUrl);
  }, 300000); // 5分钟
}

async function sendTelegram() {
  if (!BOT_TOKEN || !CHAT_ID) {
      console.log('TG variables is empty,Skipping push nodes to TG');
      return;
  }
  try {
      const message = fs.readFileSync(path.join(FILE_PATH, 'sub.txt'), 'utf8');
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      
      const escapedName = NAME.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
      
      const params = {
          chat_id: CHAT_ID,
          text: `**${escapedName}节点推送通知**\n\`\`\`${message}\`\`\``,
          parse_mode: 'MarkdownV2'
      };

      await axios.post(url, null, { params });
      console.log('Telegram message sent successfully');
  } catch (error) {
      console.error('Failed to send Telegram message', error);
  }
}

async function uplodNodes() {
  if (UPLOAD_URL && PROJECT_URL) {
    const subscriptionUrl = `${PROJECT_URL}/${SUB_PATH}`;
    const jsonData = {
      subscription: [subscriptionUrl]
    };
    try {
        const response = await axios.post(`${UPLOAD_URL}/api/add-subscriptions`, jsonData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200) {
            console.log('Subscription uploaded successfully');
        } else {
          return null;
        }
    } catch (error) {
        if (error.response) {
            if (error.response.status === 400) {
            }
        }
    }
  } else if (UPLOAD_URL) {
      if (!fs.existsSync(listPath)) return;
      const content = fs.readFileSync(listPath, 'utf-8');
      const nodes = content.split('\n').filter(line => /(vless|vmess|trojan|hysteria2|tuic):\/\//.test(line));

      if (nodes.length === 0) return;

      const jsonData = JSON.stringify({ nodes });

      try {
          const response = await axios.post(`${UPLOAD_URL}/api/add-nodes`, jsonData, {
              headers: { 'Content-Type': 'application/json' }
          });
          if (response.status === 200) {
            console.log('Subscription uploaded successfully');
          } else {
            return null;
          }
      } catch (error) {
          return null;
      }
  } else {
      return;
  }
}

// 自动访问项目URL
async function AddVisitTask() {
  if (!AUTO_ACCESS || !PROJECT_URL) {
    console.log("Skipping adding automatic access task");
    return;
  }

  try {
    const response = await axios.post('https://keep.gvrander.eu.org/add-url', {
      url: PROJECT_URL
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('automatic access task added successfully');
  } catch (error) {
    console.error(`添加URL失败: ${error.message}`);
  }
}

// 运行服务
async function startserver() {
  deleteNodes();
  cleanupOldFiles();
  argoType();
  await downloadFilesAndRun();
  await AddVisitTask();
  cleanFiles();
}
startserver();

// 根路由
app.get("/", async function(req, res) {
  try {
    const filePath = path.join(__dirname, 'index.html');
    const data = await fs.promises.readFile(filePath, 'utf8');
    res.send(data);
  } catch (err) {
    res.send("Hello world!<br><br>You can access /{SUB_PATH}(Default: /sub) get your nodes!");
  }
});

app.get("/sshx", async function(req, res) {
  const sshxInfoFile = path.join(FILE_PATH, 's.txt');
  if (sshxUrl) {
    res.send(`SSHX URL: ${sshxUrl}`);
  } else if (fs.existsSync(sshxInfoFile)) {
    const content = fs.readFileSync(sshxInfoFile, 'utf-8');
    const match = content.match(/https:\/\/sshx\.io\/s\/[a-zA-Z0-9]+#[a-zA-Z0-9]+/);
    if (match) {
      res.send(`SSHX URL: ${match[0]}`);
    } else {
      res.send(content);
    }
  } else {
    res.send("SSHX is not enabled or not ready yet.");
  }
});

app.listen(PORT, () => console.log(`server is running on port:${PORT}!`));
