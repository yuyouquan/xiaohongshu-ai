import { NextResponse } from 'next/server';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || 'sk-cp-RbXjlT3ez_OaSzJ_Sb89ft8reiMhdsQf6stAT-2UkRwLSepi79tpthjpZCUBQN88vT890B72EtsBgkjpZY5V1mGffbjZoIaIVjqw-L2vkZSABVAsEcZJNxI';
const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_pro_2';

const stylePrompts: Record<string, string> = {
  passion: '热情种草风格，充满激情，使用夸张但真实的推荐语，适合好物分享',
  funny: '幽默搞笑风格，轻松有趣，适合分享日常趣事',
  干货: '干货教程风格，专业实用，适合知识分享',
  情感: '情感共鸣风格，温暖走心，适合情感话题',
};

export async function POST(req: Request) {
  const { topic, style } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: '请输入主题' }, { status: 400 });
  }

  const stylePrompt = stylePrompts[style] || stylePrompts.passion;

  const prompt = `你是一个小红书文案专家。请根据以下主题，生成一篇爆款小红书笔记文案。

主题：${topic}
风格：${stylePrompt}

要求：
1. 标题要吸引眼球，使用 emoji
2. 正文要通顺自然，有真情实感
3. 内容要符合小红书用户的阅读习惯
4. 添加合适的话题标签 (#话题)
5. 字数控制在 300-800 字

请直接输出文案内容，不要有其他解释。`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(MINIMAX_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'abab6.5s-chat',
            messages: [
              { role: 'user', content: prompt }
            ],
            stream: true,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'API错误: ' + error })}\n\n`));
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        if (!reader) {
          controller.close();
          return;
        }

        // Send initial progress
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: 10 })}\n\n`));

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, progress: 100 })}\n\n`));
                continue;
              }
              
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, progress: Math.min(90, 10 + fullContent.length / 2) })}\n\n`));
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, progress: 100 })}\n\n`));
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '生成失败' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
