export class JsonHighlighter {
  static highlight(jsonString: string): string {
    let prettyJson;
    try {
      prettyJson = JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch (e) {
      prettyJson = jsonString; // fallback
    }

    // Escape HTML first
    let escaped = prettyJson
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Syntax highlighting regex
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
    
    return escaped.replace(regex, (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    });
  }
}
