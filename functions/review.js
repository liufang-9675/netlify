exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: '仅支持 POST' }) };
  }

  try {
    const { title, essay } = JSON.parse(event.body);
    if (!essay || !essay.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: '作文内容不能为空' }) };
    }

    const systemPrompt = `你是一位资深语文教师，请根据以下要求批改学生作文：
1. 作文题目为“${title}”，若内容偏题请明确指出。
2. 从“内容”“结构”“语言表达”三方面打分（每项满分100），并给出总分。
3. 指出主要优点和不足，至少各2条。
4. 提供具体的修改建议，包括病句、逻辑问题、词汇优化。
5. 最后写出修改后的范文段落（150字左右）。
请用鼓励、清晰的语气，适合学生阅读。`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: essay }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'DeepSeek API 错误');
    const review = data.choices?.[0]?.message?.content || '未获取批改结果';

    return {
      statusCode: 200,
      body: JSON.stringify({ review })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
