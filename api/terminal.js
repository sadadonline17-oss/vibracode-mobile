// Vercel Serverless Function — Terminal Proxy
// Proxies terminal execution requests for the VibraCode mobile app
// Supports basic shell commands via Vercel's Node.js runtime

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { command, cwd, timeout } = req.body || {};

  if (!command?.trim()) {
    return res.status(400).json({ error: 'command is required' });
  }

  // Security: block dangerous commands
  const blocked = [
    'rm -rf /', 'rm -rf /*', 'mkfs', 'dd if=', ':(){ :|:& };:',
    'chmod 777 /', 'chown', 'shutdown', 'reboot', 'halt',
    'wget ', 'curl -o /', 'nc -l', 'fork bomb',
  ];

  const cmdLower = command.toLowerCase().trim();
  if (blocked.some(b => cmdLower.includes(b.toLowerCase()))) {
    return res.status(403).json({
      stdout: '',
      stderr: 'Command blocked for security reasons.',
      code: 1,
    });
  }

  const safeTimeout = Math.min(timeout ?? 15000, 30000);

  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);

    const { stdout, stderr } = await execAsync(command, {
      cwd: '/tmp',
      timeout: safeTimeout,
      maxBuffer: 1024 * 256,
      shell: '/bin/sh',
    });

    return res.status(200).json({
      stdout: stdout || '',
      stderr: stderr || '',
      code: 0,
    });
  } catch (err) {
    return res.status(200).json({
      stdout: err.stdout || '',
      stderr: err.stderr || err.message || 'Execution failed',
      code: err.code || 1,
    });
  }
};
