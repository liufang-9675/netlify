// netlify/functions/review.js
exports.handler = async (event) => {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: '仅支持 POST 请求' }) };
  }

  try {
    const { essay } = JSON.parse(event.body);
    if (!essay || essay.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: '作文内容不能为空' }) };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: '服务端未配置 API 密钥' }) };
    }

    // 调用 OpenAI API (可替换为国内兼容接口)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',   // 性价比高，适合批改
        messages: [
          {
            role: 'system',
            content: `你是一位专业的中小学语文老师，请对学生的作文进行细致批改。
            要求：
            1. 给出总分（满分100），并从“内容”、“结构”、“语言表达”三方面简要评分。
            2. 指出主要优点和不足之处。
            3. 提供具体的修改建议（可指出病句、逻辑问题等）。
            4. 最后给出优化后的范文片段（2-3句即可）。
            请用简洁、鼓励的语气，适合学生阅读。`
          },
          {
            role: 'user',
            content: `请批改以下作文：\n\n${essay}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'AI 接口调用失败');
    }

    const review = data.choices?.[0]?.message?.content || '未获取到批改结果';
    return {
      statusCode: 200,
      body: JSON.stringify({ review })
    };

  } catch (error) {
    console.error('批改出错:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || '内部错误' })
    };
  }
};