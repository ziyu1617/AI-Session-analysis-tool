/**
 * 同时启动后端与前端，并保证退出时一起收干净（避免残留进程占住端口）。
 */

import { spawn } from 'node:child_process';

const children = [];
let shuttingDown = false;

function run(name, command, args) {
  const child = spawn(command, args, { stdio: 'inherit', shell: false });
  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.log(`\n[${name}] 已退出（code ${code}），正在关闭其余进程…`);
    shutdown(code ?? 0);
  });
  children.push(child);
  return child;
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

run('server', process.execPath, ['server/index.js']);
run('web', process.execPath, ['node_modules/vite/bin/vite.js']);
