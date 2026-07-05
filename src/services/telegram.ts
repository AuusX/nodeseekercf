import { Bot, Context, webhookCallback } from 'grammy';
import { DatabaseService, Post, KeywordSub } from './database';

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

export class TelegramService {
  private bot: Bot;

  constructor(
    private dbService: DatabaseService,
    private botToken: string
  ) {
    this.bot = new Bot(botToken);
    this.setupHandlers();
  }

  /**
   * 获取分类对应的图标
   */
  private getCategoryIcon(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'daily': '📅',
      'tech': '💻',
      'info': 'ℹ️',
      'review': '⭐',
      'trade': '💰',
      'carpool': '🚗',
      'promotion': '📢',
      'life': '🏠',
      'dev': '⚡',
      'photo': '📷',
      'expose': '🚨',
      'sandbox': '🏖️'
    };
    return categoryMap[category] || '📂';
  }

  private getCategoryName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'daily': '日常',
      'tech': '技术',
      'info': '情报',
      'review': '测评',
      'trade': '交易',
      'carpool': '拼车',
      'promotion': '推广',
      'life': '生活',
      'dev': 'Dev',
      'photo': '贴图',
      'expose': '曝光',
      'sandbox': '沙盒'
    };
    return categoryMap[category] || category;
  }

  /**
   * 验证用户权限
   */
  private async checkUserPermission(ctx: Context): Promise<boolean> {
    const config = await this.dbService.getBaseConfig();
    if (!config) {
      return false;
    }

    const currentChatId = ctx.chat?.id?.toString();

    // 检查是否是绑定的聊天
    return !!(config.chat_id && config.chat_id === currentChatId);
  }

  /**
   * 设置命令处理器
   */
  private setupHandlers(): void {
    // 处理 /start 命令（特殊处理，不需要权限验证）
    this.bot.command('start', async (ctx) => {
      await this.handleStartCommand(ctx);
    });

    // 处理 /stop 命令
    this.bot.command('stop', async (ctx) => {
      if (!(await this.checkUserPermission(ctx))) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handleStopCommand(ctx);
    });

    // 处理 /resume 命令
    this.bot.command('resume', async (ctx) => {
      if (!(await this.checkUserPermission(ctx))) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handleResumeCommand(ctx);
    });

    // 处理 /list 命令
    this.bot.command('list', async (ctx) => {
      if (!(await this.checkUserPermission(ctx))) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handleListCommand(ctx);
    });

    // 处理 /add 命令
    this.bot.command('add', async (ctx) => {
      if (!(await this.checkUserPermission(ctx))) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handleAddCommand(ctx);
    });

    // 处理 /del 命令
    this.bot.command('del', async (ctx) => {
      if (!(await this.checkUserPermission(ctx))) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handleDeleteCommand(ctx);
    });

    // 处理 /post 命令
    this.bot.command('post', async (ctx) => {
      if (!(await this.checkUserPermission(ctx))) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handlePostCommand(ctx);
    });

    // 处理 /help 命令（允许所有人查看）
    this.bot.command('help', async (ctx) => {
      await this.handleHelpCommand(ctx);
    });

    // 处理 /getme 命令（允许所有人查看）
    this.bot.command('getme', async (ctx) => {
      await this.handleGetMeCommand(ctx);
    });

    // 处理 /unbind 命令
    this.bot.command('unbind', async (ctx) => {
      if (!(await this.checkUserPermission(ctx))) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handleUnbindCommand(ctx);
    });

    // 处理其他消息
    this.bot.on('message:text', async (ctx) => {
      if (!ctx.message.text.startsWith('/')) {
        if (!(await this.checkUserPermission(ctx))) {
          await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。\n\n发送 /help 查看可用命令。');
          return;
        }
        await ctx.reply('请使用命令与我交互。发送 /help 查看可用命令。');
      }
    });
  }

  /**
   * 获取 webhook 回调
   */
  getWebhookCallback() {
    return webhookCallback(this.bot, 'cloudflare-mod');
  }

  /**
   * 发送消息到 Telegram
   */
  async sendMessage(chatId: string | number, text: string): Promise<boolean> {
    try {
      await this.bot.api.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      return true;
    } catch (error) {
      console.error('发送 Telegram 消息时出错:', error);
      return false;
    }
  }

  /**
   * 设置 Webhook
   */
  async setWebhook(webhookUrl: string): Promise<boolean> {
    try {
      await this.bot.api.setWebhook(webhookUrl);
      return true;
    } catch (error) {
      console.error('设置 Webhook 失败:', error);
      return false;
    }
  }

  /**
   * 获取 Bot 信息
   */
  async getBotInfo() {
    try {
      return await this.bot.api.getMe();
    } catch (error) {
      console.error('获取 Bot 信息失败:', error);
      return null;
    }
  }

  /**
   * 设置 Bot 命令菜单
   */
  async setBotCommands(): Promise<boolean> {
    try {
      const commands = [
        { command: 'start', description: '开始使用并绑定账户' },
        { command: 'help', description: '查看帮助信息' },
        { command: 'getme', description: '查看Bot和绑定状态' },
        { command: 'list', description: '查看订阅列表' },
        { command: 'add', description: '添加订阅 (用法: /add 关键词1 关键词2)' },
        { command: 'del', description: '删除订阅 (用法: /del 订阅ID)' },
        { command: 'post', description: '查看最近文章' },
        { command: 'stop', description: '停止推送' },
        { command: 'resume', description: '恢复推送' },
        { command: 'unbind', description: '解除用户绑定' }
      ];

      await this.bot.api.setMyCommands(commands);
      console.log('Bot 命令菜单设置成功');
      return true;
    } catch (error) {
      console.error('设置 Bot 命令菜单失败:', error);
      return false;
    }
  }

  /**
   * 处理 /start 命令
   */
  private async handleStartCommand(ctx: Context): Promise<void> {
    const config = await this.dbService.getBaseConfig();
    
    if (!config) {
      await ctx.reply('系统尚未初始化，请先在网页端完成初始化设置。');
      return;
    }

    const chatId = ctx.chat?.id;
    if (!chatId) return;

    // 获取用户信息
    const user = ctx.from;
    const userFullName = `${user?.first_name || ''}${user?.last_name ? ' ' + user.last_name : ''}`.trim();
    const username = user?.username || '';

    // 检查是否已经有绑定的用户
    if (config.chat_id && config.chat_id.trim() !== '') {
      // 如果是已绑定的用户，显示欢迎信息
      if (config.chat_id === chatId.toString()) {
        const welcomeText = `
🎉 **欢迎回来！**

👤 **用户信息：** ${userFullName || '未知用户'}${username ? ` (@${username})` : ''}
🆔 **Chat ID：** ${chatId}

✅ 您已经绑定到此系统，可以正常使用所有功能。

📋 **可用命令：**
/help - 查看帮助
/list - 查看订阅列表
/add - 添加订阅
/del - 删除订阅
/post - 查看最近文章
/stop - 停止推送
/resume - 恢复推送
        `;
        await ctx.reply(welcomeText, { parse_mode: 'Markdown' });
        return;
      } else {
        // 如果是其他用户尝试绑定，拒绝
        await ctx.reply(`❌ **绑定失败**

此系统已绑定到其他用户：

如需更换绑定用户，请：
1. 使用已绑定的账号发送 /unbind 命令解除绑定
2. 或联系管理员在网页端解除当前绑定

📋 **当前可用命令：**
/help - 查看帮助
/getme - 查看绑定状态`, { parse_mode: 'Markdown' });
        return;
      }
    }

    // 如果没有绑定用户，进行绑定
    await this.dbService.updateBaseConfig({ 
      chat_id: chatId.toString(),
      bound_user_name: userFullName,
      bound_user_username: username
    });

    const userInfo = userFullName || '未知用户';
    const welcomeText = `
🎉 **欢迎使用 NodeSeek RSS 监控机器人！**

👤 **用户信息：** ${userInfo}${username ? ` (@${username})` : ''}
🆔 **Chat ID：** ${chatId}

✅ 已保存您的 Chat ID 和用户信息，现在可以接收推送消息了。

📋 **可用命令：**
/help - 查看帮助
/list - 查看订阅列表
/add - 添加订阅
/del - 删除订阅
/post - 查看最近文章
/stop - 停止推送
/resume - 恢复推送
    `;

    await ctx.reply(welcomeText, { parse_mode: 'Markdown' });
  }

  /**
   * 处理 /stop 命令
   */
  private async handleStopCommand(ctx: Context): Promise<void> {
    await this.dbService.updateBaseConfig({ stop_push: 1 });
    await ctx.reply('✅ 已停止推送。发送 /resume 可恢复推送。');
  }

  /**
   * 处理 /resume 命令
   */
  private async handleResumeCommand(ctx: Context): Promise<void> {
    await this.dbService.updateBaseConfig({ stop_push: 0 });
    await ctx.reply('✅ 已恢复推送。');
  }

  /**
   * 处理 /list 命令
   */
  private async handleListCommand(ctx: Context): Promise<void> {
    const subscriptions = await this.dbService.getAllKeywordSubs();
    
    if (subscriptions.length === 0) {
      await ctx.reply('📝 暂无订阅记录。使用 /add 添加订阅。');
      return;
    }

    let text = '📋 当前订阅列表\n\n';
    subscriptions.forEach((sub, index) => {
      const keywords = [sub.keyword1, sub.keyword2, sub.keyword3]
        .filter(k => k && k.trim().length > 0);
      
      text += `${index + 1}. ID:${sub.id}\n`;
      
      if (keywords.length > 0) {
        text += `🔍 ${keywords.join(' + ')}\n`;
      }
      
      if (sub.creator) {
        text += `👤 ${sub.creator}\n`;
      }
      
      if (sub.category) {
        text += `${this.getCategoryIcon(sub.category)} ${this.getCategoryName(sub.category)}\n`;
      }
      
    });

    text += '💡 使用 /del 订阅ID 删除订阅';

    await ctx.reply(text, { parse_mode: 'Markdown' });
  }

  /**
   * 处理 /add 命令
   */
  private async handleAddCommand(ctx: Context): Promise<void> {
    const args = ctx.message?.text?.split(' ').slice(1) || [];
    
    if (args.length === 0) {
      await ctx.reply('❌ 请提供关键词。\n**用法：** /add 关键词1 关键词2 关键词3', { parse_mode: 'Markdown' });
      return;
    }

    const keywords = args.slice(0, 3); // 最多3个关键词
    
    try {
      const sub = await this.dbService.createKeywordSub({
        keyword1: keywords[0],
        keyword2: keywords[1] || undefined,
        keyword3: keywords[2] || undefined
      });

      let text = `✅ **订阅添加成功！**\n\n**ID:** ${sub.id}\n**关键词：** ${sub.keyword1}`;
      if (sub.keyword2) text += ` \\+ ${sub.keyword2}`;
      if (sub.keyword3) text += ` \\+ ${sub.keyword3}`;

      await ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.reply(`❌ 添加订阅失败：${error}`);
    }
  }

  /**
   * 处理 /del 命令
   */
  private async handleDeleteCommand(ctx: Context): Promise<void> {
    const args = ctx.message?.text?.split(' ').slice(1) || [];
    
    if (args.length === 0) {
      await ctx.reply('❌ 请提供订阅 ID。\n**用法：** /del 订阅ID', { parse_mode: 'Markdown' });
      return;
    }

    const id = parseInt(args[0]);
    if (isNaN(id)) {
      await ctx.reply('❌ 订阅 ID 必须是数字。');
      return;
    }

    try {
      const success = await this.dbService.deleteKeywordSub(id);
      if (success) {
        await ctx.reply(`✅ 订阅 ${id} 删除成功。`);
      } else {
        await ctx.reply(`❌ 订阅 ${id} 不存在。`);
      }
    } catch (error) {
      await ctx.reply(`❌ 删除订阅失败：${error}`);
    }
  }

  /**
   * 处理 /post 命令
   */
  private async handlePostCommand(ctx: Context): Promise<void> {
    const posts = await this.dbService.getRecentPosts(10);
    
    if (posts.length === 0) {
      await ctx.reply('📝 暂无文章数据。');
      return;
    }

    let text = '📰 最近10条文章\n\n';
    posts.forEach((post, index) => {
      text += `${index + 1}. [${post.title}](https://www.nodeseek.com/post-${post.post_id}-1)\n`;
    });

    await ctx.reply(text, { parse_mode: 'Markdown' });
  }

  /**
   * 处理 /help 命令
   */
  private async handleHelpCommand(ctx: Context): Promise<void> {
    const helpText = `
🤖 **NodeSeek RSS 监控机器人**

📋 **可用命令：**

/start \\- 开始使用并保存用户信息
/getme \\- 查看 Bot 信息和绑定状态
/unbind \\- 解除用户绑定
/stop \\- 停止推送
/resume \\- 恢复推送
/list \\- 列出所有订阅
/add 关键词1 关键词2 关键词3 \\- 添加订阅（最多3个关键词）
/del 订阅ID \\- 根据订阅ID删除订阅
/post \\- 查看最近10条文章及推送状态
/help \\- 显示此帮助信息

💡 **使用说明：**
\\- 添加订阅后，系统会自动匹配包含关键词的文章
\\- 可以设置多个关键词，文章需要包含所有关键词才会推送
\\- 使用 /list 查看订阅ID，然后用 /del 删除不需要的订阅
\\- 使用 /getme 查看当前绑定状态和 Bot 详细信息
    `;

    await ctx.reply(helpText, { parse_mode: 'Markdown' });
  }

  /**
   * 处理 /getme 命令
   */
  private async handleGetMeCommand(ctx: Context): Promise<void> {
    try {
      const botInfo = await this.getBotInfo();
      const config = await this.dbService.getBaseConfig();
      
      if (!botInfo) {
        await ctx.reply('❌ 无法获取 Bot 信息');
        return;
      }

      const currentUser = ctx.from;
      const currentUserName = `${currentUser?.first_name || ''}${currentUser?.last_name ? ' ' + currentUser.last_name : ''}`.trim();
      const currentUsername = currentUser?.username || '';

      let userBindingStatus = '';
      if (config?.chat_id && config.chat_id.trim() !== '') {
        if (config.chat_id === ctx.chat?.id?.toString()) {
          userBindingStatus = `✅ **绑定状态：** 已绑定\n👤 **绑定用户：** ${config.bound_user_name || '未知'}${config.bound_user_username ? ` (@${config.bound_user_username})` : ''}\n💬 **绑定Chat ID：** ${config.chat_id}`;
        } else {
          userBindingStatus = `⚠️ **绑定状态：** 已绑定到其他用户`;
        }
      } else {
        userBindingStatus = '❌ **绑定状态：** 未绑定（发送 /start 进行绑定）';
      }

      const text = `
🤖 **NodeSeek RSS 监控机器人信息**

**当前用户：**
👤 **您的名称：** ${currentUserName || '未知'}${currentUsername ? ` (@${currentUsername})` : ''}
🆔 **您的 Chat ID：** ${ctx.chat?.id}

**绑定信息：**
${userBindingStatus}

💡 **提示：** 使用 /help 查看所有可用命令
      `;

      await ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('处理 /getme 命令失败:', error);
      await ctx.reply('❌ 获取信息时发生错误');
    }
  }

  /**
   * 处理 /unbind 命令
   */
  private async handleUnbindCommand(ctx: Context): Promise<void> {
    const currentChatId = ctx.chat?.id?.toString();
    const config = await this.dbService.getBaseConfig();
    
    // 检查是否是当前绑定的用户
    if (!config || config.chat_id !== currentChatId) {
      await ctx.reply('❌ 您当前未绑定到此系统。');
      return;
    }
    
    // 解除绑定
    await this.dbService.updateBaseConfig({ 
      chat_id: '', 
      bound_user_name: undefined, 
      bound_user_username: undefined 
    });
    
    await ctx.reply('✅ **绑定已解除**\n\n您将不再接收推送消息。如需重新绑定，请发送 /start 命令。', { parse_mode: 'Markdown' });
  }

  private buildPostMessage(post: Post, matchedSub: KeywordSub): string {
    // 构建关键词字符串，用markdown格式的标签包裹
    const keywords = [matchedSub.keyword1, matchedSub.keyword2, matchedSub.keyword3]
      .filter(k => k && k.trim().length > 0)
      .join(' ');

    const keywordsStr = keywords ? `🎯 ${keywords}` : '';

    const creator = matchedSub.creator ? `👤 ${matchedSub.creator}` : '';
    const category = matchedSub.category ? `🗂️ ${this.getCategoryName(matchedSub.category)}` : '';

    // 构建帖子链接
    const postUrl = `https://www.nodeseek.com/post-${post.post_id}-1`;

    // 去除 post.title 会影响markdown链接的符号
    const title = post.title
      .replace(/\[/g, "「")
      .replace(/\]/g, "」")
      .replace(/\(/g, "（")
      .replace(/\)/g, "）");

    return `
**${keywordsStr} ${creator} ${category}**

**[${title}](${postUrl})**
      `;
  }

  async sendPost(post: Post, matchedSub: KeywordSub, chatId: string): Promise<boolean> {
    return this.sendMessage(chatId, this.buildPostMessage(post, matchedSub));
  }

  /**
   * 推送文章到 Telegram
   */
  async pushPost(post: Post, matchedSub: KeywordSub): Promise<boolean> {
    try {
      const config = await this.dbService.getBaseConfig();
      if (!config || config.stop_push === 1 || !config.chat_id) {
        return false;
      }

      const success = await this.sendPost(post, matchedSub, config.chat_id);

      if (success) {
        // 更新推送状态
        await this.dbService.updatePostPushStatus(
          post.post_id,
          1, // 已推送
          matchedSub.id,
          new Date().toISOString()
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('推送文章失败:', error);
      return false;
    }
  }
}
