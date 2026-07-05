import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { BaseConfig, DatabaseService } from '../services/database'
import { AuthService } from '../services/auth'
import { RSSService } from '../services/rss'
import { TelegramService } from '../services/telegram'
import { NtfyService } from '../services/ntfy'
import { MatcherService } from '../services/matcher'
import { performanceMonitor, withPerformanceMonitoring } from '../services/performance'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
}

type Variables = {
  dbService: DatabaseService
  authService: AuthService
  jwtPayload: any
}

export const apiRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// JWT 中间件
const jwtMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      message: '请提供有效的认证token'
    }, 401)
  }
  
  const token = authHeader.substring(7)
  const authService = c.get('authService')
  
  const verification = await authService.verifyToken(token)
  if (!verification.valid) {
    return c.json({
      success: false,
      message: verification.message || 'Token无效'
    }, 401)
  }
  
  c.set('jwtPayload', verification.payload)
  await next()
}

// 应用JWT中间件到所有API路由
apiRoutes.use('*', jwtMiddleware)

function hasNtfyFields(body: any): boolean {
  return ['ntfy_enabled', 'ntfy_server_url', 'ntfy_topic', 'ntfy_token', 'clear_ntfy_token']
    .some(field => Object.prototype.hasOwnProperty.call(body, field))
}

function normalizeNtfySettings(body: any): { success: true; data: Partial<BaseConfig> } | { success: false; message: string } {
  const ntfyEnabled = body.ntfy_enabled ? 1 : 0
  const serverUrl = ((typeof body.ntfy_server_url === 'string' ? body.ntfy_server_url : '') || 'https://ntfy.sh')
    .trim()
    .replace(/\/+$/, '')
  const topic = (typeof body.ntfy_topic === 'string' ? body.ntfy_topic : '').trim()

  try {
    const url = new URL(serverUrl)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { success: false, message: 'ntfy 服务地址必须使用 http 或 https' }
    }
  } catch (error) {
    return { success: false, message: 'ntfy 服务地址格式无效' }
  }

  if (ntfyEnabled === 1 && !topic) {
    return { success: false, message: '启用 ntfy 推送时必须填写 topic' }
  }

  const data: Partial<BaseConfig> = {
    ntfy_enabled: ntfyEnabled,
    ntfy_server_url: serverUrl,
    ntfy_topic: topic || null
  }

  if (typeof body.ntfy_token === 'string' && body.ntfy_token.trim().length > 0) {
    data.ntfy_token = body.ntfy_token.trim()
  }
  if (body.clear_ntfy_token === true) {
    data.ntfy_token = null
  }

  return { success: true, data }
}

function toSafeConfig(config: BaseConfig) {
  const { password, ntfy_token, ...safeConfig } = config
  return {
    ...safeConfig,
    ntfy_token_configured: !!ntfy_token
  }
}

// 获取基础配置
apiRoutes.get('/config', async (c) => {
  try {
    const dbService = c.get('dbService')
    const config = await dbService.getBaseConfig()
    
    if (!config) {
      return c.json({
        success: false,
        message: '配置不存在'
      }, 404)
    }

    return c.json({
      success: true,
      data: toSafeConfig(config)
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `获取配置失败: ${error}`
    }, 500)
  }
})

// 更新基础配置
apiRoutes.put('/config', async (c) => {
  try {
    const body = await c.req.json()
    const { chat_id, stop_push, only_title } = body

    const dbService = c.get('dbService')
    const updateData: Partial<BaseConfig> = {
      chat_id,
      stop_push: stop_push !== undefined ? (stop_push ? 1 : 0) : undefined,
      only_title: only_title !== undefined ? (only_title ? 1 : 0) : undefined
    }

    if (hasNtfyFields(body)) {
      const ntfySettings = normalizeNtfySettings(body)
      if (!ntfySettings.success) {
        return c.json({
          success: false,
          message: ntfySettings.message
        }, 400)
      }
      Object.assign(updateData, ntfySettings.data)
    }

    const config = await dbService.updateBaseConfig(updateData)
    
    if (!config) {
      return c.json({
        success: false,
        message: '更新配置失败'
      }, 500)
    }
    
    return c.json({
      success: true,
      data: toSafeConfig(config),
      message: '配置更新成功'
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `更新配置失败: ${error}`
    }, 500)
  }
})

// 设置 Bot Token（验证并自动设置 Webhook）
apiRoutes.post('/telegram/setup-bot', async (c) => {
  const endTimer = performanceMonitor.startTimer('telegram_setup_bot');
  
  try {
    const body = await c.req.json()
    const { bot_token } = body
    
    if (!bot_token) {
      endTimer(0, false);
      return c.json({
        success: false,
        message: '请提供 Bot Token'
      }, 400)
    }

    const dbService = c.get('dbService')
    
    // 创建 Telegram 服务实例测试 Token
    const telegramService = new TelegramService(dbService, bot_token)
    
    // 验证 Bot Token
    const botInfo = await telegramService.getBotInfo()
    if (!botInfo) {
      return c.json({
        success: false,
        message: 'Bot Token 无效，请检查后重试'
      }, 400)
    }
    
    // 自动设置 Webhook
    const webhookUrl = `${c.req.url.split('/api')[0]}/telegram/webhook`
    const webhookResult = await telegramService.setWebhook(webhookUrl)
    
    if (!webhookResult) {
      endTimer(0, false);
      return c.json({
        success: false,
        message: 'Bot Token 有效，但 Webhook 设置失败'
      }, 400)
    }
    
    // 设置 Bot 命令菜单
    const commandsResult = await telegramService.setBotCommands()
    
    // 保存 Bot Token 到配置
    const config = await dbService.updateBaseConfig({
      bot_token
    })
    
    if (!config) {
      return c.json({
        success: false,
        message: '保存 Bot Token 失败'
      }, 500)
    }
    
    endTimer(1, false);
    return c.json({
      success: true,
      message: `Bot Token 设置成功，Webhook 已自动配置${commandsResult ? '，命令菜单已创建' : ''}`,
      data: {
        bot_info: {
          id: botInfo.id,
          username: botInfo.username,
          first_name: botInfo.first_name,
          is_bot: botInfo.is_bot
        },
        webhook_url: webhookUrl,
        commands_configured: commandsResult,
        binding_instructions: {
          step1: '在 Telegram 中搜索并打开你的 Bot',
          step2: '发送 /start 命令给 Bot，或点击菜单按钮选择命令',
          step3: 'Bot 将自动保存你的 Chat ID 完成绑定',
          bot_username: botInfo.username ? `@${botInfo.username}` : null
        }
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `设置 Bot Token 失败: ${error}`
    }, 500)
  }
})

// 更新推送设置
apiRoutes.put('/telegram/push-settings', async (c) => {
  try {
    const body = await c.req.json()
    const { stop_push, only_title } = body

    const dbService = c.get('dbService')
    const updateData: Partial<BaseConfig> = {
      stop_push: stop_push ? 1 : 0,
      only_title: only_title ? 1 : 0
    }

    if (hasNtfyFields(body)) {
      const ntfySettings = normalizeNtfySettings(body)
      if (!ntfySettings.success) {
        return c.json({
          success: false,
          message: ntfySettings.message
        }, 400)
      }
      Object.assign(updateData, ntfySettings.data)
    }

    const config = await dbService.updateBaseConfig(updateData)
    
    if (!config) {
      return c.json({
        success: false,
        message: '更新推送设置失败'
      }, 500)
    }
    
    return c.json({
      success: true,
      message: '推送设置更新成功',
      data: {
        stop_push: config.stop_push === 1,
        only_title: config.only_title === 1,
        ntfy_enabled: config.ntfy_enabled === 1,
        ntfy_server_url: config.ntfy_server_url || 'https://ntfy.sh',
        ntfy_topic: config.ntfy_topic || '',
        ntfy_token_configured: !!config.ntfy_token
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `更新推送设置失败: ${error}`
    }, 500)
  }
})

// 发送 ntfy 测试消息
apiRoutes.post('/ntfy/test', async (c) => {
  try {
    const dbService = c.get('dbService')
    const config = await dbService.getBaseConfig()
    const ntfyService = new NtfyService()

    if (!ntfyService.isConfigured(config)) {
      return c.json({
        success: false,
        message: '请先启用 ntfy 并填写 topic'
      }, 400)
    }

    const result = await ntfyService.sendTest(config!)

    if (!result) {
      return c.json({
        success: false,
        message: 'ntfy 测试推送失败，请检查服务地址、topic 或访问令牌'
      }, 400)
    }

    return c.json({
      success: true,
      message: 'ntfy 测试推送成功'
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `ntfy 测试推送失败: ${error}`
    }, 500)
  }
})

// 设置 Bot 命令菜单
apiRoutes.post('/telegram/set-commands', async (c) => {
  try {
    const dbService = c.get('dbService')
    const config = await dbService.getBaseConfig()
    
    if (!config || !config.bot_token) {
      return c.json({
        success: false,
        message: '请先配置Bot Token'
      }, 400)
    }
    
    const telegramService = new TelegramService(dbService, config.bot_token)
    
    // 验证Bot连接
    const botInfo = await telegramService.getBotInfo()
    if (!botInfo) {
      return c.json({
        success: false,
        message: '无法连接到Bot，请检查Token是否正确'
      }, 400)
    }
    
    // 设置命令菜单
    const result = await telegramService.setBotCommands()
    
    if (result) {
      return c.json({
        success: true,
        message: 'Bot 命令菜单设置成功',
        data: {
          bot_username: botInfo.username,
          commands_count: 10
        }
      })
    } else {
      return c.json({
        success: false,
        message: '设置 Bot 命令菜单失败'
      }, 500)
    }
  } catch (error) {
    return c.json({
      success: false,
      message: `设置命令菜单失败: ${error}`
    }, 500)
  }
})

// 手动设置Telegram Webhook
apiRoutes.post('/telegram/webhook', async (c) => {
  try {
    const body = await c.req.json()
    const { bot_token, webhook_url } = body
    
    if (!bot_token || !webhook_url) {
      return c.json({
        success: false,
        message: '请提供bot_token和webhook_url'
      }, 400)
    }
    
    const dbService = c.get('dbService')
    const telegramService = new TelegramService(dbService, bot_token)
    
    const result = await telegramService.setWebhook(webhook_url)
    
    if (result) {
      return c.json({
        success: true,
        message: 'Webhook设置成功',
        data: result
      })
    } else {
      return c.json({
        success: false,
        message: `Webhook设置失败: ${result}`,
        data: result
      }, 400)
    }
  } catch (error) {
    return c.json({
      success: false,
      message: `设置Webhook失败: ${error}`
    }, 500)
  }
})

// Bot 测试端点 - getMe
apiRoutes.get('/telegram/getme', async (c) => {
  try {
    const dbService = c.get('dbService')
    const config = await dbService.getBaseConfig()
    
    if (!config || !config.bot_token) {
      return c.json({
        success: false,
        message: '请先配置Bot Token'
      }, 400)
    }
    
    const telegramService = new TelegramService(dbService, config.bot_token)
    const botInfo = await telegramService.getBotInfo()
    
    if (!botInfo) {
      return c.json({
        success: false,
        message: '无法获取Bot信息，请检查Token是否正确'
      }, 400)
    }
    
    return c.json({
      success: true,
      message: 'Bot 测试成功',
      data: {
        id: botInfo.id,
        is_bot: botInfo.is_bot,
        first_name: botInfo.first_name,
        username: botInfo.username,
        can_join_groups: botInfo.can_join_groups,
        can_read_all_group_messages: botInfo.can_read_all_group_messages,
        supports_inline_queries: botInfo.supports_inline_queries
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `Bot 测试失败: ${error}`
    }, 500)
  }
})

// 获取Bot信息和绑定状态
apiRoutes.get('/telegram/info', async (c) => {
  try {
    const dbService = c.get('dbService')
    const config = await dbService.getBaseConfig()
    
    if (!config || !config.bot_token) {
      return c.json({
        success: false,
        message: '请先配置Bot Token'
      }, 400)
    }
    
    const telegramService = new TelegramService(dbService, config.bot_token)
    const botInfo = await telegramService.getBotInfo()
    
    if (!botInfo) {
      return c.json({
        success: false,
        message: '无法获取Bot信息，请检查Token是否正确'
      }, 400)
    }
    
    // 获取绑定用户信息
    let boundUserInfo = null
    if (config.chat_id) {
      try {
        // 使用存储的用户信息
        boundUserInfo = {
          chat_id: config.chat_id,
          name: config.bound_user_name || '未知用户',
          username: config.bound_user_username || null,
          display_name: config.bound_user_name ? 
            (config.bound_user_username ? `${config.bound_user_name} (@${config.bound_user_username})` : config.bound_user_name) :
            '未知用户'
        }
      } catch (error) {
        console.error('获取绑定用户信息失败:', error)
      }
    }
    
    return c.json({
      success: true,
      message: '获取Bot信息成功',
      data: {
        bot: {
          id: botInfo.id,
          username: botInfo.username,
          first_name: botInfo.first_name,
          is_bot: botInfo.is_bot
        },
        bound_user: boundUserInfo,
        webhook_status: {
          auto_configured: true,
          url: `${c.req.url.split('/api')[0]}/telegram/webhook`
        },
        binding_instructions: boundUserInfo ? null : {
          step1: '在 Telegram 中搜索并打开你的 Bot',
          step2: '发送 /start 命令给 Bot',
          step3: 'Bot 将自动保存你的 Chat ID 完成绑定',
          bot_username: botInfo.username ? `@${botInfo.username}` : null
        }
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `获取Bot信息失败: ${error}`
    }, 500)
  }
})

// 解除用户绑定
apiRoutes.post('/telegram/unbind', async (c) => {
  try {
    const dbService = c.get('dbService')
    const config = await dbService.getBaseConfig()
    
    if (!config) {
      return c.json({
        success: false,
        message: '配置不存在'
      }, 404)
    }
    
    // 如果当前没有绑定用户，直接返回成功
    if (!config.chat_id) {
      return c.json({
        success: true,
        message: '当前未绑定任何用户'
      })
    }
    
    // 保存原绑定信息用于返回
    const unboundUser = {
      name: config.bound_user_name || '未知用户',
      username: config.bound_user_username || null,
      chat_id: config.chat_id
    }
    
    // 清除绑定信息
    const updatedConfig = await dbService.updateBaseConfig({
      chat_id: '',
      bound_user_name: undefined,
      bound_user_username: undefined
    })
    
    if (!updatedConfig) {
      return c.json({
        success: false,
        message: '解除绑定失败'
      }, 500)
    }
    
    return c.json({
      success: true,
      message: '用户绑定已成功解除',
      data: {
        unbound_user: unboundUser
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `解除绑定失败: ${error}`
    }, 500)
  }
})

// 获取订阅列表
apiRoutes.get('/subscriptions', async (c) => {
  try {
    const dbService = c.get('dbService')
    const subscriptions = await dbService.getAllKeywordSubs()
    
    return c.json({
      success: true,
      data: subscriptions
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `获取订阅列表失败: ${error}`
    }, 500)
  }
})

// 添加订阅
apiRoutes.post('/subscriptions', async (c) => {
  try {
    const body = await c.req.json()
    const { keyword1, keyword2, keyword3, creator, category } = body
    
    // 检查是否至少有一个关键词或者有创建者/分类
    const hasKeywords = (keyword1 && keyword1.trim()) || (keyword2 && keyword2.trim()) || (keyword3 && keyword3.trim())
    const hasCreatorOrCategory = (creator && creator.trim()) || (category && category.trim())
    
    if (!hasKeywords && !hasCreatorOrCategory) {
      return c.json({
        success: false,
        message: '请至少填写一个关键词，或者选择创建者/分类'
      }, 400)
    }
    
    const dbService = c.get('dbService')
    const subscription = await dbService.createKeywordSub({
      keyword1: keyword1 && keyword1.trim() ? keyword1.trim() : null,
      keyword2: keyword2 && keyword2.trim() ? keyword2.trim() : null,
      keyword3: keyword3 && keyword3.trim() ? keyword3.trim() : null,
      creator: creator && creator.trim() ? creator.trim() : null,
      category: category && category.trim() ? category.trim() : null
    })
    
    return c.json({
      success: true,
      data: subscription,
      message: '订阅添加成功'
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `添加订阅失败: ${error}`
    }, 500)
  }
})

// 更新订阅
apiRoutes.put('/subscriptions/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({
        success: false,
        message: '无效的订阅ID'
      }, 400)
    }
    
    const body = await c.req.json()
    const { keyword1, keyword2, keyword3, creator, category } = body
    
    const dbService = c.get('dbService')
    const subscription = await dbService.updateKeywordSub(id, {
      keyword1: keyword1 ? keyword1.trim() : undefined,
      keyword2: keyword2 ? keyword2.trim() : undefined,
      keyword3: keyword3 ? keyword3.trim() : undefined,
      creator: creator ? creator.trim() : undefined,
      category: category ? category.trim() : undefined
    })
    
    if (!subscription) {
      return c.json({
        success: false,
        message: '订阅不存在'
      }, 404)
    }
    
    return c.json({
      success: true,
      data: subscription,
      message: '订阅更新成功'
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `更新订阅失败: ${error}`
    }, 500)
  }
})

// 删除订阅
apiRoutes.delete('/subscriptions/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({
        success: false,
        message: '无效的订阅ID'
      }, 400)
    }
    
    const dbService = c.get('dbService')
    const success = await dbService.deleteKeywordSub(id)
    
    if (success) {
      return c.json({
        success: true,
        message: '订阅删除成功'
      })
    } else {
      return c.json({
        success: false,
        message: '订阅不存在'
      }, 404)
    }
  } catch (error) {
    return c.json({
      success: false,
      message: `删除订阅失败: ${error}`
    }, 500)
  }
})

// 获取文章列表（支持分页和过滤）
apiRoutes.get('/posts', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const pushStatus = c.req.query('push_status')
    const creator = c.req.query('creator')
    const category = c.req.query('category')
    const startDate = c.req.query('start_date')
    const endDate = c.req.query('end_date')
    
    const dbService = c.get('dbService')
    
    // 构建过滤条件
    const filters: any = {}
    if (pushStatus !== undefined && pushStatus !== '') {
      filters.pushStatus = parseInt(pushStatus)
    }
    if (creator) filters.creator = creator
    if (category) filters.category = category
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate
    
    // 使用新的分页方法
    const result = await dbService.getPostsWithPagination(page, limit, filters)
    
    return c.json({
      success: true,
      data: result.posts,
      pagination: {
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
        limit
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `获取文章列表失败: ${error}`
    }, 500)
  }
})

// 手动更新RSS
apiRoutes.post('/rss/update', async (c) => {
  try {
    const dbService = c.get('dbService')
    const rssService = new RSSService(dbService)
    
    const result = await rssService.manualUpdate()
    
    return c.json(result)
  } catch (error) {
    return c.json({
      success: false,
      message: `RSS更新失败: ${error}`
    }, 500)
  }
})

// 获取匹配统计（兼容旧接口）
apiRoutes.get('/stats', async (c) => {
  try {
    const dbService = c.get('dbService')
    const config = await dbService.getBaseConfig()
    const ntfyService = new NtfyService()
    const telegramService = config?.bot_token ? new TelegramService(dbService, config.bot_token) : undefined
    const matcherService = new MatcherService(dbService, telegramService, ntfyService)
    
    const stats = await matcherService.getMatchStats()
    
    return c.json({
      success: true,
      data: stats
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `获取统计信息失败: ${error}`
    }, 500)
  }
})

// 获取综合统计信息（新接口，更高效）
apiRoutes.get('/stats/comprehensive', async (c) => {
  try {
    const dbService = c.get('dbService')
    const stats = await dbService.getComprehensiveStats()
    
    return c.json({
      success: true,
      data: {
        ...stats
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `获取综合统计信息失败: ${error}`
    }, 500)
  }
})

// 获取今日统计
apiRoutes.get('/stats/today', async (c) => {
  try {
    const dbService = c.get('dbService')
    
    const [todayPosts, todayMessages] = await Promise.all([
      dbService.getTodayPostsCount(),
      dbService.getTodayMessagesCount()
    ])
    
    return c.json({
      success: true,
      data: {
        posts: todayPosts,
        messages: todayMessages
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `获取今日统计失败: ${error}`
    }, 500)
  }
})

// 清理旧数据
apiRoutes.post('/posts/cleanup', async (c) => {
  try {
    const dbService = c.get('dbService')
    const result = await dbService.cleanupOldPosts()
    
    return c.json({
      success: true,
      data: result,
      message: `数据清理完成，删除了 ${result.deletedCount} 条过期记录`
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `清理旧数据失败: ${error}`
    }, 500)
  }
})

// 获取性能监控指标
apiRoutes.get('/performance/metrics', async (c) => {
  try {
    const timeWindow = parseInt(c.req.query('window') || '300000'); // 默认5分钟
    
    const [systemMetrics, queryStats] = await Promise.all([
      Promise.resolve(performanceMonitor.getSystemMetrics()),
      Promise.resolve(performanceMonitor.getQueryStats(timeWindow))
    ]);
    
    return c.json({
      success: true,
      data: {
        system: systemMetrics,
        queries: queryStats,
        recommendations: performanceMonitor.getPerformanceRecommendations()
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      message: `获取性能指标失败: ${error}`
    }, 500);
  }
})

// 清理性能监控数据
apiRoutes.post('/performance/cleanup', async (c) => {
  try {
    performanceMonitor.cleanup();
    
    return c.json({
      success: true,
      message: '性能监控数据清理完成'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: `清理性能数据失败: ${error}`
    }, 500);
  }
})
