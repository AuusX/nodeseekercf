import type { FC } from 'hono/jsx'

export const DashboardPage: FC = () => {
  return (
    <>
      <title>NodeSeek RSS 监控 - 控制台</title>
      <meta name="description" content="NodeSeek RSS 监控系统管理控制台" />
      <link href="/css/style.css" rel="stylesheet" />
      
      <style>
        {`
        .tab-btn {
          transition: all 0.2s ease;
        }
        .tab-btn.active {
          background: #2196f3 !important;
          color: white !important;
        }
        .tab-btn:not(.active) {
          background: #f5f5f5 !important;
          color: #666 !important;
        }
        .tab-btn:hover:not(.active) {
          background: #e8e8e8 !important;
          color: #333 !important;
        }
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block !important;
        }
        .subscription-item, .post-item {
          background: white;
          padding: 14px;
          margin-bottom: 10px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 3px solid #2196f3;
        }
        .subscription-item h4, .post-item h4 {
          margin-bottom: 8px;
          color: #333;
          font-size: 15px;
        }
        .subscription-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 12px;
        }
        .subscription-title {
          margin: 0;
          flex: 1;
          color: #333;
          font-size: 15px;
        }
        .subscription-delete-btn {
          padding: 4px 8px;
          font-size: 12px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.2s;
        }
        .subscription-delete-btn:hover {
          background: #d32f2f;
        }
        .keywords {
          background: #e3f2fd;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
          color: #1976d2;
          margin-bottom: 6px;
        }
        .filters {
          font-size: 11px;
          color: #666;
          margin-bottom: 10px;
        }
        .actions {
          display: flex;
          gap: 6px;
        }
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }
        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
          border-left: 4px solid #4caf50;
        }
        .stat-card h3 {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
          font-weight: 500;
        }
        .stat-card .number {
          font-size: 28px;
          font-weight: bold;
          color: #333;
        }
        
        /* 移动端优化样式 */
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 10px !important;
          }
          
          .page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            padding: 16px !important;
          }
          
          .page-header h1 {
            font-size: 22px !important;
          }
          
          .page-header p {
            font-size: 14px !important;
          }
          
          .header-actions {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
          }
          
          .status-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          
          .tab-nav {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          
          .tab-buttons {
            display: flex !important;
            min-width: max-content !important;
            gap: 0 !important;
          }
          
          .tab-btn {
            padding: 12px 16px !important;
            font-size: 13px !important;
            min-width: 100px !important;
            white-space: nowrap !important;
          }
          
          .tab-content {
            padding: 20px !important;
          }
          
          .section-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          
          .section-actions {
            flex-direction: column !important;
            width: 100% !important;
          }
          
          .section-actions button {
            width: 100% !important;
            justify-content: center !important;
          }
          
          .form-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          .config-section {
            padding: 16px !important;
            margin-bottom: 16px !important;
          }
          
          .bot-token-form {
            flex-direction: column !important;
            gap: 12px !important;
          }
          
          .bot-token-form input {
            margin-bottom: 8px !important;
          }
          
          .bot-token-form button {
            width: 100% !important;
          }
          
          .bot-info-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          
          .binding-instructions ol {
            padding-left: 16px !important;
          }
          
          .push-settings-form {
            gap: 16px !important;
          }
          
          .checkbox-label {
            padding: 12px !important;
            font-size: 14px !important;
          }
          
          .test-buttons {
            flex-direction: column !important;
            gap: 8px !important;
          }
          
          .test-buttons button {
            width: 100% !important;
            font-size: 14px !important;
          }
          
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 16px !important;
          }
        }
        
                 @media (max-width: 480px) {
           .page-header {
             padding: 12px !important;
           }
           
           .page-header h1 {
             font-size: 20px !important;
           }
           
           .page-header p {
             font-size: 13px !important;
           }
           
           .status-grid {
             grid-template-columns: 1fr !important;
           }
           
           .tab-btn {
             padding: 10px 12px !important;
             font-size: 12px !important;
             min-width: 80px !important;
           }
           
           .tab-content {
             padding: 15px !important;
           }
           
           .section-header h2 {
             font-size: 18px !important;
           }
           
           .config-section {
             padding: 12px !important;
           }
           
           .config-section h3 {
             font-size: 15px !important;
           }
           
           .form-grid {
             gap: 12px !important;
           }
           
           .form-grid input, .form-grid select {
             padding: 10px !important;
             font-size: 14px !important;
           }
           
           .subscription-item, .post-item {
             padding: 12px !important;
             margin-bottom: 8px !important;
           }
           
           .subscription-header {
             gap: 8px !important;
           }
           
           .subscription-title {
             font-size: 14px !important;
           }
           
           .subscription-delete-btn {
             padding: 6px 8px !important;
             font-size: 11px !important;
           }
           
           .subscription-item h4, .post-item h4 {
             font-size: 14px !important;
           }
           
           .actions {
             flex-wrap: wrap !important;
             gap: 4px !important;
           }
           
           .actions button {
             font-size: 11px !important;
             padding: 4px 8px !important;
           }
           
           .stats-grid {
             gap: 12px !important;
           }
           
           .stat-card {
             padding: 16px !important;
           }
           
           .stat-card h3 {
             font-size: 12px !important;
           }
           
           .stat-card .number {
             font-size: 24px !important;
           }
         }
        `}
      </style>
      
      <div style="min-height: 100vh; background: #f5f5f5; padding: 20px;" class="dashboard-container">
        <div style="max-width: 1200px; margin: 0 auto;">
          {/* 页面头部 */}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" class="page-header">
            <div>
              <h1 style="font-size: 28px; font-weight: bold; color: #333; margin-bottom: 8px;">
                📡 NodeSeek RSS 监控控制台
              </h1>
              <p style="color: #666; font-size: 16px;">
                智能文章监控与推送系统
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;" class="header-actions">
              <span style="color: #666; font-size: 14px;">管理员已登录</span>
              <button id="logoutBtn" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                退出登录
              </button>
            </div>
          </div>

          {/* 消息提示区域 */}
          <div id="message" style="display: none; margin-bottom: 20px; padding: 12px; border-radius: 6px;"></div>

          {/* 状态卡片 */}
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;" class="status-grid">
            <div id="botStatusCard" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #999;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="font-size: 14px; color: #666; margin: 0;">Bot 状态</h3>
                <span style="font-size: 24px;">🤖</span>
              </div>
              <div style="font-size: 24px; font-weight: bold; color: #4caf50;" id="botStatus">检查中...</div>
              <p style="font-size: 12px; color: #999; margin: 4px 0 0 0;" id="botDetail">Telegram Bot 连接状态</p>
            </div>

            <div id="userStatusCard" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #999;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="font-size: 14px; color: #666; margin: 0;">绑定用户</h3>
                <span style="font-size: 24px;">👥</span>
              </div>
              <div style="font-size: 24px; font-weight: bold; color: #333;" id="boundUser">未绑定</div>
              <p style="font-size: 12px; color: #999; margin: 4px 0 0 0;" id="userDetail">当前绑定的 Telegram 用户</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="font-size: 14px; color: #666; margin: 0;">活跃订阅</h3>
                <span style="font-size: 24px;">📝</span>
              </div>
              <div style="font-size: 24px; font-weight: bold; color: #333;" id="activeSubscriptions">0</div>
              <p style="font-size: 12px; color: #999; margin: 4px 0 0 0;">正在监控的关键词订阅</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="font-size: 14px; color: #666; margin: 0;">24小时推送</h3>
                <span style="font-size: 24px;">📬</span>
              </div>
              <div style="font-size: 24px; font-weight: bold; color: #333;" id="todayMessages">0</div>
              <p style="font-size: 12px; color: #999; margin: 4px 0 0 0;">最近24小时发送的消息数量</p>
            </div>
          </div>

          {/* 标签页导航 */}
          <div style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;" class="tab-nav">
            <div style="display: flex; border-bottom: 1px solid #eee;" class="tab-buttons">
              <button class="tab-btn active" data-tab="config" style="padding: 16px 24px; border: none; background: #2196f3; color: white; cursor: pointer; font-size: 14px;">
                ⚙️ 基础设置
              </button>
              <button class="tab-btn" data-tab="subscriptions" style="padding: 16px 24px; border: none; background: #f5f5f5; color: #666; cursor: pointer; font-size: 14px;">
                📝 订阅管理
              </button>
              <button class="tab-btn" data-tab="posts" style="padding: 16px 24px; border: none; background: #f5f5f5; color: #666; cursor: pointer; font-size: 14px;">
                📰 文章列表
              </button>
              <button class="tab-btn" data-tab="stats" style="padding: 16px 24px; border: none; background: #f5f5f5; color: #666; cursor: pointer; font-size: 14px;">
                📊 统计信息
              </button>
            </div>

            {/* 基础设置内容 */}
            <div id="config" class="tab-content active" style="padding: 30px;">
              <h2 style="font-size: 20px; margin-bottom: 30px; color: #333;">🤖 Telegram Bot 设置</h2>
              
              {/* Bot Token 设置区域 */}
              <div style="background: #f8f9fa; padding: 24px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #2196f3;" class="config-section">
                <h3 style="font-size: 16px; margin-bottom: 16px; color: #333; display: flex; align-items: center; gap: 8px;">
                  🔑 Bot Token 配置
                  <span id="botTokenStatus" style="font-size: 12px; padding: 4px 8px; border-radius: 12px; background: #dc3545; color: white;">未配置</span>
                </h3>
                
                <form id="botTokenForm" style="display: flex; flex-direction: column; gap: 16px;">
                  <div>
                    <label for="botToken" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Bot Token</label>
                    <div style="display: flex; gap: 12px;" class="bot-token-form">
                      <input 
                        type="password" 
                        id="botToken" 
                        name="botToken" 
                        placeholder="请输入从 @BotFather 获取的 Bot Token"
                        style="flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
                      />
                      <button type="submit" style="padding: 12px 24px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; white-space: nowrap;">
                        💾 保存并验证
                      </button>
                    </div>
                    <p style="font-size: 12px; color: #666; margin-top: 4px;">
                      💡 保存后将自动验证 Token 有效性并设置 Webhook
                    </p>
                  </div>
                </form>

                {/* Bot 信息显示区域 */}
                <div id="botInfoDisplay" style="display: none; margin-top: 20px; padding: 16px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
                  <h4 style="font-size: 14px; margin-bottom: 12px; color: #333;">Bot 信息</h4>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 14px;" class="bot-info-grid">
                    <div><strong>Bot ID:</strong> <span id="botId">-</span></div>
                    <div><strong>用户名:</strong> <span id="botUsername">-</span></div>
                    <div><strong>名称:</strong> <span id="botName">-</span></div>
                    <div><strong>Webhook:</strong> <span style="color: #4caf50;">✅ 已配置</span></div>
                    <div><strong>命令菜单:</strong> <span id="commandsStatus" style="color: #4caf50;">✅ 已创建</span></div>
                  </div>
                </div>
              </div>

              {/* 用户绑定区域 */}
              <div style="background: #f8f9fa; padding: 24px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #ff9800;" class="config-section">
                <h3 style="font-size: 16px; margin-bottom: 16px; color: #333; display: flex; align-items: center; gap: 8px;">
                  👥 用户绑定状态
                  <span id="bindingStatus" style="font-size: 12px; padding: 4px 8px; border-radius: 12px; background: #dc3545; color: white;">未绑定</span>
                </h3>

                {/* 绑定指引 */}
                <div id="bindingInstructions" style="display: none;" class="binding-instructions">
                  <div style="background: #e3f2fd; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
                    <h4 style="font-size: 14px; margin-bottom: 12px; color: #1976d2;">📋 绑定步骤</h4>
                    <ol style="margin: 0; padding-left: 20px; color: #555; line-height: 1.6;">
                      <li>在 Telegram 中搜索 <strong id="botUsernameLink">你的 Bot</strong></li>
                      <li>点击进入 Bot 对话</li>
                      <li>发送 <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">/start</code> 命令</li>
                      <li>Bot 将自动保存你的信息并完成绑定</li>
                    </ol>
                  </div>
                </div>

                {/* 绑定信息显示 */}
                <div id="boundUserInfo" style="display: none;">
                  <div style="background: #e8f5e8; padding: 16px; border-radius: 6px;">
                    <h4 style="font-size: 14px; margin-bottom: 12px; color: #2e7d32;">✅ 绑定成功</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 14px; margin-bottom: 16px;">
                      <div><strong>用户名:</strong> <span id="boundUserName">-</span></div>
                      <div><strong>Telegram 用户名:</strong> <span id="boundUserUsername">-</span></div>
                      <div><strong>Chat ID:</strong> <span id="boundChatId">-</span></div>
                    </div>
                    <button id="unbindUserBtn" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                      🔓 解除绑定
                    </button>
                  </div>
                </div>
              </div>

              {/* 推送设置区域 */}
              <div style="background: #f8f9fa; padding: 24px; border-radius: 8px; border-left: 4px solid #9c27b0;margin-bottom: 30px; min-height: 200px;" class="config-section" id="pushSettingsSection">
                <h3 style="font-size: 16px; margin-bottom: 16px; color: #333;">📬 推送设置</h3>
                
                <form id="pushSettingsForm" style="display: flex !important; flex-direction: column; gap: 20px;" class="push-settings-form">
                  <div style="display: flex; flex-direction: column; gap: 16px;">
                    <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;" class="checkbox-label">
                      <input type="checkbox" id="stopPush" name="stopPush" style="width: 18px; height: 18px; cursor: pointer; margin: 0;" />
                      <div style="pointer-events: none;">
                        <div style="font-weight: 500; color: #333;">停止推送</div>
                        <div style="font-size: 12px; color: #666;">勾选后将暂停所有推送通道</div>
                      </div>
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;" class="checkbox-label">
                      <input type="checkbox" id="onlyTitle" name="onlyTitle" style="width: 18px; height: 18px; cursor: pointer; margin: 0;" />
                      <div style="pointer-events: none;">
                        <div style="font-weight: 500; color: #333;">只匹配标题</div>
                        <div style="font-size: 12px; color: #666;">勾选后仅在文章标题中搜索关键词，不搜索内容</div>
                      </div>
                    </label>
                  </div>

                  <div style="background: white; border-radius: 6px; border: 1px solid #e0e0e0; padding: 16px;">
                    <h4 style="font-size: 14px; margin-bottom: 14px; color: #333;">ntfy 推送</h4>
                    <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; margin-bottom: 16px;" class="checkbox-label">
                      <input type="checkbox" id="ntfyEnabled" name="ntfyEnabled" style="width: 18px; height: 18px; cursor: pointer; margin: 0;" />
                      <div style="pointer-events: none;">
                        <div style="font-weight: 500; color: #333;">启用 ntfy</div>
                        <div style="font-size: 12px; color: #666;">匹配成功后同时发送到 ntfy topic</div>
                      </div>
                    </label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;" class="form-grid">
                      <div>
                        <label for="ntfyServerUrl" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">服务地址</label>
                        <input type="url" id="ntfyServerUrl" name="ntfyServerUrl" placeholder="https://ntfy.sh" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" />
                      </div>
                      <div>
                        <label for="ntfyTopic" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">Topic</label>
                        <input type="text" id="ntfyTopic" name="ntfyTopic" placeholder="请输入 ntfy topic" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" />
                      </div>
                      <div>
                        <label for="ntfyToken" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">访问令牌</label>
                        <input type="password" id="ntfyToken" name="ntfyToken" placeholder="可选，留空则不修改" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" />
                      </div>
                    </div>
                    <p id="ntfyTokenStatus" style="font-size: 12px; color: #666; margin-top: 8px;">访问令牌未配置</p>
                  </div>

                  <button type="submit" style="padding: 12px 24px; background: #9c27b0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; align-self: flex-start;">
                    💾 保存推送设置
                  </button>
                </form>
              </div>

              {/* 测试区域 */}
              <div style="background: #f8f9fa; padding: 24px; border-radius: 8px; border-left: 4px solid #607d8b;" class="config-section">
                <h3 style="font-size: 16px; margin-bottom: 16px; color: #333;">🔧 测试工具</h3>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;" class="test-buttons">
                  <button id="testBotBtn" style="padding: 12px 24px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    🔍 测试 Bot 连接
                  </button>
                  <button id="setCommandsBtn" style="padding: 12px 24px; background: #9c27b0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    📋 设置命令菜单
                  </button>
                  <button id="refreshInfoBtn" style="padding: 12px 24px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    🔄 刷新状态
                  </button>
                  <button id="testNtfyBtn" style="padding: 12px 24px; background: #009688; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    📣 测试 ntfy
                  </button>
                </div>
              </div>
            </div>

            {/* 订阅管理内容 */}
            <div id="subscriptions" class="tab-content" style="padding: 30px; display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;" class="section-header">
                <h2 style="font-size: 20px; color: #333; margin: 0;">📝 订阅管理</h2>
              </div>
              
              <form id="addSubForm" style="margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px;" class="config-section">
                <h3 style="font-size: 16px; margin-bottom: 16px; color: #333;">添加新订阅</h3>
                <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
                  💡 提示：至少需要填写一个关键词，或者选择创建者/分类进行监控
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;" class="form-grid">
                  <div>
                    <label for="keyword1" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">关键词1</label>
                    <input type="text" id="keyword1" name="keyword1" placeholder="输入关键词" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                  </div>
                  <div>
                    <label for="keyword2" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">关键词2</label>
                    <input type="text" id="keyword2" name="keyword2" placeholder="输入关键词" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                  </div>
                  <div>
                    <label for="keyword3" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">关键词3</label>
                    <input type="text" id="keyword3" name="keyword3" placeholder="输入关键词" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                  </div>
                  <div>
                    <label for="creator" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">创建者</label>
                    <input type="text" id="creator" name="creator" placeholder="用户名" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                  </div>
                  <div>
                    <label for="category" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">分类</label>
                    <select id="category" name="category" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: white;">
                      <option value="">全部</option>
                      <option value="daily">📅 日常</option>
                      <option value="tech">💻 技术</option>
                      <option value="info">ℹ️ 情报</option>
                      <option value="review">⭐ 测评</option>
                      <option value="trade">💰 交易</option>
                      <option value="carpool">🚗 拼车</option>
                      <option value="promotion">📢 推广</option>
                      <option value="life">🏠 生活</option>
                      <option value="dev">⚡ Dev</option>
                      <option value="photo">📷 贴图</option>
                      <option value="expose">🚨 曝光</option>
                      <option value="sandbox">🏖️ 沙盒</option>
                    </select>
                  </div>
                </div>
                <button type="submit" style="margin-top: 16px; padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  ➕ 添加订阅
                </button>
              </form>
              
              <div id="subscriptionsList" style="min-height: 200px;">
                <div style="text-align: center; padding: 60px 20px; color: #999;">
                  加载中...
                </div>
              </div>
            </div>

            {/* 文章列表内容 */}
            <div id="posts" class="tab-content" style="padding: 30px; display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;" class="section-header">
                <h2 style="font-size: 20px; color: #333; margin: 0;">📰 文章列表</h2>
                <div style="display: flex; gap: 12px;" class="section-actions">
                  <button id="refreshPostsBtn" style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 刷新
                  </button>
                  <button id="updateRssBtn" style="padding: 8px 16px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    📡 更新RSS
                  </button>
                  <button id="cleanupPostsBtn" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🗑️ 清理旧数据
                  </button>
                </div>
              </div>
              
              {/* 筛选区域 */}
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;" class="filters-section">
                <h3 style="font-size: 16px; margin-bottom: 16px; color: #333;">🔍 筛选条件</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;" class="filter-grid">
                  <div>
                    <label for="filterCategory" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">分类</label>
                    <select id="filterCategory" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: white;">
                      <option value="">全部分类</option>
                      <option value="daily">📅 日常</option>
                      <option value="tech">💻 技术</option>
                      <option value="info">ℹ️ 情报</option>
                      <option value="review">⭐ 测评</option>
                      <option value="trade">💰 交易</option>
                      <option value="carpool">🚗 拼车</option>
                      <option value="promotion">📢 推广</option>
                      <option value="life">🏠 生活</option>
                      <option value="dev">⚡ Dev</option>
                      <option value="photo">📷 贴图</option>
                      <option value="expose">🚨 曝光</option>
                      <option value="sandbox">🏖️ 沙盒</option>
                    </select>
                  </div>
                  
                  <div>
                    <label for="filterPushStatus" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">推送状态</label>
                    <select id="filterPushStatus" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: white;">
                      <option value="">全部状态</option>
                      <option value="0">⏳ 未推送</option>
                      <option value="1">✅ 已推送</option>
                      <option value="2">🚫 无需推送</option>
                    </select>
                  </div>
                  
                  <div>
                    <label for="filterCreator" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">创建者</label>
                    <input type="text" id="filterCreator" placeholder="输入用户名" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                  </div>
                  
                  <div style="display: flex; align-items: end;">
                    <button id="applyFiltersBtn" style="padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
                      🔍 应用筛选
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 文章列表状态信息 */}
              <div id="postsInfo" style="display: none; margin-bottom: 16px; padding: 12px; background: #e3f2fd; border-radius: 6px; color: #1976d2; font-size: 14px;">
                <span id="postsInfoText"></span>
              </div>
              
              <div id="postsList" style="min-height: 400px;">
                <div style="text-align: center; padding: 60px 20px; color: #999;">
                  加载中...
                </div>
              </div>
              
              {/* 加载更多按钮 */}
              <div id="loadMoreContainer" style="text-align: center; margin-top: 20px; display: none;">
                <button id="loadMoreBtn" style="padding: 12px 24px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                  📄 加载更多
                </button>
              </div>
              
              {/* 没有更多数据提示 */}
              <div id="noMoreData" style="text-align: center; margin-top: 20px; color: #999; font-size: 14px; display: none;">
                📝 已显示全部文章
              </div>
            </div>

            {/* 统计信息内容 */}
            <div id="stats" class="tab-content" style="padding: 30px; display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;" class="section-header">
                <h2 style="font-size: 20px; color: #333; margin: 0;">📊 统计信息</h2>
              </div>
              <div id="statsContent" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; min-height: 300px;" class="stats-grid">
                <div style="text-align: center; padding: 60px 20px; color: #999; grid-column: 1 / -1;">
                  加载中...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <script src="/js/dashboard.js"></script>
    </>
  )
}
