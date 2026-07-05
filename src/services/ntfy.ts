import { BaseConfig, KeywordSub, Post } from './database';

export class NtfyService {
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

  private getServerUrl(config: BaseConfig): string {
    return (config.ntfy_server_url || 'https://ntfy.sh').trim().replace(/\/+$/, '');
  }

  private getPostUrl(post: Post): string {
    return `https://www.nodeseek.com/post-${post.post_id}-1`;
  }

  private getMatchText(matchedSub: KeywordSub): string {
    return [matchedSub.keyword1, matchedSub.keyword2, matchedSub.keyword3]
      .filter(keyword => keyword && keyword.trim().length > 0)
      .join(' ');
  }

  isConfigured(config: BaseConfig | null): boolean {
    return !!(
      config &&
      config.ntfy_enabled === 1 &&
      config.ntfy_topic &&
      config.ntfy_topic.trim().length > 0
    );
  }

  async sendPost(post: Post, matchedSub: KeywordSub, config: BaseConfig): Promise<boolean> {
    if (!this.isConfigured(config)) {
      return false;
    }

    const postUrl = this.getPostUrl(post);
    const matchText = this.getMatchText(matchedSub);
    const messageLines = [
      matchText ? `匹配: ${matchText}` : '',
      post.creator ? `作者: ${post.creator}` : '',
      post.category ? `分类: ${this.getCategoryName(post.category)}` : '',
      postUrl
    ].filter(Boolean);

    return this.publish(config, {
      title: `NodeSeek: ${post.title}`,
      message: messageLines.join('\n'),
      click: postUrl,
      tags: ['newspaper']
    });
  }

  async sendTest(config: BaseConfig): Promise<boolean> {
    if (!this.isConfigured(config)) {
      return false;
    }

    return this.publish(config, {
      title: 'NodeSeeker ntfy 测试',
      message: `这是一条测试推送。\n时间: ${new Date().toISOString()}`,
      tags: ['white_check_mark']
    });
  }

  private async publish(config: BaseConfig, payload: {
    title: string;
    message: string;
    click?: string;
    tags?: string[];
  }): Promise<boolean> {
    try {
      const token = config.ntfy_token?.trim();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(this.getServerUrl(config), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: config.ntfy_topic?.trim(),
          title: payload.title,
          message: payload.message,
          click: payload.click,
          tags: payload.tags,
          priority: 3
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ntfy 推送失败: HTTP ${response.status} ${errorText}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('ntfy 推送异常:', error);
      return false;
    }
  }
}
