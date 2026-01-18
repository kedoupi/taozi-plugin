#!/usr/bin/env node
/**
 * Taozi Plugin for OpenCode
 *
 * 提供智能 Agent 调度和 Skill 管理功能
 *
 * 工具:
 *   - find_agents: 列出所有可用的 Agent
 *   - use_agent: 使用指定的 Agent
 *   - find_skills: 列出所有可用的 Skill
 *   - use_skill: 使用指定的 Skill
 */

const fs = require('fs');
const path = require('path');

// 获取 Taozi 安装目录
const TAOZI_DIR = process.env.TAOZI_DIR || path.join(process.env.HOME, '.config/opencode/taozi');
const AGENTS_DIR = path.join(TAOZI_DIR, 'agents');
const SKILLS_DIR = path.join(TAOZI_DIR, 'skills');

/**
 * 解析 Markdown 文件的 frontmatter
 */
function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return { metadata: {}, body: content };

    const metadata = {};
    match[1].split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
            metadata[key.trim()] = valueParts.join(':').trim();
        }
    });

    return {
        metadata,
        body: content.slice(match[0].length).trim()
    };
}

/**
 * 列出目录中的所有 .md 文件
 * 支持: 直接 .md 文件、目录下的 index.md/同名.md/SKILL.md
 */
function listMarkdownFiles(dir) {
    if (!fs.existsSync(dir)) return [];

    const items = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isFile() && entry.name.endsWith('.md')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const { metadata } = parseFrontmatter(content);
            items.push({
                name: path.basename(entry.name, '.md'),
                description: metadata.description || '',
                path: fullPath
            });
        } else if (entry.isDirectory()) {
            // 检查目录下的入口文件，按优先级: SKILL.md > index.md > 同名.md
            const skillPath = path.join(fullPath, 'SKILL.md');
            const indexPath = path.join(fullPath, 'index.md');
            const namedPath = path.join(fullPath, `${entry.name}.md`);

            let mdPath = null;
            if (fs.existsSync(skillPath)) mdPath = skillPath;
            else if (fs.existsSync(indexPath)) mdPath = indexPath;
            else if (fs.existsSync(namedPath)) mdPath = namedPath;

            if (mdPath) {
                const content = fs.readFileSync(mdPath, 'utf-8');
                const { metadata } = parseFrontmatter(content);
                items.push({
                    name: entry.name,
                    description: metadata.description || '',
                    path: mdPath
                });
            }
        }
    }

    return items;
}

/**
 * 读取指定的 Agent 或 Skill 内容
 * 支持: 直接 .md 文件、目录下的 SKILL.md/index.md/同名.md
 */
function readItem(dir, name) {
    // 尝试直接文件
    const directPath = path.join(dir, `${name}.md`);
    if (fs.existsSync(directPath)) {
        return fs.readFileSync(directPath, 'utf-8');
    }

    // 尝试目录下的 SKILL.md (技能约定)
    const skillPath = path.join(dir, name, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
        return fs.readFileSync(skillPath, 'utf-8');
    }

    // 尝试目录下的 index.md
    const indexPath = path.join(dir, name, 'index.md');
    if (fs.existsSync(indexPath)) {
        return fs.readFileSync(indexPath, 'utf-8');
    }

    // 尝试目录下的同名文件
    const namedPath = path.join(dir, name, `${name}.md`);
    if (fs.existsSync(namedPath)) {
        return fs.readFileSync(namedPath, 'utf-8');
    }

    return null;
}

// ============ OpenCode Plugin API ============

/**
 * 插件元信息
 */
const plugin = {
    name: 'taozi',
    version: '2.1.0',
    description: 'Taozi 2.1 - 工作流驱动、3 条铁律、思维工具箱'
};

/**
 * 会话启动时的系统提示
 */
const systemPrompt = `
# Taozi Plugin

你可以使用以下工具来调用专家 Agent 和 Skill:

## 工具
- \`find_agents\`: 列出所有可用的 Agent
- \`use_agent\`: 使用指定的 Agent 处理任务
- \`find_skills\`: 列出所有可用的 Skill
- \`use_skill\`: 使用指定的 Skill

## 推荐工作流
1. 用户描述任务后，先用 find_agents 查看可用 Agent
2. 选择最合适的 Agent，用 use_agent 获取其专业指导
3. 如需参考资料，用 find_skills 和 use_skill 获取

## Agent 分类 (10 个核心)
- 执行层: fullstack-developer, devops-engineer, debugger
- 质量层: code-reviewer, testing-engineer
- 优化层: performance-engineer, refactoring-specialist
- 支撑层: documentation-engineer, prompt-engineer, context-manager
`;

/**
 * 工具定义
 */
const tools = [
    {
        name: 'find_agents',
        description: '列出所有可用的 Taozi Agent，包括名称和描述',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        },
        handler: () => {
            const agents = listMarkdownFiles(AGENTS_DIR);
            if (agents.length === 0) {
                return { error: `未找到 Agent，请检查目录: ${AGENTS_DIR}` };
            }
            return {
                count: agents.length,
                agents: agents.map(a => ({ name: a.name, description: a.description }))
            };
        }
    },
    {
        name: 'use_agent',
        description: '使用指定的 Taozi Agent，返回 Agent 的完整指导内容',
        parameters: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Agent 名称，如 fullstack-developer, debugger'
                }
            },
            required: ['name']
        },
        handler: ({ name }) => {
            const content = readItem(AGENTS_DIR, name);
            if (!content) {
                return { error: `未找到 Agent: ${name}` };
            }
            return { name, content };
        }
    },
    {
        name: 'find_skills',
        description: '列出所有可用的 Taozi Skill，包括名称和描述',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        },
        handler: () => {
            const skills = listMarkdownFiles(SKILLS_DIR);
            if (skills.length === 0) {
                return { error: `未找到 Skill，请检查目录: ${SKILLS_DIR}` };
            }
            return {
                count: skills.length,
                skills: skills.map(s => ({ name: s.name, description: s.description }))
            };
        }
    },
    {
        name: 'use_skill',
        description: '使用指定的 Taozi Skill，返回 Skill 的完整内容',
        parameters: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Skill 名称，如 typescript-patterns, nextjs-architecture'
                }
            },
            required: ['name']
        },
        handler: ({ name }) => {
            const content = readItem(SKILLS_DIR, name);
            if (!content) {
                return { error: `未找到 Skill: ${name}` };
            }
            return { name, content };
        }
    }
];

// ============ CLI 模式 ============

if (require.main === module) {
    const [,, command, ...args] = process.argv;

    switch (command) {
        case 'info':
            console.log(JSON.stringify(plugin, null, 2));
            break;

        case 'system-prompt':
            console.log(systemPrompt);
            break;

        case 'tools':
            console.log(JSON.stringify(tools.map(t => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters
            })), null, 2));
            break;

        case 'call': {
            const toolName = args[0];
            const params = args[1] ? JSON.parse(args[1]) : {};
            const tool = tools.find(t => t.name === toolName);

            if (!tool) {
                console.error(`Unknown tool: ${toolName}`);
                process.exit(1);
            }

            const result = tool.handler(params);
            console.log(JSON.stringify(result, null, 2));
            break;
        }

        default:
            console.log(`
Taozi Plugin for OpenCode

用法:
  node taozi.js info           显示插件信息
  node taozi.js system-prompt  输出系统提示
  node taozi.js tools          列出工具定义
  node taozi.js call <tool> [params]  调用工具

示例:
  node taozi.js call find_agents
  node taozi.js call use_agent '{"name":"fullstack-developer"}'
`);
    }
}

// 导出供 OpenCode 直接使用
module.exports = {
    plugin,
    systemPrompt,
    tools
};
