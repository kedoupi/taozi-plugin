#!/usr/bin/env node
const args = process.argv.slice(2);
const cmd = args.join(' ');

if (cmd.includes('--help')) {
  process.stdout.write('YouMind CLI (mock)\n');
  process.exit(0);
}

if (cmd.includes('call getDefaultBoard')) {
  console.log(JSON.stringify({ id: 'mock-board-001', name: 'Test Board' }));
  process.exit(0);
}

if (cmd.includes('call createChat')) {
  console.log(JSON.stringify({ id: 'mock-chat-002', status: 'pending' }));
  process.exit(0);
}

if (cmd.includes('call getChat')) {
  console.log(JSON.stringify({ id: 'mock-chat-002', status: 'completed' }));
  process.exit(0);
}

if (cmd.includes('call listMessages')) {
  console.log(JSON.stringify({
    items: [{
      blocks: [{
        type: 'tool',
        toolName: 'image_generate',
        toolResult: {
          original_image_urls: ['https://mock.img/test.jpg'],
          width: 900,
          height: 383
        }
      }]
    }]
  }));
  process.exit(0);
}

// 默认：未知命令
process.stderr.write(`Unknown command: ${cmd}\n`);
process.exit(1);
